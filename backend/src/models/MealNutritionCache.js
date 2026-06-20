const mongoose = require('mongoose');

const MealNutritionCacheSchema = new mongoose.Schema({
  ingredientName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  calories: {
    type: Number,
    required: true
  },
  proteinGrams: {
    type: Number,
    required: true
  },
  carbsGrams: {
    type: Number,
    required: true
  },
  fatGrams: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 days in seconds
  }
});

module.exports = mongoose.model('MealNutritionCache', MealNutritionCacheSchema);
