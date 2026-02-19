import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all items for an agency
router.get("/getAllItems", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;

    let query = `SELECT im.*, i.current_quantity, i.reorder_level
                  FROM item_master im
                  LEFT JOIN inventory i ON im.id = i.item_id AND i.agency_id = im.agency_id
                  WHERE im.agency_id = ?`;
    let params = [agency_id];

    // Super admin can get items from all agencies or specific one
    if (role === 'super_admin' && req.query.agency_id) {
      query = `SELECT im.*, i.current_quantity, i.reorder_level
                FROM item_master im
                LEFT JOIN inventory i ON im.id = i.item_id AND i.agency_id = im.agency_id
                WHERE im.agency_id = ?`;
      params = [req.query.agency_id];
    }

    const [items] = await pool.execute(query, params);

    res.json({ items, success: true });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get single item by ID
router.get("/getItem/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const itemId = req.params.id;

    let query = "SELECT * FROM item_master WHERE id = ?";
    let params = [itemId];

    if (role !== 'super_admin') {
      query += " AND agency_id = ?";
      params.push(agency_id);
    }

    const [items] = await pool.execute(query, params);

    if (items.length === 0) {
      return res.status(404).json({ error: "Item not found", success: false });
    }

    res.json({ item: items[0], success: true });
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Add a new item master
router.post("/addItem", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const {
      item_code,
      item_name,
      category,
      brand,
      supplier_id,
      unit,
      unit_size,
      buying_price,
      selling_price_1,
      selling_price_2,
      selling_price_3,
      tax_rate,
      barcode,
      image_url,
      is_expirable,
      shelf_life_days,
      reorder_level,
      status = 'ACTIVE'
    } = req.body;

    // Validation
    if (!item_name || !item_code) {
      return res.status(400).json({ error: "Item name and code are required", success: false });
    }

    if (!buying_price || !selling_price_1 || !unit) {
      return res.status(400).json({ error: "Buying price, selling price, and unit are required", success: false });
    }

    const finalAgencyId = role === 'super_admin' ? req.body.agency_id || agency_id : agency_id;

    const [result] = await pool.execute(
      `INSERT INTO item_master
      (agency_id, item_code, item_name, category, brand, supplier_id, unit, unit_size,
       buying_price, selling_price_1, selling_price_2, selling_price_3,
       tax_rate, barcode, image_url, is_expirable, shelf_life_days, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalAgencyId,
        item_code,
        item_name,
        category || null,
        brand || null,
        supplier_id ? parseInt(supplier_id) : null,
        unit,
        unit_size ? parseFloat(unit_size) : null,
        parseFloat(buying_price),
        parseFloat(selling_price_1),
        selling_price_2 ? parseFloat(selling_price_2) : null,
        selling_price_3 ? parseFloat(selling_price_3) : null,
        tax_rate ? parseFloat(tax_rate) : 0,
        barcode || null,
        image_url || null,
        is_expirable ? true : false,
        shelf_life_days ? parseInt(shelf_life_days) : null,
        status
      ]
    );

    // Create default inventory record for the new item
    try {
      await pool.execute(
        `INSERT INTO inventory
        (agency_id, item_id, current_quantity, reorder_level, status)
        VALUES (?, ?, 0, ?, 'ACTIVE')`,
        [finalAgencyId, result.insertId, reorder_level ? parseInt(reorder_level) : 10]
      );
    } catch (inventoryError) {
      console.warn("Could not create default inventory record:", inventoryError.message);
      // Don't fail the item creation if inventory creation fails
    }

    res.status(201).json({
      message: "Item added successfully",
      itemId: result.insertId,
      success: true
    });
  } catch (error) {
    console.error("Error adding item:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Item code already exists for this agency", success: false });
    }
    res.status(500).json({ error: "Internal server error", details: error.message, success: false });
  }
});

// Update item master
router.put('/updateItem/:id', authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const itemId = req.params.id;
    const {
      item_code,
      item_name,
      category,
      brand,
      supplier_id,
      unit,
      unit_size,
      buying_price,
      selling_price_1,
      selling_price_2,
      selling_price_3,
      tax_rate,
      barcode,
      image_url,
      is_expirable,
      shelf_life_days,
      reorder_level,
      status
    } = req.body;

    // Validation
    if (!item_name) {
      return res.status(400).json({ error: 'Item name is required', success: false });
    }

    if (!buying_price || !selling_price_1) {
      return res.status(400).json({ error: 'Buying price and selling price are required', success: false });
    }

    let updateQuery = `UPDATE item_master
                      SET item_code = ?, item_name = ?, category = ?, brand = ?, supplier_id = ?, unit = ?, unit_size = ?,
                          buying_price = ?, selling_price_1 = ?, selling_price_2 = ?, selling_price_3 = ?,
                          tax_rate = ?, barcode = ?, image_url = ?, is_expirable = ?, shelf_life_days = ?,
                          status = ?, updated_at = CURRENT_TIMESTAMP
                      WHERE id = ?`;
    let updateParams = [
      item_code,
      item_name,
      category || null,
      brand || null,
      supplier_id ? parseInt(supplier_id) : null,
      unit,
      unit_size ? parseFloat(unit_size) : null,
      parseFloat(buying_price),
      parseFloat(selling_price_1),
      selling_price_2 ? parseFloat(selling_price_2) : null,
      selling_price_3 ? parseFloat(selling_price_3) : null,
      tax_rate ? parseFloat(tax_rate) : 0,
      barcode || null,
      image_url || null,
      is_expirable ? true : false,
      shelf_life_days ? parseInt(shelf_life_days) : null,
      status || 'ACTIVE',
      itemId
    ];

    // Add agency filter for non-super_admin users
    if (role !== 'super_admin') {
      updateQuery += ' AND agency_id = ?';
      updateParams.push(agency_id);
    }

    const [result] = await pool.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found or not authorized', success: false });
    }

    // Update reorder_level in inventory if provided
    if (reorder_level !== undefined && reorder_level !== null) {
      try {
        await pool.execute(
          `UPDATE inventory SET reorder_level = ? WHERE item_id = ? AND agency_id = ?`,
          [parseInt(reorder_level), itemId, agency_id]
        );
      } catch (inventoryError) {
        console.warn("Could not update inventory reorder_level:", inventoryError.message);
        // Don't fail the item update if inventory update fails
      }
    }

    res.json({ message: 'Item updated successfully', success: true });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, success: false });
  }
});

// Delete item master
router.delete('/deleteItem/:id', authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const itemId = req.params.id;

    // Build query based on user role
    let query = 'DELETE FROM item_master WHERE id = ?';
    let params = [itemId];

    // Filter by agency_id for non-super_admin users
    if (role !== 'super_admin' && agency_id) {
      query += ' AND agency_id = ?';
      params.push(agency_id);
    }

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found or you do not have permission to delete it', success: false });
    }

    res.json({ message: 'Item deleted successfully', success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, success: false });
  }
});

export default router;
