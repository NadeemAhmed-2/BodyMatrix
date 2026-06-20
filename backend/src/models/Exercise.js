const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  }, // wger exercise base ID
  uuid: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: [true, 'Please add an exercise name'],
    trim: true,
  },
  description: {
    type: String,
  },
  muscleGroup: {
    type: String,
    required: [true, 'Please add a target muscle group'],
    enum: [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'legs',
      'core',
      'cardio',
      'flexibility',
      'full_body'
    ],
  },
  primaryMuscleIds: [{
    type: Number,
  }],
  secondaryMuscleIds: [{
    type: Number,
  }],
  equipment: {
    type: String,
    required: [true, 'Please add equipment category'],
    enum: ['barbell', 'dumbbell', 'bodyweight', 'machine', 'band', 'cable', 'none'],
  },
  mode: {
    type: String,
    required: true,
    enum: ['gym', 'home', 'both'],
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'athlete'],
  },
  imageUrl: {
    type: String,
  },
  imageUrlSecondary: {
    type: String,
  },
  youtubeVideoId: {
    type: String,
  },
  youtubeCachedAt: {
    type: Date,
  },
  wgerCategoryId: {
    type: Number,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Exercise', ExerciseSchema);
