import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    if (!admin) return res.status(401).json({ message: "Invalid admin token" });

    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Middleware to check for superadmin role
export const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Superadmin access required',
    });
  }
  next();
};

