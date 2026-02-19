import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all transactions (Income & Expense)
router.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const { agency_id } = req.user;
    const { type } = req.query; // Optional filter by type

    let query = "SELECT * FROM finance WHERE agency_id = ?";
    let params = [agency_id];

    if (type) {
      query += " AND type = ?";
      params.push(type.toUpperCase());
    }

    query += " ORDER BY transaction_date DESC";

    const [transactions] = await pool.execute(query, params);
    res.json({ transactions, success: true });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Add a transaction
router.post("/transaction", authenticateToken, async (req, res) => {
  try {
    const { agency_id } = req.user;
    const { transaction_date, amount, type, category, source, payment_method, reference_number, notes } = req.body;

    if (!transaction_date || !amount || !type || !payment_method) {
      return res.status(400).json({ error: "Required fields are missing", success: false });
    }

    const [result] = await pool.execute(
      `INSERT INTO finance (agency_id, transaction_date, amount, type, category, source, payment_method, reference_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [agency_id, transaction_date, amount, type.toUpperCase(), category, source, payment_method, reference_number, notes]
    );

    res.status(201).json({ message: "Transaction added successfully", id: result.insertId, success: true });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Delete a transaction
router.delete("/transaction/:id", authenticateToken, async (req, res) => {
  try {
    const { agency_id } = req.user;
    const { id } = req.params;
    const [result] = await pool.execute(
      "DELETE FROM finance WHERE id = ? AND agency_id = ?",
      [id, agency_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Transaction not found", success: false });
    }

    res.json({ message: "Transaction deleted successfully", success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// --- Summary Endpoint ---

router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const { agency_id } = req.user;
    
    const [results] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as totalExpenses
       FROM finance 
       WHERE agency_id = ?`,
      [agency_id]
    );
    
    const totalIncome = parseFloat(results[0].totalIncome || 0);
    const totalExpenses = parseFloat(results[0].totalExpenses || 0);
    
    res.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      success: true
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// --- Cash Registry (Day Opening/Closing) ---

// Get today's cash status
router.get("/cash-status", authenticateToken, async (req, res) => {
  try {
    const { agency_id } = req.user;
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.execute(
      "SELECT * FROM cash_registry WHERE agency_id = ? AND date = ?",
      [agency_id, today]
    );

    if (rows.length === 0) {
      return res.json({ status: "NONE", success: true });
    }

    res.json({ registry: rows[0], status: rows[0].status, success: true });
  } catch (error) {
    console.error("Error fetching cash status:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Open Cash
router.post("/open-cash", authenticateToken, async (req, res) => {
  try {
    const { agency_id, id: user_id } = req.user;
    const { opening_balance, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const [result] = await pool.execute(
      `INSERT INTO cash_registry (agency_id, date, opening_balance, status, notes, created_by)
       VALUES (?, ?, ?, 'OPEN', ?, ?)
       ON DUPLICATE KEY UPDATE opening_balance = VALUES(opening_balance), notes = VALUES(notes)`,
      [agency_id, today, opening_balance, notes, user_id]
    );

    res.status(201).json({ message: "Cash registry opened", success: true });
  } catch (error) {
    console.error("Error opening cash:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Close Cash
router.post("/close-cash", authenticateToken, async (req, res) => {
  try {
    const { agency_id, id: user_id } = req.user;
    const { actual_cash, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // 1. Get current balance for today's transactions (CASH ONLY)
    const [transactions] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
       FROM finance 
       WHERE agency_id = ? AND transaction_date = ? AND payment_method = 'CASH'`,
      [agency_id, today]
    );

    const [registry] = await pool.execute(
      "SELECT opening_balance FROM cash_registry WHERE agency_id = ? AND date = ?",
      [agency_id, today]
    );

    if (registry.length === 0) {
      return res.status(400).json({ error: "No open registry found for today", success: false });
    }

    const opening = parseFloat(registry[0].opening_balance || 0);
    const dayIncome = parseFloat(transactions[0].income || 0);
    const dayExpense = parseFloat(transactions[0].expense || 0);
    const expectedClosing = opening + dayIncome - dayExpense;
    const difference = actual_cash - expectedClosing;

    await pool.execute(
      `UPDATE cash_registry 
       SET closing_balance = ?, actual_cash = ?, difference = ?, status = 'CLOSED', notes = ?, closed_by = ?
       WHERE agency_id = ? AND date = ?`,
      [expectedClosing, actual_cash, difference, notes, user_id, agency_id, today]
    );

    res.json({ 
      message: "Cash registry closed", 
      expectedClosing, 
      difference,
      success: true 
    });
  } catch (error) {
    console.error("Error closing cash:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get cash history
router.get("/cash-history", authenticateToken, async (req, res) => {
  try {
    const { agency_id } = req.user;
    const [rows] = await pool.execute(
      "SELECT * FROM cash_registry WHERE agency_id = ? ORDER BY date DESC LIMIT 30",
      [agency_id]
    );
    res.json({ history: rows, success: true });
  } catch (error) {
    console.error("Error fetching cash history:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

export default router;
