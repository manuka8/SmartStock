import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Generate unique GRN number
function generateGRNNumber(agencyId) {
  const prefix = 'GRN';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
}

// Create GRN (Goods Received Note) - Status: DRAFT (no inventory update)
router.post('/create', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  const agency_id = req.user.agency_id;
  const {
    supplier_id,
    grn_number,
    invoice_number,
    invoice_date,
    due_date,
    received_date,
    source,
    warehouse,
    notes,
    items
  } = req.body;

  try {
    await connection.beginTransaction();

    // Validate required fields
    if (!supplier_id || !received_date || !items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: supplier_id, received_date, or items'
      });
    }

    // Validate that all items have valid item_id
    const invalidItems = items.filter(item => !item.item_id || item.item_id === 0);
    if (invalidItems.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid items',
        details: 'All items must have a valid product selected'
      });
    }

    // Map buying_price to unit_price
    const mappedItems = items.map(item => ({ ...item, unit_price: item.buying_price }));

    // Generate GRN number if not provided
    const finalGrnNumber = grn_number || generateGRNNumber(agency_id);

    // Check if GRN number already exists
    const [existingGrn] = await connection.execute(
      'SELECT id FROM grn WHERE agency_id = ? AND grn_number = ?',
      [agency_id, finalGrnNumber]
    );

    if (existingGrn.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'GRN number already exists'
      });
    }

    // Calculate totals
    const totals = mappedItems.reduce((acc, item) => {
      const lineTotal = item.quantity * item.unit_price;
      const discountAmount = lineTotal * (item.discount_percent || 0) / 100;
      const taxableAmount = lineTotal - discountAmount;
      const taxAmount = taxableAmount * (item.tax_percent || 0) / 100;

      acc.subtotal += lineTotal;
      acc.discount_total += discountAmount;
      acc.tax_total += taxAmount;
      acc.grand_total += taxableAmount + taxAmount;

      return acc;
    }, { subtotal: 0, discount_total: 0, tax_total: 0, grand_total: 0 });

    // Insert GRN header (status = DRAFT)
    const [grnResult] = await connection.execute(
      `INSERT INTO grn (
        agency_id, supplier_id, grn_number, invoice_number,
        invoice_date, due_date, received_date, source, warehouse,
        total_items, subtotal, discount_total, tax_total, grand_total,
        status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)`,
      [
        agency_id, supplier_id, finalGrnNumber, invoice_number || null,
        invoice_date || null, due_date || null, received_date, source || null, warehouse || null,
        mappedItems.length, totals.subtotal, totals.discount_total, totals.tax_total, totals.grand_total,
        notes || null, req.user.id
      ]
    );

    const grnId = grnResult.insertId;

    // Insert GRN items
    const itemPromises = mappedItems.map(async (item) => {
      const lineTotal = item.quantity * item.unit_price;
      const discountAmount = lineTotal * (item.discount_percent || 0) / 100;
      const taxableAmount = lineTotal - discountAmount;
      const taxAmount = taxableAmount * (item.tax_percent || 0) / 100;
      const finalLineTotal = taxableAmount + taxAmount;

      await connection.execute(
        `INSERT INTO grn_items (
          agency_id, grn_id, item_id, quantity, unit_price,
          discount_percent, discount_amount, tax_percent, tax_amount, line_total,
          batch_number, expiry_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          agency_id, grnId, item.item_id, item.quantity, item.unit_price,
          item.discount_percent || 0, discountAmount, item.tax_percent || 0, taxAmount, finalLineTotal,
          item.batch_number || null, item.expiry_date || null
        ]
      );
    });

    await Promise.all(itemPromises);
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'GRN created successfully',
      data: {
        grn_id: grnId,
        grn_number: finalGrnNumber
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating GRN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create GRN',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Get all GRNs for an agency
router.get('/getAll', authenticateToken, async (req, res) => {
  const agency_id = req.user.agency_id;
  const { page = 1, limit = 10, status, supplier_id, date_from, date_to } = req.query;

  try {
    if (!agency_id) {
      return res.status(400).json({
        success: false,
        error: 'Agency ID is required'
      });
    }

    const agencyIdNum = parseInt(agency_id);
    if (isNaN(agencyIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Agency ID'
      });
    }

    // Build WHERE clause
    let whereClause = 'WHERE g.agency_id = ?';
    const params = [agencyIdNum];

    if (status && status !== 'ALL' && status !== 'all') {
      whereClause += ' AND g.status = ?';
      params.push(status);
    }

    if (supplier_id) {
      const supplierIdNum = parseInt(supplier_id);
      if (!isNaN(supplierIdNum)) {
        whereClause += ' AND g.supplier_id = ?';
        params.push(supplierIdNum);
      }
    }

    if (date_from) {
      whereClause += ' AND g.received_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND g.received_date <= ?';
      params.push(date_to);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM grn g ${whereClause}`,
      params
    );

    const total = countResult[0].total;
    const limitNum = parseInt(String(limit)) || 10;
    const pageNum = parseInt(String(page)) || 1;
    const offset = Math.max(0, (pageNum - 1) * limitNum);

    // Ensure limit and offset are valid numbers
    if (isNaN(limitNum) || isNaN(offset) || limitNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters'
      });
    }

    // MySQL doesn't support LIMIT/OFFSET as prepared statement parameters in all versions
    // So we use string interpolation (safe since we've validated as integers)
    const limitClause = `LIMIT ${limitNum} OFFSET ${offset}`;

    // Get GRNs with pagination
    const query = `SELECT 
         g.id, g.grn_number, g.invoice_number, g.invoice_date, g.due_date, g.received_date,
         g.source, g.warehouse, g.total_items, g.subtotal, g.discount_total, g.tax_total, g.grand_total, g.status,
         g.created_at, g.updated_at,
         s.supplier_name, s.supplier_code
       FROM grn g
       LEFT JOIN suppliers s ON g.supplier_id = s.id
       ${whereClause}
       ORDER BY g.created_at DESC
       ${limitClause}`;
    
    const [grns] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        grns,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching GRNs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GRNs',
      details: error.message
    });
  }
});

// Get single GRN by ID
router.get('/getSingle/:id', authenticateToken, async (req, res) => {
  const agency_id = req.user.agency_id;
  const { id } = req.params;

  try {
    const [grn] = await pool.execute(
      `SELECT 
         g.id, g.grn_number, g.supplier_id, g.invoice_number, g.invoice_date, g.due_date, g.received_date,
         g.source, g.warehouse, g.total_items, g.subtotal, g.discount_total, g.tax_total, g.grand_total,
         g.status, g.notes, g.created_at, g.updated_at,
         s.supplier_name, s.supplier_code, s.contact_person, s.email, s.phone,
         u.username as created_by_name
       FROM grn g
       LEFT JOIN suppliers s ON g.supplier_id = s.id
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.id = ? AND g.agency_id = ?`,
      [id, agency_id]
    );

    if (grn.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'GRN not found'
      });
    }

    const [items] = await pool.execute(
      `SELECT
          gi.id, gi.item_id, gi.quantity, gi.unit_price as buying_price,
          gi.discount_percent, gi.discount_amount, gi.tax_percent, gi.tax_amount, gi.line_total,
          gi.batch_number, gi.expiry_date,
          im.item_name, im.item_code, im.unit
        FROM grn_items gi
        LEFT JOIN item_master im ON gi.item_id = im.id
        WHERE gi.grn_id = ? AND gi.agency_id = ?`,
      [id, agency_id]
    );

    res.json({
      success: true,
      data: {
        ...grn[0],
        items
      }
    });

  } catch (error) {
    console.error('Error fetching GRN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GRN',
      details: error.message
    });
  }
});

// Update GRN (only if status is DRAFT)
router.put('/update/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  const agency_id = req.user.agency_id;
  const { id } = req.params;
  const {
    supplier_id,
    invoice_number,
    invoice_date,
    due_date,
    received_date,
    source,
    warehouse,
    notes,
    items
  } = req.body;

  try {
    await connection.beginTransaction();

    // Check if GRN exists and is in DRAFT or RECEIVED status
    const [existingGrn] = await connection.execute(
      'SELECT * FROM grn WHERE id = ? AND agency_id = ? AND status IN (?, ?)',
      [id, agency_id, 'DRAFT', 'RECEIVED']
    );

    if (existingGrn.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'GRN not found or cannot be edited (must be in DRAFT or RECEIVED status)'
      });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Items are required'
      });
    }

    // Validate that all items have valid item_id
    const invalidItems = items.filter(item => !item.item_id || item.item_id === 0);
    if (invalidItems.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid items',
        details: 'All items must have a valid product selected'
      });
    }

    // Map buying_price to unit_price
    const mappedItems = items.map(item => ({ ...item, unit_price: item.buying_price }));

    // Calculate new totals
    const totals = mappedItems.reduce((acc, item) => {
      const lineTotal = item.quantity * item.unit_price;
      const discountAmount = lineTotal * (item.discount_percent || 0) / 100;
      const taxableAmount = lineTotal - discountAmount;
      const taxAmount = taxableAmount * (item.tax_percent || 0) / 100;

      acc.subtotal += lineTotal;
      acc.discount_total += discountAmount;
      acc.tax_total += taxAmount;
      acc.grand_total += taxableAmount + taxAmount;

      return acc;
    }, { subtotal: 0, discount_total: 0, tax_total: 0, grand_total: 0 });

    // Update GRN header
    await connection.execute(
      `UPDATE grn SET
          supplier_id = ?, invoice_number = ?, invoice_date = ?, due_date = ?,
          received_date = ?, source = ?, warehouse = ?, notes = ?,
          total_items = ?, subtotal = ?, discount_total = ?, tax_total = ?, grand_total = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND agency_id = ?`,
      [
        supplier_id || existingGrn[0].supplier_id,
        invoice_number || existingGrn[0].invoice_number,
        invoice_date || existingGrn[0].invoice_date,
        due_date || existingGrn[0].due_date,
        received_date || existingGrn[0].received_date,
        source || existingGrn[0].source,
        warehouse || existingGrn[0].warehouse,
        notes || existingGrn[0].notes,
        mappedItems.length, totals.subtotal, totals.discount_total, totals.tax_total, totals.grand_total,
        id, agency_id
      ]
    );

    // Delete existing items
    await connection.execute('DELETE FROM grn_items WHERE grn_id = ? AND agency_id = ?', [id, agency_id]);

    // Insert new items
    const itemPromises = mappedItems.map(async (item) => {
      const lineTotal = item.quantity * item.unit_price;
      const discountAmount = lineTotal * (item.discount_percent || 0) / 100;
      const taxableAmount = lineTotal - discountAmount;
      const taxAmount = taxableAmount * (item.tax_percent || 0) / 100;
      const finalLineTotal = taxableAmount + taxAmount;

      await connection.execute(
        `INSERT INTO grn_items (
          agency_id, grn_id, item_id, quantity, unit_price,
          discount_percent, discount_amount, tax_percent, tax_amount, line_total,
          batch_number, expiry_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          agency_id, id, item.item_id, item.quantity, item.unit_price,
          item.discount_percent || 0, discountAmount, item.tax_percent || 0, taxAmount, finalLineTotal,
          item.batch_number || null, item.expiry_date || null
        ]
      );
    });

    await Promise.all(itemPromises);
    await connection.commit();

    res.json({
      success: true,
      message: 'GRN updated successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating GRN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update GRN',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Confirm GRN (change status to RECEIVED and update inventory)
router.put('/confirm/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  const agency_id = req.user.agency_id;
  const { id } = req.params;

  try {
    await connection.beginTransaction();

    // Check if GRN exists and is in DRAFT status
    const [existingGrn] = await connection.execute(
      'SELECT * FROM grn WHERE id = ? AND agency_id = ? AND status = ?',
      [id, agency_id, 'DRAFT']
    );

    if (existingGrn.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'GRN not found or cannot be confirmed (must be in DRAFT status)'
      });
    }

    // Get all GRN items
    const [items] = await connection.execute(
      `SELECT gi.*, im.item_name, im.item_code 
       FROM grn_items gi
       LEFT JOIN item_master im ON gi.item_id = im.id
       WHERE gi.grn_id = ? AND gi.agency_id = ?`,
      [id, agency_id]
    );

    // Validate that all items have valid item_id
    const invalidItems = items.filter(item => !item.item_id || item.item_id === 0 || !item.item_name);
    if (invalidItems.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid GRN items',
        details: 'Some items do not have valid products selected. Please edit the GRN and select valid products.'
      });
    }

    // Update inventory for each item
    for (const item of items) {
      const qty = Number(item.quantity);
      const unitPrice = parseFloat(item.unit_price);
      const lineTotal = parseFloat(item.line_total);

      // Update or insert inventory
      const [inventory] = await connection.execute(
        'SELECT * FROM inventory WHERE agency_id = ? AND item_id = ?',
        [agency_id, item.item_id]
      );

      if (inventory.length === 0) {
        // Create new inventory record
        await connection.execute(
          `INSERT INTO inventory (
            agency_id, item_id, current_quantity, last_purchase_cost, average_cost,
            last_stock_in_date
          ) VALUES (?, ?, ?, ?, ?, NOW())`,
          [agency_id, item.item_id, qty, unitPrice, unitPrice]
        );
      } else {
        // Update existing inventory
        const currentQty = Number(inventory[0].current_quantity || 0);
        const currentAvgCost = parseFloat(inventory[0].average_cost || 0);
        const newQty = currentQty + qty;
        
        // Calculate new average cost
        const newAvgCost = newQty > 0 
          ? ((currentQty * currentAvgCost) + (qty * unitPrice)) / newQty
          : unitPrice;

        await connection.execute(
          `UPDATE inventory SET
            current_quantity = ?,
            last_purchase_cost = ?,
            average_cost = ?,
            last_stock_in_date = NOW(),
            updated_at = CURRENT_TIMESTAMP
          WHERE agency_id = ? AND item_id = ?`,
          [newQty, unitPrice, newAvgCost, agency_id, item.item_id]
        );
      }

      // Insert inventory transaction
      await connection.execute(
        `INSERT INTO inventory_transactions (
          agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
          reference_type, reference_id, batch_number, expiry_date, performed_by
        ) VALUES (?, ?, 'IN', ?, ?, ?, 'PURCHASE', ?, ?, ?, ?)`,
        [
          agency_id, 
          item.item_id, 
          qty, 
          unitPrice, 
          lineTotal,
          id, 
          item.batch_number || null, 
          item.expiry_date || null, 
          req.user.id
        ]
      );
    }

    // Update GRN status to RECEIVED
    await connection.execute(
      'UPDATE grn SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND agency_id = ?',
      ['RECEIVED', id, agency_id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'GRN confirmed and inventory updated successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error confirming GRN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm GRN',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Cancel GRN (change status to CANCELLED)
router.put('/cancel/:id', authenticateToken, async (req, res) => {
  const agency_id = req.user.agency_id;
  const { id } = req.params;

  try {
    // Check if GRN exists and is in DRAFT status
    const [existingGrn] = await pool.execute(
      'SELECT * FROM grn WHERE id = ? AND agency_id = ? AND status = ?',
      [id, agency_id, 'DRAFT']
    );

    if (existingGrn.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'GRN not found or cannot be cancelled (must be in DRAFT status)'
      });
    }

    // Update status to CANCELLED
    await pool.execute(
      'UPDATE grn SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND agency_id = ?',
      ['CANCELLED', id, agency_id]
    );

    res.json({
      success: true,
      message: 'GRN cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling GRN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel GRN',
      details: error.message
    });
  }
});

// Delete GRN (only if DRAFT or CANCELLED)
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  const agency_id = req.user.agency_id;
  const { id } = req.params;

  try {
    await connection.beginTransaction();

    // Check if GRN exists and can be deleted
    const [existingGrn] = await connection.execute(
      'SELECT * FROM grn WHERE id = ? AND agency_id = ? AND status IN (?, ?)',
      [id, agency_id, 'DRAFT', 'CANCELLED']
    );

    if (existingGrn.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'GRN cannot be deleted (must be in DRAFT or CANCELLED status)'
      });
    }

    // Delete GRN items (cascade will handle this, but explicit for clarity)
    await connection.execute('DELETE FROM grn_items WHERE grn_id = ? AND agency_id = ?', [id, agency_id]);

    // Delete GRN
    await connection.execute('DELETE FROM grn WHERE id = ? AND agency_id = ?', [id, agency_id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'GRN deleted successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting GRN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete GRN',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Get GRN statistics
router.get('/stats', authenticateToken, async (req, res) => {
  const agency_id = req.user.agency_id;
  const { date_from, date_to } = req.query;

  try {
    let whereClause = 'WHERE agency_id = ?';
    const params = [agency_id];

    if (date_from) {
      whereClause += ' AND received_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND received_date <= ?';
      params.push(date_to);
    }

    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_grns,
         SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_count,
         SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received_count,
         SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count,
         SUM(grand_total) as total_value
       FROM grn
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching GRN stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GRN statistics',
      details: error.message
    });
  }
});

export default router;
