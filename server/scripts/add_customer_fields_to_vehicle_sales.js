import pool from "../config/database.js";

async function addCustomerFieldsToVehicleSales() {
  try {
    console.log("🔄 Adding customer fields to vehicle_sales table...");

    // Add customer_name column
    await pool.query(`
      ALTER TABLE vehicle_sales
      ADD COLUMN customer_name VARCHAR(255) AFTER invoice_number
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    // Add customer_address column
    await pool.query(`
      ALTER TABLE vehicle_sales
      ADD COLUMN customer_address VARCHAR(500) AFTER customer_name
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    // Add customer_phone column
    await pool.query(`
      ALTER TABLE vehicle_sales
      ADD COLUMN customer_phone VARCHAR(20) AFTER customer_address
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    console.log("✅ Customer fields added to vehicle_sales table successfully!");
  } catch (error) {
    console.error("❌ Error adding customer fields:", error);
    throw error;
  }
}

// Run the migration
addCustomerFieldsToVehicleSales()
  .then(() => {
    console.log("🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });