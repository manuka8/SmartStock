import { pool } from "../config/database.js";

async function addPriceTypeToCustomers() {
  try {
    console.log("Adding price_type column to customers table...");

    // Add the price_type column
    await pool.execute(`
      ALTER TABLE customers
      ADD COLUMN price_type VARCHAR(50) DEFAULT 'selling_price_1' AFTER customer_type
    `);

    console.log("Column added successfully. Now updating existing customers...");

    // Update existing customers based on customer_type
    await pool.execute(`
      UPDATE customers
      SET price_type = CASE
        WHEN customer_type = 'REGISTERED' THEN 'selling_price_1'
        WHEN customer_type = 'WHOLESALE' THEN 'selling_price_2'
        WHEN customer_type = 'VIP' THEN 'selling_price_3'
        ELSE 'selling_price_1'
      END
    `);

    console.log("Existing customers updated successfully.");
    console.log("Migration completed successfully!");

  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    process.exit(0);
  }
}

addPriceTypeToCustomers();