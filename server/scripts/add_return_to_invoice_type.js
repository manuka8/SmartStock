import pool from "../config/database.js";

async function addReturnToInvoiceType() {
  try {
    console.log("🔄 Adding 'RETURN' to invoice_type enum in invoices table...");

    // Modify the invoice_type column to include 'RETURN'
    await pool.query(`
      ALTER TABLE invoices
      MODIFY COLUMN invoice_type ENUM('VEHICLE_SALE','DIRECT_SALE','SERVICE','RETURN') DEFAULT 'VEHICLE_SALE'
    `).catch(err => {
      if (!err.message.includes('Duplicate entry') && !err.message.includes('Invalid use of NULL value')) {
        throw err;
      }
    });

    console.log("✅ 'RETURN' added to invoice_type enum successfully!");
  } catch (error) {
    console.error("❌ Error adding 'RETURN' to invoice_type:", error);
    throw error;
  }
}

// Run the migration
addReturnToInvoiceType()
  .then(() => {
    console.log("🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });