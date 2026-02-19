import pool from "../config/database.js";

async function addCreditToInvoices() {
  try {
    console.log("🔄 Adding credit column to invoices table...");

    // Add credit column
    await pool.query(`
      ALTER TABLE invoices
      ADD COLUMN credit DECIMAL(12,2) DEFAULT 0.00 AFTER cheque
    `).catch(err => {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    console.log("✅ Credit column added to invoices table successfully!");
  } catch (error) {
    console.error("❌ Error adding credit column:", error);
    throw error;
  }
}

// Run the migration
addCreditToInvoices()
  .then(() => {
    console.log("🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });