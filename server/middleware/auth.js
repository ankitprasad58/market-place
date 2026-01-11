const jwt = require("jsonwebtoken");
const { isBlacklisted } = require("./tokenBlacklist");

// Required authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  // Check if token is blacklisted (logged out)
  if (isBlacklisted(token)) {
    return res
      .status(401)
      .json({ message: "Token has been invalidated. Please login again." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    req.token = token; // Store token for logout
    next();
  });
};

// Optional authentication (for guest checkout)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  // Check if token is blacklisted
  if (isBlacklisted(token)) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
      req.token = token;
    }
    next();
  });
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { authenticateToken, optionalAuth, adminOnly };
