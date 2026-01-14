require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { testConnection } = require("./config/database");
const { apiLimiter } = require("./middleware/security");

const app = express();
app.set("trust proxy", 1);

// Security middleware
app.use(helmet()); // Security headers

// CORS configuration
const allowedOriginRegex = [
  /^http:\/\/localhost:3000$/,
  /^https:\/\/.*\.netlify\.app$/, // Netlify preview + staging + prod
  /^https:\/\/marketstation-uat\.netlify\.app$/, // explicit allow (optional)
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request Origin:", origin);

      // Allow server-to-server / Postman
      if (!origin) return callback(null, true);

      const isAllowed = allowedOriginRegex.some((regex) => regex.test(origin));

      if (isAllowed) {
        return callback(null, true);
      }

      console.error("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser with size limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.options("*", cors());
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
