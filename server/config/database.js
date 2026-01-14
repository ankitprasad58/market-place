const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    connectTimeout: 60000,
  },
});

// ✅ Single connection test
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
};
// Run migrations
const runMigrations = async () => {
  try {
    // Create users table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(15),
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        profile_image VARCHAR(500) DEFAULT 'https://via.placeholder.com/150',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Create presets table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS presets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category ENUM('video', 'photo', 'audio', 'graphics') NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        preview_image VARCHAR(500),
        file_path VARCHAR(500) NOT NULL,
        file_size VARCHAR(50),
        thumbnail VARCHAR(500),
        creator_id INT,
        downloads INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Create purchases table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        guest_email VARCHAR(100),
        guest_phone VARCHAR(15),
        preset_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_id VARCHAR(100),
        order_id VARCHAR(100),
        download_token VARCHAR(100) UNIQUE,
        download_count INT DEFAULT 0,
        max_downloads INT DEFAULT 5,
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL
      );
    `);

    console.log("✅ Database migrations completed");
  } catch (error) {
    console.error("Migration error:", error.message);
  }
};

// Seed sample data
const seedData = async () => {
  try {
    const [presets] = await sequelize.query(
      "SELECT COUNT(*) as count FROM presets"
    );

    if (presets[0].count === 0) {
      await sequelize.query(`
        INSERT INTO presets (title, description, category, price, original_price, preview_image, file_path, thumbnail, file_size) VALUES
        ('Cinematic LUT Pack Pro', 'Professional color grading LUTs for filmmakers.', 'video', 499, 999, 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400', '/assets/presets/cinematic-luts.zip', 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400', '25 MB'),
        ('Portrait Lightroom Bundle', 'Beautiful presets for portrait photography.', 'photo', 299, 599, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', '/assets/presets/portrait-presets.zip', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', '15 MB'),
        ('Lo-Fi Music Producer Kit', 'Chill beats and ambient sounds.', 'audio', 199, 399, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', '/assets/presets/lofi-pack.zip', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', '120 MB')
      `);
      console.log("✅ Sample presets added");
    }
  } catch (error) {
    console.error("Seed error:", error.message);
  }
};

// Main initialization function
const initDB = async () => {
  await connectDB();
  await runMigrations();
  await seedData();
};

module.exports = { sequelize, initDB };
