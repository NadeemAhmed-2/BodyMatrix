const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, otp) => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error('SMTP configuration missing in environment variables');
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Body Matrix" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'VERIFY PROTOCOL - Verification Code',
      text: `Your Body Matrix verification code (OTP) is ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="background-color: #131313; color: #e5e2e1; font-family: sans-serif; padding: 30px; border-top: 4px solid #ccff00;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 2px; margin-bottom: 20px;">VERIFY PROTOCOL</h1>
          <p style="font-size: 16px; color: #c4c9ac; line-height: 24px;">To unlock your Body Matrix performance profile, enter the following 4-digit verification code:</p>
          <div style="background-color: #201f1f; border: 1px solid #444933; padding: 20px; font-size: 32px; font-weight: bold; color: #ccff00; letter-spacing: 5px; text-align: center; margin: 30px 0; max-width: 150px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #8e9379;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`[SMTP] Real-time verification email successfully sent to ${email}`);
  } catch (err) {
    console.error('Real-time SMTP dispatch failed:', err.message);
    throw new Error(`Failed to send verification email: ${err.message}`);
  }
};

module.exports = { sendVerificationEmail };
