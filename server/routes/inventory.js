import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all inventory items for a user/agency
router.get("/getAllItems", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;

    let query = "SELECT * FROM item_list WHERE agency_id = ?";
    let params = [agency_id];

    // Super admin can get items from all agencies or specific one
    if (role === 'super_admin' && req.query.agency_id) {
      query = "SELECT * FROM item_list WHERE agency_id = ?";
      params = [req.query.agency_id];
    }

    query += " ORDER BY created_at DESC";

    const [items] = await pool.execute(query, params);

    res.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new inventory item
router.post("/addItem", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const {
      supplier_id,
      item_code,
      item_name,
      category,
      unit,
      buying_price,
      selling_price_1,
      selling_price_2,
      selling_price_3,
    } = req.body;

    if (!item_name) {
      return res.status(400).json({ error: "Item name is required" });
    }

    if (!buying_price || !selling_price_1) {
      return res.status(400).json({ error: "Buying price and selling price are required" });
    }

    const finalCenterId = role === 'super_admin' ? req.body.agency_id || agency_id : agency_id;

    const [result] = await pool.execute(
      "INSERT INTO item_list (agency_id, supplier_id, item_code, item_name, category, unit, buying_price, selling_price_1, selling_price_2, selling_price_3) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        finalCenterId,
        supplier_id || null,
        item_code || null,
        item_name,
        category || null,
        unit,
        parseFloat(buying_price),
        parseFloat(selling_price_1),
        selling_price_2 ? parseFloat(selling_price_2) : null,
        selling_price_3 ? parseFloat(selling_price_3) : null,
      ]
    );

    res.status(201).json({ message: "Item added successfully", itemId: result.insertId });
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Update an inventory item
router.put('/updateItem/:id', authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const itemId = req.params.id;
    const {
      supplier_id,
      item_code,
      item_name,
      category,
      unit,
      buying_price,
      selling_price_1,
      selling_price_2,
      selling_price_3,
    } = req.body;

    // Validate required fields
    if (!item_name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    if (!buying_price || !selling_price_1) {
      return res.status(400).json({ error: 'Buying price and selling price are required' });
    }

    // Update the inventory record
    let updateQuery = `UPDATE item_list
                      SET item_code = ?, item_name = ?, supplier_id = ?, category = ?, unit = ?, buying_price = ?, selling_price_1 = ?, selling_price_2 = ?, selling_price_3 = ?, updated_at = CURRENT_TIMESTAMP
                      WHERE id = ?`;
    let updateParams = [item_code || null, item_name, supplier_id || null, category || null, unit || 0, parseFloat(buying_price), parseFloat(selling_price_1), selling_price_2 ? parseFloat(selling_price_2) : null, selling_price_3 ? parseFloat(selling_price_3) : null, itemId];

    // Add agency filter for non-super_admin users
    if (role !== 'super_admin') {
      updateQuery += ' AND agency_id = ?';
      updateParams.push(agency_id);
    }

    const [result] = await pool.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found or not authorized' });
    }

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete an inventory item
router.delete('/deleteItem/:id', authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const itemId = req.params.id;

    // Build query based on user role
    let query = 'DELETE FROM item_list WHERE id = ?';
    let params = [itemId];

    // Filter by agency_id for non-super_admin users
    if (role !== 'super_admin' && agency_id) {
      query += ' AND agency_id = ?';
      params.push(agency_id);
    }

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'item not found or you do not have permission to delete it' });
    }

    res.json({ message: 'item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Add bulk items item
// router.post('/addBulkItems', authenticateToken, async (req, res) => {
//   try {
//     const { role, agency_id } = req.user;
//     const items = req.body.items;

//     if (!Array.isArray(items)) {
//       return res.status(400).json({ error: 'Items must be an array' });
//     }

//     const insertQuery = `
//       INSERT INTO item_list (
//         item_code, item_name, supplier_id, category, unit,
//         buying_price, selling_price_1, selling_price_2, selling_price_3,
//         agency_id
//       ) VALUES ?
//     `;

//     const values = items.map(item => [
//       item.item_code || null,
//       item.item_name,
//       item.supplier_id || null,
//       item.category || null,
//       item.unit || 0,
//       parseFloat(item.buying_price),
//       parseFloat(item.selling_price_1),
//       item.selling_price_2 ? parseFloat(item.selling_price_2) : null,
//       item.selling_price_3 ? parseFloat(item.selling_price_3) : null,
//       agency_id
//     ]);

//     const [result] = await pool.execute(insertQuery, [values]);

//     res.status(201).json({ message: "Items added successfully", count: result.affectedRows });
//   } catch (error) {
//     console.error("Error adding bulk items:", error);
//     res.status(500).json({ error: "Internal server error", details: error.message });
//   }
// });

// Add a new inventory item
router.post('/addInventoryItem', authenticateToken, async (req, res) => {
    try {
        const { role, agency_id } = req.user;
        const {
            product_name,
            supplier,
            category,
            quantity,
            boxes,
            cards,
            items,
            price,
            bill_number,
            date
        } = req.body;
    } catch (error) {
        
    }
});

export default router;
