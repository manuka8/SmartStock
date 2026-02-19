import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all suppliers for an agency
router.get("/getAllSuppliers", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;

    let query = "SELECT * FROM suppliers WHERE agency_id = ? ORDER BY created_at DESC";
    let params = [agency_id];

    // Super admin can get suppliers from all agencies or specific one
    if (role === "super_admin" && req.query.agency_id) {
      query = "SELECT * FROM suppliers WHERE agency_id = ? ORDER BY created_at DESC";
      params = [req.query.agency_id];
    }

    const [suppliers] = await pool.execute(query, params);

    res.json({ suppliers, success: true });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get single supplier by ID
router.get("/getSupplier/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const supplierId = req.params.id;

    let query = "SELECT * FROM suppliers WHERE id = ?";
    let params = [supplierId];

    if (role !== "super_admin") {
      query += " AND agency_id = ?";
      params.push(agency_id);
    }

    const [suppliers] = await pool.execute(query, params);

    if (suppliers.length === 0) {
      return res
        .status(404)
        .json({ error: "Supplier not found", success: false });
    }

    res.json({ supplier: suppliers[0], success: true });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Add a new supplier
router.post("/addSupplier", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const {
      supplier_code,
      supplier_name,
      contact_person,
      email,
      phone,
      address_line1,
      address_line2,
      city,
      district,
      postal_code,
      tax_number,
      status = "ACTIVE",
    } = req.body;

    // Validation
    if (!supplier_name) {
      return res
        .status(400)
        .json({ error: "Supplier name is required", success: false });
    }

    const finalAgencyId = role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    const [result] = await pool.execute(
      `INSERT INTO suppliers
       (agency_id, supplier_code, supplier_name, contact_person, email, phone,
        address_line1, address_line2, city, district, postal_code, tax_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalAgencyId,
        supplier_code || null,
        supplier_name,
        contact_person || null,
        email || null,
        phone || null,
        address_line1 || null,
        address_line2 || null,
        city || null,
        district || null,
        postal_code || null,
        tax_number || null,
        status,
      ]
    );

    res.status(201).json({
      message: "Supplier added successfully",
      supplierId: result.insertId,
      success: true,
    });
  } catch (error) {
    console.error("Error adding supplier:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({
          error: "Supplier code already exists for this agency",
          success: false,
        });
    }
    res
      .status(500)
      .json({
        error: "Internal server error",
        details: error.message,
        success: false,
      });
  }
});

// Update supplier
router.put("/updateSupplier/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const supplierId = req.params.id;
    const {
      supplier_code,
      supplier_name,
      contact_person,
      email,
      phone,
      address_line1,
      address_line2,
      city,
      district,
      postal_code,
      tax_number,
      status,
    } = req.body;

    // Validation
    if (!supplier_name) {
      return res
        .status(400)
        .json({ error: "Supplier name is required", success: false });
    }

    let updateQuery = `UPDATE suppliers
                       SET supplier_code = ?, supplier_name = ?, contact_person = ?, email = ?,
                           phone = ?, address_line1 = ?, address_line2 = ?, city = ?, district = ?,
                           postal_code = ?, tax_number = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                       WHERE id = ?`;
    let updateParams = [
      supplier_code || null,
      supplier_name,
      contact_person || null,
      email || null,
      phone || null,
      address_line1 || null,
      address_line2 || null,
      city || null,
      district || null,
      postal_code || null,
      tax_number || null,
      status || "ACTIVE",
      supplierId,
    ];

    // Add agency filter for non-super_admin users
    if (role !== "super_admin") {
      updateQuery += " AND agency_id = ?";
      updateParams.push(agency_id);
    }

    const [result] = await pool.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          error: "Supplier not found or not authorized",
          success: false,
        });
    }

    res.json({ message: "Supplier updated successfully", success: true });
  } catch (error) {
    console.error("Update supplier error:", error);
    res
      .status(500)
      .json({
        error: "Internal server error",
        details: error.message,
        success: false,
      });
  }
});

// Delete supplier
router.delete("/deleteSupplier/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const supplierId = req.params.id;

    // Build query based on user role
    let query = "DELETE FROM suppliers WHERE id = ?";
    let params = [supplierId];

    // Filter by agency_id for non-super_admin users
    if (role !== "super_admin" && agency_id) {
      query += " AND agency_id = ?";
      params.push(agency_id);
    }

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          error:
            "Supplier not found or you do not have permission to delete it",
          success: false,
        });
    }

    res.json({ message: "Supplier deleted successfully", success: true });
  } catch (error) {
    console.error("Delete supplier error:", error);
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
