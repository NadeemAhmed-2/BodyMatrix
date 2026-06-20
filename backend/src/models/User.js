const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  passwordHash: {
    type: String,
    required: function() {
      return !this.firebaseUid;
    },
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
  },
  profile: {
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female'] },
    heightCm: { type: Number },
    weightKg: { type: Number },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    },
    goal: {
      type: String,
      enum: ['lose', 'maintain', 'gain'],
    },
  },
  targets: {
    maintenanceCalories: { type: Number },
    weightLossCalories: { type: Number },
    weightGainCalories: { type: Number },
    macros: {
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
    },
    weeklyProjectionKg: { type: Number },
    calculatedAt: { type: Date },
  },
  preferences: {
    dietType: { type: String, default: 'vegetarian' }, // 'vegetarian' | 'non-vegetarian' | 'vegan'
    allergies: [{ type: String }],
    equipmentAccess: { type: String, enum: ['home', 'gym'], default: 'gym' },
    budgetLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationOtp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
