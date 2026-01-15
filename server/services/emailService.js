const PDFDocument = require("pdfkit");
const { Resend } = require("resend");

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  // Generate PDF Receipt
  async generateReceipt(purchaseData) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(24)
        .fillColor("#667eea")
        .text("PresetHub", { align: "center" });
      doc
        .fontSize(12)
        .fillColor("#666")
        .text("Digital Assets Marketplace", { align: "center" });
      doc.moveDown(2);

      // Receipt Title
      doc
        .fontSize(18)
        .fillColor("#333")
        .text("PURCHASE RECEIPT", { align: "center" });
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#eee");
      doc.moveDown();

      // Purchase Details
      doc.fontSize(12).fillColor("#333");
      doc.text(`Receipt No: ${purchaseData.receiptNo}`, { continued: false });
      doc.text(
        `Date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`
      );
      doc.text(`Payment ID: ${purchaseData.paymentId}`);
      doc.moveDown();

      // Customer Info
      doc.fontSize(14).fillColor("#667eea").text("Customer Details");
      doc.fontSize(11).fillColor("#333");
      doc.text(`Email: ${purchaseData.email}`);
      if (purchaseData.phone) doc.text(`Phone: ${purchaseData.phone}`);
      doc.moveDown();

      // Product Details
      doc.fontSize(14).fillColor("#667eea").text("Product Details");
      doc.fontSize(11).fillColor("#333");
      doc.text(`Product: ${purchaseData.presetTitle}`);
      doc.text(`Category: ${purchaseData.category}`);
      doc.moveDown();

      // Price Box
      doc.rect(50, doc.y, 500, 60).fill("#f8f9fa");
      doc.fillColor("#333").fontSize(12);
      doc.text("Amount Paid:", 70, doc.y - 45);
      doc.fontSize(24).fillColor("#667eea");
      doc.text(`₹${purchaseData.amount}`, 400, doc.y - 35, { align: "right" });
      doc.moveDown(3);

      // Download Info
      doc.fontSize(14).fillColor("#667eea").text("Download Information");
      doc.fontSize(11).fillColor("#333");
      doc.text(`Download Token: ${purchaseData.downloadToken}`);
      doc.text(
        `Valid Until: ${new Date(purchaseData.expiresAt).toLocaleDateString(
          "en-IN"
        )}`
      );
      doc.text(`Maximum Downloads: 5`);
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).fillColor("#999");
      doc.text("Thank you for your purchase!", { align: "center" });
      doc.text("For support: support@presethub.in", { align: "center" });

      doc.end();
    });
  }

  // Send purchase email with PDF and Drive link
  async sendPurchaseEmail(to, purchaseData) {
    const {
      presetTitle,
      category,
      amount,
      driveLink,
      downloadToken,
      expiresAt,
      paymentId,
    } = purchaseData;

    // Generate PDF receipt
    const pdfBuffer = await this.generateReceipt({
      receiptNo: `PH-${Date.now()}`,
      email: to,
      phone: purchaseData.phone,
      presetTitle,
      category,
      amount,
      downloadToken,
      expiresAt,
      paymentId,
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .success-icon { font-size: 60px; margin-bottom: 20px; }
          .preset-card { background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
          .download-btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .info-box { background: #e8f5e9; border: 1px solid #4caf50; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .warning-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
          .token-box { background: #e8f4fd; border: 1px dashed #2196f3; border-radius: 8px; padding: 15px; margin: 15px 0; font-family: monospace; word-break: break-all; text-align: center; font-size: 14px; }
          .steps { background: #fafafa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .steps ol { margin: 0; padding-left: 20px; }
          .steps li { margin: 10px 0; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">🎉</div>
            <h1>Payment Successful!</h1>
            <p>Thank you for your purchase</p>
          </div>
          
          <div class="content">
            <h2>Hi there!</h2>
            <p>Great news! Your payment of <strong>₹${amount}</strong> has been received. Your preset is ready for download!</p>
            
            <div class="preset-card">
              <h3 style="margin-top: 0; color: #667eea;">📦 ${presetTitle}</h3>
              <p style="margin-bottom: 0; color: #666;">Category: ${category}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${driveLink}" class="download-btn">
                ⬇️ Download from Google Drive
              </a>
            </div>

            <div class="steps">
              <h4 style="margin-top: 0;">📋 How to Download:</h4>
              <ol>
                <li>Click the download button above</li>
                <li>Google Drive will open in a new tab</li>
                <li>Click the download icon (⬇️) or right-click → Download</li>
                <li>Extract the ZIP file and enjoy!</li>
              </ol>
            </div>
            
            <div class="info-box">
              <strong>✅ What's Included:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Complete preset pack (ZIP file)</li>
                <li>Installation guide (PDF)</li>
                <li>Lifetime access to updates</li>
              </ul>
            </div>

            <div class="warning-box">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please download within <strong>30 days</strong></li>
                <li>Do not share this link publicly</li>
                <li>Save your receipt PDF for reference</li>
              </ul>
            </div>
            
            <p><strong>Your Reference Token:</strong></p>
            <div class="token-box">${downloadToken}</div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <h3>Need Help?</h3>
            <p>If you have any issues, contact us:</p>
            <ul>
              <li>📧 Email: support@presethub.in</li>
              <li>💬 WhatsApp: +91 98765 43210</li>
            </ul>
          </div>
          
          <div class="footer">
            <p><strong>PresetHub</strong> - India's #1 Preset Marketplace</p>
            <p>📎 Your receipt is attached as PDF</p>
            <p>© 2026 PresetHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.resend.emails.send({
      from: "ankprasad58@gmail.com",
      to,
      subject: `🎉 Your Preset is Ready: ${presetTitle}`,
      html,
      attachments: [
        {
          filename: `PresetHub-Receipt-${downloadToken.slice(0, 8)}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log(`✅ Purchase email sent to ${to}`);
  }
}

module.exports = new EmailService();
