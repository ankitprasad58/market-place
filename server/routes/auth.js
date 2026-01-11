const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
// const { authLimiter } = require("../middleware/security");

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/logout
router.post("/logout", authenticateToken, logout);

// GET /api/auth/me
router.get("/me", authenticateToken, getCurrentUser);

// POST /api/auth/change-password
router.post("/change-password", authenticateToken, changePassword);

module.exports = router;
