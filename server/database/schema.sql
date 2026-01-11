-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS presets_marketplace;
USE presets_marketplace;

-- Users table (with phone)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_image VARCHAR(500) DEFAULT 'https://via.placeholder.com/150',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Presets table (with file storage info)
CREATE TABLE IF NOT EXISTS presets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('video', 'photo', 'audio', 'graphics') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    preview_image VARCHAR(500),
    file_url VARCHAR(500) NOT NULL,
    file_size VARCHAR(50),
    thumbnail VARCHAR(500),
    creator_id INT,
    downloads INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Purchases table (supports guest checkout)
CREATE TABLE IF NOT EXISTS purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    guest_email VARCHAR(100),
    guest_phone VARCHAR(15),
    preset_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_id VARCHAR(100),
    order_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    download_token VARCHAR(100),
    download_count INT DEFAULT 0,
    download_expiry TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 30 DAY),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (preset_id) REFERENCES presets(id)
);

-- Assets/Files table (for your own hosted files)
CREATE TABLE IF NOT EXISTS assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    preset_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (preset_id) REFERENCES presets(id)
);

-- Sample presets data
INSERT INTO presets (title, description, category, price, preview_image, file_url, file_size, thumbnail) VALUES
('Cinematic LUT Pack', 'Professional color grading LUTs for video editing. Includes 20+ LUTs for different moods.', 'video', 499, 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400', '/assets/cinematic-luts.zip', '25MB', 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400'),
('Portrait Lightroom Presets', 'Beautiful presets for portrait photography. Works on mobile and desktop.', 'photo', 299, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', '/assets/portrait-presets.zip', '15MB', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'),
('Lo-Fi Audio Pack', 'Chill beats and ambient sounds for content creators.', 'audio', 199, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', '/assets/lofi-pack.zip', '50MB', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Social Media Templates', 'Instagram and YouTube thumbnail templates. Fully editable PSD files.', 'graphics', 399, 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400', '/assets/social-templates.zip', '30MB', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'),
('Wedding Film LUTs', 'Romantic color grades for wedding videos. 15 premium LUTs included.', 'video', 599, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400', '/assets/wedding-luts.zip', '20MB', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400'),
('Street Photography Presets', 'Urban and moody photo presets for street photographers.', 'photo', 249, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400', '/assets/street-presets.zip', '12MB', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400');