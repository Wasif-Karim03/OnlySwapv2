import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;

    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: { email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

