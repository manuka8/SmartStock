import { pool } from '../config/database.js';

export async function addSupplierIdToItemMaster() {
  try {
    // Check if supplier_id column already exists
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM item_master LIKE 'supplier_id'"
    );

    if (columns.length === 0) {
      // Add supplier_id column
      await pool.execute(
        'ALTER TABLE item_master ADD COLUMN supplier_id INT AFTER agency_id'
      );
      console.log('✅ supplier_id column added to item_master table');
    } else {
      console.log('ℹ️  supplier_id column already exists in item_master table');
    }

    // Check if foreign key constraint already exists
    const [constraints] = await pool.execute(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'item_master'
        AND COLUMN_NAME = 'supplier_id'
        AND REFERENCED_TABLE_NAME = 'suppliers'
    `);

    if (constraints.length === 0) {
      // Add foreign key constraint
      await pool.execute(`
        ALTER TABLE item_master
        ADD CONSTRAINT fk_item_master_supplier_id
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key constraint added for supplier_id in item_master table');
    } else {
      console.log('ℹ️  Foreign key constraint for supplier_id already exists in item_master table');
    }

  } catch (error) {
    console.error('Error adding supplier_id to item_master:', error);
  }
}