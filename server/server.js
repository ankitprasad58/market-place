require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { testConnection } = require("./config/database");
const { apiLimiter } = require("./middleware/security");

const app = express();

// Security middleware
app.use(helmet()); // Security headers

// CORS configuration
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  "http://localhost:3000", // Always allow local dev
].filter(Boolean); // Removes undefined values if the env var isn't set

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser with size limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Request logging (development only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
const authRoutes = require("./routes/auth");
const presetRoutes = require("./routes/presets");
const paymentRoutes = require("./routes/payment");
const userRoutes = require("./routes/user");
const downloadRoutes = require("./routes/download");

app.use("/api/auth", authRoutes);
app.use("/api/presets", presetRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/download", downloadRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📧 Email Service: ${
      process.env.SMTP_USER ? "Configured" : "Not configured"
    }`
  );
  console.log(
    `💳 Razorpay: ${
      process.env.RAZORPAY_KEY_ID ? "Configured" : "Not configured"
    }`
  );
});
