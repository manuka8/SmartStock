import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Generate invoice number
function generateInvoiceNumber(agencyId) {
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${agencyId}-${timestamp}`;
}

// Get all invoices
router.get("/getAllInvoices", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const { status, type } = req.query;

    let query = `
      SELECT
        i.*,
        COALESCE(r.total_returned_amount, 0) as total_returned_amount,
        v.vehicle_code,
        v.vehicle_number,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM invoices i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN (
        SELECT invoice_id, SUM(total_return_amount) as total_returned_amount
        FROM sales_returns
        WHERE status != 'CANCELLED'
        GROUP BY invoice_id
      ) r ON i.id = r.invoice_id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.agency_id = ?
    `;
    let params = [agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      params = [req.query.agency_id];
    }

    if (status && status !== 'all') {
      query += " AND i.status = ?";
      params.push(status);
    }

    if (type && type !== 'all') {
      query += " AND i.invoice_type = ?";
      params.push(type);
    }

    if (req.query.created_by) {
      query += " AND i.created_by = ?";
      params.push(req.query.created_by);
    }

    if (req.query.start_date) {
      query += " AND i.created_at >= ?";
      params.push(req.query.start_date + ' 00:00:00');
    }

    if (req.query.end_date) {
      query += " AND i.created_at <= ?";
      params.push(req.query.end_date + ' 23:59:59');
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const offset = (page - 1) * limit;

    // Get total count first
    let countQuery = `SELECT COUNT(*) as total FROM invoices i WHERE i.agency_id = ?`;
    let countParams = [agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      countParams = [req.query.agency_id];
    }

    if (status && status !== 'all') {
      countQuery += " AND i.status = ?";
      countParams.push(status);
    }

    if (type && type !== 'all') {
      countQuery += " AND i.invoice_type = ?";
      countParams.push(type);
    }

    if (req.query.created_by) {
      countQuery += " AND i.created_by = ?";
      countParams.push(req.query.created_by);
    }

    if (req.query.start_date) {
      countQuery += " AND i.created_at >= ?";
      countParams.push(req.query.start_date + ' 00:00:00');
    }

    if (req.query.end_date) {
      countQuery += " AND i.created_at <= ?";
      countParams.push(req.query.end_date + ' 23:59:59');
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const totalCount = countResult[0].total;

    query += ` ORDER BY i.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [invoices] = await pool.execute(query, params);

    res.json({
      success: true,
      invoices: invoices,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

// Get single invoice
router.get("/getInvoice/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const invoiceId = req.params.id;

    let query = `
      SELECT
        i.*,
        COALESCE(r.total_returned_amount, 0) as total_returned_amount,
        v.vehicle_code,
        v.vehicle_number,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM invoices i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN (
        SELECT invoice_id, SUM(total_return_amount) as total_returned_amount
        FROM sales_returns
        WHERE status != 'CANCELLED'
        GROUP BY invoice_id
      ) r ON i.id = r.invoice_id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = ? AND i.agency_id = ?
    `;
    let params = [invoiceId, agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      params = [invoiceId, req.query.agency_id];
    }

    const [invoices] = await pool.execute(query, params);

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found"
      });
    }

    // Get invoice items if it's a vehicle sale
    let items = [];
    if (invoices[0].vehicle_sale_id) {
      const [saleItems] = await pool.execute(
        `SELECT
          vsi.*,
          im.item_name,
          im.item_code,
          im.unit,
          im.category,
          false as is_free
        FROM vehicle_sales_items vsi
        LEFT JOIN item_master im ON vsi.item_id = im.id
        WHERE vsi.vehicle_sale_id = ?`,
        [invoices[0].vehicle_sale_id]
      );
      
      const [freeItems] = await pool.execute(
        `SELECT
          vsfi.id,
          vsfi.agency_id,
          vsfi.vehicle_sale_id,
          vsfi.item_id,
          vsfi.quantity,
          0.00 as unit_price,
          0.00 as line_total,
          im.item_name,
          im.item_code,
          im.unit,
          im.category,
          true as is_free
        FROM vehicle_sales_free_items vsfi
        LEFT JOIN item_master im ON vsfi.item_id = im.id
        WHERE vsfi.vehicle_sale_id = ?`,
        [invoices[0].vehicle_sale_id]
      );

      items = [...saleItems, ...freeItems];

      // Calculate already returned quantity for each item
      for (let item of items) {
        const [alreadyReturned] = await pool.execute(
          `SELECT COALESCE(SUM(sri.quantity), 0) as returned_qty
           FROM sales_return_items sri
           INNER JOIN sales_returns sr ON sri.sales_return_id = sr.id
           WHERE sr.invoice_id = ? AND sri.item_id = ? AND sr.agency_id = ? AND sr.status != 'CANCELLED'`,
          [invoices[0].id, item.item_id, agency_id]
        );
        item.already_returned = alreadyReturned[0].returned_qty;
        item.max_returnable_qty = item.quantity - item.already_returned;
      }
    }

    // Get returned items
    const [returnedItems] = await pool.execute(
      `SELECT
         sri.id,
         sri.quantity,
         sri.unit_price,
         sri.line_total,
         sri.return_type,
         im.item_name,
         im.unit
       FROM sales_return_items sri
       INNER JOIN sales_returns sr ON sri.sales_return_id = sr.id
       LEFT JOIN item_master im ON sri.item_id = im.id
       WHERE sr.invoice_id = ? AND sr.status != 'CANCELLED'`,
      [invoices[0].id]
    );

    res.json({
      success: true,
      invoice: invoices[0],
      items: items,
      returnedItems: returnedItems
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

// Create invoice (usually called automatically from vehicle sales)
router.post("/createInvoice", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { role, agency_id, id: user_id } = req.user;
    const {
      invoice_type = 'VEHICLE_SALE',
      customer_name,
      customer_address,
      customer_phone,
      customer_email,
      vehicle_id,
      vehicle_sale_id,
      subtotal,
      discount_total = 0,
      tax_total = 0,
      grand_total,
      payment_method,
      payment_status = 'UNPAID',
      amount_paid = 0,
      amount_due,
      date,
      notes
    } = req.body;

    const finalAgencyId = role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    await connection.beginTransaction();

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(finalAgencyId);

    // Create invoice record
    const [result] = await connection.execute(
      `INSERT INTO invoices
       (agency_id, invoice_number, invoice_type, customer_name, customer_address,
        customer_phone, customer_email, vehicle_id, vehicle_sale_id, subtotal,
        discount_total, tax_total, grand_total, payment_method, payment_status,
        amount_paid, amount_due, sale_date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalAgencyId,
        invoiceNumber,
        invoice_type,
        customer_name,
        customer_address,
        customer_phone,
        customer_email,
        vehicle_id,
        vehicle_sale_id,
        subtotal,
        discount_total,
        tax_total,
        grand_total,
        payment_method,
        payment_status,
        amount_paid,
        amount_due || grand_total,
        date,
        notes,
        user_id
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoiceId: result.insertId,
      invoiceNumber: invoiceNumber
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating invoice:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Update invoice status
router.put("/updateInvoice/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const invoiceId = req.params.id;
    const { status, payment_status, amount_paid, notes } = req.body;

    let updateQuery = `UPDATE invoices SET`;
    let params = [];
    let updates = [];

    if (status) {
      updates.push(" status = ?");
      params.push(status);
    }

    if (payment_status) {
      updates.push(" payment_status = ?");
      params.push(payment_status);
    }

    if (amount_paid !== undefined) {
      updates.push(" amount_paid = ?, amount_due = grand_total - ?");
      params.push(amount_paid, amount_paid);
    }

    if (notes !== undefined) {
      updates.push(" notes = ?");
      params.push(notes);
    }

    updates.push(" updated_at = CURRENT_TIMESTAMP");

    updateQuery += updates.join(",") + " WHERE id = ? AND agency_id = ?";
    params.push(invoiceId, agency_id);

    if (role === "super_admin" && req.body.agency_id) {
      updateQuery = updateQuery.replace("agency_id = ?", "agency_id = ?");
      params[params.length - 1] = req.body.agency_id;
    }

    const [result] = await pool.execute(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found or no permission to update"
      });
    }

    res.json({
      success: true,
      message: "Invoice updated successfully"
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

export default router;