const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize } = require("../config/database");
const { blacklistToken } = require("../middleware/tokenBlacklist");

// Register
const register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user exists
    const [existingUsers] = await sequelize.query(
      "SELECT id FROM users WHERE email = ?",
      { replacements: [email.toLowerCase()] }
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await sequelize.query(
      "INSERT INTO users (username, email, password, phone, role) VALUES (?, ?, ?, ?, 'user')",
      {
        replacements: [
          username,
          email.toLowerCase(),
          hashedPassword,
          phone || null,
        ],
      }
    );

    // Generate token
    const token = jwt.sign(
      { id: result, email: email.toLowerCase(), role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: result,
        name,
        email: email.toLowerCase(),
        phone,
        role: "user",
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const [users] = await sequelize.query(
      "SELECT * FROM users WHERE email = ?",
      { replacements: [email.toLowerCase()] }
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const token = req.token;

    if (token) {
      // Add token to blacklist
      blacklistToken(token);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const [users] = await sequelize.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?",
      { replacements: [req.user.id] }
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    // Get user
    const [users] = await sequelize.query(
      "SELECT password FROM users WHERE id = ?",
      { replacements: [userId] }
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await sequelize.query("UPDATE users SET password = ? WHERE id = ?", {
      replacements: [hashedPassword, userId],
    });

    // Blacklist current token (force re-login)
    if (req.token) {
      blacklistToken(req.token);
    }

    res.json({ message: "Password changed successfully. Please login again." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

module.exports = { register, login, logout, getCurrentUser, changePassword };
