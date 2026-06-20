const mongoose = require('mongoose');

const MealPlanCacheSchema = new mongoose.Schema({
  targetCalories: {
    type: Number,
    required: true
  },
  diet: {
    type: String,
    required: true,
    lowercase: true
  },
  mealsPerDay: {
    type: Number,
    required: true
  },
  planData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60 // 7 days in seconds
  }
});

// Create a compound index for fast lookups
MealPlanCacheSchema.index({ targetCalories: 1, diet: 1, mealsPerDay: 1 });

module.exports = mongoose.model('MealPlanCache', MealPlanCacheSchema);
