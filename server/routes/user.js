const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getProfile,
  getPurchases,
  checkOwnership,
  lookupPurchases,
  updateProfile,
} = require("../controllers/userController");

// GET /api/user/profile
router.get("/profile", authenticateToken, getProfile);

// GET /api/user/purchases
router.get("/purchases", authenticateToken, getPurchases);

// GET /api/user/owns/:presetId
router.get("/owns/:presetId", authenticateToken, checkOwnership);

// GET /api/user/lookup?email=xxx&phone=xxx (for guest purchase lookup)
router.get("/lookup", lookupPurchases);

// PUT /api/user/profile
router.put("/profile", authenticateToken, updateProfile);

module.exports = router;
