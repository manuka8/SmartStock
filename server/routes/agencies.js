import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Generate unique agency ID
function generateAgencyId() {
  const prefix = 'MA';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

// Get all agencies (Admin only)
router.get('/getAllAgencies', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const [agencies] = await pool.execute(`
      SELECT * FROM agencies
      ORDER BY created_at DESC
    `);

    res.json({ agencies });
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get a single agency by ID
router.get('/getAgency/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [agencies] = await pool.execute(
      'SELECT * FROM agencies WHERE id = ?',
      [id]
    );

    if (agencies.length === 0) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    // Count related entities
    const [userCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE agency_id = ?',
      [id]
    );
    const [supplierCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM suppliers WHERE agency_id = ?',
      [id]
    );
    const [customerCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM customers WHERE agency_id = ?',
      [id]
    );

    const agency = {
      ...agencies[0],
      stats: {
        users: userCount[0].count,
        suppliers: supplierCount[0].count,
        customers: customerCount[0].count
      }
    };

    res.json({ agency });
  } catch (error) {
    console.error('Error fetching agency:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Create a new agency (Admin only)
router.post('/createAgency', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const {
      agency_name,
      registration_number,
      email,
      phone_number,
      address_line1,
      address_line2,
      city,
      district,
      postal_code,
      owner_name,
      logo_url,
      status = 'active'
    } = req.body;

    // Validation
    if (!agency_name || !registration_number || !email || !phone_number || 
        !address_line1 || !city || !district || !postal_code || !owner_name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['agency_name', 'registration_number', 'email', 'phone_number', 
                   'address_line1', 'city', 'district', 'postal_code', 'owner_name']
      });
    }

    // Check if registration number already exists
    const [existing] = await pool.execute(
      'SELECT id FROM agencies WHERE registration_number = ?',
      [registration_number]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Registration number already exists' });
    }

    // Generate unique agency ID
    const agency_id = generateAgencyId();

    // Insert agency into database
    const [result] = await pool.execute(`
      INSERT INTO agencies (
        agency_id, agency_name, registration_number, email, phone_number,
        address_line1, address_line2, city, district, postal_code,
        owner_name, logo_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      agency_id, agency_name, registration_number, email, phone_number,
      address_line1, address_line2 || null, city, district, postal_code,
      owner_name, logo_url || null, status
    ]);

    // Fetch the created agency
    const [newAgency] = await pool.execute(
      'SELECT * FROM agencies WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      message: 'Medical center created successfully',
      center: newAgency[0]
    });
  } catch (error) {
    console.error('Error creating agency:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Registration number or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update a agency (Admin or owner of the agency)
router.put('/updateAgency/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, agency_id } = req.user;

    // Allow super_admin or owner updating their own agency
    // Convert to string for comparison since one might be int and other string
    if (role !== 'super_admin' && (role !== 'owner' || String(agency_id) !== String(id))) {
      return res.status(403).json({ error: 'Access denied. You can only update your own agency.' });
    }

    const {
      agency_name,
      registration_number,
      email,
      phone_number,
      address_line1,
      address_line2,
      city,
      district,
      postal_code,
      owner_name,
      logo_url,
      status
    } = req.body;

    // Check if agency exists
    const [existing] = await pool.execute(
      'SELECT * FROM agencies WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (agency_name !== undefined) {
      updates.push('agency_name = ?');
      values.push(agency_name);
    }
    if (registration_number !== undefined) {
      updates.push('registration_number = ?');
      values.push(registration_number);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone_number !== undefined) {
      updates.push('phone_number = ?');
      values.push(phone_number);
    }
    if (address_line1 !== undefined) {
      updates.push('address_line1 = ?');
      values.push(address_line1);
    }
    if (address_line2 !== undefined) {
      updates.push('address_line2 = ?');
      values.push(address_line2);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      values.push(city);
    }
    if (district !== undefined) {
      updates.push('district = ?');
      values.push(district);
    }
    if (postal_code !== undefined) {
      updates.push('postal_code = ?');
      values.push(postal_code);
    }
    if (owner_name !== undefined) {
      updates.push('owner_name = ?');
      values.push(owner_name);
    }
    if (logo_url !== undefined) {
      updates.push('logo_url = ?');
      values.push(logo_url);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await pool.execute(
      `UPDATE agencies SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated agency
    const [updatedAgency] = await pool.execute(
      'SELECT * FROM agencies WHERE id = ?',
      [id]
    );

    res.json({ 
      message: 'Agency updated successfully',
      agency: updatedAgency[0]
    });
  } catch (error) {
    console.error('Error updating agency:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Registration number or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete a agency (Admin only - with cascade warning)
router.delete('/deleteAgency/:id', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Check if agency exists
    const [agency] = await pool.execute(
      'SELECT * FROM agencies WHERE id = ?',
      [id]
    );

    if (agency.length === 0) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    // Check for related data
    const [users] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE agency_id = ?',
      [id]
    );
    const [suppliers] = await pool.execute(
      'SELECT COUNT(*) as count FROM suppliers WHERE agency_id = ?',
      [id]
    );
    const [customers] = await pool.execute(
      'SELECT COUNT(*) as count FROM customers WHERE agency_id = ?',
      [id]
    );

    const hasRelatedData = users[0].count > 0 || suppliers[0].count > 0 || customers[0].count > 0;

    if (hasRelatedData) {
      return res.status(400).json({
        error: 'Cannot delete agency with related data',
        message: 'This agency has associated users, suppliers, or customers. Please reassign or remove them first.',
        relatedData: {
          users: users[0].count,
          suppliers: suppliers[0].count,
          customers: customers[0].count
        }
      });
    }

    // Delete the agency
    await pool.execute('DELETE FROM agencies WHERE id = ?', [id]);

    res.json({ message: 'Agency deleted successfully' });
  } catch (error) {
    console.error('Error deleting agency:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update agency status (Admin only)
router.patch('/updateAgencyStatus/:id', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active, inactive, or suspended.' });
    }

    const [result] = await pool.execute(
      'UPDATE agencies SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    res.json({ message: 'Status updated successfully', status });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;

