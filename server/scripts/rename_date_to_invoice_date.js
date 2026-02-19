import pool from "../config/database.js";

async function renameDateToInvoiceDate() {
  try {
    console.log("🔄 Renaming 'date' column to 'invoice_date' in invoices table...");

    // Rename the column
    await pool.query(`
      ALTER TABLE invoices
      CHANGE \`date\` invoice_date DATE
    `).catch(err => {
      if (!err.message.includes('Unknown column') && !err.message.includes('Duplicate column name')) {
        throw err;
      }
    });

    console.log("✅ 'date' column renamed to 'invoice_date' successfully!");
  } catch (error) {
    console.error("❌ Error renaming column:", error);
    throw error;
  }
}

// Run the migration
renameDateToInvoiceDate()
  .then(() => {
    console.log("🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });