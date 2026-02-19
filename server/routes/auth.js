import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../config/database.js";
import { authenticateToken, generateToken } from "../middleware/auth.js";

const router = express.Router();

//Admin login
router.post('/admin/login', async(req, res) => {
  try {
    const { email, password } = req.body;

    if ( !email || !password ) {
      return res.status(400).json({error: "Email and password are required"})
    }

    const [users] = await pool.execute(
      "SELECT * FROM users WHERE email = ? AND is_active = true",
      [email] 
    )

    if (users.length == 0) {
      return res.status(401).json({ error: "Invalid credentials"});
    }

    const user = users[0];

    if ( user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can log in here'});
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials"})
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

// Public signup (register as owner)
router.post("/signup", async(req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      store_name,
      phone,
      agency_id,
      role,
      username: providedUsername,
    } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res
        .status(400)
        .json({ error: "Email, password, first and last name are required" });
    }

    const username = providedUsername || email.split("@")[0];
    const userRole = role || "owner";

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password, role, first_name, last_name, store_name, phone, agency_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        email,
        hashedPassword,
        userRole,
        first_name,
        last_name,
        store_name || null,
        phone || null,
        agency_id || null,
      ]
    );

    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      result.insertId,
    ]);
    const user = rows[0];
    const token = generateToken(user);
    const { password: _pw, ...userWithoutPassword } = user;

    return res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Signup error:", error);
    if (error && error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Public login
router.post("/login", async(req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [users] = await pool.execute(
      "SELECT * FROM users WHERE email= ? AND is_active = true",
      [email]
    );

    if (users.length == 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    // Allow owners and employees to log in via the standard login
    if (user.role !== "owner" && user.role !== "employee") {
      res.status(403).json({ error: "Please use the admin login page" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register (for admin to create users)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { username, email, password, role, first_name, last_name, phone } = req.body;

    // Check if requester is admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only admin can create users' });
    }

    // Validate required fields
    if (!username || !email || !password || !role || !first_name || !last_name) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Enforce allowed roles: super_admin and doctor only
    const allowedRoles = ['super_admin', 'owner'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Allowed roles are 'super_admin' and 'owner'" });
    }

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password, role, first_name, last_name, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, role, first_name, last_name, phone]
    );

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const userId = req.user.id;

    await pool.execute(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [first_name, last_name, phone, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (Admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const [users] = await pool.execute(`
      SELECT 
        u.id, u.username, u.email, u.role, u.first_name, u.last_name,
        u.phone, u.agency_id, store_name, u.is_active, u.created_at,
        ag.agency_name
      FROM users u
      LEFT JOIN agencies ag ON u.agency_id = ag.id
      ORDER BY u.created_at DESC
    `);

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin only)
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      username,
      role,
      phone,  
      agency_id,
      store_name, 
      is_active 
    } = req.body;

    // Check if user exists
    const [existingUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 12);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (store_name !== undefined) {
      updates.push('store_name = ?');
      values.push(store_name);
    }
    if (agency_id !== undefined) {
      updates.push('agency_id = ?');
      values.push(agency_id);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Check if user exists
    const [existingUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add team member (sub-doctor or employee) - For doctors
router.post('/team', authenticateToken, async (req, res) => {
  try {
    // Only owners can add team members
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Only owners can add team members.' });
    }

    const {
      email,
      password,
      first_name,
      last_name,
      role, // 'owner' or 'employee'
      store_name,
      phone,
      username: providedUsername
    } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate role (can only add owners or employees)
    if (role !== 'owner' && role !== 'employee') {
      return res.status(400).json({ error: 'Invalid role. Can only add owners or employees.' });
    }

    // Get the logged-in owner's agency_id
    const ownerAgencyId = req.user.agency_id;
    
    if (!ownerAgencyId) {
      return res.status(400).json({ error: 'Your account is not assigned to an agency. Please contact admin.' });
    }

    // Generate username if not provided
    const username = providedUsername || email.split('@')[0];

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new team member with doctor's center_id
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password, role, first_name, last_name, store_name, phone, agency_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [username, email, hashedPassword, role, first_name, last_name, store_name || null, phone || null, ownerAgencyId]
    );

    console.log(`Doctor ${req.user.id} added new ${role} (ID: ${result.insertId}) to agency ${ownerAgencyId}`);

    res.status(201).json({
      message: `${role === 'owner' ? 'manager' : 'Employee'} added successfully`,
      userId: result.insertId,
      username,
      agency_id: ownerAgencyId
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team members - For owners and employees
router.get('/team', authenticateToken, async (req, res) => {
  try {
    // Only owners and employees can view their team
    if (req.user.role !== 'owner' && req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only owners and employees can view team members.' });
    }

    const ownerAgencyId = req.user.agency_id;

    if (!ownerAgencyId) {
      return res.status(400).json({ error: 'Your account is not assigned to an agency.' });
    }

    // Get all owners and employees from the same agency
    const [teamMembers] = await pool.execute(
      `SELECT 
        u.id, u.username, u.email, u.role, u.first_name, u.last_name,
        u.phone, u.store_name, u.is_active, u.created_at,
        ag.agency_name AS center_name
       FROM users u
       LEFT JOIN agencies ag ON u.agency_id = ag.id
       WHERE u.agency_id = ? AND u.role IN ('owner', 'employee')
       ORDER BY u.role ASC, u.created_at DESC`,
      [ownerAgencyId]
    );

    res.json({ teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
