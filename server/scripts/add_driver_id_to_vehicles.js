import { pool } from '../config/database.js';

export async function addDriverIdToVehicles() {
  try {
    // Check if driver_id column already exists
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM vehicles LIKE 'driver_id'"
    );

    if (columns.length === 0) {
      // Add driver_id column
      await pool.execute(
        'ALTER TABLE vehicles ADD COLUMN driver_id INT AFTER vehicle_type'
      );
      console.log('✅ driver_id column added to vehicles table');
    } else {
      console.log('ℹ️  driver_id column already exists in vehicles table');
    }

    // Check if foreign key constraint already exists
    const [constraints] = await pool.execute(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'vehicles'
        AND COLUMN_NAME = 'driver_id'
        AND REFERENCED_TABLE_NAME = 'employees'
    `);

    if (constraints.length === 0) {
      // Add foreign key constraint
      await pool.execute(`
        ALTER TABLE vehicles
        ADD CONSTRAINT fk_vehicles_driver_id
        FOREIGN KEY (driver_id) REFERENCES employees(id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key constraint added for driver_id in vehicles table');
    } else {
      console.log('ℹ️  Foreign key constraint for driver_id already exists in vehicles table');
    }

  } catch (error) {
    console.error('Error adding driver_id to vehicles:', error);
  }
}