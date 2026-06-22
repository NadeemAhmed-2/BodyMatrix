const axios = require('axios');
const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');

// Premium mock video ID bank mapped by muscle group
const MOCK_VIDEOS = {
  chest: 'rT7DgCr-3pg',       // Bench Press Tutorial (Jeff Nippard)
  back: 'eGo4IYlbE5g',        // Lat Pulldown Tutorial (ScottHerman)
  legs: 'bEv6CCg2BC8',        // Squat Tutorial (Squat University)
  shoulders: 'qEwKCR5JCog',   // Overhead Press Tutorial (Jeff Nippard)
  core: 'ASdvN_XEl_c',        // Plank Tutorial (Athlean-X)
  biceps: 'kwG2ipFRgFo',      // Bicep Curl Tutorial (ScottHerman)
  triceps: '2-LAMcpzODU',     // Triceps Pushdown Tutorial (ScottHerman)
  cardio: 'ml6cT4AZdqI',      // HIIT Cardio (MadFit)
  flexibility: 'g_tea8ZNk5A',  // Downward Dog Stretch Tutorial
  full_body: 'UItWltVZZmE'     // Full Body Compound Tutorial (Jeff Nippard)
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
        embedUrl: `https://www.youtube-nocookie.com/embed/${exercise.youtubeVideoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`,
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
        embedUrl: `https://www.youtube-nocookie.com/embed/${fallbackId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`,
        fromCache: false
      };
    }

    // 3. Search YouTube Data API v3 targeting specific channels and shorts
    console.log(`[YouTube] Querying live YouTube API for: ${exercise.name}`);
    let videoId = null;

    // Stage 1: Fitonomy Coaching — exact exercise name
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: `${exercise.name} exercise tutorial @fitonomycoaching`,
          type: 'video',
          videoDuration: 'short',
          order: 'relevance',
          maxResults: 1,
          key: apiKey
        },
        timeout: 3000
      });
      if (response.data?.items?.length > 0) {
        videoId = response.data.items[0].id.videoId;
      }
    } catch (err) {
      console.warn(`[YouTube] Stage 1 failed: ${err.message}`);
    }

    // Stage 2: Official Demic — exact exercise name
    if (!videoId) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: `${exercise.name} exercise tutorial @officialdemic`,
            type: 'video',
            videoDuration: 'short',
            order: 'relevance',
            maxResults: 1,
            key: apiKey
          },
          timeout: 3000
        });
        if (response.data?.items?.length > 0) {
          videoId = response.data.items[0].id.videoId;
        }
      } catch (err) {
        console.warn(`[YouTube] Stage 2 failed: ${err.message}`);
      }
    }

    // Stage 3: Athlean-X — known for proper form tutorials
    if (!videoId) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: `${exercise.name} proper form @athleanx`,
            type: 'video',
            order: 'relevance',
            maxResults: 1,
            key: apiKey
          },
          timeout: 3000
        });
        if (response.data?.items?.length > 0) {
          videoId = response.data.items[0].id.videoId;
        }
      } catch (err) {
        console.warn(`[YouTube] Stage 3 failed: ${err.message}`);
      }
    }

    // Stage 4: Jeff Nippard — science-based exercise tutorials
    if (!videoId) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: `${exercise.name} how to @jeffnippard`,
            type: 'video',
            order: 'relevance',
            maxResults: 1,
            key: apiKey
          },
          timeout: 3000
        });
        if (response.data?.items?.length > 0) {
          videoId = response.data.items[0].id.videoId;
        }
      } catch (err) {
        console.warn(`[YouTube] Stage 4 failed: ${err.message}`);
      }
    }

    // Stage 5: ScottHermanFitness — covers all muscle groups
    if (!videoId) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: `${exercise.name} tutorial @scotthermanfitness`,
            type: 'video',
            order: 'relevance',
            maxResults: 1,
            key: apiKey
          },
          timeout: 3000
        });
        if (response.data?.items?.length > 0) {
          videoId = response.data.items[0].id.videoId;
        }
      } catch (err) {
        console.warn(`[YouTube] Stage 5 failed: ${err.message}`);
      }
    }

    // Stage 6: General fallback — strict relevance filter using exercise name
    if (!videoId) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: `"${exercise.name}" exercise how to proper form`,
            type: 'video',
            order: 'relevance',
            maxResults: 3,
            key: apiKey
          },
          timeout: 3000
        });
        if (response.data?.items?.length > 0) {
          // Pick the result whose title contains the exercise name for relevance
          const match = response.data.items.find(item =>
            item.snippet.title.toLowerCase().includes(exercise.name.toLowerCase().split(' ')[0])
          );
          videoId = match 
            ? match.id.videoId 
            : response.data.items[0].id.videoId;
        }
      } catch (err) {
        console.warn(`[YouTube] Stage 6 failed: ${err.message}`);
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
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`,
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
          embedUrl: `https://www.youtube-nocookie.com/embed/${fallbackId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`,
          fromCache: false
        };
      }
    } catch (_) {}
    
    // Final absolute fallback
    return {
      videoId: 'vthMCtgB86w',
      embedUrl: 'https://www.youtube-nocookie.com/embed/vthMCtgB86w?autoplay=0&rel=0&modestbranding=1&playsinline=1',
      fromCache: false
    };
  }
};

module.exports = { getYoutubeVideoId };
