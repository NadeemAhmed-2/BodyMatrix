const sendVerificationEmail = async (email, otp) => {
  if (!process.env.SMTP_PASS) {
    throw new Error("SMTP_PASS (Resend API key) missing");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SMTP_PASS}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Body Matrix <noreply@bodymatrix.site>",
      to: email,
      subject: "VERIFY PROTOCOL - Verification Code",
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
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Resend API error:", data);
    throw new Error(
      `Failed to send email: ${data.message || JSON.stringify(data)}`,
    );
  }

  console.log(`[Resend] Verification email sent to ${email}`);
};

module.exports = { sendVerificationEmail };
