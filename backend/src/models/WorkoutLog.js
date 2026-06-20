const mongoose = require('mongoose');

const WorkoutLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan',
  },
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
  },
  setsDone: {
    type: Number,
    required: true,
  },
  repsDone: {
    type: Number,
    required: true,
  },
  weightKg: {
    type: Number, // Optional, weight lifted in kg
  },
  durationSec: {
    type: Number, // Optional, duration in seconds for cardio/flexibility
  },
  notes: {
    type: String,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);
