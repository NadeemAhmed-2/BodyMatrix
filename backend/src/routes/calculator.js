const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Calculate calories & macros, and save to user profile
// @route   POST /api/calculator/calculate
// @access  Private
router.post('/calculate', protect, async (req, res) => {
  try {
    const { age, gender, heightCm, weightKg, activityLevel, goal } = req.body;

    if (!age || !gender || !heightCm || !weightKg || !activityLevel || !goal) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all profile details: age, gender, heightCm, weightKg, activityLevel, goal',
      });
    }

    // 1. Calculate BMR (Mifflin-St Jeor Equation)
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else if (gender === 'female') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    } else {
      return res.status(400).json({ success: false, error: 'Gender must be male or female' });
    }

    // 2. Calculate TDEE (Maintenance Calories)
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const multiplier = activityMultipliers[activityLevel];
    if (!multiplier) {
      return res.status(400).json({ success: false, error: 'Invalid activity level' });
    }

    const TDEE = Math.round(bmr * multiplier);

    // 3. Calculate Weight Loss & Weight Gain target calories
    // Weight loss calories = TDEE - 20% (approx ~500 kcal deficit)
    const weightLossCalories = Math.round(TDEE * 0.80);
    // Weight gain calories = TDEE + 15% (approx ~300-500 kcal surplus)
    const weightGainCalories = Math.round(TDEE * 1.15);

    // Determine target calories based on goal
    let targetCalories = TDEE;
    if (goal === 'lose') {
      targetCalories = weightLossCalories;
    } else if (goal === 'gain') {
      targetCalories = weightGainCalories;
    }

    // 4. Calculate Macronutrient Breakdown
    // Protein: 2.0g per kg of bodyweight
    const proteinGrams = Math.round(weightKg * 2.0);
    const proteinCalories = proteinGrams * 4;

    // Fat: 25% of target calories
    const fatCalories = targetCalories * 0.25;
    const fatGrams = Math.round(fatCalories / 9);

    // Carbohydrates: Remaining calories
    const carbsCalories = targetCalories - (proteinCalories + fatCalories);
    const carbsGrams = Math.max(0, Math.round(carbsCalories / 4));

    // 5. Weekly weight change projection (7700 kcal = 1kg)
    const dailyDeficitOrSurplus = targetCalories - TDEE;
    const weeklyDeficitOrSurplus = dailyDeficitOrSurplus * 7;
    const weeklyProjectionKg = parseFloat((weeklyDeficitOrSurplus / 7700).toFixed(2));

    // 6. Update user document
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.profile = {
      age,
      gender,
      heightCm,
      weightKg,
      activityLevel,
      goal,
    };

    user.targets = {
      maintenanceCalories: TDEE,
      weightLossCalories,
      weightGainCalories,
      macros: {
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams,
      },
      weeklyProjectionKg,
      calculatedAt: new Date(),
    };

    await user.save();

    return res.json({
      success: true,
      data: {
        profile: user.profile,
        targets: user.targets,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
