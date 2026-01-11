const crypto = require("crypto");

class StorageService {
  // Generate unique download token
  generateDownloadToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  // For Google Drive, the link is already shareable
  // We just return the stored link
  getDriveLink(filePath) {
    return filePath; // Already a Google Drive link
  }

  // Generate expiry date (30 days from now)
  generateExpiryDate(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}

module.exports = new StorageService();
