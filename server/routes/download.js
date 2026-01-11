const express = require("express");
const router = express.Router();
const {
  downloadPreset,
  getDownloadInfo,
} = require("../controllers/downloadController");
const { downloadLimiter } = require("../middleware/security");

// GET /api/download/:token - Download file
router.get("/:token", downloadLimiter, downloadPreset);

// GET /api/download/:token/info - Get download info
router.get("/:token/info", getDownloadInfo);

module.exports = router;
