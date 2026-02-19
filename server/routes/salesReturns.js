import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Generate return number
function generateReturnNumber(agencyId) {
  const timestamp = Date.now().toString().slice(-6);
  return `RTN-${agencyId}-${timestamp}`;
}

// Create sales return
router.post("/createReturn", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { role, agency_id, id: user_id } = req.user;
    const {
      invoice_id,
      vehicle_sale_id,
      return_date,
      return_reason,
      items // array of { item_id, return_type, quantity, unit_price, batch_number, expiry_date }
    } = req.body;

    // Validation
    if (!invoice_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invoice ID and at least one return item are required"
      });
    }

    if (!return_date) {
      return res.status(400).json({
        success: false,
        error: "Return date is required"
      });
    }

    const finalAgencyId = role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    // Check if invoice exists and belongs to agency
    const [invoiceCheck] = await connection.execute(
      "SELECT id, invoice_type, vehicle_id, vehicle_sale_id, subtotal, discount_total, tax_total, grand_total, amount_paid FROM invoices WHERE id = ? AND agency_id = ?",
      [invoice_id, finalAgencyId]
    );

    if (invoiceCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found"
      });
    }

    const invoice = invoiceCheck[0];
    let vehicle_id = null;
    let actual_vehicle_sale_id = vehicle_sale_id || invoice.vehicle_sale_id;

    // Determine vehicle_id based on invoice type
    if (invoice.invoice_type === 'VEHICLE_SALE') {
      if (!actual_vehicle_sale_id) {
        return res.status(400).json({
          success: false,
          error: "Vehicle sale ID is required for vehicle sale returns"
        });
      }

      // Get vehicle_id from vehicle_sales
      const [vehicleSaleCheck] = await connection.execute(
        "SELECT vehicle_id FROM vehicle_sales WHERE id = ? AND agency_id = ?",
        [actual_vehicle_sale_id, finalAgencyId]
      );

      if (vehicleSaleCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Vehicle sale not found"
        });
      }

      vehicle_id = vehicleSaleCheck[0].vehicle_id;

      // Validation: vehicle_id must match invoice's vehicle_id
      if (invoice.vehicle_id !== vehicle_id) {
        return res.status(400).json({
          success: false,
          error: "Vehicle ID mismatch between invoice and vehicle sale"
        });
      }
    } else if (invoice.invoice_type === 'DIRECT_SALE') {
      // For direct sales, vehicle_id remains NULL
      vehicle_id = null;
    } else {
      return res.status(400).json({
        success: false,
        error: "Returns are only supported for vehicle sales and direct sales"
      });
    }

    await connection.beginTransaction();

    // Generate return number
    const returnNumber = generateReturnNumber(finalAgencyId);

    // Calculate totals
    let marketReturnTotal = 0;
    let expiredReturnTotal = 0;

    // Validate items and calculate totals
    for (const item of items) {
      const { item_id, return_type, quantity, unit_price } = item;

      if (!item_id || !return_type || !quantity || quantity <= 0 || !unit_price) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: "Each return item must have valid item_id, return_type, quantity > 0, and unit_price"
        });
      }

      if (!['MARKET', 'EXPIRED'].includes(return_type)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: "Return type must be either 'MARKET' or 'EXPIRED'"
        });
      }

      // Check if item was sold in the invoice
      let soldQuantity = 0;
      if (invoice.invoice_type === 'VEHICLE_SALE') {
        const [soldItems] = await connection.execute(
          "SELECT quantity FROM vehicle_sales_items WHERE vehicle_sale_id = ? AND item_id = ? AND agency_id = ?",
          [actual_vehicle_sale_id, item_id, finalAgencyId]
        );
        soldQuantity = soldItems.length > 0 ? soldItems[0].quantity : 0;
      } else {
        // For direct sales, we might need to check from a different table, but assuming it's handled elsewhere
        soldQuantity = quantity; // Placeholder, adjust as needed
      }

      // Check already returned quantity
      const [alreadyReturned] = await connection.execute(
        `SELECT COALESCE(SUM(sri.quantity), 0) as returned_qty
         FROM sales_return_items sri
         INNER JOIN sales_returns sr ON sri.sales_return_id = sr.id
         WHERE sr.invoice_id = ? AND sri.item_id = ? AND sr.agency_id = ? AND sr.status != 'CANCELLED'`,
        [invoice_id, item_id, finalAgencyId]
      );

      const alreadyReturnedQty = alreadyReturned[0].returned_qty;

      if (quantity > (soldQuantity - alreadyReturnedQty)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: `Cannot return more than sold quantity for item ${item_id}. Sold: ${soldQuantity}, Already returned: ${alreadyReturnedQty}, Attempting: ${quantity}`
        });
      }

      const lineTotal = unit_price * quantity;
      if (return_type === 'MARKET') {
        marketReturnTotal += lineTotal;
      } else {
        expiredReturnTotal += lineTotal;
      }
    }

    const totalReturnAmount = marketReturnTotal + expiredReturnTotal;

    // Create sales return record
    const [returnResult] = await connection.execute(
      `INSERT INTO sales_returns
       (agency_id, invoice_id, vehicle_sale_id, vehicle_id, return_number, return_date,
        return_reason, market_return_total, expired_return_total, total_return_amount,
        status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
      [
        finalAgencyId,
        invoice_id,
        actual_vehicle_sale_id,
        vehicle_id,
        returnNumber,
        return_date,
        return_reason || null,
        marketReturnTotal,
        expiredReturnTotal,
        totalReturnAmount,
        user_id
      ]
    );

    const returnId = returnResult.insertId;

    // Process each return item
    for (const item of items) {
      const { item_id, return_type, quantity, unit_price, batch_number, expiry_date } = item;
      const lineTotal = unit_price * quantity;

      // Insert return item
      await connection.execute(
        `INSERT INTO sales_return_items
         (agency_id, sales_return_id, item_id, return_type, quantity, unit_price,
          line_total, batch_number, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalAgencyId,
          returnId,
          item_id,
          return_type,
          quantity,
          unit_price,
          lineTotal,
          batch_number || null,
          expiry_date || null
        ]
      );

      if (return_type === 'MARKET') {
        // Add back to vehicle inventory
        if (vehicle_id) {
          const [vehicleInventory] = await connection.execute(
            "SELECT id, current_quantity FROM vehicle_inventory WHERE vehicle_id = ? AND item_id = ?",
            [vehicle_id, item_id]
          );

          if (vehicleInventory.length > 0) {
            const newQty = vehicleInventory[0].current_quantity + quantity;
            await connection.execute(
              `UPDATE vehicle_inventory
               SET current_quantity = ?, last_updated = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [newQty, vehicleInventory[0].id]
            );
          } else {
            // If no vehicle inventory record exists, create one
            await connection.execute(
              `INSERT INTO vehicle_inventory
               (agency_id, vehicle_id, item_id, current_quantity)
               VALUES (?, ?, ?, ?)`,
              [finalAgencyId, vehicle_id, item_id, quantity]
            );
          }

          // Record inventory transaction
          await connection.execute(
            `INSERT INTO inventory_transactions
             (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
              reference_type, reference_id, source_location, destination_location, note, performed_by)
             VALUES (?, ?, 'IN', ?, ?, ?, 'VEHICLE_RETURN', ?, 'CUSTOMER', 'VEHICLE', ?, ?)`,
            [
              finalAgencyId,
              item_id,
              quantity,
              unit_price,
              lineTotal,
              returnId,
              `Market return to vehicle - Return: ${returnNumber}`,
              user_id
            ]
          );
        } else {
          // For direct sales, add to main inventory
          const [mainInventory] = await connection.execute(
            "SELECT id, current_quantity FROM inventory WHERE item_id = ? AND agency_id = ?",
            [item_id, finalAgencyId]
          );

          if (mainInventory.length > 0) {
            const newQty = mainInventory[0].current_quantity + quantity;
            await connection.execute(
              `UPDATE inventory
               SET current_quantity = ?, last_stock_in_date = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [newQty, mainInventory[0].id]
            );
          } else {
            await connection.execute(
              `INSERT INTO inventory
               (agency_id, item_id, current_quantity)
               VALUES (?, ?, ?)`,
              [finalAgencyId, item_id, quantity]
            );
          }

          // Record inventory transaction
          await connection.execute(
            `INSERT INTO inventory_transactions
             (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
              reference_type, reference_id, source_location, destination_location, note, performed_by)
             VALUES (?, ?, 'IN', ?, ?, ?, 'VEHICLE_RETURN', ?, 'CUSTOMER', 'MAIN', ?, ?)`,
            [
              finalAgencyId,
              item_id,
              quantity,
              unit_price,
              lineTotal,
              returnId,
              `Market return to main inventory - Return: ${returnNumber}`,
              user_id
            ]
          );
        }
      } else if (return_type === 'EXPIRED') {
        // Insert into expired stock
        await connection.execute(
          `INSERT INTO expired_stock
           (agency_id, item_id, vehicle_id, quantity, reason, source, reference_type, reference_id, recorded_date)
           VALUES (?, ?, ?, ?, 'EXPIRED', 'VEHICLE_RETURN', 'SALE_RETURN', ?, ?)`,
          [
            finalAgencyId,
            item_id,
            vehicle_id,
            quantity,
            returnId,
            return_date
          ]
        );

        // Record inventory transaction
        await connection.execute(
          `INSERT INTO inventory_transactions
           (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
            reference_type, reference_id, source_location, destination_location, note, performed_by)
           VALUES (?, ?, 'OUT', ?, ?, ?, 'VEHICLE_RETURN', ?, 'VEHICLE', 'SCRAP', ?, ?)`,
          [
            finalAgencyId,
            item_id,
            quantity,
            unit_price,
            lineTotal,
            returnId,
            `Expired return to scrap - Return: ${returnNumber}`,
            user_id
          ]
        );
      }
    }

    // Update invoice subtotal by subtracting return amount, and recalculate grand_total
    const newSubtotal = invoice.subtotal - totalReturnAmount;
    const newGrandTotal = newSubtotal - invoice.discount_total + invoice.tax_total;
    const newAmountDue = Math.max(0, newGrandTotal - invoice.amount_paid); // Ensure amount_due doesn't go negative
    await connection.execute(
      "UPDATE invoices SET subtotal = ?, grand_total = ?, amount_due = ? WHERE id = ? AND agency_id = ?",
      [newSubtotal, newGrandTotal, newAmountDue, invoice_id, finalAgencyId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Return created successfully",
      returnId: returnId,
      returnNumber: returnNumber,
      totalReturnAmount: totalReturnAmount
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating sales return:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Get all sales returns
router.get("/getAllReturns", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const { status, start_date, end_date } = req.query;

    let query = `
      SELECT
        sr.*,
        i.invoice_number,
        v.vehicle_code,
        v.vehicle_number,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM sales_returns sr
      LEFT JOIN invoices i ON sr.invoice_id = i.id
      LEFT JOIN vehicles v ON sr.vehicle_id = v.id
      LEFT JOIN users u ON sr.created_by = u.id
      WHERE sr.agency_id = ?
    `;
    let params = [agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      params = [req.query.agency_id];
    }

    if (status && status !== 'all') {
      query += " AND sr.status = ?";
      params.push(status);
    }

    if (start_date) {
      query += " AND sr.return_date >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND sr.return_date <= ?";
      params.push(end_date);
    }

    query += " ORDER BY sr.return_date DESC, sr.created_at DESC";

    const [returns] = await pool.execute(query, params);

    res.json({
      success: true,
      returns: returns
    });
  } catch (error) {
    console.error("Error fetching sales returns:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

// Get single sales return with items
router.get("/getReturn/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const returnId = req.params.id;

    let query = `
      SELECT
        sr.*,
        i.invoice_number,
        v.vehicle_code,
        v.vehicle_number,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM sales_returns sr
      LEFT JOIN invoices i ON sr.invoice_id = i.id
      LEFT JOIN vehicles v ON sr.vehicle_id = v.id
      LEFT JOIN users u ON sr.created_by = u.id
      WHERE sr.id = ? AND sr.agency_id = ?
    `;
    let params = [returnId, agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      params = [returnId, req.query.agency_id];
    }

    const [returns] = await pool.execute(query, params);

    if (returns.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Return not found"
      });
    }

    // Get return items
    const [returnItems] = await pool.execute(
      `SELECT
        sri.*,
        im.item_name,
        im.item_code,
        im.unit
      FROM sales_return_items sri
      INNER JOIN item_master im ON sri.item_id = im.id
      WHERE sri.sales_return_id = ?`,
      [returnId]
    );

    res.json({
      success: true,
      return: returns[0],
      items: returnItems
    });
  } catch (error) {
    console.error("Error fetching sales return:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

// Create return invoice
router.post("/createReturnInvoice", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { role, agency_id, id: user_id } = req.user;
    const {
      return_date,
      return_reason,
      items // array of { item_id, return_type, quantity, unit_price, batch_number, expiry_date }
    } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one return item is required"
      });
    }

    if (!return_date) {
      return res.status(400).json({
        success: false,
        error: "Return date is required"
      });
    }

    const finalAgencyId = role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    await connection.beginTransaction();

    // Calculate totals
    let marketReturnTotal = 0;
    let expiredReturnTotal = 0;

    // Validate items and calculate totals
    for (const item of items) {
      const { item_id, return_type, quantity, unit_price } = item;

      if (!item_id || !return_type || !quantity || quantity <= 0 || !unit_price) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: "Each return item must have valid item_id, return_type, quantity > 0, and unit_price"
        });
      }

      if (!['MARKET', 'EXPIRED'].includes(return_type)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: "Return type must be either 'MARKET' or 'EXPIRED'"
        });
      }

      const lineTotal = unit_price * quantity;
      if (return_type === 'MARKET') {
        marketReturnTotal += lineTotal;
      } else {
        expiredReturnTotal += lineTotal;
      }
    }

    const totalReturnAmount = marketReturnTotal + expiredReturnTotal;

    // Generate return number
    const returnNumber = generateReturnNumber(finalAgencyId);

    // Create sales return record
    const [returnResult] = await connection.execute(
      `INSERT INTO sales_returns
       (agency_id, invoice_id, vehicle_sale_id, vehicle_id, return_number, return_date,
        return_reason, market_return_total, expired_return_total, total_return_amount,
        status, created_by)
       VALUES (?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
      [
        finalAgencyId,
        returnNumber,
        return_date,
        return_reason || null,
        marketReturnTotal,
        expiredReturnTotal,
        totalReturnAmount,
        user_id
      ]
    );

    const returnId = returnResult.insertId;

    // Generate invoice number for return invoice
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const invoiceNumber = `INVR-${finalAgencyId}-${year}${month}${day}-${returnId}`;

    // Create return invoice
    const [invoiceResult] = await connection.execute(
      `INSERT INTO invoices
       (agency_id, invoice_number, invoice_type, customer_name, customer_address, customer_phone,
        vehicle_id, vehicle_sale_id, subtotal, discount_total, tax_total, grand_total,
        payment_method, payment_status, amount_paid, amount_due, sale_date, notes, created_by)
       VALUES (?, ?, 'RETURN', 'Return Customer', NULL, NULL, NULL, NULL, ?, 0, 0, ?, 'CASH', 'PAID', ?, 0, ?, ?, ?)`,
      [
        finalAgencyId,
        invoiceNumber,
        totalReturnAmount,
        totalReturnAmount,
        totalReturnAmount,
        return_date,
        return_reason || 'Return Invoice',
        user_id
      ]
    );

    const returnInvoiceId = invoiceResult.insertId;

    // Process each return item
    for (const item of items) {
      const { item_id, return_type, quantity, unit_price, batch_number, expiry_date } = item;
      const lineTotal = unit_price * quantity;

      // Insert return item
      await connection.execute(
        `INSERT INTO sales_return_items
         (agency_id, sales_return_id, item_id, return_type, quantity, unit_price,
          line_total, batch_number, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalAgencyId,
          returnId,
          item_id,
          return_type,
          quantity,
          unit_price,
          lineTotal,
          batch_number || null,
          expiry_date || null
        ]
      );

      if (return_type === 'MARKET') {
        // Add to main inventory
        const [mainInventory] = await connection.execute(
          "SELECT id, current_quantity FROM inventory WHERE item_id = ? AND agency_id = ?",
          [item_id, finalAgencyId]
        );

        if (mainInventory.length > 0) {
          const newQty = mainInventory[0].current_quantity + quantity;
          await connection.execute(
            `UPDATE inventory
             SET current_quantity = ?, last_stock_in_date = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [newQty, mainInventory[0].id]
          );
        } else {
          await connection.execute(
            `INSERT INTO inventory
             (agency_id, item_id, current_quantity)
             VALUES (?, ?, ?)`,
            [finalAgencyId, item_id, quantity]
          );
        }

        // Record inventory transaction
        await connection.execute(
          `INSERT INTO inventory_transactions
           (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
            reference_type, reference_id, source_location, destination_location, note, performed_by)
           VALUES (?, ?, 'IN', ?, ?, ?, 'VEHICLE_RETURN', ?, 'CUSTOMER', 'MAIN', ?, ?)`,
          [
            finalAgencyId,
            item_id,
            quantity,
            unit_price,
            lineTotal,
            returnId,
            `Market return to main inventory - Return: ${returnNumber}`,
            user_id
          ]
        );
      } else if (return_type === 'EXPIRED') {
        // Insert into expired stock
        await connection.execute(
          `INSERT INTO expired_stock
           (agency_id, item_id, vehicle_id, quantity, reason, source, reference_type, reference_id, recorded_date)
           VALUES (?, ?, NULL, ?, 'EXPIRED', 'RETURN_INVOICE', 'SALE_RETURN', ?, ?)`,
          [
            finalAgencyId,
            item_id,
            quantity,
            returnId,
            return_date
          ]
        );

        // Record inventory transaction
        await connection.execute(
          `INSERT INTO inventory_transactions
           (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
            reference_type, reference_id, source_location, destination_location, note, performed_by)
           VALUES (?, ?, 'OUT', ?, ?, ?, 'VEHICLE_RETURN', ?, 'CUSTOMER', 'SCRAP', ?, ?)`,
          [
            finalAgencyId,
            item_id,
            quantity,
            unit_price,
            lineTotal,
            returnId,
            `Expired return to scrap - Return: ${returnNumber}`,
            user_id
          ]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Return invoice created successfully",
      returnId: returnId,
      returnNumber: returnNumber,
      returnInvoiceId: returnInvoiceId,
      invoiceNumber: invoiceNumber,
      totalReturnAmount: totalReturnAmount
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating return invoice:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  } finally {
    connection.release();
  }
});

export default router;