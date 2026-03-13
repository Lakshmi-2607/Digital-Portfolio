import bcrypt from 'bcrypt';
import crypto from 'crypto';
import QRCode from 'qrcode';
import validator from 'validator';
import User from '../models/User.js';
import { generateOtp } from '../utils/generateOtp.js';
import { sendOtpEmail } from '../config/mailer.js';
import { generateToken } from '../utils/generateToken.js';

const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/.test(password);

export const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          'Password must contain uppercase, lowercase, number, symbol and be 8-64 characters'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      otp,
      otpExpiresAt,
      isVerified: false
    });

    await sendOtpEmail(user.email, otp);

    return res.status(201).json({
      message: 'Signup successful. OTP sent to email for verification.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    user.qrToken = crypto.randomBytes(32).toString('hex');
    await user.save();

    const qrLoginUrl = `${process.env.CLIENT_URL}/qr-login/${user.qrToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrLoginUrl);

    return res.status(200).json({
      message: 'Email verified successfully',
      qrCodeDataUrl,
      qrLoginUrl
    });
  } catch (error) {
    return res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp);
    return res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email not verified. Verify OTP before login.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ userId: user._id, email: user.email });
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export const qrLogin = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const user = await User.findOne({ qrToken, isVerified: true });

    if (!user) {
      return res.status(401).json({ message: 'Invalid QR token' });
    }

    const token = generateToken({ userId: user._id, email: user.email });
    return res.status(200).json({
      message: 'QR login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    return res.status(500).json({ message: 'QR login failed', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password -otp -otpExpiresAt -qrToken');
  return res.status(200).json(user);
};
