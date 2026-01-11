const express = require("express");
const router = express.Router();
const presetController = require("../controllers/presetController");

// GET /api/presets
router.get("/", presetController.getAllPresets);

// GET /api/presets/:id
router.get("/:id", presetController.getPresetById);

// GET /api/presets/category/:category
router.get("/category/:category", presetController.getPresetsByCategory);

module.exports = router;
