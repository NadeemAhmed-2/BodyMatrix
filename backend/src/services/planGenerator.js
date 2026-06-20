const Exercise = require('../models/Exercise');

const LEVEL_CONFIG = {
  beginner: { sets: 2, reps: 15, rest: 90, exercisesPerSession: 5, warmupSets: 1 },
  intermediate: { sets: 3, reps: 12, rest: 75, exercisesPerSession: 6, warmupSets: 1 },
  advanced: { sets: 4, reps: 8, rest: 60, exercisesPerSession: 7, warmupSets: 2 },
  athlete: { sets: 5, reps: 5, rest: 45, exercisesPerSession: 8, warmupSets: 2 },
};

const applyAgeAdjustments = (config, age) => {
  const newConfig = { ...config };
  if (age < 18) {
    newConfig.sets = Math.max(newConfig.sets - 1, 2);
    newConfig.reps = Math.min(newConfig.reps + 3, 18);
    newConfig.rest += 15;
  }
  if (age > 50) {
    newConfig.rest += 30;
    newConfig.exercisesPerSession = Math.max(newConfig.exercisesPerSession - 1, 4);
  }
  return newConfig;
};

// Map muscle categories to front/back zones
const UPPER_BODY_MUSCLES = ['chest', 'shoulders', 'biceps', 'triceps', 'back'];
const LOWER_BODY_MUSCLES = ['legs', 'core'];

const generatePlan = async ({ userId, goal, mode, level, age, muscleGroups }) => {
  // 1. Get base level configurations and apply age adjustments
  const baseConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG.intermediate;
  const adjustedConfig = applyAgeAdjustments(baseConfig, age);

  const schedule = [];
  let splitType = '';

  // Determine split type and weekly structure
  const hasFullBody = muscleGroups.includes('full_body');
  const count = muscleGroups.length;

  if (hasFullBody || count <= 2) {
    splitType = '3-Day Full Body Split';
    // Mon, Wed, Fri
    const days = [
      { num: 1, name: 'Monday' },
      { num: 3, name: 'Wednesday' },
      { num: 5, name: 'Friday' }
    ];

    for (const d of days) {
      schedule.push({
        dayNumber: d.num,
        dayName: d.name,
        type: 'Full Body',
        warmupNote: '5-10 min light cardio warm-up followed by dynamic stretches.',
        cooldownNote: '5-10 min static stretching targeting the muscles trained today.',
        exercises: []
      });
    }
  } else if (count >= 3 && count <= 4) {
    splitType = 'Upper / Lower Split';
    // Day 1 (Mon): Upper Body
    // Day 2 (Wed): Lower Body
    // Day 3 (Fri): Upper Body
    // Day 4 (Sat): Lower Body
    const days = [
      { num: 1, name: 'Monday', type: 'Upper Body' },
      { num: 3, name: 'Wednesday', type: 'Lower Body' },
      { num: 5, name: 'Friday', type: 'Upper Body' },
      { num: 6, name: 'Saturday', type: 'Lower Body' }
    ];

    for (const d of days) {
      schedule.push({
        dayNumber: d.num,
        dayName: d.name,
        type: d.type,
        warmupNote: '5-10 min warm-up (upper body rotations or light jogging).',
        cooldownNote: '5-10 min targeted static stretching.',
        exercises: []
      });
    }
  } else {
    splitType = 'Push / Pull / Legs (PPL) Split';
    // Day 1 (Mon): Push (chest, shoulders, triceps)
    // Day 2 (Tue): Pull (back, biceps)
    // Day 3 (Thu): Legs (legs, core)
    // Day 4 (Fri): Push
    // Day 5 (Sat): Pull
    const days = [
      { num: 1, name: 'Monday', type: 'Push (Chest/Shoulders/Triceps)' },
      { num: 2, name: 'Tuesday', type: 'Pull (Back/Biceps)' },
      { num: 4, name: 'Thursday', type: 'Legs & Core' },
      { num: 5, name: 'Friday', type: 'Push (Chest/Shoulders/Triceps)' },
      { num: 6, name: 'Saturday', type: 'Pull (Back/Biceps)' }
    ];

    for (const d of days) {
      schedule.push({
        dayNumber: d.num,
        dayName: d.name,
        type: d.type,
        warmupNote: '5 min dynamic warm-up corresponding to the day type.',
        cooldownNote: '5-10 min foam rolling or deep static stretching.',
        exercises: []
      });
    }
  }

  // Populate rest days for the remaining days of the week (1-7)
  const activeDaysNumbers = schedule.map(s => s.dayNumber);
  const weekdayNames = {
    1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday'
  };

  for (let i = 1; i <= 7; i++) {
    if (!activeDaysNumbers.includes(i)) {
      schedule.push({
        dayNumber: i,
        dayName: weekdayNames[i],
        type: 'Rest Day',
        warmupNote: 'Active recovery (optional light walking or stretching).',
        cooldownNote: 'Rest and repair.',
        exercises: []
      });
    }
  }

  // Sort schedule by dayNumber (1 = Mon, 7 = Sun)
  schedule.sort((a, b) => a.dayNumber - b.dayNumber);

  // Retrieve exercises from DB and assign them to active days
  for (const day of schedule) {
    if (day.type === 'Rest Day') continue;

    // Determine target muscles for this specific day based on the split type
    let targetMuscles = [];
    if (splitType === '3-Day Full Body Split') {
      targetMuscles = muscleGroups.filter(m => m !== 'cardio' && m !== 'flexibility');
      // If only cardio/flexibility were selected, fallback to full list
      if (targetMuscles.length === 0) {
        targetMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core'];
      }
    } else if (splitType === 'Upper / Lower Split') {
      if (day.type === 'Upper Body') {
        targetMuscles = muscleGroups.filter(m => UPPER_BODY_MUSCLES.includes(m));
        if (targetMuscles.length === 0) targetMuscles = UPPER_BODY_MUSCLES;
      } else {
        targetMuscles = muscleGroups.filter(m => LOWER_BODY_MUSCLES.includes(m));
        if (targetMuscles.length === 0) targetMuscles = LOWER_BODY_MUSCLES;
      }
    } else {
      // PPL split
      if (day.type.includes('Push')) {
        targetMuscles = muscleGroups.filter(m => ['chest', 'shoulders', 'triceps'].includes(m));
        if (targetMuscles.length === 0) targetMuscles = ['chest', 'shoulders', 'triceps'];
      } else if (day.type.includes('Pull')) {
        targetMuscles = muscleGroups.filter(m => ['back', 'biceps'].includes(m));
        if (targetMuscles.length === 0) targetMuscles = ['back', 'biceps'];
      } else {
        // Legs & Core
        targetMuscles = muscleGroups.filter(m => ['legs', 'core'].includes(m));
        if (targetMuscles.length === 0) targetMuscles = ['legs', 'core'];
      }
    }

    // Query DB for candidate exercises
    // Match equipment mode: mode === 'both' OR mode === user mode ('home' or 'gym')
    let candidates = await Exercise.find({
      muscleGroup: { $in: targetMuscles },
      mode: { $in: ['both', mode] }
    });

    // Fallback if candidates is empty (e.g. no exact matching equipment/muscles in DB)
    if (candidates.length === 0) {
      candidates = await Exercise.find({
        muscleGroup: { $in: targetMuscles }
      });
    }

    // Fallback to any exercise if still empty
    if (candidates.length === 0) {
      candidates = await Exercise.find({});
    }

    // Sort/filter candidates to prioritize matching difficulty, but allow fallbacks
    let matchingCandidates = candidates.filter(ex => ex.difficulty === level);
    if (matchingCandidates.length < adjustedConfig.exercisesPerSession) {
      // Merge all candidates if matching difficulty is not enough
      matchingCandidates = candidates;
    }

    // Shuffle and pick target count
    const shuffled = matchingCandidates.sort(() => 0.5 - Math.random());
    const selectedExercises = shuffled.slice(0, adjustedConfig.exercisesPerSession);

    // Map selected exercises to the plan schema structure
    day.exercises = selectedExercises.map((ex, index) => {
      // Flexibilty exercises: 0 reps, duration-based (e.g., 30s)
      const isFlexibility = ex.muscleGroup === 'flexibility';
      return {
        exercise: ex._id,
        sets: isFlexibility ? 1 : adjustedConfig.sets,
        reps: isFlexibility ? 0 : adjustedConfig.reps,
        durationSec: isFlexibility ? 30 : null,
        restSec: isFlexibility ? 15 : adjustedConfig.rest,
        orderIndex: index + 1
      };
    });

    // If goal is weight loss, append 1 cardio exercise to every active session
    if (goal === 'weight_loss') {
      let cardioCandidates = await Exercise.find({ muscleGroup: 'cardio' });
      if (cardioCandidates.length > 0) {
        const randomCardio = cardioCandidates[Math.floor(Math.random() * cardioCandidates.length)];
        day.exercises.push({
          exercise: randomCardio._id,
          sets: 1,
          reps: 0,
          durationSec: 600, // 10 minutes cardio
          restSec: 60,
          orderIndex: day.exercises.length + 1
        });
      }
    }
  }

  return {
    goal,
    mode,
    level,
    age,
    muscleGroups,
    schedule,
    notes: `Generated weekly ${splitType} plan with age-adjusted loading protocols.`
  };
};

module.exports = { generatePlan };
