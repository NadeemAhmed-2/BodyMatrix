const axios = require('axios');
const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');

// Premium mock video ID bank mapped by muscle group
const MOCK_VIDEOS = {
  chest: 'vthMCtgB86w', // Bench Press Tutorial
  back: 'eGo4IYlbE5g', // Lat Pulldown Tutorial
  legs: 'U3HlEV_sPk8', // Squat Tutorial
  shoulders: 'B-aVuy51BO0', // Shoulder Press Tutorial
  core: 'Xyd_fa5zoEU', // Plank Tutorial
  biceps: 'ykJgrb560_Q', // Bicep Curl Tutorial
  triceps: '6kALZHtoS9Y', // Triceps Pushdown Tutorial
  cardio: '1Tq3yZ_v0LI', // HIIT Cardio Tutorial
  flexibility: 'g_tea8ZNk5A', // Downward Dog Stretch Tutorial
  full_body: 'vthMCtgB86w' // Bench Press / Compound Tutorial
};

const getYoutubeVideoId = async (exerciseId) => {
  try {
    let exercise;
    if (mongoose.Types.ObjectId.isValid(exerciseId)) {
      exercise = await Exercise.findById(exerciseId);
    } else {
      const numericId = parseInt(exerciseId);
      if (!isNaN(numericId)) {
        exercise = await Exercise.findOne({ id: numericId });
      }
    }

    if (!exercise) {
      throw new Error('Exercise not found');
    }

    // 1. Return cached video ID if present
    if (exercise.youtubeVideoId) {
      return {
        videoId: exercise.youtubeVideoId,
        embedUrl: `https://www.youtube.com/embed/${exercise.youtubeVideoId}?autoplay=0&rel=0&modestbranding=1`,
        fromCache: true
      };
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    // 2. If no YouTube API Key is set, fall back to muscle-group specific mock video
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_google_youtube_v3_key') {
      console.log(`[YouTube] Missing or default YOUTUBE_API_KEY. Using mock fallback for ${exercise.name}`);
      const fallbackId = MOCK_VIDEOS[exercise.muscleGroup] || MOCK_VIDEOS.full_body;
      
      // Cache the mock fallback to prevent repeated warnings
      exercise.youtubeVideoId = fallbackId;
      exercise.youtubeCachedAt = new Date();
      await exercise.save();

      return {
        videoId: fallbackId,
        embedUrl: `https://www.youtube.com/embed/${fallbackId}?autoplay=0&rel=0&modestbranding=1`,
        fromCache: false
      };
    }

    // 3. Search YouTube Data API v3 targeting specific channels and shorts
    console.log(`[YouTube] Querying live YouTube API for: ${exercise.name}`);
    let videoId = null;

    // Search Stage 1: Fitonomy Coaching Shorts
    try {
      console.log(`[YouTube] Stage 1 Search: Fitonomy Coaching`);
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: `${exercise.name} @fitonomycoaching shorts`,
          type: 'video',
          videoDuration: 'short',
          order: 'viewCount',
          maxResults: 1,
          key: apiKey
        },
        timeout: 3000
      });
      if (response.data && response.data.items && response.data.items.length > 0) {
        videoId = response.data.items[0].id.videoId;
        console.log(`[YouTube] Found video on Fitonomy: ${videoId}`);
      }
    } catch (err) {
      console.warn(`[YouTube] Fitonomy Stage 1 failed: ${err.message}`);
    }

    // Search Stage 2: Official Demic Shorts
    if (!videoId) {
      try {
        console.log(`[YouTube] Stage 2 Search: Official Demic`);
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: `${exercise.name} @officialdemic shorts`,
            type: 'video',
            videoDuration: 'short',
            order: 'viewCount',
            maxResults: 1,
            key: apiKey
          },
          timeout: 3000
        });
        if (response.data && response.data.items && response.data.items.length > 0) {
          videoId = response.data.items[0].id.videoId;
          console.log(`[YouTube] Found video on Demic: ${videoId}`);
        }
      } catch (err) {
        console.warn(`[YouTube] Demic Stage 2 failed: ${err.message}`);
      }
    }

    // Search Stage 3: General Highest Viewed Shorts
    if (!videoId) {
      try {
        console.log(`[YouTube] Stage 3 Search: General Shorts`);
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: `${exercise.name} shorts`,
            type: 'video',
            videoDuration: 'short',
            order: 'viewCount',
            maxResults: 1,
            key: apiKey
          },
          timeout: 3000
        });
        if (response.data && response.data.items && response.data.items.length > 0) {
          videoId = response.data.items[0].id.videoId;
          console.log(`[YouTube] Found general shorts video: ${videoId}`);
        }
      } catch (err) {
        console.warn(`[YouTube] General Shorts Stage 3 failed: ${err.message}`);
      }
    }

    // Search Stage 4: General Exercise Tutorial (Fallback)
    if (!videoId) {
      try {
        console.log(`[YouTube] Stage 4 Search: General Tutorial Fallback`);
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: `${exercise.name} exercise tutorial proper form`,
            type: 'video',
            maxResults: 1,
            key: apiKey
          },
          timeout: 3000
        });
        if (response.data && response.data.items && response.data.items.length > 0) {
          videoId = response.data.items[0].id.videoId;
          console.log(`[YouTube] Found general tutorial fallback: ${videoId}`);
        }
      } catch (err) {
        console.warn(`[YouTube] Stage 4 fallback failed: ${err.message}`);
      }
    }

    // If search yielded no results, use mock bank as a safe fallback
    if (!videoId) {
      videoId = MOCK_VIDEOS[exercise.muscleGroup] || MOCK_VIDEOS.full_body;
    }

    // 4. Cache and update exercise document
    exercise.youtubeVideoId = videoId;
    exercise.youtubeCachedAt = new Date();
    await exercise.save();

    return {
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`,
      fromCache: false
    };

  } catch (error) {
    console.error('[YouTube] Caching service error:', error.message);
    // Safe graceful recovery in case of API failure (network error, quota limit, etc.)
    try {
      const exercise = await Exercise.findById(exerciseId);
      if (exercise) {
        const fallbackId = MOCK_VIDEOS[exercise.muscleGroup] || MOCK_VIDEOS.full_body;
        return {
          videoId: fallbackId,
          embedUrl: `https://www.youtube.com/embed/${fallbackId}?autoplay=0&rel=0&modestbranding=1`,
          fromCache: false
        };
      }
    } catch (_) {}
    
    // Final absolute fallback
    return {
      videoId: 'vthMCtgB86w',
      embedUrl: 'https://www.youtube.com/embed/vthMCtgB86w?autoplay=0&rel=0&modestbranding=1',
      fromCache: false
    };
  }
};

module.exports = { getYoutubeVideoId };
