const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 6 * 1, // 15 minutes
  max: 1000, // 100 requests per window
  skip: (req) => req.method === "OPTIONS",
  message: {
    message: "Too many requests, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth routes (login, register)
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // 5 attempts per window
//   message: {
//     message: "Too many login attempts, please try again after 15 minutes",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Payment routes limiter
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 payment attempts per hour
  message: {
    message: "Too many payment attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Download limiter
const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 downloads per hour
  message: {
    message: "Too many download attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  paymentLimiter,
  downloadLimiter,
};
