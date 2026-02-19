import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all inventory for an agency
router.get("/getAllInventory", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;

    let query = `SELECT i.*, im.item_name, im.item_code, im.category, im.unit, 
                        im.buying_price, im.selling_price_1 
                 FROM inventory i
                 JOIN item_master im ON i.item_id = im.id
                 WHERE i.agency_id = ?`;
    let params = [agency_id];

    // Super admin can filter by agency
    if (role === "super_admin" && req.query.agency_id) {
      query = `SELECT i.*, im.item_name, im.item_code, im.category, im.unit,
                      im.buying_price, im.selling_price_1 
               FROM inventory i
               JOIN item_master im ON i.item_id = im.id
               WHERE i.agency_id = ?`;
      params = [req.query.agency_id];
    }

    const [inventory] = await pool.execute(query, params);

    res.json({ inventory, success: true });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get single inventory record
router.get("/getInventory/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const inventoryId = req.params.id;

    let query = `SELECT i.*, im.item_name, im.item_code, im.category, im.unit,
                        im.buying_price, im.selling_price_1
                 FROM inventory i
                 JOIN item_master im ON i.item_id = im.id
                 WHERE i.id = ?`;
    let params = [inventoryId];

    if (role !== "super_admin") {
      query += " AND i.agency_id = ?";
      params.push(agency_id);
    }

    const [inventory] = await pool.execute(query, params);

    if (inventory.length === 0) {
      return res
        .status(404)
        .json({ error: "Inventory record not found", success: false });
    }

    res.json({ inventory: inventory[0], success: true });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Create inventory record
router.post("/createInventory", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const {
      item_id,
      current_quantity,
      reserved_quantity = 0,
      reorder_level,
      average_cost,
      last_purchase_cost,
      status = "ACTIVE",
    } = req.body;

    // Validation
    if (!item_id) {
      return res
        .status(400)
        .json({ error: "Item ID is required", success: false });
    }

    if (current_quantity === undefined || current_quantity === null) {
      return res
        .status(400)
        .json({ error: "Current quantity is required", success: false });
    }

    const finalAgencyId =
      role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    // Check if item belongs to agency
    const [itemCheck] = await pool.execute(
      "SELECT id FROM item_master WHERE id = ? AND agency_id = ?",
      [item_id, finalAgencyId]
    );

    if (itemCheck.length === 0) {
      return res
        .status(400)
        .json({ error: "Item not found in your agency", success: false });
    }

    // Check if inventory already exists
    const [existingInventory] = await pool.execute(
      "SELECT id FROM inventory WHERE agency_id = ? AND item_id = ?",
      [finalAgencyId, item_id]
    );

    if (existingInventory.length > 0) {
      return res
        .status(400)
        .json({
          error: "Inventory already exists for this item",
          success: false,
        });
    }

    const [result] = await pool.execute(
      `INSERT INTO inventory 
       (agency_id, item_id, current_quantity, reserved_quantity, reorder_level, 
        average_cost, last_purchase_cost, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalAgencyId,
        item_id,
        parseInt(current_quantity),
        parseInt(reserved_quantity) || 0,
        reorder_level ? parseInt(reorder_level) : 0,
        average_cost ? parseFloat(average_cost) : null,
        last_purchase_cost ? parseFloat(last_purchase_cost) : null,
        status,
      ]
    );

    res.status(201).json({
      message: "Inventory created successfully",
      inventoryId: result.insertId,
      success: true,
    });
  } catch (error) {
    console.error("Error creating inventory:", error);
    res
      .status(500)
      .json({
        error: "Internal server error",
        details: error.message,
        success: false,
      });
  }
});

// Update inventory quantity and details
router.put("/updateInventory/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const inventoryId = req.params.id;
    const {
      current_quantity,
      reserved_quantity,
      reorder_level,
      average_cost,
      last_purchase_cost,
      status,
      last_stock_in_date,
      last_stock_out_date,
    } = req.body;

    let updateQuery = `UPDATE inventory
                      SET current_quantity = ?, reserved_quantity = ?, reorder_level = ?,
                          average_cost = ?, last_purchase_cost = ?, status = ?,
                          last_stock_in_date = ?, last_stock_out_date = ?,
                          updated_at = CURRENT_TIMESTAMP
                      WHERE id = ?`;
    let updateParams = [
      current_quantity !== undefined ? parseInt(current_quantity) : 0,
      reserved_quantity !== undefined ? parseInt(reserved_quantity) : 0,
      reorder_level !== undefined ? parseInt(reorder_level) : 0,
      average_cost ? parseFloat(average_cost) : null,
      last_purchase_cost ? parseFloat(last_purchase_cost) : null,
      status || "ACTIVE",
      last_stock_in_date || null,
      last_stock_out_date || null,
      inventoryId,
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
          error: "Inventory record not found or not authorized",
          success: false,
        });
    }

    res.json({ message: "Inventory updated successfully", success: true });
  } catch (error) {
    console.error("Update inventory error:", error);
    res
      .status(500)
      .json({
        error: "Internal server error",
        details: error.message,
        success: false,
      });
  }
});

// Delete inventory record
router.delete("/deleteInventory/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const inventoryId = req.params.id;

    let query = "DELETE FROM inventory WHERE id = ?";
    let params = [inventoryId];

    if (role !== "super_admin" && agency_id) {
      query += " AND agency_id = ?";
      params.push(agency_id);
    }

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          error: "Inventory record not found or not authorized",
          success: false,
        });
    }

    res.json({ message: "Inventory deleted successfully", success: true });
  } catch (error) {
    console.error("Delete inventory error:", error);
    res
      .status(500)
      .json({
        error: "Internal server error",
        details: error.message,
        success: false,
      });
  }
});

// Get low stock alerts for an agency
router.get("/getLowStockAlerts", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;

    // Get items with low stock (existing inventory)
    let lowStockQuery = `SELECT i.*, im.item_name, im.item_code, im.category, im.unit_size, im.unit,
                        im.buying_price, im.selling_price_1, im.image_url
                 FROM inventory i
                 JOIN item_master im ON i.item_id = im.id
                 WHERE i.agency_id = ? AND i.current_quantity <= i.reorder_level AND i.status = 'ACTIVE'
                 ORDER BY (i.reorder_level - i.current_quantity) DESC`;
    let params = [agency_id];

    // Super admin can filter by agency
    if (role === "super_admin" && req.query.agency_id) {
      lowStockQuery = `SELECT i.*, im.item_name, im.item_code, im.category, im.unit_size, im.unit,
                      im.buying_price, im.selling_price_1, im.image_url
               FROM inventory i
               JOIN item_master im ON i.item_id = im.id
               WHERE i.agency_id = ? AND i.current_quantity <= i.reorder_level AND i.status = 'ACTIVE'
               ORDER BY (i.reorder_level - i.current_quantity) DESC`;
      params = [req.query.agency_id];
    }

    const [lowStockAlerts] = await pool.execute(lowStockQuery, params);

    // Also get items without inventory records (need setup)
    let noInventoryQuery = `SELECT im.id as item_id, im.item_name, im.item_code, im.category, im.unit_size, im.unit,
                           im.buying_price, im.selling_price_1, im.image_url,
                           0 as current_quantity, 0 as reorder_level, 'NO_INVENTORY' as status
                    FROM item_master im
                    LEFT JOIN inventory i ON im.id = i.item_id AND i.agency_id = im.agency_id
                    WHERE im.agency_id = ? AND i.id IS NULL AND im.status = 'ACTIVE'
                    ORDER BY im.created_at DESC`;
    let noInventoryParams = [agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      noInventoryQuery = `SELECT im.id as item_id, im.item_name, im.item_code, im.category, im.unit_size, im.unit,
                         im.buying_price, im.selling_price_1, im.image_url,
                         0 as current_quantity, 0 as reorder_level, 'NO_INVENTORY' as status
                  FROM item_master im
                  LEFT JOIN inventory i ON im.id = i.item_id AND i.agency_id = im.agency_id
                  WHERE im.agency_id = ? AND i.id IS NULL AND im.status = 'ACTIVE'
                  ORDER BY im.created_at DESC`;
      noInventoryParams = [req.query.agency_id];
    }

    const [noInventoryAlerts] = await pool.execute(
      noInventoryQuery,
      noInventoryParams
    );

    // Combine and return alerts
    const allAlerts = [...lowStockAlerts, ...noInventoryAlerts];

    res.json({ alerts: allAlerts, success: true });
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get top selling products
router.get("/getTopSellingProducts", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;

    let query = `
      SELECT
        vsi.item_id,
        im.item_name,
        im.item_code,
        SUM(vsi.quantity) as total_sold,
        SUM(vsi.quantity * vsi.unit_price) as total_revenue
      FROM vehicle_sales_items vsi
      INNER JOIN vehicle_sales vs ON vsi.vehicle_sale_id = vs.id
      INNER JOIN item_master im ON vsi.item_id = im.id
      WHERE vs.agency_id = ?
      GROUP BY vsi.item_id, im.item_name, im.item_code
      ORDER BY total_sold DESC
      LIMIT 10
    `;
    let params = [agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      params = [req.query.agency_id];
    }

    const [products] = await pool.execute(query, params);

    res.json({ products, success: true });
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

export default router;
