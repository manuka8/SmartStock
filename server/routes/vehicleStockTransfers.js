import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Generate reference number for transfer
function generateTransferNumber(agencyId, transferType) {
  const prefix = transferType === "OUT" ? "VST-OUT" : "VST-RET";
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${agencyId}-${timestamp}`;
}

// Loading: Transfer stock from inventory to vehicle (OUT)
router.post("/loading", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { role, agency_id, id: user_id } = req.user;
    const { vehicle_id, items, transfer_date, notes } = req.body;

    // Validation
    if (!vehicle_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Vehicle ID and at least one item are required",
        success: false,
      });
    }

    if (!transfer_date) {
      return res.status(400).json({
        error: "Transfer date is required",
        success: false,
      });
    }

    const finalAgencyId =
      role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    // Check if vehicle exists and belongs to agency
    const [vehicleCheck] = await connection.execute(
      "SELECT id FROM vehicles WHERE id = ? AND agency_id = ?",
      [vehicle_id, finalAgencyId]
    );

    if (vehicleCheck.length === 0) {
      return res.status(400).json({
        error: "Vehicle not found in your agency",
        success: false,
      });
    }

    await connection.beginTransaction();

    // Generate reference number
    const referenceNumber = generateTransferNumber(finalAgencyId, "OUT");

    // Create vehicle stock transfer record
    const [transferResult] = await connection.execute(
      `INSERT INTO vehicle_stock_transfers 
       (agency_id, vehicle_id, transfer_type, reference_number, transfer_date, status, created_by, notes)
       VALUES (?, ?, 'OUT', ?, ?, 'CONFIRMED', ?, ?)`,
      [
        finalAgencyId,
        vehicle_id,
        referenceNumber,
        transfer_date,
        user_id,
        notes || null,
      ]
    );

    const transferId = transferResult.insertId;

    // Process each item
    for (const item of items) {
      const { item_id, quantity } = item;

      if (!item_id || !quantity || quantity <= 0) {
        await connection.rollback();
        return res.status(400).json({
          error: "Each item must have a valid item_id and quantity > 0",
          success: false,
        });
      }

      // Check if item exists
      const [itemCheck] = await connection.execute(
        "SELECT id FROM item_master WHERE id = ? AND agency_id = ?",
        [item_id, finalAgencyId]
      );

      if (itemCheck.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: `Item ID ${item_id} not found in your agency`,
          success: false,
        });
      }

      // Check inventory availability with lock
      const [inventory] = await connection.execute(
        "SELECT i.id, i.current_quantity, im.item_name FROM inventory i INNER JOIN item_master im ON i.item_id = im.id WHERE i.agency_id = ? AND i.item_id = ? FOR UPDATE",
        [finalAgencyId, item_id]
      );

      if (inventory.length === 0 || inventory[0].current_quantity < quantity) {
        await connection.rollback();
        return res.status(400).json({
          error: `Insufficient inventory for item ID ${item_id}: ${inventory.length > 0 ? inventory[0].item_name : 'Unknown'}. Available: ${
            inventory.length > 0 ? inventory[0].current_quantity : 0
          }, Requested: ${quantity}`,
          success: false,
        });
      }

      // Insert transfer item
      await connection.execute(
        `INSERT INTO vehicle_stock_transfer_items 
         (agency_id, transfer_id, item_id, quantity)
         VALUES (?, ?, ?, ?)`,
        [finalAgencyId, transferId, item_id, quantity]
      );

      // Decrease inventory atomically
      await connection.execute(
        `UPDATE inventory 
         SET current_quantity = current_quantity - ?, last_stock_out_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [quantity, inventory[0].id]
      );

      // Update or create vehicle inventory
      const [vehicleInventory] = await connection.execute(
        "SELECT id, current_quantity FROM vehicle_inventory WHERE vehicle_id = ? AND item_id = ?",
        [vehicle_id, item_id]
      );

      if (vehicleInventory.length === 0) {
        await connection.execute(
          `INSERT INTO vehicle_inventory (agency_id, vehicle_id, item_id, current_quantity)
           VALUES (?, ?, ?, ?)`,
          [finalAgencyId, vehicle_id, item_id, quantity]
        );
      } else {
        await connection.execute(
          `UPDATE vehicle_inventory 
           SET current_quantity = current_quantity + ?, last_updated = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [quantity, vehicleInventory[0].id]
        );
      }

      // Get item buying price for transaction record
      const [itemMaster] = await connection.execute(
        "SELECT buying_price FROM item_master WHERE id = ?",
        [item_id]
      );
      const unitCost = itemMaster[0]?.buying_price || null;
      const totalCost = unitCost ? unitCost * quantity : null;

      // Create inventory transaction (OUT)
      await connection.execute(
        `INSERT INTO inventory_transactions 
         (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
          reference_type, reference_id, source_location, destination_location, note, performed_by)
         VALUES (?, ?, 'OUT', ?, ?, ?, 'VEHICLE_TRANSFER', ?, 'MAIN', 'VEHICLE', ?, ?)`,
        [
          finalAgencyId,
          item_id,
          quantity,
          unitCost,
          totalCost,
          transferId,
          notes || null,
          user_id,
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Stock loaded to vehicle successfully",
      transferId: transferId,
      referenceNumber: referenceNumber,
      success: true,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error loading stock to vehicle:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      success: false,
    });
  } finally {
    connection.release();
  }
});

// Unloading: Return stock from vehicle to inventory (RETURN)
router.post("/unloading", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { role, agency_id, id: user_id } = req.user;
    const { vehicle_id, items, transfer_date, notes } = req.body;

    // Validation
    if (!vehicle_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Vehicle ID and at least one item are required",
        success: false,
      });
    }

    if (!transfer_date) {
      return res.status(400).json({
        error: "Transfer date is required",
        success: false,
      });
    }

    const finalAgencyId =
      role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    // Check if vehicle exists and belongs to agency
    const [vehicleCheck] = await connection.execute(
      "SELECT id FROM vehicles WHERE id = ? AND agency_id = ?",
      [vehicle_id, finalAgencyId]
    );

    if (vehicleCheck.length === 0) {
      return res.status(400).json({
        error: "Vehicle not found in your agency",
        success: false,
      });
    }

    await connection.beginTransaction();

    // Generate reference number
    const referenceNumber = generateTransferNumber(finalAgencyId, "RETURN");

    // Create vehicle stock transfer record
    const [transferResult] = await connection.execute(
      `INSERT INTO vehicle_stock_transfers 
       (agency_id, vehicle_id, transfer_type, reference_number, transfer_date, status, created_by, notes)
       VALUES (?, ?, 'RETURN', ?, ?, 'CONFIRMED', ?, ?)`,
      [
        finalAgencyId,
        vehicle_id,
        referenceNumber,
        transfer_date,
        user_id,
        notes || null,
      ]
    );

    const transferId = transferResult.insertId;

    // Process each item
    for (const item of items) {
      const { item_id, quantity } = item;

      if (!item_id || !quantity || quantity <= 0) {
        await connection.rollback();
        return res.status(400).json({
          error: "Each item must have a valid item_id and quantity > 0",
          success: false,
        });
      }

      // Check if item exists
      const [itemCheck] = await connection.execute(
        "SELECT id FROM item_master WHERE id = ? AND agency_id = ?",
        [item_id, finalAgencyId]
      );

      if (itemCheck.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: `Item ID ${item_id} not found in your agency`,
          success: false,
        });
      }

      // Check vehicle inventory availability with lock
      const [vehicleInventory] = await connection.execute(
        "SELECT vi.id, vi.current_quantity, im.item_name FROM vehicle_inventory vi INNER JOIN item_master im ON vi.item_id = im.id WHERE vi.vehicle_id = ? AND vi.item_id = ? FOR UPDATE",
        [vehicle_id, item_id]
      );

      if (
        vehicleInventory.length === 0 ||
        vehicleInventory[0].current_quantity < quantity
      ) {
        await connection.rollback();
        return res.status(400).json({
          error: `Insufficient vehicle inventory for item ID ${item_id}: ${vehicleInventory.length > 0 ? vehicleInventory[0].item_name : 'Unknown'}. Available: ${
            vehicleInventory.length > 0 ? vehicleInventory[0].current_quantity : 0
          }, Requested: ${quantity}`,
          success: false,
        });
      }

      // Insert transfer item
      await connection.execute(
        `INSERT INTO vehicle_stock_transfer_items 
         (agency_id, transfer_id, item_id, quantity)
         VALUES (?, ?, ?, ?)`,
        [finalAgencyId, transferId, item_id, quantity]
      );

      // Decrease vehicle inventory atomically
      await connection.execute(
        `UPDATE vehicle_inventory 
         SET current_quantity = current_quantity - ?, last_updated = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [quantity, vehicleInventory[0].id]
      );

      // Update or create main inventory
      const [inventory] = await connection.execute(
        "SELECT id, current_quantity FROM inventory WHERE agency_id = ? AND item_id = ?",
        [finalAgencyId, item_id]
      );

      if (inventory.length === 0) {
        await connection.execute(
          `INSERT INTO inventory 
           (agency_id, item_id, current_quantity, reserved_quantity, reorder_level, status, last_stock_in_date)
           VALUES (?, ?, ?, 0, 10, 'ACTIVE', CURRENT_TIMESTAMP)`,
          [finalAgencyId, item_id, quantity]
        );
      } else {
        await connection.execute(
          `UPDATE inventory 
           SET current_quantity = current_quantity + ?, last_stock_in_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [quantity, inventory[0].id]
        );
      }

      // Get item buying price for transaction record
      const [itemMaster] = await connection.execute(
        "SELECT buying_price FROM item_master WHERE id = ?",
        [item_id]
      );
      const unitCost = itemMaster[0]?.buying_price || null;
      const totalCost = unitCost ? unitCost * quantity : null;

      // Create inventory transaction (IN)
      await connection.execute(
        `INSERT INTO inventory_transactions 
         (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
          reference_type, reference_id, source_location, destination_location, note, performed_by)
         VALUES (?, ?, 'IN', ?, ?, ?, 'VEHICLE_RETURN', ?, 'VEHICLE', 'MAIN', ?, ?)`,
        [
          finalAgencyId,
          item_id,
          quantity,
          unitCost,
          totalCost,
          transferId,
          notes || null,
          user_id,
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Stock unloaded from vehicle successfully",
      transferId: transferId,
      referenceNumber: referenceNumber,
      success: true,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error unloading stock from vehicle:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      success: false,
    });
  } finally {
    connection.release();
  }
});

// Get current vehicle inventory (per vehicle with items)
router.get("/vehicle-inventory", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const queryAgencyId =
      role === "super_admin" && req.query.agency_id
        ? req.query.agency_id
        : agency_id;

    const sql = `
      SELECT
        v.id AS vehicle_id,
        v.vehicle_code,
        v.vehicle_number,
        v.vehicle_type,
        v.status AS vehicle_status,
        CONCAT(e.first_name, ' ', e.last_name) AS driver_name,
        vi.item_id,
        vi.current_quantity,
        im.item_name,
        im.item_code,
        im.unit,
        im.unit_size,
        im.selling_price_1,
        im.selling_price_2,
        im.selling_price_3
      FROM vehicle_inventory vi
      INNER JOIN vehicles v ON vi.vehicle_id = v.id
      INNER JOIN item_master im ON vi.item_id = im.id
      LEFT JOIN employees e ON v.driver_id = e.id
      WHERE vi.agency_id = ?
      ORDER BY v.vehicle_code, vi.item_id;
    `;

    const [rows] = await pool.execute(sql, [queryAgencyId]);

    const vehiclesMap = new Map();

    rows.forEach((row) => {
      if (!vehiclesMap.has(row.vehicle_id)) {
        vehiclesMap.set(row.vehicle_id, {
          vehicle_id: row.vehicle_id,
          vehicle_code: row.vehicle_code,
          vehicle_number: row.vehicle_number,
          vehicle_type: row.vehicle_type,
          vehicle_status: row.vehicle_status,
          driver_name: row.driver_name,
          items: [],
        });
      }

      if (row.item_id) {
        vehiclesMap.get(row.vehicle_id).items.push({
          item_id: row.item_id,
          item_name: row.item_name,
          item_code: row.item_code,
          unit: row.unit,
          unit_size: row.unit_size,
          quantity: row.current_quantity,
          selling_price_1: row.selling_price_1,
          selling_price_2: row.selling_price_2,
          selling_price_3: row.selling_price_3,
        });
      }
    });

    const vehicles = Array.from(vehiclesMap.values());

    res.json({
      success: true,
      data: {
        vehicles,
      },
    });
  } catch (error) {
    console.error("Error fetching vehicle inventory:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Get loading/unloading reports with date filtering
router.get("/getReports", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const { start_date, end_date, transfer_type } = req.query;

    // First get the transfers
    let transferQuery = `
      SELECT
        vst.*,
        v.vehicle_code,
        v.vehicle_number,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM vehicle_stock_transfers vst
      INNER JOIN vehicles v ON vst.vehicle_id = v.id
      LEFT JOIN users u ON vst.created_by = u.id
      WHERE vst.agency_id = ?
    `;
    let params = [agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      params = [req.query.agency_id];
    }

    if (transfer_type) {
      transferQuery += " AND vst.transfer_type = ?";
      params.push(transfer_type);
    }

    if (start_date) {
      transferQuery += " AND vst.transfer_date >= ?";
      params.push(start_date);
    }

    if (end_date) {
      transferQuery += " AND vst.transfer_date <= ?";
      params.push(end_date);
    }

    transferQuery += ` ORDER BY vst.transfer_date DESC, vst.created_at DESC`;

    const [transfers] = await pool.execute(transferQuery, params);

    // Then get items for each transfer
    const transfersWithItems = await Promise.all(transfers.map(async (transfer) => {
      const [items] = await pool.execute(`
        SELECT
          vsti.quantity,
          im.item_name,
          im.item_code,
          im.unit,
          im.unit_size
        FROM vehicle_stock_transfer_items vsti
        INNER JOIN item_master im ON vsti.item_id = im.id
        WHERE vsti.transfer_id = ?
      `, [transfer.id]);

      return {
        ...transfer,
        items: items,
        item_count: items.length,
        total_quantity: items.reduce((sum, item) => sum + item.quantity, 0)
      };
    }));

    res.json({
      transfers: transfersWithItems,
      success: true
    });
  } catch (error) {
    console.error("Error fetching loading/unloading reports:", error);
    res.status(500).json({
      error: "Internal server error",
      success: false
    });
  }
});

export default router;

