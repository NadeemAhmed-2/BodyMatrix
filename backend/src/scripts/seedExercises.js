require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Exercise = require('../models/Exercise');

// wger category ID -> our muscle_group mapping
const mapCategoryToMuscleGroup = (categoryId, musclesList) => {
  const catId = Number(categoryId);
  switch (catId) {
    case 10:
      return 'core';
    case 8: // Arms category -> check muscles
      if (Array.isArray(musclesList)) {
        const hasTriceps = musclesList.some(m => Number(m.id) === 5);
        const hasBiceps = musclesList.some(m => [1, 14].includes(Number(m.id)));
        if (hasTriceps) return 'triceps';
        if (hasBiceps) return 'biceps';
      }
      return 'biceps'; // fallback
    case 12:
      return 'back';
    case 14:
      return 'legs'; // calves
    case 15:
      return 'chest';
    case 11:
      return 'legs';
    case 13:
      return 'shoulders';
    default:
      return 'full_body';
  }
};

// wger equipment ID -> our equipment value
const mapEquipment = (equipmentList) => {
  if (!Array.isArray(equipmentList) || equipmentList.length === 0) {
    return 'bodyweight'; // empty = bodyweight
  }
  const mainEqId = Number(equipmentList[0].id);
  switch (mainEqId) {
    case 1:
    case 2:
    case 7:
      return 'barbell';
    case 3:
    case 9:
      return 'dumbbell';
    case 10:
    case 4:
    case 6:
      return 'bodyweight';
    case 8:
      return 'band';
    case 11:
      return 'cable';
    case 12:
      return 'machine';
    default:
      return 'none';
  }
};

// Derive mode from equipment
const deriveMode = (equipment) => {
  if (['bodyweight', 'band', 'none'].includes(equipment)) {
    return 'both';
  }
  if (equipment === 'dumbbell') {
    return 'both';
  }
  if (['barbell', 'cable', 'machine'].includes(equipment)) {
    return 'gym';
  }
  return 'both';
};

// Assign difficulty
const assignDifficulty = (equipment, categoryId) => {
  const catId = Number(categoryId);
  if (equipment === 'barbell' && [12, 11].includes(catId)) {
    return 'advanced'; // barbell back/legs compound
  }
  if (equipment === 'barbell' && catId === 15) {
    return 'advanced'; // bench press
  }
  if (['cable', 'machine'].includes(equipment)) {
    return 'intermediate';
  }
  if (equipment === 'bodyweight' && catId === 10) {
    return 'beginner'; // bodyweight abs
  }
  if (equipment === 'bodyweight') {
    return 'intermediate';
  }
  if (equipment === 'dumbbell') {
    return 'intermediate';
  }
  if (equipment === 'band') {
    return 'beginner';
  }
  return 'intermediate';
};

// Strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const manualExercises = [
  // CARDIO
  {
    id: 90001, name: 'Outdoor run', muscleGroup: 'cardio',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Steady-state running outdoors. Great for cardiovascular endurance.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  {
    id: 90002, name: 'Jump rope', muscleGroup: 'cardio',
    equipment: 'band', mode: 'both', difficulty: 'beginner',
    description: 'Skipping with a jump rope. Burns high calories in short time.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  {
    id: 90003, name: 'Burpees', muscleGroup: 'cardio',
    equipment: 'bodyweight', mode: 'both', difficulty: 'intermediate',
    description: 'Full body explosive movement combining squat, plank, push-up, and jump.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  {
    id: 90004, name: 'Cycling (stationary)', muscleGroup: 'cardio',
    equipment: 'machine', mode: 'gym', difficulty: 'beginner',
    description: 'Low-impact cardio on a stationary bike. Suitable for all fitness levels.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  {
    id: 90005, name: 'High knees', muscleGroup: 'cardio',
    equipment: 'bodyweight', mode: 'both', difficulty: 'beginner',
    description: 'Run in place bringing knees up to hip height. Great warm-up exercise.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  // FLEXIBILITY / YOGA
  {
    id: 90010, name: 'Downward dog', muscleGroup: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Yoga pose that stretches hamstrings, calves, and spine. Hold 30 seconds.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  {
    id: 90011, name: 'Warrior I', muscleGroup: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Standing yoga pose that stretches hip flexors and strengthens legs.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  {
    id: 90012, name: 'Hip flexor stretch', muscleGroup: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Kneeling stretch targeting hip flexors. Hold 30 seconds each side.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  {
    id: 90013, name: 'Cat-cow stretch', muscleGroup: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Spinal mobilisation on hands and knees. Repeat 10 slow cycles.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  {
    id: 90014, name: 'Child\'s pose', muscleGroup: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Resting yoga pose that releases lower back and hip tension. Hold 60 seconds.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
  {
    id: 90015, name: 'Seated hamstring stretch', muscleGroup: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Sit on floor, legs extended, reach for toes. Hold 30 seconds.',
    primaryMuscleIds: [], secondaryMuscleIds: [], imageUrl: null
  },
];

const seedExercises = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness';
    console.log(`[SEED] Connecting to Database...`);
    await mongoose.connect(mongoUri);
    console.log('[SEED] Connected to MongoDB.');

    let offset = 0;
    const limit = 100;
    let keepFetching = true;
    let seededCount = 0;

    console.log('[SEED] Beginning exercises fetch from wger API...');

    while (keepFetching) {
      const url = `https://wger.de/api/v2/exercise/?format=json&language=2&status=2&limit=${limit}&offset=${offset}`;
      console.log(`[SEED] Fetching exercises batch at offset ${offset}...`);
      const response = await axios.get(url);

      if (!response.data || !response.data.results || response.data.results.length === 0) {
        keepFetching = false;
        break;
      }

      const results = response.data.results;
      console.log(`[SEED] Received ${results.length} exercises. Extracting detail info...`);

      for (const exercise of results) {
        try {
          // Add delay to prevent hitting wger rate limit
          await delay(200);

          const detailUrl = `https://wger.de/api/v2/exerciseinfo/${exercise.id}/?format=json`;
          const detailRes = await axios.get(detailUrl);
          const detail = detailRes.data;

          if (!detail) continue;

          // Find the translation object for English (language 2)
          const enTranslation = detail.translations && detail.translations.find(t => Number(t.language) === 2);
          
          if (!enTranslation || !enTranslation.name) {
            // Skip if no English translation
            continue;
          }

          const name = enTranslation.name;
          const description = stripHtml(enTranslation.description);
          const muscleGroup = mapCategoryToMuscleGroup(detail.category.id, detail.muscles);
          const equipment = mapEquipment(detail.equipment);
          const mode = deriveMode(equipment);
          const difficulty = assignDifficulty(equipment, detail.category.id);

          // Get image URLs
          let imageUrl = null;
          let imageUrlSecondary = null;

          if (Array.isArray(detail.images) && detail.images.length > 0) {
            const mainImg = detail.images.find(img => img.is_main === true) || detail.images[0];
            if (mainImg && mainImg.image) {
              imageUrl = mainImg.image.startsWith('http') ? mainImg.image : `https://wger.de${mainImg.image}`;
            }
            
            const secondaryImg = detail.images.find(img => img.is_main === false);
            if (secondaryImg && secondaryImg.image) {
              imageUrlSecondary = secondaryImg.image.startsWith('http') ? secondaryImg.image : `https://wger.de${secondaryImg.image}`;
            }
          }

          const primaryMuscleIds = detail.muscles ? detail.muscles.map(m => Number(m.id)) : [];
          const secondaryMuscleIds = detail.muscles_secondary ? detail.muscles_secondary.map(m => Number(m.id)) : [];

          // Upsert exercise
          await Exercise.findOneAndUpdate(
            { id: detail.id },
            {
              id: detail.id,
              uuid: detail.uuid,
              name,
              description,
              muscleGroup,
              primaryMuscleIds,
              secondaryMuscleIds,
              equipment,
              mode,
              difficulty,
              imageUrl,
              imageUrlSecondary,
              wgerCategoryId: detail.category.id
            },
            { upsert: true, new: true }
          );

          seededCount++;
          if (seededCount % 50 === 0) {
            console.log(`[SEED] Seeded ${seededCount} exercises so far...`);
          }
        } catch (detailErr) {
          console.error(`[SEED] Error processing exercise ID ${exercise.id}:`, detailErr.message);
        }
      }

      offset += limit;
      // Safety limit of offset to prevent infinite loop just in case
      if (offset > 1500) {
        keepFetching = false;
      }
    }

    console.log(`[SEED] Finished wger imports. Inserting manual gap-fill exercises...`);
    for (const manualEx of manualExercises) {
      await Exercise.findOneAndUpdate(
        { id: manualEx.id },
        manualEx,
        { upsert: true }
      );
    }
    console.log(`[SEED] Seeding completed successfully. Total exercises in DB: ${seededCount + manualExercises.length}`);

    await mongoose.connection.close();
    console.log('[SEED] Database connection closed.');
  } catch (error) {
    console.error('[SEED] Fatal error seeding database:', error.message);
    process.exit(1);
  }
};

seedExercises();
