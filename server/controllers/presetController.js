const { sequelize } = require("../config/database");

// Get all presets
const getAllPresets = async (req, res) => {
  try {
    const [presets] = await sequelize.query(
      "SELECT * FROM presets WHERE is_active = true ORDER BY created_at DESC"
    );
    res.json(presets);
  } catch (error) {
    console.error("Error fetching presets:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single preset
const getPresetById = async (req, res) => {
  try {
    const [presets] = await sequelize.query(
      "SELECT * FROM presets WHERE id = ?",
      { replacements: [req.params.id] }
    );

    if (presets.length === 0) {
      return res.status(404).json({ message: "Preset not found" });
    }

    res.json(presets[0]);
  } catch (error) {
    console.error("Error fetching preset:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get presets by category
const getPresetsByCategory = async (req, res) => {
  try {
    const [presets] = await sequelize.query(
      "SELECT * FROM presets WHERE category = ? AND is_active = true ORDER BY created_at DESC",
      { replacements: [req.params.category] }
    );
    res.json(presets);
  } catch (error) {
    console.error("Error fetching presets:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getAllPresets, getPresetById, getPresetsByCategory };
