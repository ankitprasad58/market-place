const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sequelize } = require("../config/database");
const emailService = require("../services/emailService");
const storageService = require("../services/storageService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order
const createOrder = async (req, res) => {
  try {
    const { presetId, guestEmail, guestPhone } = req.body;
    const userId = req.user?.id || null;

    const [presets] = await sequelize.query(
      "SELECT * FROM presets WHERE id = ?",
      { replacements: [presetId] }
    );

    if (presets.length === 0) {
      return res.status(404).json({ message: "Preset not found" });
    }

    const preset = presets[0];

    const order = await razorpay.orders.create({
      amount: Math.round(preset.price * 100),
      currency: "INR",
      receipt: `preset_${presetId}_${Date.now()}`,
      notes: { presetId, userId, guestEmail, guestPhone },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// Verify payment and send email
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user?.id || null;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Get order details
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const { presetId, guestEmail, guestPhone } = order.notes;

    // Get preset
    const [presets] = await sequelize.query(
      "SELECT * FROM presets WHERE id = ?",
      { replacements: [presetId] }
    );
    const preset = presets[0];

    // Generate token and expiry
    const downloadToken = storageService.generateDownloadToken();
    const expiresAt = storageService.generateExpiryDate(30);

    // Save purchase
    const [result] = await sequelize.query(
      `INSERT INTO purchases 
       (user_id, guest_email, guest_phone, preset_id, amount, payment_id, order_id, download_token, expires_at, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      {
        replacements: [
          userId,
          guestEmail || null,
          guestPhone || null,
          presetId,
          preset.price,
          razorpay_payment_id,
          razorpay_order_id,
          downloadToken,
          expiresAt,
        ],
      }
    );

    // Get email
    let emailTo = guestEmail;
    let phone = guestPhone;
    
    if (userId) {
      const [users] = await sequelize.query(
        "SELECT email, phone FROM users WHERE id = ?",
        { replacements: [userId] }
      );
      if (users.length > 0) {
        emailTo = users[0].email;
        phone = users[0].phone;
      }
    }

    // Track email status
    let emailSent = false;
    let emailError = null;

    // Send email with PDF receipt and Drive link
    if (emailTo) {
      try {
        await emailService.sendPurchaseEmail(emailTo, {
          presetTitle: preset.title,
          category: preset.category,
          amount: preset.price,
          driveLink: preset.file_path,
          downloadToken,
          expiresAt,
          paymentId: razorpay_payment_id,
          phone,
        });
        emailSent = true;
      } catch (error) {
        console.error("Email send error:", error);
        emailError = "Failed to send email. Please contact support.";
      }
    }

    // Update download count
    await sequelize.query(
      "UPDATE presets SET downloads = downloads + 1 WHERE id = ?",
      { replacements: [presetId] }
    );

    // Return response with email status
    res.json({
      success: true,
      message: emailSent 
        ? "Payment successful! Check your email for download link."
        : "Payment successful! But email delivery failed. Use the download link below.",
      emailSent,
      emailError,
      purchase: {
        id: result,
        download_token: downloadToken,
        drive_link: preset.file_path,
        expires_at: expiresAt,
        preset_title: preset.title,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

// Get payment history for logged-in user
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [purchases] = await sequelize.query(
      `SELECT 
        p.id,
        p.amount,
        p.payment_id,
        p.order_id,
        p.download_token,
        p.status,
        p.created_at,
        p.expires_at,
        pr.id as preset_id,
        pr.title as preset_title,
        pr.category,
        pr.thumbnail
       FROM purchases p
       JOIN presets pr ON p.preset_id = pr.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      { replacements: [userId] }
    );

    res.json(purchases);
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory };
