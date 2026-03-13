import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

export const sendOtpEmail = async (toEmail, otp) => {
  await mailer.sendMail({
    from: `Secure Auth App <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your OTP verification code',
    html: `<h2>Email Verification OTP</h2><p>Your OTP is <b>${otp}</b>.</p><p>It expires in 5 minutes.</p>`
  });
};
