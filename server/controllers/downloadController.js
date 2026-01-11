const { sequelize } = require("../config/database");
const storageService = require("../services/storageService");

// Handle secure download
const downloadPreset = async (req, res) => {
  const { token } = req.params;

  try {
    // Find purchase by token
    const [purchases] = await sequelize.query(
      `SELECT p.*, pr.title, pr.file_path, pr.file_size 
       FROM purchases p 
       JOIN presets pr ON p.preset_id = pr.id 
       WHERE p.download_token = ?`,
      { replacements: [token] }
    );

    if (purchases.length === 0) {
      return res.status(404).json({ message: "Invalid download token" });
    }

    const purchase = purchases[0];

    // Check if expired
    if (purchase.expires_at && new Date(purchase.expires_at) < new Date()) {
      return res.status(410).json({ message: "Download link has expired" });
    }

    // Check download count
    if (purchase.download_count >= purchase.max_downloads) {
      return res.status(410).json({
        message: "Maximum downloads reached. Please contact support.",
      });
    }

    // Increment download count
    await sequelize.query(
      "UPDATE purchases SET download_count = download_count + 1 WHERE id = ?",
      { replacements: [purchase.id] }
    );

    // Redirect to Google Drive link
    res.redirect(purchase.file_path);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Download failed" });
  }
};

// Get download info
const getDownloadInfo = async (req, res) => {
  const { token } = req.params;

  try {
    const [purchases] = await sequelize.query(
      `SELECT p.download_count, p.max_downloads, p.expires_at, p.created_at,
              pr.title, pr.thumbnail, pr.file_size
       FROM purchases p 
       JOIN presets pr ON p.preset_id = pr.id 
       WHERE p.download_token = ?`,
      { replacements: [token] }
    );

    if (purchases.length === 0) {
      return res.status(404).json({ message: "Invalid token" });
    }

    const purchase = purchases[0];

    res.json({
      title: purchase.title,
      thumbnail: purchase.thumbnail,
      fileSize: purchase.file_size,
      downloadsUsed: purchase.download_count,
      maxDownloads: purchase.max_downloads,
      downloadsRemaining: purchase.max_downloads - purchase.download_count,
      expiresAt: purchase.expires_at,
      isExpired:
        purchase.expires_at && new Date(purchase.expires_at) < new Date(),
      purchasedAt: purchase.created_at,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { downloadPreset, getDownloadInfo };
