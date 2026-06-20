const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { protect } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/email');
const { verifyFirebaseIdToken } = require('../utils/firebase');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyforfitnessappdev123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (Unverified initially, sends OTP)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, and password' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      if (userExists.isVerified) {
        return res.status(400).json({ success: false, error: 'User already exists' });
      } else {
        // Overwrite the unverified user's registration details and send new OTP
        userExists.name = name;
        userExists.passwordHash = password; // pre-save hook handles hashing
        userExists.verificationOtp = otp;
        userExists.otpExpires = otpExpires;
        await userExists.save();

        await sendVerificationEmail(email, otp);

        return res.status(200).json({
          success: true,
          message: 'OTP sent to your email. Please verify your identity.',
          email: userExists.email,
        });
      }
    }

    // Create user as unverified
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      isVerified: false,
      verificationOtp: otp,
      otpExpires,
    });

    if (user) {
      await sendVerificationEmail(email, otp);

      return res.status(201).json({
        success: true,
        message: 'OTP sent to your email. Please verify your identity.',
        email: user.email,
      });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Check for user email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      user.verificationOtp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendVerificationEmail(email, otp);

      return res.status(403).json({
        success: false,
        error: 'Please verify your email. A new OTP has been sent.',
        unverified: true,
        email: user.email,
      });
    }

    const profile = await Profile.findOne({ userId: user._id });

    return res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        targets: user.targets,
        preferences: user.preferences,
      },
      profile,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Please provide email and verification code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: 'Email already verified',
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          targets: user.targets,
          preferences: user.preferences,
        },
      });
    }

    if (user.verificationOtp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, error: 'Verification code has expired' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const profile = await Profile.findOne({ userId: user._id });

    return res.json({
      success: true,
      message: 'Account verified successfully',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        targets: user.targets,
        preferences: user.preferences,
      },
      profile,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, error: 'Email is already verified' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.verificationOtp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, otp);

    return res.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    return res.json({ success: true, user: req.user, profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Google Sign-In with Firebase Auth
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { token, email: reqEmail, name: reqName } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Please provide Google authentication token' });
    }

    // Verify token using Firebase verification utility
    const verification = await verifyFirebaseIdToken(token);
    if (!verification.success) {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(__dirname, '../../auth_debug.log');
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] Verification Failed: ${verification.error}\nToken sent: ${token.substring(0, 30)}...\n`);
      return res.status(401).json({ success: false, error: `Google token verification failed: ${verification.error}` });
    }

    const decoded = verification.decoded;
    const email = decoded.email || reqEmail;
    const name = decoded.name || reqName || email.split('@')[0];
    const firebaseUid = decoded.sub || decoded.uid;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email could not be verified from Google account' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Link firebaseUid if it wasn't linked already
      let modified = false;
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        modified = true;
      }
      // Google sign-in guarantees verification
      if (!user.isVerified) {
        user.isVerified = true;
        user.verificationOtp = undefined;
        user.otpExpires = undefined;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    } else {
      // Create a new verified user without password
      user = await User.create({
        name,
        email,
        firebaseUid,
        isVerified: true,
      });
    }

    const profile = await Profile.findOne({ userId: user._id });

    return res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        targets: user.targets,
        preferences: user.preferences,
      },
      profile,
    });
  } catch (error) {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../../auth_debug.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Route Exception: ${error.stack}\n`);
    console.error('Google Auth Route Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
