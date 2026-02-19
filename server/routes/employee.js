import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all employees
router.get("/getAllEmployees", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;

    let query = "SELECT * FROM employees WHERE agency_id = ? ORDER BY created_at DESC";
    let params = [agency_id];

    if (role === "super_admin" && req.params.agency_id) {
      query = "SELECT * FROM employees WHERE agency_id = ? ORDER BY created_at DESC";
      params = [req.params.agency_id];
    }

    const [employees] = await pool.execute(query, params);

    res.json({ employees, success: true });
  } catch (error) {
    console.error("Error fetching employees", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get a single employee
router.get("/getSingleEmployee/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const employeeId = req.params.id;

    let query = "SELECT * FROM employees WHERE id = ?";
    let params = [employeeId];

    if (role !== "super_admin") {
      query += " AND agency_id = ?";
      params.push(agency_id);
    }

    const [employees] = await pool.execute(query, params);

    if (employees.length === 0) {
      return res.status(404).json({ error: "Employee not found", success: false });
    }

    res.json({ employee: employees[0], success: true });
  } catch (error) {
    console.error("Error fetching employee", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Create an employee
router.post("/createEmployee", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const {
      employee_code,
      first_name,
      last_name,
      employee_type = "STAFF",
      license_number,
      phone,
      status = "ACTIVE",
    } = req.body;

    if (!employee_code) {
      return res
        .status(400)
        .json({ error: "Employee Code is required", success: false });
    }

    const finalAgencyId =
      role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    const [result] = await pool.execute(
      `INSERT INTO employees (agency_id, employee_code, first_name, last_name, employee_type, license_number, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalAgencyId,
        employee_code,
        first_name,
        last_name,
        employee_type,
        license_number,
        phone || null,
        status,
      ]
    );

    res
      .status(201)
      .json({
        employeeId: result.insertId,
        message: "Employee created successfully",
        success: true,
      });
  } catch (error) {
    console.error("Error creating employee", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Update an employee
router.put("/updateEmployee/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const employeeId = req.params.id;
    const {
      employee_code,
      first_name,
      last_name,
      employee_type = "STAFF",
      license_number,
      phone,
      status = "ACTIVE",
    } = req.body;

    if (!employee_code) {
      return res
        .status(400)
        .json({ error: "Employee Code is required", success: false });
    }

    let updateQuery = `UPDATE employees
                    SET employee_code = ?, first_name = ?, last_name = ?, employee_type =?, license_number = ?, phone = ?, status = ?
                    WHERE id = ?`;

    let updateParams = [
      employee_code,
      first_name,
      last_name,
      employee_type,
      license_number,
      phone || null,
      status,
      employeeId,
    ];

    if (role !== "super_admin") {
      updateQuery += " AND agency_id = ?";
      updateParams.push(agency_id);
    }

    const [result] = await pool.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found or no permission to update", success: false });
    }

    res
      .status(200)
      .json({ message: "Employee updated successfully", success: true });
  } catch (error) {
    console.error("Error updating employee", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// delete a vehicle
router.delete('/deleteEmployee/:id', authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const employeeId = req.params.id;

    let deleteQuery = "DELETE FROM employees WHERE id = ?";
    let params = [employeeId];

    if (role !== "super_admin") {
      deleteQuery += " AND agency_id = ?";
      params.push(agency_id);
    }

    const [result] = await pool.execute(deleteQuery, params);

    if (result.affectedRows == 0) {
      return res
        .status(404)
        .json({
          error: "Employee not found or you do not have permission to delete it",
          success: false,
        });
    }

    res.status(200).json({ message: "Employee deleted successfully", success: true });
  } catch (error) {
    console.error("Delete Employee error:", error);
    res
      .status(500)
      .json({
        error: "Internal server error",
        details: error.message,
        success: false,
      });
  }
});

export default router;