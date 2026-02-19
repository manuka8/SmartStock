import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all customers
router.get("/getAllCustomers", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;

    let query = "SELECT *, CONCAT(first_name, ' ', last_name) as name FROM customers WHERE agency_id = ? ORDER BY created_at DESC";
    let params = [agency_id];

    // Super admin can get suppliers from all agencies or specific one
    if (role === "super_admin" && req.query.agency_id) {
      query = "SELECT *, CONCAT(first_name, ' ', last_name) as name FROM customers WHERE agency_id = ? ORDER BY created_at DESC";
      params = [req.query.agency_id];
    }

    const [customers] = await pool.execute(query, params);

    res.json({ customers, success: true });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get single customer by id
router.get("/getSingleCustomer/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const supplierId = req.params.id;

    let query = "SELECT *, CONCAT(first_name, ' ', last_name) as name FROM customers WHERE id = ?";
    let params = [supplierId];

    if (role !== "super_admin") {
      query += " AND agency_id = ?";
      params.push(agency_id);
    }

    const [customers] = await pool.execute(query, params);

    if (customers.length === 0) {
      return res
        .status(404)
        .json({ error: "Customer not found", success: false });
    }

    res.json({ customer: customers[0], success: true });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Add a new customer
router.post("/addCustomer", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const {
      customer_code,
      customer_type = "WALK_IN",
      first_name,
      last_name,
      business_name,
      email,
      phone,
      address_line1,
      address_line2,
      city,
      district,
      postal_code,
      tax_number,
      credit_limit = 0.0,
      outstanding_balance = 0.0,
      credit_days = 0,
      loyalty_points = 0,
      total_purchases = 0.0,
      status = "ACTIVE",
      notes = null,
    } = req.body;

    // Validation
    if (!first_name || !last_name) {
      return res.status(400).json({
        error: "Customer code, first name and last name are required",
        success: false,
      });
    }

    const finalAgencyId =
      role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    // Determine price_type based on customer_type
    let price_type = 'selling_price_1'; // default
    if (customer_type === 'REGISTERED') {
      price_type = 'selling_price_1';
    } else if (customer_type === 'WHOLESALE') {
      price_type = 'selling_price_2';
    } else if (customer_type === 'VIP') {
      price_type = 'selling_price_3';
    }

    const [result] = await pool.execute(
      `INSERT INTO customers
       (agency_id, customer_code, customer_type, price_type, first_name, last_name, business_name, email, phone,
        address_line1, address_line2, city, district, postal_code, tax_number,
        credit_limit, outstanding_balance, credit_days, loyalty_points, total_purchases, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalAgencyId,
        customer_code,
        customer_type,
        price_type,
        first_name,
        last_name,
        business_name,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        district,
        postal_code,
        tax_number,
        credit_limit,
        outstanding_balance,
        credit_days,
        loyalty_points,
        total_purchases,
        status,
        notes,
      ]
    );

    res.status(201).json({
      message: "Supplier added successfully",
      supplierId: result.insertId,
      success: true,
    });
  } catch (error) {
    console.error("Error adding customer:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        error: "Customer code already exists for this agency",
        success: false,
      });
    }
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      success: false,
    });
  }
});

// Update a customer
router.put("/updateCustomer/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const customerId = req.params.id;
    const {
      customer_code,
      customer_type = "WALK_IN",
      first_name,
      last_name,
      business_name,
      email,
      phone,
      address_line1,
      address_line2,
      city,
      district,
      postal_code,
      tax_number,
      credit_limit = 0.0,
      outstanding_balance,
      credit_days = 0,
      loyalty_points = 0,
      total_purchases = 0.0,
      status = "ACTIVE",
      notes = null,
    } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({
        error: "First name and last name are required",
        success: false,
      });
    }

    // Determine price_type based on customer_type
    let price_type = 'selling_price_1'; // default
    if (customer_type === 'REGISTERED') {
      price_type = 'selling_price_1';
    } else if (customer_type === 'WHOLESALE') {
      price_type = 'selling_price_2';
    } else if (customer_type === 'VIP') {
      price_type = 'selling_price_3';
    }

    let updateFields = [];
    let updateParams = [];

    updateFields.push('customer_code = ?');
    updateParams.push(customer_code);

    updateFields.push('customer_type = ?');
    updateParams.push(customer_type);

    updateFields.push('price_type = ?');
    updateParams.push(price_type);

    updateFields.push('first_name = ?');
    updateParams.push(first_name);

    updateFields.push('last_name = ?');
    updateParams.push(last_name);

    updateFields.push('business_name = ?');
    updateParams.push(business_name);

    updateFields.push('email = ?');
    updateParams.push(email);

    updateFields.push('phone = ?');
    updateParams.push(phone);

    updateFields.push('address_line1 = ?');
    updateParams.push(address_line1);

    updateFields.push('address_line2 = ?');
    updateParams.push(address_line2);

    updateFields.push('city = ?');
    updateParams.push(city);

    updateFields.push('district = ?');
    updateParams.push(district);

    updateFields.push('postal_code = ?');
    updateParams.push(postal_code);

    updateFields.push('tax_number = ?');
    updateParams.push(tax_number);

    updateFields.push('credit_limit = ?');
    updateParams.push(credit_limit);

    if (outstanding_balance !== undefined) {
      updateFields.push('outstanding_balance = ?');
      updateParams.push(outstanding_balance);
    }

    updateFields.push('credit_days = ?');
    updateParams.push(credit_days);

    updateFields.push('loyalty_points = ?');
    updateParams.push(loyalty_points);

    updateFields.push('total_purchases = ?');
    updateParams.push(total_purchases);

    updateFields.push('status = ?');
    updateParams.push(status || "ACTIVE");

    updateFields.push('notes = ?');
    updateParams.push(notes);

    let updateQuery = `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`;
    updateParams.push(customerId);

    // Add agency filter for non-super_admin users
    if (role !== 'super_admin') {
      updateQuery += ' AND agency_id = ?';
      updateParams.push(agency_id);
    }

    const [result] = await pool.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found or not authorized', success: false });
    }

    res.status(201).json({ message: 'Customer updated successfully', success: true });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, success: false });
  }
});

router.delete('/deleteCustomer/:id', authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const customerId = req.params.id;

    // Build query based on user role
    let query = 'DELETE FROM customers WHERE id = ?';
    let params = [customerId];

    // Filter by agency_id for non-super_admin users
    if (role !== 'super_admin' && agency_id) {
      query += ' AND agency_id = ?';
      params.push(agency_id);
    }

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found or you do not have permission to delete it', success: false });
    }

    res.status(201).json({ message: 'Customer deleted successfully', success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, success: false });
  }
});

// --- Credit Management ---

// Get all customers with outstanding credit balances
router.get("/credit-balances", authenticateToken, async (req, res) => {
  try {
    const { agency_id } = req.user;
    const [customers] = await pool.execute(
      `SELECT id, customer_code, first_name, last_name, business_name, phone, outstanding_balance, credit_limit 
       FROM customers 
       WHERE agency_id = ? AND outstanding_balance > 0 
       ORDER BY outstanding_balance DESC`,
      [agency_id]
    );
    res.json({ customers, success: true });
  } catch (error) {
    console.error("Error fetching credit balances:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Record a credit payment from a customer
router.post("/credit-payment", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { agency_id, id: user_id } = req.user;
    const { customer_id, amount, payment_date, payment_method, reference_number, notes } = req.body;

    if (!customer_id || !amount || !payment_date || !payment_method) {
      return res.status(400).json({ error: "Required fields missing", success: false });
    }

    // 1. Insert payment record
    await connection.execute(
      `INSERT INTO customer_credit_payments (agency_id, customer_id, payment_date, amount, payment_method, reference_number, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [agency_id, customer_id, payment_date, amount, payment_method, reference_number, notes, user_id]
    );

    // 2. Update customer outstanding balance
    await connection.execute(
      "UPDATE customers SET outstanding_balance = outstanding_balance - ? WHERE id = ? AND agency_id = ?",
      [amount, customer_id, agency_id]
    );

    // 3. Add to finance table as INCOME
    await connection.execute(
      `INSERT INTO finance (agency_id, transaction_date, amount, type, category, source, payment_method, reference_number, notes)
       VALUES (?, ?, ?, 'INCOME', 'CREDIT_PAYMENT', ?, ?, ?, ?)`,
      [agency_id, payment_date, amount, `Customer ID: ${customer_id}`, payment_method, reference_number, notes]
    );

    await connection.commit();
    res.json({ message: "Payment recorded successfully", success: true });
  } catch (error) {
    await connection.rollback();
    console.error("Error recording credit payment:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  } finally {
    connection.release();
  }
});

// Get credit payment history for a customer
router.get("/credit-history/:id", authenticateToken, async (req, res) => {
  try {
    const { agency_id } = req.user;
    const { id } = req.params;
    const [history] = await pool.execute(
      "SELECT * FROM customer_credit_payments WHERE customer_id = ? AND agency_id = ? ORDER BY payment_date DESC",
      [id, agency_id]
    );
    res.json({ history, success: true });
  } catch (error) {
    console.error("Error fetching credit history:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get all credit payments for dashboard summary
router.get("/getAllCreditPayments", authenticateToken, async (req, res) => {
  try {
    const { agency_id } = req.user;
    const [payments] = await pool.execute(
      "SELECT * FROM customer_credit_payments WHERE agency_id = ? ORDER BY payment_date DESC",
      [agency_id]
    );
    res.json({ payments, success: true });
  } catch (error) {
    console.error("Error fetching all credit payments:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

export default router;