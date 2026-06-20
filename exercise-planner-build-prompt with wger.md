# Intelligent Exercise Planner — Master Build Prompt (wger Edition)

> Copy this entire prompt into your AI coding assistant (Cursor, Claude Code, etc.) to scaffold the full feature from scratch.

---

## FEATURE OVERVIEW

Build a complete **Intelligent Exercise Planner** feature for a fitness app. The planner converts user inputs (muscle focus via SVG body selector, fitness level, age, mode) into a personalised workout plan with exercises, sets, reps, rest times, static images, and embedded YouTube videos.

**Key architectural rule:** All exercise data is seeded once from wger into your own database. At runtime your app only queries your own DB — zero external API calls per user request.

---

## TECH STACK


- **External APIs**:
  - wger REST API — `https://wger.de/api/v2/` — free, no auth needed for public endpoints, one-time seed only
  - YouTube Data API v3 — free, cached lazily on first exercise view

---

## WGER API REFERENCE — READ THIS FIRST

All public endpoints need zero authentication. Always append `format=json&language=2` to get English results.

### Key endpoints used in this project

```
# 1. Paginated exercise list (with category/muscle filters)
GET https://wger.de/api/v2/exercise/?format=json&language=2&status=2&limit=100&offset=0

# 2. Full exercise detail in ONE call (use this for seeding — avoids extra round trips)
GET https://wger.de/api/v2/exerciseinfo/{id}/?format=json

# 3. Filter exercises by category ID
GET https://wger.de/api/v2/exercise/?format=json&language=2&status=2&category=10

# 4. Filter exercises by muscle ID
GET https://wger.de/api/v2/exercise/?format=json&language=2&status=2&muscles=1

# 5. Exercise images (static JPG/PNG — not GIFs)
GET https://wger.de/api/v2/exerciseimage/?format=json&exercise={exercise_id}

# 6. Full muscle list
GET https://wger.de/api/v2/muscle/?format=json

# 7. Full category list
GET https://wger.de/api/v2/exercisecategory/?format=json

# 8. Equipment list
GET https://wger.de/api/v2/equipment/?format=json
```

### wger category ID → our muscle_group mapping

```
wger category ID  →  our muscle_group value
─────────────────────────────────────────────
10  (Abs)         →  core
8   (Arms)        →  biceps  (split further using muscles array — see seed script)
12  (Back)        →  back
14  (Calves)      →  legs
15  (Chest)       →  chest
11  (Legs)        →  legs
13  (Shoulders)   →  shoulders
```

### wger muscle ID → our muscle label

```
Muscle ID  →  Name
──────────────────
1   Biceps brachii       → biceps
2   Anterior deltoid     → shoulders
3   Serratus anterior    → chest (secondary)
4   Pectoralis major     → chest
5   Triceps brachii      → triceps
6   Biceps femoris       → legs
7   Rectus abdominis     → core
8   Gastrocnemius        → legs (calves)
10  Gluteus maximus      → legs
11  Hamstrings           → legs
12  Quadriceps           → legs
13  Trapezius            → back
14  Brachialis           → biceps
15  Latissimus dorsi     → back
```

### wger equipment ID → our equipment value

```
Equipment ID  →  our value
──────────────────────────
1   Barbell        → barbell
2   SZ-Bar         → barbell
3   Dumbbell       → dumbbell
4   Gym mat        → none
5   Swiss Ball     → none
6   Pull-up bar    → bodyweight
7   Weight plate   → barbell
8   Resistance band→ band
9   Kettlebell     → dumbbell
10  Body weight    → bodyweight
11  Cable          → cable
12  Machine        → machine
```

### wger exerciseinfo response shape (use this for seeding)

```json
{
  "id": 15,
  "uuid": "...",
  "category": { "id": 15, "name": "Chest" },
  "muscles": [{ "id": 4, "name_en": "Pectoralis major", "is_front": true }],
  "muscles_secondary": [{ "id": 2, "name_en": "Shoulders" }],
  "equipment": [{ "id": 1, "name": "Barbell" }],
  "images": [
    {
      "id": 5,
      "uuid": "...",
      "exercise_base": 15,
      "image": "https://wger.de/media/exercise-images/15/Bench-press_1.jpg",
      "is_main": true
    }
  ],
  "translations": [
    {
      "language": 2,
      "name": "Bench press",
      "description": "<p>Lie on a flat bench...</p>"
    }
  ]
}
```

---

## SECTION 1 — DATABASE SCHEMA

Run these migrations before anything else.

### Table: `exercises`

```sql
CREATE TABLE exercises (
  id                  INTEGER PRIMARY KEY,        -- wger exercise base ID
  uuid                VARCHAR(64) UNIQUE,
  name                VARCHAR(255) NOT NULL,
  description         TEXT,                       -- HTML stripped to plain text
  muscle_group        VARCHAR(64)  NOT NULL,      -- chest|back|shoulders|biceps|triceps|legs|core|cardio|flexibility|full_body
  primary_muscle_ids  INTEGER[],                  -- raw wger muscle IDs
  secondary_muscle_ids INTEGER[],
  equipment           VARCHAR(64)  NOT NULL,      -- barbell|dumbbell|bodyweight|machine|band|cable|none
  mode                VARCHAR(16)  NOT NULL,      -- gym|home|both
  difficulty          VARCHAR(16)  NOT NULL,      -- beginner|intermediate|advanced|athlete
  image_url           TEXT,                       -- main image from wger (JPG/PNG)
  image_url_secondary TEXT,                       -- second image if available
  youtube_video_id    VARCHAR(32),                -- cached lazily on first view
  youtube_cached_at   TIMESTAMPTZ,
  wger_category_id    INTEGER,                    -- raw wger category ID for reference
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercises_muscle     ON exercises(muscle_group);
CREATE INDEX idx_exercises_mode       ON exercises(mode);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
```

### Table: `workout_plans`

```sql
CREATE TABLE workout_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  goal          VARCHAR(64),     -- weight_loss|muscle_gain|endurance|flexibility|general_fitness
  mode          VARCHAR(16),     -- home|gym
  level         VARCHAR(16),     -- beginner|intermediate|advanced|athlete
  age           SMALLINT,
  muscle_groups TEXT[],          -- e.g. ['chest','shoulders','triceps']
  schedule      JSONB,           -- full weekly plan (see Section 4)
  notes         TEXT
);
```

### Table: `plan_exercises`

```sql
CREATE TABLE plan_exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  exercise_id  INTEGER NOT NULL REFERENCES exercises(id),
  day_number   SMALLINT NOT NULL,    -- 1=Monday … 7=Sunday
  order_index  SMALLINT NOT NULL,
  sets         SMALLINT NOT NULL,
  reps         SMALLINT NOT NULL,    -- 0 if duration-based
  duration_sec SMALLINT,             -- for cardio/yoga
  rest_sec     SMALLINT NOT NULL,
  week_number  SMALLINT DEFAULT 1
);
```

### Table: `workout_logs`

```sql
CREATE TABLE workout_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id),
  plan_id      UUID REFERENCES workout_plans(id),
  exercise_id  INTEGER REFERENCES exercises(id),
  logged_at    TIMESTAMPTZ DEFAULT NOW(),
  sets_done    SMALLINT,
  reps_done    SMALLINT,
  weight_kg    NUMERIC(5,2),
  duration_sec SMALLINT,
  notes        TEXT
);
```

---

## SECTION 2 — ONE-TIME SEED SCRIPT

Create `scripts/seedExercises.js`. Run once during setup.

### Step-by-step logic

```
STEP 1 — Fetch all exercises from wger using exerciseinfo endpoint

  For offset = 0, 100, 200, ... until no more results:
    GET https://wger.de/api/v2/exercise/?format=json&language=2&status=2&limit=100&offset={offset}
    
    For each exercise in results:
      GET https://wger.de/api/v2/exerciseinfo/{exercise.id}/?format=json
      → This single call returns category, muscles, equipment, images, translations all at once
    
    Add 200ms delay between exerciseinfo calls to be respectful to wger servers

STEP 2 — Extract English name and description

  Find the translation object where language == 2
  name        = translation.name
  description = strip all HTML tags from translation.description using a regex or library
  
  IF no English translation found → skip this exercise (it's not in English)

STEP 3 — Map category ID to muscle_group

  Use this mapping (category = exerciseinfo.category.id):
  10 → 'core'
  8  → determine from muscles array:
         if any muscle.id in [1,14] → 'biceps'
         if any muscle.id in [5]    → 'triceps'
         else                       → 'biceps'  (fallback for Arms category)
  12 → 'back'
  14 → 'legs'
  15 → 'chest'
  11 → 'legs'
  13 → 'shoulders'
  (unknown) → 'full_body'

STEP 4 — Map equipment IDs to our equipment value

  Take exerciseinfo.equipment array, pick first item's ID:
  [1,2,7]   → 'barbell'
  [3]        → 'dumbbell'
  [9]        → 'dumbbell'
  [10,4,6]   → 'bodyweight'
  [8]        → 'band'
  [11]       → 'cable'
  [12]       → 'machine'
  []         → 'bodyweight'  (empty = no equipment)
  (other)    → 'none'

STEP 5 — Derive mode from equipment

  bodyweight, band, none → 'both'
  dumbbell               → 'both'
  barbell, cable, machine→ 'gym'

STEP 6 — Assign difficulty

  barbell + category in [12, 11] (back/legs compound) → 'advanced'
  barbell + category 15 (chest)                       → 'advanced'
  cable or machine                                    → 'intermediate'
  bodyweight + category 10 (core)                     → 'beginner'
  bodyweight + any other                              → 'intermediate'
  dumbbell                                            → 'intermediate'
  band                                                → 'beginner'
  (default)                                           → 'intermediate'

STEP 7 — Extract image URL

  From exerciseinfo.images array:
  main_image = images.find(img => img.is_main === true)
  IF found → image_url = 'https://wger.de' + main_image.image
             (wger returns relative paths like /media/exercise-images/..., prepend base URL)
  IF main_image.image already starts with 'https' → use as-is
  secondary_image = images.find(img => img.is_main === false) → same logic

STEP 8 — UPSERT into exercises table

  INSERT INTO exercises (id, uuid, name, description, muscle_group, primary_muscle_ids,
    secondary_muscle_ids, equipment, mode, difficulty, image_url, image_url_secondary,
    wger_category_id)
  VALUES (...)
  ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, image_url=EXCLUDED.image_url, ...

STEP 9 — Log progress every 50 exercises
  "Seeded 150 / ~700 exercises..."

STEP 10 — After wger seed, INSERT manual exercises for gaps (cardio + flexibility)
  See manual exercises list below.
```

### Manual exercises (gap-fill for cardio + flexibility)

wger has very few cardio and no yoga exercises. Insert these manually with IDs starting at 90000 to avoid collision with wger IDs.

```js
const manualExercises = [
  // CARDIO
  {
    id: 90001, name: 'Outdoor run', muscle_group: 'cardio',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Steady-state running outdoors. Great for cardiovascular endurance.',
    image_url: null
  },
  {
    id: 90002, name: 'Jump rope', muscle_group: 'cardio',
    equipment: 'band', mode: 'both', difficulty: 'beginner',
    description: 'Skipping with a jump rope. Burns high calories in short time.',
    image_url: null
  },
  {
    id: 90003, name: 'Burpees', muscle_group: 'cardio',
    equipment: 'bodyweight', mode: 'both', difficulty: 'intermediate',
    description: 'Full body explosive movement combining squat, plank, push-up, and jump.',
    image_url: null
  },
  {
    id: 90004, name: 'Cycling (stationary)', muscle_group: 'cardio',
    equipment: 'machine', mode: 'gym', difficulty: 'beginner',
    description: 'Low-impact cardio on a stationary bike. Suitable for all fitness levels.',
    image_url: null
  },
  {
    id: 90005, name: 'High knees', muscle_group: 'cardio',
    equipment: 'bodyweight', mode: 'both', difficulty: 'beginner',
    description: 'Run in place bringing knees up to hip height. Great warm-up exercise.',
    image_url: null
  },
  // FLEXIBILITY / YOGA
  {
    id: 90010, name: 'Downward dog', muscle_group: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Yoga pose that stretches hamstrings, calves, and spine. Hold 30 seconds.',
    image_url: null
  },
  {
    id: 90011, name: 'Warrior I', muscle_group: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Standing yoga pose that stretches hip flexors and strengthens legs.',
    image_url: null
  },
  {
    id: 90012, name: 'Hip flexor stretch', muscle_group: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Kneeling stretch targeting hip flexors. Hold 30 seconds each side.',
    image_url: null
  },
  {
    id: 90013, name: 'Cat-cow stretch', muscle_group: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Spinal mobilisation on hands and knees. Repeat 10 slow cycles.',
    image_url: null
  },
  {
    id: 90014, name: 'Child\'s pose', muscle_group: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Resting yoga pose that releases lower back and hip tension. Hold 60 seconds.',
    image_url: null
  },
  {
    id: 90015, name: 'Seated hamstring stretch', muscle_group: 'flexibility',
    equipment: 'none', mode: 'both', difficulty: 'beginner',
    description: 'Sit on floor, legs extended, reach for toes. Hold 30 seconds.',
    image_url: null
  },
]
```

---

## SECTION 3 — SVG BODY SELECTOR → LIVE EXERCISE SEARCH

This is the key user-facing flow. When a user taps a muscle zone on the SVG body, the app immediately queries your own database for matching exercises. No wger call happens at runtime.

### SVG muscle zone → muscle_group mapping

```js
const SVG_ZONE_TO_MUSCLE = {
  // Front view zones
  'svg-chest'          : 'chest',
  'svg-shoulders-left' : 'shoulders',
  'svg-shoulders-right': 'shoulders',
  'svg-biceps-left'    : 'biceps',
  'svg-biceps-right'   : 'biceps',
  'svg-core'           : 'core',
  'svg-quads-left'     : 'legs',
  'svg-quads-right'    : 'legs',
  // Back view zones
  'svg-back-upper'     : 'back',
  'svg-back-lower'     : 'back',
  'svg-triceps-left'   : 'triceps',
  'svg-triceps-right'  : 'triceps',
  'svg-hamstrings-left': 'legs',
  'svg-hamstrings-right': 'legs',
  'svg-calves-left'    : 'legs',
  'svg-calves-right'   : 'legs',
  // Chip selections (no SVG zone, user tapped chip directly)
  'chip-cardio'        : 'cardio',
  'chip-flexibility'   : 'flexibility',
  'chip-full_body'     : 'full_body',
}
```

### Live search query on each SVG tap

When user taps an SVG zone, extract the muscle_group from the map above, then call this endpoint immediately:

```
GET /api/exercises/preview?muscle={muscle_group}&mode={home|gym}&level={level}&limit=5
```

Backend query:
```sql
SELECT id, name, muscle_group, equipment, image_url
FROM exercises
WHERE muscle_group = $1        -- from SVG tap
  AND mode IN ('both', $2)     -- user's home/gym mode
  AND difficulty = $3          -- user's level
ORDER BY RANDOM()
LIMIT 5;
```

Show these 5 exercises as a preview card below the body selector. This gives users instant feedback — "these are the exercises you'll get for this muscle."

### On "Generate plan" button press

Collect all selected muscle_groups (array from all tapped zones), then POST to `/api/workout/generate`. The full plan is generated server-side from your DB.

---

## SECTION 4 — PLAN GENERATION LOGIC

Create `services/planGenerator.js`.

### Sets / reps / rest matrix

```js
const LEVEL_CONFIG = {
  beginner:     { sets: 2, reps: 15, rest: 90,  exercisesPerSession: 5,  warmupSets: 1 },
  intermediate: { sets: 3, reps: 12, rest: 75,  exercisesPerSession: 6,  warmupSets: 1 },
  advanced:     { sets: 4, reps: 8,  rest: 60,  exercisesPerSession: 7,  warmupSets: 2 },
  athlete:      { sets: 5, reps: 5,  rest: 45,  exercisesPerSession: 8,  warmupSets: 2 },
}
```

### Age adjustments (apply on top of level config)

```js
function applyAgeAdjustments(config, age) {
  if (age < 18) {
    config.sets     = Math.max(config.sets - 1, 2)
    config.reps     = Math.min(config.reps + 3, 18)
    config.rest     += 15
  }
  if (age > 50) {
    config.rest     += 30
    config.exercisesPerSession = Math.max(config.exercisesPerSession - 1, 4)
  }
  return config
}
```

### Weekly split logic

```
IF muscle_groups includes 'full_body' OR muscle_groups.length <= 2:
  → 3-day full body split: Mon, Wed, Fri

IF muscle_groups.length == 3–4:
  → Upper/Lower split:
    Day 1 (Mon): upper body groups (chest, shoulders, biceps, triceps, back)
    Day 2 (Wed): lower body groups (legs, core)
    Day 3 (Fri): upper body
    Day 4 (Sat): lower body

IF muscle_groups.length >= 5:
  → Push/Pull/Legs:
    Day 1 Mon: chest + shoulders + triceps
    Day 2 Tue: back + biceps
    Day 3 Thu: legs + core
    Day 4 Fri: chest + shoulders + triceps
    Day 5 Sat: back + biceps

Always add: warmup_note + cooldown_note per day.
If goal == 'weight_loss': append 1 cardio exercise to every session regardless of muscle selection.
```

### Exercise selection per session

```sql
SELECT * FROM exercises
WHERE muscle_group = ANY($1::text[])
  AND mode IN ('both', $2)
  AND difficulty = $3
ORDER BY RANDOM()
LIMIT $4;
```

---

## SECTION 5 — YOUTUBE VIDEO CACHING SERVICE

Create `services/youtubeService.js`. Called lazily — only when a user taps "Watch video" on an exercise that has no cached video ID.

```
FUNCTION getYoutubeVideoId(exercise):

  1. IF exercise.youtube_video_id IS NOT NULL
     → return { video_id: exercise.youtube_video_id, from_cache: true }

  2. Build search query:
     query = `${exercise.name} exercise tutorial proper form`

  3. GET https://www.googleapis.com/youtube/v3/search
     Params:
       part=snippet
       q={query}
       type=video
       videoDuration=medium
       videoDefinition=high
       maxResults=3
       key={YOUTUBE_API_KEY}

  4. Filter results: skip any video where snippet.channelTitle contains
     words like 'promo', 'product', 'buy' (optional quality filter)
     Pick items[0].id.videoId

  5. IF no results found → return { video_id: null }

  6. UPDATE exercises
     SET youtube_video_id = videoId, youtube_cached_at = NOW()
     WHERE id = exercise.id

  7. return { video_id: videoId, from_cache: false }
```

**Embed URL:**
```
https://www.youtube.com/embed/{videoId}?autoplay=0&rel=0&modestbranding=1
```

Note: YouTube embedding is explicitly permitted by YouTube's Terms of Service. You are not downloading or hosting the video — you are displaying it via YouTube's official embed player. This is fully legal and is how every major fitness app handles video.

---

## SECTION 6 — API ENDPOINTS

### POST `/api/workout/generate`

**Request:**
```json
{
  "muscle_groups": ["chest", "shoulders", "triceps"],
  "mode": "gym",
  "level": "intermediate",
  "age": 25,
  "goal": "muscle_gain"
}
```

**Logic:**
1. Validate: muscle_groups non-empty, level is one of 4 valid values, mode is home/gym
2. Call planGenerator.generatePlan(inputs)
3. Save to workout_plans + plan_exercises
4. Return full plan with exercise details

---

### GET `/api/exercises/preview`

**Params:** `muscle`, `mode`, `level`, `limit` (default 5)

Returns quick preview of exercises for a given muscle group. Called on every SVG body tap.

---

### GET `/api/exercises/:id/video`

Lazy-loads YouTube video ID for one exercise.
Returns: `{ video_id, embed_url, from_cache }`

---

### POST `/api/workout/log`

```json
{
  "plan_id": "uuid",
  "exercise_id": 15,
  "sets_done": 3,
  "reps_done": 12,
  "weight_kg": 60
}
```

---

### GET `/api/workout/plans`

Lists all plans for authenticated user, newest first.

---

## SECTION 7 — FRONTEND SCREENS & COMPONENTS

### Screen 1: Muscle Selector (`ExercisePlannerScreen`)

**Layout** (stacked on mobile, two-panel on tablet/web):

**Top half — SVG Body Selector:**
- Render SVG body silhouette (front/back toggle)
- Front view zones (each is a `<path>` or `<rect>` with `data-zone` attribute):
  - chest, shoulders-left, shoulders-right, biceps-left, biceps-right, core, quads-left, quads-right
- Back view zones:
  - back-upper, back-lower, triceps-left, triceps-right, hamstrings-left, hamstrings-right, calves-left, calves-right
- On tap: lookup `SVG_ZONE_TO_MUSCLE[zoneId]`, add to selectedMuscles state
- Selected zones: fill `#7F77DD`, stroke `#534AB7`
- Unselected zones: fill `#E1F5EE`, stroke `#5DCAA5`
- Tapping a selected zone deselects it

**Bottom chips row** (for groups not on SVG):
- Cardio, Flexibility / Yoga, Full Body — tappable chips with same highlight behaviour

**Right/Bottom panel:**
- Selected muscles chip list with remove (×) button per chip
- **Live exercise preview**: after each tap, call `GET /api/exercises/preview` and show 3–5 exercise names with small thumbnails. Updates in real-time as user taps.
- Age slider (range 10–70)
- Level cards: Beginner / Intermediate / Advanced / Athlete
- Mode toggle: Home / Gym
- Goal picker: Weight loss / Muscle gain / Endurance / Flexibility / General fitness
- "Generate my plan →" CTA button (disabled until at least 1 muscle selected)

**On button press:**
- Show loading state
- POST to `/api/workout/generate`
- Navigate to WorkoutPlanScreen on success

---

### Screen 2: Workout Plan (`WorkoutPlanScreen`)

- Weekly tab bar (Mon → Sun). Rest days show "Rest day — recover"
- Each active day shows:
  - Day label e.g. "Monday — Chest & Shoulders"
  - Warm-up note banner
  - List of `ExerciseCard` components
  - Cool-down note banner
  - "Start workout" button → navigates to ActiveWorkoutScreen

### Component: `ExerciseCard`

```
┌────────────────────────────────────────────┐
│  [Image 80x80]   Bench Press               │
│                  Chest · Gym · Barbell     │
│                                            │
│  3 sets × 12 reps         Rest: 75s        │
│                                            │
│  [▶ Watch video]     [≡ Instructions]      │
└────────────────────────────────────────────┘
```

- Image: `exercise.image_url` (static JPG from wger, stored in DB)
- If `image_url` is null → show a grey placeholder with muscle group icon
- "Watch video" button:
  - If `youtube_video_id` cached → show inline YouTube embed immediately
  - If null → call `GET /api/exercises/:id/video`, show spinner, then embed
- "Instructions" → expand accordion with description text

---

### Screen 3: Active Workout (`ActiveWorkoutScreen`)

Full-screen, one exercise at a time.

- Large image at top (exercise.image_url)
- Exercise name, muscle group tag
- Set counter: "Set 2 of 3"
- Current rep target displayed large
- "Done with set" button → starts rest timer automatically
- Rest timer:
  - Circular countdown ring (rest_sec down to 0)
  - Vibration haptic at 3s warning and at 0
  - Sound chime at 0
  - "Skip rest" button available
- After rest timer ends → auto-advances to next set prompt
- "Log this set" bottom sheet: actual reps done + optional weight in kg
- Bottom nav: Previous exercise / Next exercise

---

### Screen 4: Walking Goal Widget (`WalkingGoalWidget`)

Display as a card on the home screen or at the top of the plan screen.

**Calorie → steps calculation:**
```
steps_needed = calorie_target / 0.04
km_needed    = steps_needed / 1312
```

**Display:**
- Circular progress ring: steps today / steps_needed
- Text: "6,240 / 8,750 steps · 4.8 km · 250 kcal"
- Pull live step count from device pedometer:
  - React Native: `expo-sensors` Pedometer or `react-native-health`
  - Web: Unavailable — show manual input field instead

---

## SECTION 8 — PROGRESSIVE OVERLOAD

Run server-side after each completed workout session.

```
FOR each exercise_id in today's logged session:
  
  recent_logs = SELECT * FROM workout_logs
    WHERE user_id = $user AND exercise_id = $ex
    ORDER BY logged_at DESC LIMIT 2

  IF recent_logs.length == 2
    AND both logs have reps_done >= plan target reps:
      → Increment: if reps < 20 → reps += 2
                   if reps >= 20 → sets += 1, reps = 10
      → UPDATE plan_exercises SET reps/sets for week_number + 1

  IF recent_logs[0].reps_done < (target_reps * 0.7):
      → Keep same targets
      → Add session note: "Same targets next session — take your time"
```

---

## SECTION 9 — ENVIRONMENT VARIABLES

```env
YOUTUBE_API_KEY=your_google_youtube_v3_key
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# No wger API key needed — all public endpoints are unauthenticated
```

---

## SECTION 10 — BUILD ORDER

Follow this exact sequence. Do not skip steps.

```
1.  Run DB migrations (Section 1) — create all 4 tables
2.  Run seed script (Section 2) — verify exercises table has 600+ rows
3.  Manually check: SELECT muscle_group, COUNT(*) FROM exercises GROUP BY muscle_group;
    All 10 groups should have at least some rows. Cardio/flexibility will be from manual inserts.
4.  Build planGenerator service (Section 4)
5.  Build youtubeService (Section 5)
6.  Build API endpoints (Section 6)
7.  Build ExercisePlannerScreen with SVG body selector + live preview (Section 7 — Screen 1)
8.  Build WorkoutPlanScreen + ExerciseCard (Section 7 — Screen 2)
9.  Build ActiveWorkoutScreen with rest timer (Section 7 — Screen 3)
10. Add WalkingGoalWidget (Section 7 — Screen 4)
11. Add progressive overload logic (Section 8)
```

---

## SECTION 11 — WHAT NOT TO CALL AT RUNTIME

| ❌ Never at runtime | ✅ Use instead |
|---|---|
| wger API | Your own `exercises` table |
| wger for images | `exercise.image_url` stored in DB |
| YouTube on every page load | `exercise.youtube_video_id` if cached |
| YouTube if video_id exists | Return cached ID instantly |
| Any external API on SVG tap | `GET /api/exercises/preview` → your own DB |

**Golden rule:** Every user-facing request touches only your own database. External APIs are used at setup (wger) or lazily on first trigger (YouTube), never on every user action.

---

*End of build prompt. All decisions are pre-made. Start at Section 10 Step 1 and work downward.*
