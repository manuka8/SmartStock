import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'Smart_Stock_Lion:Bit_secret_key_2025_Best_Software_solutions';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.get("authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database to ensure they still exist and are active
    const [users] = await pool.execute(
      "SELECT id, username, email, role, first_name, last_name, agency_id, is_active FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ error: 'Invalid token or user deactivated.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

export const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role,
      agencyId: user.agency_id
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};
  
