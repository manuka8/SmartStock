import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Generate invoice number for vehicle sales
function generateInvoiceNumber(agencyId) {
  const timestamp = Date.now().toString().slice(-6);
  return `VS-${agencyId}-${timestamp}`;
}

// Generate return number
function generateReturnNumber(agencyId) {
  const timestamp = Date.now().toString().slice(-6);
  return `RTN-${agencyId}-${timestamp}`;
}

// Create vehicle sale (sell items from vehicle)
router.post("/createSale", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { role, agency_id, id: user_id } = req.user;
    const {
      vehicle_id,
      items = [],
      sale_date,
      payment_method,
      notes,
      customer_id,
      cash_amount,
      cheque_amount,
      credit_amount,
      return_items = [],
      free_items = [],
    } = req.body;

    // Validation
    const hasItems = Array.isArray(items) && items.length > 0;
    const hasReturns = Array.isArray(return_items) && return_items.length > 0;
    const hasFree = Array.isArray(free_items) && free_items.length > 0;

    if (!vehicle_id || (!hasItems && !hasReturns && !hasFree)) {
      return res.status(400).json({
        error: "Vehicle ID and at least one item (Sale, Return, or Free) are required",
        success: false,
      });
    }

    if (!sale_date) {
      return res.status(400).json({
        error: "Sale date is required",
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

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(finalAgencyId);

    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    // Process items and calculate totals
    for (const item of items) {
      const {
        item_id,
        quantity,
        unit_price,
        discount_percent = 0,
        tax_percent = 0,
      } = item;
      const parsedUnitPrice = parseFloat(unit_price || 0);

      if (!item_id || !quantity || quantity <= 0 || !parsedUnitPrice) {
        await connection.rollback();
        return res.status(400).json({
          error:
            "Each item must have valid item_id, quantity > 0, and unit_price",
          success: false,
        });
      }

      // Use FOR UPDATE to lock the row
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
           error: `Insufficient vehicle inventory for item ${
             vehicleInventory.length > 0
               ? vehicleInventory[0].item_name
               : "Unknown"
           }. Available: ${
             vehicleInventory.length > 0
               ? vehicleInventory[0].current_quantity
               : 0
           }, Requested: ${quantity}`,
           success: false,
         });
      }

      // Calculate line totals
      const lineTotal = parsedUnitPrice * quantity;
      const discountAmount = (lineTotal * discount_percent) / 100;
      const taxableAmount = lineTotal - discountAmount;
      const taxAmount = (taxableAmount * tax_percent) / 100;

      subtotal += lineTotal;
      discountTotal += discountAmount;
      taxTotal += taxAmount;
    }

    // Process Return totals for net calculation
    let marketReturnTotal = 0;
    let expiredReturnTotal = 0;
    
    if (return_items && Array.isArray(return_items) && return_items.length > 0) {
      for (const item of return_items) {
        const lineTotal = parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0);
        if (item.return_type === 'MARKET') marketReturnTotal += lineTotal;
        else if (item.return_type === 'EXPIRED') expiredReturnTotal += lineTotal;
      }
    }
    const totalReturnAmount = marketReturnTotal + expiredReturnTotal;
    
    // Store NET subtotal (Sales - Returns)
    subtotal -= totalReturnAmount;

    const cashAmount = parseFloat(req.body.cash_amount || 0);
    const chequeAmount = parseFloat(req.body.cheque_amount || 0);
    const creditAmount = parseFloat(req.body.credit_amount || 0);
    
    // Grand Total is Net Subtotal + Tax - Discount
    const grandTotal = subtotal + taxTotal - discountTotal;

    // Resolve customer display fields
    let customerName = req.body.customer_name || null;
    let customerAddress = req.body.customer_address || null;
    let customerPhone = req.body.customer_phone || null;

    if (customer_id) {
      const [customers] = await connection.execute(
        `SELECT first_name, last_name, phone, address_line1
         FROM customers
         WHERE id = ? AND agency_id = ?`,
        [customer_id, finalAgencyId]
      );

      if (customers.length > 0) {
        const c = customers[0];
        const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim();
        customerName = fullName || customerName;
        customerAddress = c.address_line1 || customerAddress;
        customerPhone = c.phone || customerPhone;
      }
    }

    // Create vehicle sale record
    const [saleResult] = await connection.execute(
      `INSERT INTO vehicle_sales
       (agency_id, vehicle_id, sale_date, invoice_number, customer_name, customer_address, customer_phone, subtotal, discount_total, tax_total, grand_total, payment_method, cash, cheque, credit, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)`,
      [
        finalAgencyId,
        vehicle_id,
        sale_date,
        invoiceNumber,
        customerName,
        customerAddress,
        customerPhone,
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        payment_method || "CASH",
        cashAmount,
        chequeAmount,
        creditAmount,
        user_id,
      ]
    );

    const saleId = saleResult.insertId;

    if (creditAmount > 0 && customer_id) {
      await connection.execute(
        "UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ? AND agency_id = ?",
        [creditAmount, customer_id, finalAgencyId]
      );
    }

    const paymentDetails = `Cash: ${cashAmount}, Cheque: ${chequeAmount}, Credit: ${creditAmount}`;
    const finalNotes = notes ? `${notes}\n${paymentDetails}` : paymentDetails;

    // Process each item
    for (const item of items) {
      const {
        item_id,
        quantity,
        unit_price,
        discount_percent = 0,
        tax_percent = 0,
      } = item;
      const parsedUnitPrice = parseFloat(unit_price || 0);

      // Calculate line totals again
      const lineTotal = parsedUnitPrice * quantity;
      const discountAmount = (lineTotal * discount_percent) / 100;
      const taxableAmount = lineTotal - discountAmount;
      const taxAmount = (taxableAmount * tax_percent) / 100;

      // Insert sale item
      await connection.execute(
        `INSERT INTO vehicle_sales_items
         (agency_id, vehicle_sale_id, item_id, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [finalAgencyId, saleId, item_id, quantity, parsedUnitPrice, lineTotal]
      );

      // Decrease vehicle inventory atomically
      await connection.execute(
        `UPDATE vehicle_inventory
         SET current_quantity = current_quantity - ?, last_updated = CURRENT_TIMESTAMP
         WHERE vehicle_id = ? AND item_id = ?`,
        [quantity, vehicle_id, item_id]
      );

      // Get item selling price for transaction record
      const [itemMaster] = await connection.execute(
        "SELECT selling_price_1 FROM item_master WHERE id = ?",
        [item_id]
      );
      const unitCost = itemMaster[0]?.selling_price_1 || unit_price;

      // Create inventory transaction (OUT - Sale from vehicle)
      await connection.execute(
        `INSERT INTO inventory_transactions
         (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
          reference_type, reference_id, source_location, destination_location, note, performed_by)
         VALUES (?, ?, 'OUT', ?, ?, ?, 'SALE', ?, 'VEHICLE', 'CUSTOMER', ?, ?)`,
        [
          finalAgencyId,
          item_id,
          quantity,
          unitCost,
          unitCost * quantity,
          saleId,
          notes || `Sale from vehicle - Invoice: ${invoiceNumber}`,
          user_id,
        ]
      );
    }

    // Generate invoice number for invoice
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const invoiceInvoiceNumber = `INV-${finalAgencyId}-${year}${month}${day}-${saleId}`;

    // Create invoice record
    const [invoiceResult] = await connection.execute(
      `INSERT INTO invoices
       (agency_id, invoice_number, invoice_type, customer_name, customer_address,
        customer_phone, vehicle_id, vehicle_sale_id, subtotal, discount_total,
        tax_total, grand_total, payment_method, payment_status, amount_paid,
        amount_due, cash, cheque, credit, sale_date, notes, created_by)
       VALUES (?, ?, 'VEHICLE_SALE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?, 0, ?, ?, ?, ?, ?, ?)`,
      [
        finalAgencyId,
        invoiceInvoiceNumber,
        req.body.customer_name || null,
        req.body.customer_address || null,
        req.body.customer_phone || null,
        vehicle_id,
        saleId,
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        req.body.payment_method || null,
        grandTotal,
        cashAmount,
        chequeAmount,
        creditAmount,
        sale_date,
        req.body.notes || null,
        user_id,
      ]
    );

    const invoiceId = invoiceResult.insertId;

    // Process Return Records if any (using totals calculated above)
    if (return_items && Array.isArray(return_items) && return_items.length > 0) {
      const returnNumber = generateReturnNumber(finalAgencyId);

      // Create sales return record
      const [returnResult] = await connection.execute(
        `INSERT INTO sales_returns
         (agency_id, invoice_id, vehicle_sale_id, vehicle_id, return_number, return_date,
          return_reason, market_return_total, expired_return_total, total_return_amount,
          status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
        [
          finalAgencyId,
          invoiceId,
          saleId,
          vehicle_id,
          returnNumber,
          sale_date,
          'Return during sale',
          marketReturnTotal,
          expiredReturnTotal,
          totalReturnAmount,
          user_id
        ]
      );

      const returnId = returnResult.insertId;

      // Process each return item
      for (const item of return_items) {
        const { item_id, return_type, quantity, unit_price } = item;
        const qty = parseFloat(quantity || 0);
        const price = parseFloat(unit_price || 0);
        const lineTotal = price * qty;

        // Insert return item
        await connection.execute(
          `INSERT INTO sales_return_items
           (agency_id, sales_return_id, item_id, return_type, quantity, unit_price,
            line_total, batch_number, expiry_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
          [
            finalAgencyId,
            returnId,
            item_id,
            return_type,
            qty,
            price,
            lineTotal
          ]
        );

        if (return_type === 'MARKET') {
          // Add back to vehicle inventory
          const [vehicleInventory] = await connection.execute(
            "SELECT id, current_quantity FROM vehicle_inventory WHERE vehicle_id = ? AND item_id = ?",
            [vehicle_id, item_id]
          );

          if (vehicleInventory.length > 0) {
            const newQty = vehicleInventory[0].current_quantity + qty;
            await connection.execute(
              `UPDATE vehicle_inventory
               SET current_quantity = ?, last_updated = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [newQty, vehicleInventory[0].id]
            );
          } else {
            // New inventory record
            await connection.execute(
              `INSERT INTO vehicle_inventory
               (agency_id, vehicle_id, item_id, current_quantity)
               VALUES (?, ?, ?, ?)`,
              [finalAgencyId, vehicle_id, item_id, qty]
            );
          }

          // Inventory Transaction (IN)
          await connection.execute(
            `INSERT INTO inventory_transactions
             (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
              reference_type, reference_id, source_location, destination_location, note, performed_by)
             VALUES (?, ?, 'IN', ?, ?, ?, 'VEHICLE_RETURN', ?, 'CUSTOMER', 'VEHICLE', ?, ?)`,
            [
              finalAgencyId,
              item_id,
              qty,
              price,
              lineTotal,
              returnId,
              `Market return during sale - Return: ${returnNumber}`,
              user_id
            ]
          );

        } else if (return_type === 'EXPIRED') {
          // Insert into expired_stock
          await connection.execute(
            `INSERT INTO expired_stock
             (agency_id, item_id, vehicle_id, quantity, reason, source, reference_type, reference_id, recorded_date)
             VALUES (?, ?, ?, ?, 'EXPIRED', 'VEHICLE_RETURN', 'SALE_RETURN', ?, ?)`,
            [
              finalAgencyId,
              item_id,
              vehicle_id,
              qty,
              returnId,
              sale_date
            ]
          );
        }
      }
    }

    // Process Free Items
    if (free_items && Array.isArray(free_items) && free_items.length > 0) {
      // Ensure table exists
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS vehicle_sales_free_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          agency_id INT NOT NULL,
          vehicle_sale_id INT NOT NULL,
          item_id INT NOT NULL,
          quantity DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          KEY idx_vs_free_sale (vehicle_sale_id),
          KEY idx_vs_free_item (item_id)
        )
      `);

      for (const item of free_items) {
        const { item_id, quantity } = item;
        const qty = parseFloat(quantity || 0);

        if (qty > 0) {
          // Insert Free Item Record
          await connection.execute(
            `INSERT INTO vehicle_sales_free_items 
             (agency_id, vehicle_sale_id, item_id, quantity)
             VALUES (?, ?, ?, ?)`,
            [finalAgencyId, saleId, item_id, qty]
          );

          // Decrease Vehicle Inventory
          const [vehicleInventory] = await connection.execute(
            "SELECT id, current_quantity FROM vehicle_inventory WHERE vehicle_id = ? AND item_id = ?",
            [vehicle_id, item_id]
          );

          if (vehicleInventory.length > 0) {
            const newQty = vehicleInventory[0].current_quantity - qty;
            await connection.execute(
              `UPDATE vehicle_inventory
               SET current_quantity = ?, last_updated = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [newQty, vehicleInventory[0].id]
            );
          }

          // Get item value for transaction record
          const [itemMaster] = await connection.execute(
            "SELECT selling_price_1 FROM item_master WHERE id = ?",
            [item_id]
          );
          const unitValue = itemMaster[0]?.selling_price_1 || 0;

          // Create Inventory Transaction (OUT - Free)
          await connection.execute(
            `INSERT INTO inventory_transactions
             (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost,
              reference_type, reference_id, source_location, destination_location, note, performed_by)
             VALUES (?, ?, 'OUT', ?, ?, ?, 'SALE_FREE', ?, 'VEHICLE', 'CUSTOMER', ?, ?)`,
            [
              finalAgencyId,
              item_id,
              qty,
              unitValue,
              unitValue * qty,
              saleId,
              `Free item during sale - Invoice: ${invoiceNumber}`,
              user_id
            ]
          );
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      message: "Sale completed successfully",
      saleId: saleId,
      invoiceNumber: invoiceNumber,
      grandTotal: grandTotal,
      success: true,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating vehicle sale:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      success: false,
    });
  } finally {
    connection.release();
  }
});

// Update existing vehicle sale
router.put("/updateSale/:id", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { role, agency_id, id: user_id } = req.user;
    const saleId = req.params.id;

    const {
      items = [],
      return_items = [],
      free_items = [],
      sale_date,
      payment_method,
      notes,
      customer_id,
      cash_amount,
      cheque_amount,
      credit_amount,
    } = req.body;

    const hasAnyItem = (items && items.length > 0) || (return_items && return_items.length > 0) || (free_items && free_items.length > 0);
    if (!hasAnyItem) {
      return res.status(400).json({
        error: "At least one item (Sale, Return, or Free) is required",
        success: false,
      });
    }

    if (!sale_date) {
      return res.status(400).json({
        error: "Sale date is required",
        success: false,
      });
    }

    const finalAgencyId =
      role === "super_admin" ? req.body.agency_id || agency_id : agency_id;

    // Load existing sale
    const [existingSales] = await connection.execute(
      `SELECT * FROM vehicle_sales WHERE id = ? AND agency_id = ?`,
      [saleId, finalAgencyId]
    );

    if (existingSales.length === 0) {
      return res.status(404).json({ error: "Sale not found", success: false });
    }

    const existingSale = existingSales[0];
    const vehicle_id = existingSale.vehicle_id;

    await connection.beginTransaction();

    // 1. RESTORE PREVIOUS STATE

    // Restore Sale Items
    const [existingItems] = await connection.execute(
      `SELECT * FROM vehicle_sales_items WHERE vehicle_sale_id = ? AND agency_id = ?`,
      [saleId, finalAgencyId]
    );
    for (const item of existingItems) {
      await connection.execute(
        `UPDATE vehicle_inventory SET current_quantity = current_quantity + ? WHERE vehicle_id = ? AND item_id = ?`,
        [item.quantity, vehicle_id, item.item_id]
      );
    }
    await connection.execute(`DELETE FROM vehicle_sales_items WHERE vehicle_sale_id = ? AND agency_id = ?`, [saleId, finalAgencyId]);
    await connection.execute(`DELETE FROM inventory_transactions WHERE reference_type = 'SALE' AND reference_id = ?`, [saleId]);

    // Restore Free Items
    const [existingFree] = await connection.execute(
      `SELECT * FROM vehicle_sales_free_items WHERE vehicle_sale_id = ? AND agency_id = ?`,
      [saleId, finalAgencyId]
    );
    for (const item of existingFree) {
      await connection.execute(
        `UPDATE vehicle_inventory SET current_quantity = current_quantity + ? WHERE vehicle_id = ? AND item_id = ?`,
        [item.quantity, vehicle_id, item.item_id]
      );
    }
    await connection.execute(`DELETE FROM vehicle_sales_free_items WHERE vehicle_sale_id = ? AND agency_id = ?`, [saleId, finalAgencyId]);
    await connection.execute(`DELETE FROM inventory_transactions WHERE reference_type = 'SALE_FREE' AND reference_id = ?`, [saleId]);

    // Restore Return Items
    const [associatedInvoices] = await connection.execute(`SELECT id, invoice_number FROM invoices WHERE vehicle_sale_id = ?`, [saleId]);
    const invoiceId = associatedInvoices.length > 0 ? associatedInvoices[0].id : null;
    const invoiceNumber = associatedInvoices.length > 0 ? associatedInvoices[0].invoice_number : "";

    if (invoiceId) {
      const [existingReturns] = await connection.execute(`SELECT id FROM sales_returns WHERE invoice_id = ?`, [invoiceId]);
      for (const sr of existingReturns) {
        const [existingReturnItems] = await connection.execute(`SELECT * FROM sales_return_items WHERE sales_return_id = ?`, [sr.id]);
        for (const ri of existingReturnItems) {
          if (ri.return_type === 'MARKET') {
            await connection.execute(`UPDATE vehicle_inventory SET current_quantity = current_quantity - ? WHERE vehicle_id = ? AND item_id = ?`, [ri.quantity, vehicle_id, ri.item_id]);
          } else {
            await connection.execute(`DELETE FROM expired_stock WHERE reference_type = 'SALE_RETURN' AND reference_id = ?`, [sr.id]);
          }
        }
        // Delete transactions before the return record itself if needed, or by reference id
        await connection.execute(`DELETE FROM inventory_transactions WHERE reference_type = 'VEHICLE_RETURN' AND reference_id = ?`, [sr.id]);
        await connection.execute(`DELETE FROM sales_return_items WHERE sales_return_id = ?`, [sr.id]);
      }
      await connection.execute(`DELETE FROM sales_returns WHERE invoice_id = ?`, [invoiceId]);
    }

    // 2. PROCESS NEW ITEMS AND CALCULATE TOTALS

    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    // Process new Sale Items
    for (const item of items) {
      const { item_id, quantity, unit_price, discount_percent = 0, tax_percent = 0 } = item;
      const parsedUnitPrice = parseFloat(unit_price || 0);

      // Inventory check
      const [vi] = await connection.execute(`SELECT current_quantity FROM vehicle_inventory WHERE vehicle_id = ? AND item_id = ?`, [vehicle_id, item_id]);
      if (!vi[0] || vi[0].current_quantity < quantity) {
        throw new Error(`Insufficient inventory for item_id ${item_id}`);
      }

      const lineTotal = parsedUnitPrice * quantity;
      subtotal += lineTotal;
      discountTotal += (lineTotal * discount_percent) / 100;
      taxTotal += ((lineTotal - (lineTotal * discount_percent) / 100) * tax_percent) / 100;

      await connection.execute(
        `INSERT INTO vehicle_sales_items (agency_id, vehicle_sale_id, item_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)`,
        [finalAgencyId, saleId, item_id, quantity, parsedUnitPrice, lineTotal]
      );
      await connection.execute(`UPDATE vehicle_inventory SET current_quantity = current_quantity - ? WHERE vehicle_id = ? AND item_id = ?`, [quantity, vehicle_id, item_id]);
      await connection.execute(
        `INSERT INTO inventory_transactions (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost, reference_type, reference_id, source_location, destination_location, note, performed_by) VALUES (?, ?, 'OUT', ?, ?, ?, 'SALE', ?, 'VEHICLE', 'CUSTOMER', ?, ?)`,
        [finalAgencyId, item_id, quantity, parsedUnitPrice, lineTotal, saleId, notes || `Sale from vehicle`, user_id]
      );
    }

    // Process new Return Items
    let returnAmountTotal = 0;
    if (return_items.length > 0) {
      const returnNumber = `RET-${Date.now()}`;
      const [retResult] = await connection.execute(
        `INSERT INTO sales_returns (agency_id, invoice_id, return_number, return_date, total_return_amount, status, created_by) VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
        [finalAgencyId, invoiceId, returnNumber, sale_date, 0, user_id]
      );
      const returnId = retResult.insertId;

      for (const ri of return_items) {
        const lineTotal = ri.quantity * ri.unit_price;
        returnAmountTotal += lineTotal;
        await connection.execute(
          `INSERT INTO sales_return_items (agency_id, sales_return_id, item_id, quantity, unit_price, line_total, return_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [finalAgencyId, returnId, ri.item_id, ri.quantity, ri.unit_price, lineTotal, ri.return_type]
        );

        if (ri.return_type === 'MARKET') {
          await connection.execute(`UPDATE vehicle_inventory SET current_quantity = current_quantity + ? WHERE vehicle_id = ? AND item_id = ?`, [ri.quantity, vehicle_id, ri.item_id]);
          await connection.execute(
            `INSERT INTO inventory_transactions (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost, reference_type, reference_id, source_location, destination_location, note, performed_by) VALUES (?, ?, 'IN', ?, ?, ?, 'VEHICLE_RETURN', ?, 'CUSTOMER', 'VEHICLE', ?, ?)`,
            [finalAgencyId, ri.item_id, ri.quantity, ri.unit_price, lineTotal, returnId, `Market return during sale update`, user_id]
          );
        } else {
          await connection.execute(
            `INSERT INTO expired_stock (agency_id, item_id, vehicle_id, quantity, reason, source, reference_type, reference_id, recorded_date) VALUES (?, ?, ?, ?, 'EXPIRED', 'VEHICLE_RETURN', 'SALE_RETURN', ?, ?)`,
            [finalAgencyId, ri.item_id, vehicle_id, ri.quantity, returnId, sale_date]
          );
        }
      }
      await connection.execute(`UPDATE sales_returns SET total_return_amount = ? WHERE id = ?`, [returnAmountTotal, returnId]);
    }

    // Process new Free Items
    for (const fi of free_items) {
      await connection.execute(`CREATE TABLE IF NOT EXISTS vehicle_sales_free_items (id INT AUTO_INCREMENT PRIMARY KEY, agency_id INT NOT NULL, vehicle_sale_id INT NOT NULL, item_id INT NOT NULL, quantity DECIMAL(10,2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
      await connection.execute(
        `INSERT INTO vehicle_sales_free_items (agency_id, vehicle_sale_id, item_id, quantity) VALUES (?, ?, ?, ?)`,
        [finalAgencyId, saleId, fi.item_id, fi.quantity]
      );
      await connection.execute(`UPDATE vehicle_inventory SET current_quantity = current_quantity - ? WHERE vehicle_id = ? AND item_id = ?`, [fi.quantity, vehicle_id, fi.item_id]);
      await connection.execute(
        `INSERT INTO inventory_transactions (agency_id, item_id, transaction_type, quantity, unit_cost, total_cost, reference_type, reference_id, source_location, destination_location, note, performed_by) VALUES (?, ?, 'OUT', ?, ?, ?, 'SALE_FREE', ?, 'VEHICLE', 'CUSTOMER', ?, ?)`,
        [finalAgencyId, fi.item_id, fi.quantity, 0, 0, saleId, `Free item during sale update`, user_id]
      );
    }

    // 3. FINALIZE TOTALS AND UPDATE DB

    const netSubtotal = subtotal - returnAmountTotal;
    const finalGrandTotal = netSubtotal + taxTotal - discountTotal;

    // Use values from body or current ones for financial update
    const finalCash = parseFloat(cash_amount || 0);
    const finalCheque = parseFloat(cheque_amount || 0);
    const finalCredit = parseFloat(credit_amount || 0);

    // Get customer old credit
    const oldCredit = existingSale.credit || 0;

    await connection.execute(
      `UPDATE vehicle_sales SET sale_date = ?, customer_name = ?, subtotal = ?, grand_total = ?, cash = ?, cheque = ?, credit = ? WHERE id = ?`,
      [sale_date, req.body.customer_name || existingSale.customer_name, netSubtotal, finalGrandTotal, finalCash, finalCheque, finalCredit, saleId]
    );

    if (customer_id) {
      const creditDiff = finalCredit - oldCredit;
      if (creditDiff !== 0) {
        await connection.execute(`UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?`, [creditDiff, customer_id]);
      }
    }

    if (invoiceId) {
      await connection.execute(
        `UPDATE invoices SET subtotal = ?, grand_total = ?, cash = ?, cheque = ?, credit = ?, amount_paid = ?, amount_due = 0 WHERE id = ?`,
        [netSubtotal, finalGrandTotal, finalCash, finalCheque, finalCredit, finalCash + finalCheque, invoiceId]
      );
    }

    await connection.commit();
    res.json({ success: true, message: "Sale updated successfully" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating sale:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) connection.release();
  }
});



// Get All vehicle sales
router.get("/getAllSales", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const { vehicle_id, start_date, end_date, customer_name, created_by } = req.query;

    let query = `
      SELECT
        vs.*,
        vs.grand_total as total_amount,
        v.vehicle_code,
        v.vehicle_number,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        COUNT(vsi.id) as item_count,
        MAX(i.notes) as notes,
        MAX(i.invoice_number) as invoice_number
      FROM vehicle_sales vs
      INNER JOIN vehicles v ON vs.vehicle_id = v.id
      LEFT JOIN users u ON vs.created_by = u.id
      LEFT JOIN vehicle_sales_items vsi ON vs.id = vsi.vehicle_sale_id
      LEFT JOIN invoices i ON vs.id = i.vehicle_sale_id
      WHERE vs.agency_id = ?
    `;
    let params = [agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      params = [req.query.agency_id];
    }

    if (vehicle_id) {
      query += " AND vs.vehicle_id = ?";
      params.push(vehicle_id);
    }

    if (customer_name) {
      query += " AND vs.customer_name = ?";
      params.push(customer_name);
    }

    if (start_date) {
      query += " AND vs.sale_date >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND vs.sale_date <= ?";
      params.push(end_date);
    }

    if (created_by) {
      query += " AND vs.created_by = ?";
      params.push(created_by);
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const offset = (page - 1) * limit;

    // Get total count first
    let countQuery = `SELECT COUNT(DISTINCT vs.id) as total FROM vehicle_sales vs WHERE vs.agency_id = ?`;
    let countParams = [agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      countParams = [req.query.agency_id];
    }

    if (vehicle_id) {
      countQuery += " AND vs.vehicle_id = ?";
      countParams.push(vehicle_id);
    }

    if (customer_name) {
      countQuery += " AND vs.customer_name = ?";
      countParams.push(customer_name);
    }

    if (start_date) {
      countQuery += " AND vs.sale_date >= ?";
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += " AND vs.sale_date <= ?";
      countParams.push(end_date);
    }

    if (created_by) {
      countQuery += " AND vs.created_by = ?";
      countParams.push(created_by);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const totalCount = countResult[0].total;

    query += ` GROUP BY vs.id ORDER BY vs.sale_date DESC, vs.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [sales] = await pool.execute(query, params);

    res.json({ 
      sales, 
      success: true,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching vehicle sales", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get All vehicle sales for printing (without pagination)
router.get("/getAllSalesForPrint", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const { start_date, end_date, customer_name } = req.query;

    let query = `
      SELECT
        vs.*,
        vs.grand_total as total_amount,
        v.vehicle_code,
        v.vehicle_number,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        COUNT(vsi.id) as item_count,
        MAX(i.notes) as notes,
        MAX(i.invoice_number) as invoice_number
      FROM vehicle_sales vs
      INNER JOIN vehicles v ON vs.vehicle_id = v.id
      LEFT JOIN users u ON vs.created_by = u.id
      LEFT JOIN vehicle_sales_items vsi ON vs.id = vsi.vehicle_sale_id
      LEFT JOIN invoices i ON vs.id = i.vehicle_sale_id
      WHERE vs.agency_id = ?
    `;
    let params = [agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      params = [req.query.agency_id];
    }

    if (customer_name && customer_name !== "all") {
      query += " AND vs.customer_name = ?";
      params.push(customer_name);
    }

    if (start_date) {
      query += " AND vs.sale_date >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND vs.sale_date <= ?";
      params.push(end_date);
    }

    query += ` GROUP BY vs.id ORDER BY vs.sale_date DESC, vs.created_at DESC`;

    const [sales] = await pool.execute(query, params);

    res.json({ 
      sales, 
      success: true,
      total: sales.length
    });
  } catch (error) {
    console.error("Error fetching vehicle sales for print", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

// Get single vehicle sale with items
router.get("/getSale/:id", authenticateToken, async (req, res) => {
  try {
    const { role, agency_id } = req.user;
    const saleId = req.params.id;

    let query = `
      SELECT
        vs.*,
        v.vehicle_code,
        v.vehicle_number,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        i.notes
      FROM vehicle_sales vs
      INNER JOIN vehicles v ON vs.vehicle_id = v.id
      LEFT JOIN users u ON vs.created_by = u.id
      LEFT JOIN invoices i ON vs.id = i.vehicle_sale_id
      WHERE vs.id = ? AND vs.agency_id = ?
    `;
    let params = [saleId, agency_id];

    if (role === "super_admin" && req.query.agency_id) {
      params = [saleId, req.query.agency_id];
    }

    const [sales] = await pool.execute(query, params);

    if (sales.length === 0) {
      return res.status(404).json({ error: "Sale not found", success: false });
    }

    // Get sale items
    const [saleItems] = await pool.execute(
      `SELECT
        vsi.*,
        im.item_name,
        im.item_code,
        im.unit,
        im.unit_size,
        im.buying_price,
        im.category
      FROM vehicle_sales_items vsi
      LEFT JOIN item_master im ON vsi.item_id = im.id
      WHERE vsi.vehicle_sale_id = ?`,
      [saleId]
    );

    // Get free items
    const [freeItems] = await pool.execute(
      `SELECT
        vsfi.*,
        im.item_name,
        im.item_code,
        im.unit,
        im.unit_size,
        im.category
      FROM vehicle_sales_free_items vsfi
      LEFT JOIN item_master im ON vsfi.item_id = im.id
      WHERE vsfi.vehicle_sale_id = ?`,
      [saleId]
    );

    // Get return items associated with this sale's invoice
    const [returnItems] = await pool.execute(
      `SELECT
        sri.*,
        im.item_name,
        im.item_code,
        im.unit,
        im.unit_size
      FROM sales_return_items sri
      INNER JOIN sales_returns sr ON sri.sales_return_id = sr.id
      INNER JOIN invoices i ON sr.invoice_id = i.id
      INNER JOIN item_master im ON sri.item_id = im.id
      WHERE i.vehicle_sale_id = ? AND sr.status != 'CANCELLED'`,
      [saleId]
    );

    res.json({
      sale: sales[0],
      items: saleItems,
      freeItems: freeItems,
      returnItems: returnItems,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching vehicle sale", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
});

export default router;
