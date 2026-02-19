import { pool } from '../config/database.js';
import bcrypt from 'bcrypt';

export async function insertDefaultData() {
  try {
    const [adminExists] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      ['admin', 'admin@lionstock.com']
    );

    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('Lionstock123', 12);

      await pool.execute(
        `INSERT INTO users (username, email, password, role, first_name, last_name, phone, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['admin', 'admin@lionstock.com', hashedPassword, 'super_admin', 'System', 'Administrator', '+1-555-0000', 1]
      );

      console.log('✅ Default admin user created (admin@lionstock.com / Lionstock123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (error) {
    console.error('Error inserting default data:', error);
  }
}