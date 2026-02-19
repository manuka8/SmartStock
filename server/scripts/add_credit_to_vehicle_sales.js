import pool from "../config/database.js";

async function addCreditToVehicleSales() {
  try {
    console.log("🔄 Adding credit column to vehicle_sales table...");

    // Add credit column
    await pool.query(`
      ALTER TABLE vehicle_sales
      ADD COLUMN credit DECIMAL(12,2) DEFAULT 0.00 AFTER cheque
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    console.log("✅ Credit column added to vehicle_sales table successfully!");
  } catch (error) {
    console.error("❌ Error adding credit column:", error);
    throw error;
  }
}

// Run the migration
addCreditToVehicleSales()
  .then(() => {
    console.log("🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });