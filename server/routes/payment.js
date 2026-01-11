const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
} = require("../controllers/paymentController");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const { paymentLimiter } = require("../middleware/security");

// POST /api/payment/create-order
router.post("/create-order", paymentLimiter, optionalAuth, createOrder);

// POST /api/payment/verify
router.post("/verify", paymentLimiter, optionalAuth, verifyPayment);

// GET /api/payment/history (logged-in users only)
router.get("/history", authenticateToken, getPaymentHistory);

module.exports = router;
