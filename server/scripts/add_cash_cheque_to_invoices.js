import pool from "../config/database.js";

async function addCashChequeToInvoices() {
  try {
    console.log("🔄 Adding cash and cheque columns to invoices table...");

    // Add cash column
    await pool.query(`
      ALTER TABLE invoices
      ADD COLUMN cash DECIMAL(12,2) DEFAULT 0.00
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    // Add cheque column
    await pool.query(`
      ALTER TABLE invoices
      ADD COLUMN cheque DECIMAL(12,2) DEFAULT 0.00
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    console.log("✅ Cash and cheque columns added to invoices table successfully!");
  } catch (error) {
    console.error("❌ Error adding cash and cheque columns:", error);
    throw error;
  }
}

// Run the migration
addCashChequeToInvoices()
  .then(() => {
    console.log("🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });