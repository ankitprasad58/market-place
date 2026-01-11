const { sequelize } = require("../config/database");

// Get user profile
const getProfile = async (req, res) => {
  try {
    const [users] = await sequelize.query(
      "SELECT id, username, email, phone, profile_image, created_at FROM users WHERE id = ?",
      { replacements: [req.user.id] }
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user purchases (includes purchases made with same email/phone before registration)
const getPurchases = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's email/phone
    const [users] = await sequelize.query(
      "SELECT email, phone FROM users WHERE id = ?",
      { replacements: [userId] }
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const { email, phone } = users[0];

    // Use named replacements to avoid positional mismatch
    const [purchases] = await sequelize.query(
      `SELECT 
         p.id,
         p.amount,
         p.payment_id,
         p.order_id,
         p.download_token,
         p.status,
         p.created_at,
         p.expires_at,
         p.download_count,
         p.max_downloads,
         pr.id AS preset_id,
         pr.title AS preset_title,
         pr.category,
         pr.thumbnail
       FROM purchases p
       JOIN presets pr ON p.preset_id = pr.id
       WHERE 
         p.user_id = :userId
         OR p.guest_email = :email
         OR (:phone IS NOT NULL AND p.guest_phone = :phone)
       ORDER BY p.created_at DESC`,
      { replacements: { userId, email, phone } }
    );

    res.json(purchases);
  } catch (error) {
    console.error("Purchases error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check if user owns a preset
const checkOwnership = async (req, res) => {
  try {
    const user = req.user;

    const [purchases] = await sequelize.query(
      `SELECT * FROM purchases 
       WHERE (user_id = ? OR guest_email = ? OR guest_phone = ?) 
         AND preset_id = ? AND status = 'completed'`,
      { replacements: [user.id, user.email, user.phone, req.params.presetId] }
    );

    res.json({
      owns: purchases.length > 0,
      download_token: purchases.length > 0 ? purchases[0].download_token : null,
    });
  } catch (error) {
    console.error("Check ownership error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lookup purchases by email/phone (for guest users)
const lookupPurchases = async (req, res) => {
  try {
    const { email, phone } = req.query;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone required" });
    }

    const [purchases] = await sequelize.query(
      `SELECT p.*, pr.title, pr.description, pr.category, pr.thumbnail
       FROM purchases p
       JOIN presets pr ON p.preset_id = pr.id
       WHERE (p.guest_email = ? OR p.guest_phone = ?) AND p.status = 'completed'
       ORDER BY p.created_at DESC`,
      { replacements: [email || "", phone || ""] }
    );

    res.json(purchases);
  } catch (error) {
    console.error("Lookup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { username, profile_image } = req.body;

    await sequelize.query(
      "UPDATE users SET username = ?, profile_image = ? WHERE id = ?",
      { replacements: [username, profile_image, req.user.id] }
    );

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProfile,
  getPurchases,
  checkOwnership,
  lookupPurchases,
  updateProfile,
};
