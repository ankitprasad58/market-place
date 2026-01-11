// In-memory blacklist (for production, use Redis)
const blacklistedTokens = new Set();

// Add token to blacklist
const blacklistToken = (token) => {
  blacklistedTokens.add(token);

  // Auto-remove after 24 hours (JWT expiry time)
  setTimeout(() => {
    blacklistedTokens.delete(token);
  }, 24 * 60 * 60 * 1000);
};

// Check if token is blacklisted
const isBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

module.exports = { blacklistToken, isBlacklisted };
