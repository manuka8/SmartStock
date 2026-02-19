import pool from "../config/database.js";

async function addSaleDateToVehicleSales() {
  try {
    console.log("🔄 Adding sale_date column to vehicle_sales table...");

    // Add sale_date column
    await pool.query(`
      ALTER TABLE vehicle_sales
      ADD COLUMN sale_date DATE NOT NULL DEFAULT (CURRENT_DATE) AFTER vehicle_id
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    console.log("✅ Sale date column added to vehicle_sales table successfully!");
  } catch (error) {
    console.error("❌ Error adding sale_date column:", error);
    throw error;
  }
}

// Run the migration
addSaleDateToVehicleSales()
  .then(() => {
    console.log("🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });