# Meal Planner Migration Prompt

Copy everything below into your coding assistant (Claude Code, Cursor, etc.)

---

## PROMPT START

Replace the current meal-fetching method and APIs (Spoonacular + USDA) in my meal planner app with the following new architecture. Remove all Spoonacular API calls entirely.

### New Architecture

```
User Input (calories, number of meals, veg/non-veg)
        ↓
Gemini API → generates Indian meal plan (meal names, portions, macros)
        ↓
Unsplash/Pexels API → fetches a real photo for each meal name
        ↓
USDA FoodData Central API → cross-validates/refines calorie data for generic ingredients
        ↓
Final meal cards shown to user: [Image] + [Meal name] + [Calories] + [Macros] + [Veg/Non-veg tag]
```

### Step 1: User Inputs
Collect these three inputs from the user before calling any API:
1. **Daily calorie target** (number, e.g. 2000)
2. **Number of meals per day** (e.g. 3, 4, 5 — breakfast/lunch/dinner/snacks)
3. **Diet preference** — Vegetarian / Non-Vegetarian / Both (toggle/filter)

### Step 2: Gemini API — Meal Generation
Use the Gemini API (`gemini-2.0-flash` or latest available model) to generate the meal plan. Use this system/user prompt template, injecting the user's actual inputs:

```
You are an expert Indian fitness nutritionist who creates meal plans for gym-goers in India.

Generate a {number_of_meals}-meal Indian diet plan totaling approximately {calorie_target} calories for the day.
Diet preference: {veg_or_nonveg}

Rules:
- Use authentic Indian foods and realistic portion sizes (e.g. "2 multigrain roti", "150g grilled chicken breast", "1 bowl moong dal").
- Include a mix of regional Indian dishes (North/South/East/West) where appropriate, not just generic dal-roti every time.
- For non-vegetarian plans, include eggs, chicken, fish, or paneer combos — not all meals need to be meat-based.
- For vegetarian plans, ensure protein adequacy using paneer, dal, tofu, soy chunks, Greek yogurt, sprouts, etc.
- Each meal must include: meal name, short description, estimated calories, protein (g), carbs (g), fat (g), and 3-5 ingredient list with portions.
- Spread calories sensibly across meals (e.g. don't put 80% of calories in one meal).
- Keep meal names short and searchable (2-4 words) since they will be used to search a stock photo API — avoid overly long or compound names.

Respond ONLY in valid JSON, no markdown formatting, no preamble, in this exact structure:

{
  "total_calories": number,
  "diet_type": "vegetarian" | "non-vegetarian",
  "meals": [
    {
      "meal_slot": "Breakfast" | "Lunch" | "Dinner" | "Snack",
      "name": "string",
      "description": "string",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "ingredients": ["string", "string", ...],
      "is_vegetarian": boolean
    }
  ]
}
```

### Step 3: Unsplash/Pexels API — Meal Images
For each `meal.name` returned by Gemini, call the image API to fetch a real photo:

**Unsplash (preferred):**
```
GET https://api.unsplash.com/search/photos?query={meal_name}+indian+food&per_page=1
Header: Authorization: Client-ID {UNSPLASH_ACCESS_KEY}
```
Use `results[0].urls.regular` as the image. If no results, fall back to Pexels.

**Pexels (fallback):**
```
GET https://api.pexels.com/v1/search?query={meal_name}+indian+food&per_page=1
Header: Authorization: {PEXELS_API_KEY}
```
Use `photos[0].src.medium` as the image.

If both APIs return zero results, use a static placeholder food image stored locally (don't break the UI).

### Step 4: USDA FoodData Central — Calorie Validation
For each ingredient in `meal.ingredients`, optionally cross-check calorie accuracy using USDA's API — primarily for generic/raw ingredients (rice, oil, milk, eggs, chicken breast) rather than composite Indian dishes (which USDA won't have):

```
GET https://api.nal.usda.gov/fdc/v1/foods/search?query={ingredient_name}&dataType=Foundation,SR%20Legacy&api_key={USDA_API_KEY}
```

Use this only as a validation/refinement layer — do not block meal generation if USDA has no match for an Indian-specific ingredient (e.g. "toor dal", "ghee"). In that case, trust Gemini's estimate and optionally maintain a small local fallback JSON table of common Indian ingredient calorie values for items USDA consistently misses.

### Step 5: Final Output
Combine all three data sources into a meal card for the UI:

```json
{
  "meal_slot": "Lunch",
  "name": "Paneer Bhurji",
  "image_url": "https://images.unsplash.com/...",
  "calories": 420,
  "protein_g": 28,
  "carbs_g": 30,
  "fat_g": 18,
  "ingredients": ["200g paneer", "1 tbsp oil", "2 multigrain roti"],
  "is_vegetarian": true
}
```

### Requirements for the implementation
- Remove all existing Spoonacular API calls, types, and response parsing logic.
- Add environment variables: `GEMINI_API_KEY`, `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`, `USDA_API_KEY`.
- Add loading states for each stage (generating meals → fetching images → validating calories) since this is now a 3-API pipeline instead of 1.
- Add error handling: if Gemini fails, show a retry option; if image APIs fail, use placeholder; if USDA fails, silently skip validation (non-blocking).
- Keep the existing veg/non-veg filter UI, but wire it to the Gemini prompt's `{veg_or_nonveg}` variable instead of Spoonacular's `diet` param.
- Keep the existing calorie input UI, but wire it to `{calorie_target}` in the Gemini prompt instead of Spoonacular's `maxCalories` param.

## PROMPT END
