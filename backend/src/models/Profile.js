const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  age: {
    type: Number,
    required: [true, 'Please add an age'],
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Please add gender (male/female)'],
  },
  weightKg: {
    type: Number,
    required: [true, 'Please add weight in kilograms'],
  },
  heightCm: {
    type: Number,
    required: [true, 'Please add height in centimeters'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Profile', ProfileSchema);
