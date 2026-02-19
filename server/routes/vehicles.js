import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all vehicles
router.get("/getAllVehicles", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;

    let query = `
      SELECT
        v.*,
        CONCAT(e.first_name, ' ', e.last_name) as driver_name,
        e.phone as driver_phone
      FROM vehicles v
      LEFT JOIN employees e ON v.driver_id = e.id
      WHERE v.agency_id = ?
      ORDER BY v.created_at DESC
    `;
    let params = [agency_id];

    // Super admin can get vehicles from all agencies or specific one
    if (role === "super_admin" && req.query.agency_id) {
      query = `
        SELECT
          v.*,
          CONCAT(e.first_name, ' ', e.last_name) as driver_name,
          e.phone as driver_phone
        FROM vehicles v
        LEFT JOIN employees e ON v.driver_id = e.id
        WHERE v.agency_id = ?
        ORDER BY v.created_at DESC
      `;
      params = [req.query.agency_id];
    }

    const [vehicles] = await pool.execute(query, params);

    res.json({ vehicles, success: true });
  } catch (error) {
    console.error("Error fetching vehicles", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get a single vehicle
router.get("/getSingleVehicle/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const vehicleId = req.params.id;

    let query = "SELECT * FROM vehicles WHERE id = ?";
    let params = [vehicleId];

    if (role !== "super_admin") {
      query += "AND agency_id = ?";
      params.push(agency_id);
    }

    const [vehicles] = await pool.execute(query, params);

    if (vehicles.length == 0) {
      res.status(404).json({ error: "Vehicle not found", success: false });
    }

    res.json({ vehicle: vehicles[0], success: true });
  } catch (error) {
    console.error("Error fetching vehicle", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Create a vehicle
router.post("/createVehicle", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const {
      vehicle_code,
      vehicle_number,
      vehicle_type = "VAN",
      driver_id,
      ownership_type = "OWN",
      status = "ACTIVE",
    } = req.body;

    if (!vehicle_code) {
      return res
        .status(400)
        .json({ error: "Vehicle Code is required", success: false });
    }

    const finalAgencyId = role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    const [result] = await pool.execute(
      `INSERT INTO vehicles(agency_id, vehicle_code, vehicle_number, vehicle_type, driver_id, ownership_type, status)
        VALUES(?,?,?,?,?,?,?)`,
      [
        finalAgencyId,
        vehicle_code,
        vehicle_number || null,
        vehicle_type,
        driver_id || null,
        ownership_type,
        status,
      ]
    );

    res.status(201).json({
      message: "Vehicle created successfully",
      vehicleId: result.insertId,
      success: true,
    });
  } catch (error) {
    console.error("Error creating vehicle", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// update a vehicle
router.put("/updateVehicle/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const vehicleId = req.params.id;
    const {
      vehicle_code,
      vehicle_number,
      vehicle_type,
      driver_id,
      ownership_type,
      status,
    } = req.body;

    if (!vehicle_code) {
      return res
        .status(400)
        .json({ error: "Vehicle Code is required", success: false });
    }

    let updateQuery = `UPDATE vehicles
                        SET vehicle_code = ?, vehicle_number = ?, vehicle_type = ?,
                            driver_id = ?, ownership_type = ?, status = ?
                        WHERE id = ?`;
    let updateParams = [
      vehicle_code,
      vehicle_number || null,
      vehicle_type,
      driver_id || null,
      ownership_type,
      status,
      vehicleId,
    ];

    if (role !== "super_admin") {
      updateQuery += " AND agency_id = ?";
      updateParams.push(agency_id);
    }

    const [result] = await pool.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vehicle not found or no permission to update", success: false });
    }

    res.status(200).json({ message: "Vehicle updated successfully", success: true });
  } catch (error) {
    console.error("Error updating vehicle", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

//delete a vehicle
router.delete("/deleteVehicle/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const vehicleId = req.params.id;

    let deleteQuery = "DELETE FROM vehicles WHERE id = ?";
    let params = [vehicleId];

    if (role !== "super_admin") {
      deleteQuery += " AND agency_id = ?";
      params.push(agency_id);
    }

    const [result] = await pool.execute(deleteQuery, params);

    if (result.affectedRows == 0) {
      return res
        .status(404)
        .json({
          error: "Vehicle not found or you do not have permission to delete it",
          success: false,
        });
    }

    res.status(201).json({ message: "Vehicle deleted successfully", success: true });
  } catch (error) {
    console.error("Delete vehicle error:", error);
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
