require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Import Config & Middleware
const { initDB } = require("./config/database");
const { apiLimiter } = require("./middleware/security");

const app = express();

// Set trust proxy (important for Render/Netlify)
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());

// --- CORS Configuration ---
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN, // https://marketstation-uat.netlify.app
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

// Optional: Regex for Netlify branch previews
const netlifyRegex = /^https:\/\/.*\.netlify\.app$/;

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server or Postman
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) || netlifyRegex.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        console.error("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Handle preflight for all routes
app.options("*", cors());

// Apply rate limiting
app.use("/api", apiLimiter);

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

// --- Start Server & Database ---
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Corrected: Using initDB as per your import
    await initDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
