const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutLog = require('../models/WorkoutLog');
const { generatePlan } = require('../services/planGenerator');
const { getYoutubeVideoId } = require('../services/youtubeService');

async function fetchExerciseImage(exerciseName) {
  const query = encodeURIComponent(`${exerciseName} exercise workout`);
  
  if (process.env.UNSPLASH_ACCESS_KEY) {
    try {
      const response = await axios.get(`https://api.unsplash.com/search/photos?query=${query}&per_page=1`, {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        },
        timeout: 3000
      });
      if (response.data && response.data.results && response.data.results.length > 0) {
        return response.data.results[0].urls.regular;
      }
    } catch (err) {
      console.error(`Unsplash image fetch failed for exercise ${exerciseName}:`, err.message);
    }
  }

  if (process.env.PEXELS_API_KEY) {
    try {
      const response = await axios.get(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
        headers: {
          Authorization: process.env.PEXELS_API_KEY
        },
        timeout: 3000
      });
      if (response.data && response.data.photos && response.data.photos.length > 0) {
        return response.data.photos[0].src.medium;
      }
    } catch (err) {
      console.error(`Pexels image fetch failed for exercise ${exerciseName}:`, err.message);
    }
  }

  return null;
}

async function backfillExerciseImages(exercises) {
  if (!exercises || !Array.isArray(exercises)) return;

  const promises = exercises.map(async (ex) => {
    const doc = ex.exercise ? ex.exercise : ex;
    if (!doc || doc.imageUrl) return;

    const img = await fetchExerciseImage(doc.name);
    if (img) {
      doc.imageUrl = img;
      try {
        if (typeof doc.save === 'function') {
          await doc.save();
        } else {
          await Exercise.findByIdAndUpdate(doc._id, { imageUrl: img });
        }
        console.log(`Backfilled image for exercise: ${doc.name}`);
      } catch (saveErr) {
        console.error(`Failed to save backfilled image for ${doc.name}:`, saveErr.message);
      }
    }
  });

  await Promise.all(promises);
}

// @desc    Generate a new workout plan
// @route   POST /api/workout/generate
// @access  Private
router.post('/generate', protect, async (req, res) => {
  try {
    const { 
      muscleGroups, muscle_groups,
      mode, 
      level, 
      age, 
      goal 
    } = req.body;

    const finalMuscleGroups = muscleGroups || muscle_groups;

    if (!finalMuscleGroups || !Array.isArray(finalMuscleGroups) || finalMuscleGroups.length === 0) {
      return res.status(400).json({ success: false, error: 'Please select at least one muscle group.' });
    }

    if (!mode || !['home', 'gym'].includes(mode)) {
      return res.status(400).json({ success: false, error: 'Please select a valid mode: home or gym.' });
    }

    if (!level || !['beginner', 'intermediate', 'advanced', 'athlete'].includes(level)) {
      return res.status(400).json({ success: false, error: 'Please select a valid fitness level.' });
    }

    if (!age || isNaN(age)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid age.' });
    }

    if (!goal || !['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness'].includes(goal)) {
      return res.status(400).json({ success: false, error: 'Please select a valid fitness goal.' });
    }

    // Call generating service
    const rawPlan = await generatePlan({
      userId: req.user._id,
      goal,
      mode,
      level,
      age: parseInt(age),
      muscleGroups: finalMuscleGroups
    });

    // Save plan to MongoDB
    const plan = new WorkoutPlan({
      userId: req.user._id,
      ...rawPlan
    });

    await plan.save();

    // Populate exercise details before returning
    const populatedPlan = await WorkoutPlan.findById(plan._id)
      .populate('schedule.exercises.exercise');

    // Extract and backfill any missing exercise images
    const exercisesToFill = [];
    for (const day of populatedPlan.schedule) {
      for (const exObj of day.exercises) {
        if (exObj.exercise) {
          exercisesToFill.push(exObj.exercise);
        }
      }
    }
    await backfillExerciseImages(exercisesToFill);

    return res.status(201).json({
      success: true,
      message: 'Workout plan generated and loaded.',
      plan: populatedPlan
    });

  } catch (error) {
    console.error('[Workout Generate Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get live preview of exercises for an SVG muscle tap
// @route   GET /api/workout/exercises/preview
// @access  Public (or Private)
router.get('/preview', async (req, res) => {
  try {
    const muscle = req.query.muscle;
    const mode = req.query.mode || 'gym';
    const limit = parseInt(req.query.limit) || 5;

    if (!muscle) {
      return res.status(400).json({ success: false, error: 'Muscle parameter is required.' });
    }

    // Query candidate exercises using aggregate sample for randomization
    let exercises = await Exercise.aggregate([
      { $match: { muscleGroup: muscle, mode: { $in: ['both', mode] } } },
      { $sample: { size: limit } }
    ]);

    // Fallback if no items match
    if (exercises.length === 0) {
      exercises = await Exercise.aggregate([
        { $match: { muscleGroup: muscle } },
        { $sample: { size: limit } }
      ]);
    }

    await backfillExerciseImages(exercises);

    // If still empty, return empty list
    return res.json({
      success: true,
      count: exercises.length,
      exercises
    });

  } catch (error) {
    console.error('[Exercise Preview Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Lazy-load/Fetch YouTube video for exercise
// @route   GET /api/workout/exercises/:id/video
// @access  Private
router.get('/exercises/:id/video', protect, async (req, res) => {
  try {
    const exerciseId = req.params.id;
    const result = await getYoutubeVideoId(exerciseId);
    
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[Exercise Video Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Log a completed set/exercise with Progressive Overload logic
// @route   POST /api/workout/log
// @access  Private
router.post('/log', protect, async (req, res) => {
  try {
    const { 
      planId, plan_id,
      exerciseId, exercise_id,
      setsDone, sets_done,
      repsDone, reps_done,
      weightKg, weight_kg,
      durationSec, duration_sec,
      notes 
    } = req.body;

    const finalPlanId = planId || plan_id;
    const finalExerciseId = exerciseId || exercise_id;
    const finalSetsDone = setsDone !== undefined ? setsDone : sets_done;
    const finalRepsDone = repsDone !== undefined ? repsDone : reps_done;
    const finalWeightKg = weightKg !== undefined ? weightKg : weight_kg;
    const finalDurationSec = durationSec !== undefined ? durationSec : duration_sec;

    if (!finalExerciseId) {
      return res.status(400).json({ success: false, error: 'Exercise ID is required.' });
    }

    // Lookup mongoose ObjectId of exercise
    const exerciseRef = await Exercise.findById(finalExerciseId);
    if (!exerciseRef) {
      return res.status(404).json({ success: false, error: 'Exercise not found.' });
    }

    // Save Workout Log
    const log = new WorkoutLog({
      userId: req.user._id,
      planId: finalPlanId || null,
      exerciseId: exerciseRef._id,
      setsDone: finalSetsDone || 0,
      repsDone: finalRepsDone || 0,
      weightKg: finalWeightKg || 0,
      durationSec: finalDurationSec || 0,
      notes: notes || ''
    });

    await log.save();

    let progressiveOverloadTriggered = false;
    let overloadMessage = '';

    // --- Progressive Overload Logic ---
    if (finalPlanId) {
      const plan = await WorkoutPlan.findById(finalPlanId);
      if (plan) {
        // 1. Fetch recent 2 logs for this user and this exercise
        const recentLogs = await WorkoutLog.find({
          userId: req.user._id,
          exerciseId: exerciseRef._id
        }).sort({ loggedAt: -1 }).limit(2);

        // 2. Locate target reps/sets in the plan schedule
        let targetExercise = null;
        for (const day of plan.schedule) {
          targetExercise = day.exercises.find(e => e.exercise.toString() === exerciseRef._id.toString());
          if (targetExercise) break;
        }

        if (targetExercise && recentLogs.length === 2) {
          const targetReps = targetExercise.reps;
          
          // Check if BOTH recent logs meet or exceed plan target reps
          const overloaded = recentLogs.every(l => l.repsDone >= targetReps);
          
          if (overloaded) {
            // Apply Progression
            if (targetExercise.reps < 20) {
              targetExercise.reps += 2;
              overloadMessage = `Progressive overload triggered! Rep targets increased to ${targetExercise.reps}.`;
            } else {
              targetExercise.sets += 1;
              targetExercise.reps = 10;
              overloadMessage = `Progressive overload triggered! Sets increased to ${targetExercise.sets} and reps reset to 10.`;
            }
            
            await plan.save();
            progressiveOverloadTriggered = true;
          } else if (recentLogs[0].repsDone < targetReps * 0.7) {
            overloadMessage = 'Same targets next session — take your time.';
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Workout logged successfully.',
      log,
      progressiveOverloadTriggered,
      overloadMessage
    });

  } catch (error) {
    console.error('[Workout Log Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    List all workout plans for authenticated user
// @route   GET /api/workout/plans
// @access  Private
router.get('/plans', protect, async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('schedule.exercises.exercise');

    const exercisesToFill = [];
    for (const plan of plans) {
      for (const day of plan.schedule) {
        for (const exObj of day.exercises) {
          if (exObj.exercise) {
            exercisesToFill.push(exObj.exercise);
          }
        }
      }
    }
    await backfillExerciseImages(exercisesToFill);

    return res.json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    console.error('[Workout Plans Fetch Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get the latest active workout plan
// @route   GET /api/workout/active
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('schedule.exercises.exercise');

    if (!plan) {
      return res.json({
        success: false,
        message: 'No active workout plan found.'
      });
    }

    const exercisesToFill = [];
    for (const day of plan.schedule) {
      for (const exObj of day.exercises) {
        if (exObj.exercise) {
          exercisesToFill.push(exObj.exercise);
        }
      }
    }
    await backfillExerciseImages(exercisesToFill);

    return res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('[Workout Active Plan Fetch Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
