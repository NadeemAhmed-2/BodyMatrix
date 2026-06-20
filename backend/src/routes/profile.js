const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    return res.json({ success: true, profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Create or update user profile
// @route   PUT /api/profile
// @access  Private
router.put('/', protect, async (req, res) => {
  try {
    const { name, age, gender, weightKg, heightCm } = req.body;

    if (!name || !age || !gender || !weightKg || !heightCm) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all profile details: name, age, gender, weightKg, heightCm',
      });
    }

    let profile = await Profile.findOne({ userId: req.user._id });

    if (profile) {
      // Update
      profile.name = name;
      profile.age = age;
      profile.gender = gender;
      profile.weightKg = weightKg;
      profile.heightCm = heightCm;
      await profile.save();
    } else {
      // Create
      profile = await Profile.create({
        userId: req.user._id,
        name,
        age,
        gender,
        weightKg,
        heightCm,
      });
    }

    // Synchronize User model's name property
    const user = await User.findById(req.user._id);
    if (user && user.name !== name) {
      user.name = name;
      await user.save();
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
