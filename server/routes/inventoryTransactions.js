import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all inventory transactions for an agency
router.get("/getAllTransactions", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const { transaction_type, item_id, reference_type } = req.query;

    let query = `SELECT t.*, im.item_name, im.item_code, u.username as performed_by_name
                 FROM inventory_transactions t
                 LEFT JOIN item_master im ON t.item_id = im.id
                 LEFT JOIN users u ON t.performed_by = u.id
                 WHERE t.agency_id = ?`;
    let params = [agency_id];

    // Super admin can filter by agency
    if (role === 'super_admin' && req.query.agency_id) {
      params = [req.query.agency_id];
    }

    // Apply filters
    if (transaction_type) {
      query += " AND t.transaction_type = ?";
      params.push(transaction_type);
    }

    if (item_id) {
      query += " AND t.item_id = ?";
      params.push(item_id);
    }

    if (reference_type) {
      query += " AND t.reference_type = ?";
      params.push(reference_type);
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const offset = (page - 1) * limit;

    // Get total count first
    let countQuery = `SELECT COUNT(*) as total FROM inventory_transactions t WHERE t.agency_id = ?`;
    let countParams = [agency_id];

    if (role === 'super_admin' && req.query.agency_id) {
      countParams = [req.query.agency_id];
    }

    if (transaction_type) {
      countQuery += " AND t.transaction_type = ?";
      countParams.push(transaction_type);
    }

    if (item_id) {
      countQuery += " AND t.item_id = ?";
      countParams.push(item_id);
    }

    if (reference_type) {
      countQuery += " AND t.reference_type = ?";
      countParams.push(reference_type);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const totalCount = countResult[0].total;

    query += ` ORDER BY t.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [transactions] = await pool.execute(query, params);

    res.json({
      transactions,
      success: true,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get single transaction
router.get("/getTransaction/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const transactionId = req.params.id;

    let query = `SELECT t.*, im.item_name, im.item_code, u.username as performed_by_name
                 FROM inventory_transactions t
                 LEFT JOIN item_master im ON t.item_id = im.id
                 LEFT JOIN users u ON t.performed_by = u.id
                 WHERE t.id = ?`;
    let params = [transactionId];

    if (role !== 'super_admin') {
      query += " AND t.agency_id = ?";
      params.push(agency_id);
    }

    const [transactions] = await pool.execute(query, params);

    if (transactions.length === 0) {
      return res.status(404).json({ error: "Transaction not found", success: false });
    }

    res.json({ transaction: transactions[0], success: true });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Create inventory transaction
router.post("/createTransaction", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id, id: user_id } = req.user;
    const {
      item_id,
      transaction_type, // IN, OUT, ADJUSTMENT, RETURN
      quantity,
      unit_cost,
      reference_type,
      reference_id,
      batch_number,
      expiry_date,
      note
    } = req.body;

    // Convert empty strings to null for optional fields
    const cleanReference_type = reference_type && reference_type.trim() ? reference_type : null;
    const cleanBatch_number = batch_number && batch_number.trim() ? batch_number : null;
    const cleanNote = note && note.trim() ? note : null;

    // Validation
    if (!item_id || !transaction_type || quantity === undefined) {
      return res.status(400).json({ 
        error: "Item ID, transaction type, and quantity are required", 
        success: false 
      });
    }

    // Validate transaction type
    const validTransactionTypes = ['IN', 'OUT', 'ADJUSTMENT', 'RETURN'];
    if (!validTransactionTypes.includes(transaction_type)) {
      return res.status(400).json({ 
        error: "Invalid transaction type. Must be IN, OUT, ADJUSTMENT, or RETURN", 
        success: false 
      });
    }

    const finalAgencyId = role === 'super_admin' ? req.body.agency_id || agency_id : agency_id;

    // Check if item exists and belongs to agency
    const [itemCheck] = await pool.execute(
      "SELECT id FROM item_master WHERE id = ? AND agency_id = ?",
      [item_id, finalAgencyId]
    );

    if (itemCheck.length === 0) {
      return res.status(400).json({ error: "Item not found in your agency", success: false });
    }

    // Get or create inventory record
    const [existingInventory] = await pool.execute(
      "SELECT id, current_quantity FROM inventory WHERE agency_id = ? AND item_id = ?",
      [finalAgencyId, item_id]
    );

    let inventoryId;
    let currentQuantity = 0;

    if (existingInventory.length === 0) {
      // Create inventory record with default reorder level
      const [createResult] = await pool.execute(
        `INSERT INTO inventory (agency_id, item_id, current_quantity, reserved_quantity, reorder_level, status)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
        [finalAgencyId, item_id, 0, 0, 10]
      );
      inventoryId = createResult.insertId;
    } else {
      inventoryId = existingInventory[0].id;
      currentQuantity = existingInventory[0].current_quantity;
    }

    // Calculate new quantity based on transaction type
    let newQuantity = currentQuantity;
    if (transaction_type === 'IN' || transaction_type === 'ADJUSTMENT') {
      newQuantity += parseInt(quantity);
    } else if (transaction_type === 'OUT' || transaction_type === 'RETURN') {
      newQuantity -= parseInt(quantity);
    }

    // Validate sufficient quantity for OUT/RETURN transactions
    if ((transaction_type === 'OUT' || transaction_type === 'RETURN') && newQuantity < 0) {
      return res.status(400).json({ 
        error: `Insufficient quantity. Available: ${currentQuantity}, Requested: ${quantity}`, 
        success: false 
      });
    }

    // Calculate total cost
    const totalCost = unit_cost ? parseFloat(unit_cost) * parseInt(quantity) : null;

    // Begin transaction - insert transaction and update inventory
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert transaction record
      const [transResult] = await connection.execute(
        `INSERT INTO inventory_transactions 
         (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
          reference_type, reference_id, batch_number, expiry_date, note, performed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalAgencyId,
          item_id,
          transaction_type,
          parseInt(quantity),
          unit_cost ? parseFloat(unit_cost) : null,
          totalCost,
          cleanReference_type,
          reference_id ? parseInt(reference_id) : null,
          cleanBatch_number,
          expiry_date || null,
          cleanNote,
          user_id
        ]
      );

      // Update inventory quantity and dates
      const dateField = transaction_type === 'IN' ? 'last_stock_in_date' : 'last_stock_out_date';
      const updateQuery = `UPDATE inventory 
                           SET current_quantity = ?, ${dateField} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                           WHERE id = ?`;

      await connection.execute(updateQuery, [newQuantity, inventoryId]);

      await connection.commit();

      res.status(201).json({
        message: "Transaction created successfully",
        transactionId: transResult.insertId,
        success: true
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Internal server error", details: error.message, success: false });
  }
});

// Update transaction (only for adjustments/notes)
router.put('/updateTransaction/:id', authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const transactionId = req.params.id;
    const { note } = req.body;

    // Only allow updating notes for existing transactions
    let updateQuery = `UPDATE inventory_transactions
                      SET note = ?, updated_at = CURRENT_TIMESTAMP
                      WHERE id = ?`;
    let updateParams = [note || null, transactionId];

    if (role !== 'super_admin') {
      updateQuery += ' AND agency_id = ?';
      updateParams.push(agency_id);
    }

    const [result] = await pool.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found or not authorized', success: false });
    }

    res.json({ message: 'Transaction updated successfully', success: true });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, success: false });
  }
});

// Delete transaction (only super admin or within timeframe)
router.delete('/deleteTransaction/:id', authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const transactionId = req.params.id;

    // Get transaction details first
    const [transactions] = await pool.execute(
      "SELECT * FROM inventory_transactions WHERE id = ?",
      [transactionId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found', success: false });
    }

    const transaction = transactions[0];

    // Check authorization
    if (role !== 'super_admin' && transaction.agency_id !== agency_id) {
      return res.status(403).json({ error: 'Not authorized to delete this transaction', success: false });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Reverse the transaction
      const [inventory] = await connection.execute(
        "SELECT current_quantity FROM inventory WHERE id = (SELECT id FROM inventory WHERE agency_id = ? AND item_id = ? LIMIT 1)",
        [transaction.agency_id, transaction.item_id]
      );

      if (inventory.length > 0) {
        let reversedQuantity = inventory[0].current_quantity;
        if (transaction.transaction_type === 'IN' || transaction.transaction_type === 'ADJUSTMENT') {
          reversedQuantity -= transaction.quantity;
        } else if (transaction.transaction_type === 'OUT' || transaction.transaction_type === 'RETURN') {
          reversedQuantity += transaction.quantity;
        }

        // Update inventory back to previous state
        await connection.execute(
          "UPDATE inventory SET current_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE agency_id = ? AND item_id = ?",
          [reversedQuantity, transaction.agency_id, transaction.item_id]
        );
      }

      // Delete transaction
      await connection.execute(
        "DELETE FROM inventory_transactions WHERE id = ?",
        [transactionId]
      );

      await connection.commit();

      res.json({ message: 'Transaction deleted and inventory reversed successfully', success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, success: false });
  }
});

export default router;
