import pool from "../config/database.js";

async function addCashChequeToVehicleSales() {
  try {
    console.log("🔄 Adding cash and cheque columns to vehicle_sales table...");

    // Add cash column
    await pool.query(`
      ALTER TABLE vehicle_sales
      ADD COLUMN cash DECIMAL(12,2) DEFAULT 0.00 AFTER payment_method
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    // Add cheque column
    await pool.query(`
      ALTER TABLE vehicle_sales
      ADD COLUMN cheque DECIMAL(12,2) DEFAULT 0.00 AFTER cash
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    console.log("✅ Cash and cheque columns added to vehicle_sales table successfully!");
  } catch (error) {
    console.error("❌ Error adding cash and cheque columns:", error);
    throw error;
  }
}

// Run the migration
addCashChequeToVehicleSales()
  .then(() => {
    console.log("🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });