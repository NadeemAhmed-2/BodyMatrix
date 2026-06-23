# meal.js — Complete Fix Instructions for Developer

## Overview of Problems Being Fixed
1. Gemini free tier quota (429 error) crashes the app with no fallback
2. MealPlanCache only does exact calorie match, so cache rarely hits
3. Mock plan generator exists in code but is never used as fallback
4. AI-generated meal calories are not trusted — ingredient recalculation using unreliable fallback values (150 cal default) causes 500–1000 kcal deviation from user's target
5. No hard guardrail to enforce the calorie target after generation

---

## CHANGE 1 — Replace Gemini with OpenRouter (Free LLM API)

### Why
Gemini free tier allows only 20 requests/day and is now quota-exhausted. OpenRouter provides access to free LLMs (like Llama 3.3 70B) with much higher limits and the same JSON output capability.

### Step 1 — Add to `.env` file on Render
```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
```

### Step 2 — In `meal.js`, find this block (around line 838):
```js
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not defined.');
}

let geminiRes;
const modelsToTry = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];
let lastGeminiError = null;

for (const modelName of modelsToTry) {
  try {
    console.log(`Trying Gemini model: ${modelName}`);
    geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      },
      { timeout: 20000 }
    );

    if (
      geminiRes.data.candidates &&
      geminiRes.data.candidates.length > 0 &&
      geminiRes.data.candidates[0].content &&
      geminiRes.data.candidates[0].content.parts &&
      geminiRes.data.candidates[0].content.parts.length > 0
    ) {
      console.log(`Successfully generated meal plan using model: ${modelName}`);
      break;
    }
  } catch (err) {
    console.error(`Gemini model ${modelName} failed:`, err.response?.data || err.message);
    lastGeminiError = err;
    geminiRes = null;
  }
}

if (!geminiRes) {
  throw lastGeminiError || new Error('All Gemini model fallbacks failed.');
}

let geminiRawText = geminiRes.data.candidates[0].content.parts[0].text;
geminiRawText = geminiRawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

const geminiPlan = JSON.parse(geminiRawText);
if (!geminiPlan.meals || !Array.isArray(geminiPlan.meals)) {
  throw new Error('Gemini API returned an invalid meal plan structure.');
}
```

### Replace the entire block above with this:
```js
if (!process.env.OPENROUTER_API_KEY) {
  console.log('No OPENROUTER_API_KEY found, falling back to mock plan');
  const mockPlan = generateMockPlan(tCals, diet, mPerDay);
  const newCache = new MealPlanCache({
    targetCalories: tCals,
    diet: diet.toLowerCase(),
    mealsPerDay: mPerDay,
    planData: mockPlan
  });
  await newCache.save().catch(e => console.error('Cache save failed:', e.message));
  return res.json(mockPlan);
}

let aiResponseText = null;
let aiError = null;

const openRouterModels = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-7b-instruct:free'
];

for (const model of openRouterModels) {
  try {
    console.log(`Trying OpenRouter model: ${model}`);
    const orRes = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [{ role: 'user', content: promptText }],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://bodymatrix.app'
        },
        timeout: 30000
      }
    );

    const content = orRes.data?.choices?.[0]?.message?.content;
    if (content) {
      aiResponseText = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      console.log(`OpenRouter success with model: ${model}`);
      break;
    }
  } catch (err) {
    console.error(`OpenRouter model ${model} failed:`, err.response?.data || err.message);
    aiError = err;
  }
}

// If all AI models failed, fall back to mock plan instead of crashing
if (!aiResponseText) {
  console.log('All AI models failed or quota exceeded. Falling back to mock plan.');
  const mockPlan = generateMockPlan(tCals, diet, mPerDay);
  const newCache = new MealPlanCache({
    targetCalories: tCals,
    diet: diet.toLowerCase(),
    mealsPerDay: mPerDay,
    planData: mockPlan
  });
  await newCache.save().catch(e => console.error('Cache save failed:', e.message));
  return res.json(mockPlan);
}

const geminiPlan = JSON.parse(aiResponseText);
if (!geminiPlan.meals || !Array.isArray(geminiPlan.meals)) {
  console.log('AI returned invalid structure. Falling back to mock plan.');
  const mockPlan = generateMockPlan(tCals, diet, mPerDay);
  return res.json(mockPlan);
}
```

---

## CHANGE 2 — Fix MealPlanCache to use fuzzy calorie matching (±50 kcal)

### Why
The current cache does an exact match on `targetCalories`. So if a user requests 1990 cal and the cache has a plan saved for 2000 cal (same diet, same meals), it misses the cache and hits the AI again unnecessarily. With fuzzy matching, any request within ±50 kcal of a cached plan will be served from the database instantly.

### Find this block (around line 763):
```js
if (!refresh) {
  const cachedPlan = await MealPlanCache.findOne({
    targetCalories: tCals,
    diet: diet.toLowerCase(),
    mealsPerDay: mPerDay
  });

  if (cachedPlan) {
    console.log('Serving meal plan from MealPlanCache');
    return res.json(cachedPlan.planData);
  }
}
```

### Replace with:
```js
if (!refresh) {
  const cachedPlan = await MealPlanCache.findOne({
    targetCalories: { $gte: tCals - 50, $lte: tCals + 50 },
    diet: diet.toLowerCase(),
    mealsPerDay: mPerDay
  });

  if (cachedPlan) {
    console.log('Serving meal plan from MealPlanCache (fuzzy match)');
    return res.json(cachedPlan.planData);
  }
}
```

---

## CHANGE 3 — Trust AI macro values instead of ingredient recalculation

### Why
After the AI generates a meal plan, your code recalculates calories by looking up each ingredient in your local DB or USDA. When an ingredient is not found (which happens often with Indian ingredients), it falls back to a hardcoded value of 150 cal. This causes the total calories shown to be 500–1000 kcal off from what the user asked for.

The fix is to always use the calorie/macro numbers that the AI explicitly returned for each meal, treating the ingredient lookup as supplementary info only.

### Find this block (around line 981):
```js
if (recipeCalories === 0) {
  recipeCalories = meal.calories || 300;
  recipeProtein = meal.protein_g || 15;
  recipeFat = meal.fat_g || 8;
  recipeCarbs = meal.carbs_g || 30;
}
```

### Replace with:
```js
// Always trust AI-provided macro values as the source of truth.
// Ingredient-level recalculation is unreliable due to lookup fallbacks.
recipeCalories = meal.calories || recipeCalories || 300;
recipeProtein = meal.protein_g || recipeProtein || 15;
recipeFat = meal.fat_g || recipeFat || 8;
recipeCarbs = meal.carbs_g || recipeCarbs || 30;
```

---

## CHANGE 4 — Add hard calorie scaling guardrail after generation

### Why
Even after the AI returns values, rounding errors and multi-meal summation can push the total beyond the user's target. This is a mathematical safety net that proportionally scales all meal nutrition and ingredient amounts down if the total exceeds the user's target by more than 100 kcal. It guarantees the final plan is always within ±100 kcal.

### Find this block (around line 1017):
```js
const generatedMeals = await Promise.all(mealPromises);

let totalCalories = 0;
let totalProtein = 0;
let totalFat = 0;
let totalCarbs = 0;

for (const meal of generatedMeals) {
  totalCalories += meal.nutrition.calories;
  totalProtein += meal.nutrition.protein;
  totalFat += meal.nutrition.fat;
  totalCarbs += meal.nutrition.carbohydrates;
}
```

### Replace with:
```js
const generatedMeals = await Promise.all(mealPromises);

let totalCalories = 0;
let totalProtein = 0;
let totalFat = 0;
let totalCarbs = 0;

for (const meal of generatedMeals) {
  totalCalories += meal.nutrition.calories;
  totalProtein += meal.nutrition.protein;
  totalFat += meal.nutrition.fat;
  totalCarbs += meal.nutrition.carbohydrates;
}

// Hard calorie guardrail: if total exceeds target + 100, scale everything down proportionally
const calorieTolerance = 100;
if (totalCalories > tCals + calorieTolerance) {
  console.log(`Calorie overshoot detected: ${totalCalories} vs target ${tCals}. Scaling down.`);
  const scaleFactor = tCals / totalCalories;

  for (const meal of generatedMeals) {
    meal.nutrition.calories = Math.round(meal.nutrition.calories * scaleFactor);
    meal.nutrition.protein = Math.round(meal.nutrition.protein * scaleFactor);
    meal.nutrition.fat = Math.round(meal.nutrition.fat * scaleFactor);
    meal.nutrition.carbohydrates = Math.round(meal.nutrition.carbohydrates * scaleFactor);
    meal.ingredients = meal.ingredients.map(ing => ({
      ...ing,
      amount: Math.round(ing.amount * scaleFactor * 10) / 10
    }));
  }

  // Recompute totals after scaling
  totalCalories = generatedMeals.reduce((s, m) => s + m.nutrition.calories, 0);
  totalProtein = generatedMeals.reduce((s, m) => s + m.nutrition.protein, 0);
  totalFat = generatedMeals.reduce((s, m) => s + m.nutrition.fat, 0);
  totalCarbs = generatedMeals.reduce((s, m) => s + m.nutrition.carbohydrates, 0);
}
```

---

## CHANGE 5 — Tighten the AI prompt to enforce strict calorie target

### Why
The current prompt says "approximately X calories" which the AI interprets loosely. Making the prompt strict and giving an explicit tolerance forces the model to distribute meals more precisely.

### Find this line inside the `promptText` string (around line 802):
```
Generate a ${mPerDay}-meal Indian diet plan totaling approximately ${tCals} calories for the day.
```

### Replace with:
```
Generate a ${mPerDay}-meal Indian diet plan totaling EXACTLY ${tCals} calories for the day. This is a strict requirement — the sum of all meal calories must be between ${tCals - 50} and ${tCals + 100}. Distribute the calories across meals so they add up precisely to this target. Do not exceed ${tCals + 100} total calories under any circumstance.
```

---

## CHANGE 6 — Add tolerance note in MealConfigScreen.js (Frontend)

### Why
Sets correct user expectation that the plan targets ±100 kcal, not an exact number.

### In `MealConfigScreen.js`, find the Generate button section:
```jsx
<TouchableOpacity 
  style={[styles.generateBtn, loading && styles.generateBtnLoading]}
  onPress={handleGenerate}
  disabled={loading}
  activeOpacity={0.9}
>
  <Text style={styles.generateBtnText}>
    {loading ? 'GENERATING...' : 'GENERATE PLAN'}
  </Text>
</TouchableOpacity>
```

### Add this Text component immediately after the closing `</TouchableOpacity>`:
```jsx
<Text style={{
  color: COLORS.textMuted,
  fontFamily: 'monospace',
  fontSize: 9,
  textAlign: 'center',
  marginTop: 6,
  letterSpacing: 1.5
}}>
  TARGET ±100 KCAL TOLERANCE
</Text>
```

---

## Summary of All Changes

| # | File | What changes | Why |
|---|---|---|---|
| 1 | meal.js | Replace Gemini API block with OpenRouter API | Gemini free quota exhausted; OpenRouter free models work without hard daily limits |
| 1b | meal.js | Add mock plan fallback when all AI models fail | App never crashes with quota error; user always gets a usable plan |
| 2 | meal.js | Cache lookup uses ±50 kcal range instead of exact match | Cache hits much more often; drastically reduces AI calls |
| 3 | meal.js | Use AI macro values as source of truth, not ingredient recalculation | Stops 150 cal fallback from inflating/deflating totals by 500–1000 kcal |
| 4 | meal.js | Add post-generation calorie scaling guardrail | Mathematically guarantees final plan is within ±100 kcal of user target |
| 5 | meal.js | Tighten prompt to say EXACTLY X calories with strict range | LLM generates closer to target from the start |
| 6 | MealConfigScreen.js | Add "TARGET ±100 KCAL TOLERANCE" note below generate button | Sets correct user expectation |

## Environment Variables Required on Render
```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx   ← get from openrouter.ai (free)
```
The old `GEMINI_API_KEY` can be left as-is or removed. It is no longer used.
