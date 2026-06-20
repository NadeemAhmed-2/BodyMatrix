const mongoose = require('mongoose');

const WorkoutPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  goal: {
    type: String,
    required: true,
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness'],
  },
  mode: {
    type: String,
    required: true,
    enum: ['home', 'gym'],
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'athlete'],
  },
  age: {
    type: Number,
    required: true,
  },
  muscleGroups: [{
    type: String,
  }],
  schedule: [{
    dayNumber: {
      type: Number,
      required: true, // 1 = Monday, ..., 7 = Sunday
    },
    dayName: {
      type: String,
      required: true, // "Monday", etc.
    },
    type: {
      type: String,
      required: true, // "Full Body" | "Push" | "Pull" | "Legs" | "Cardio" | "HIIT" | "Strength" | "Rest"
    },
    warmupNote: {
      type: String,
    },
    cooldownNote: {
      type: String,
    },
    exercises: [{
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true,
      },
      sets: {
        type: Number,
        required: true,
      },
      reps: {
        type: Number,
        required: true, // 0 if duration-based
      },
      durationSec: {
        type: Number, // for cardio/flexibility
      },
      restSec: {
        type: Number,
        required: true,
      },
      orderIndex: {
        type: Number,
        required: true,
      },
      weekNumber: {
        type: Number,
        default: 1,
      }
    }]
  }],
  notes: {
    type: String,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('WorkoutPlan', WorkoutPlanSchema);
