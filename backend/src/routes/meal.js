const express = require("express");
const router = express.Router();
const axios = require("axios");
const MealPlanCache = require("../models/MealPlanCache");
const MealNutritionCache = require("../models/MealNutritionCache");

// Helper to extract nutrients from USDA search results
function getNutrientVal(nutrients, ids, nameKeywords) {
  const nut = nutrients.find(
    (n) =>
      ids.includes(n.nutrientId) ||
      nameKeywords.some(
        (kw) =>
          n.nutrientName &&
          n.nutrientName.toLowerCase().includes(kw.toLowerCase()),
      ),
  );
  return nut ? nut.value : 0;
}

// Database of premium templates for Mock Generator fallback
const MOCK_MEALS_DB = {
  vegan: {
    breakfast: [
      {
        name: "High-Protein Overnight Oats",
        description:
          "Organic rolled oats soaked in almond milk, loaded with chia seeds, flax seeds, and raw organic hemp seeds. Topped with fresh blueberries and a splash of maple syrup.",
        image:
          "https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Macadamia Milk Matcha",
          description:
            "Matcha green tea whisked with creamy unsweetened macadamia nut milk.",
          icon: "local_drink",
        },
        baseCalories: 450,
        baseProtein: 15,
        baseFat: 14,
        baseCarbs: 65,
        ingredients: [
          { name: "rolled oats", amount: 80, unit: "g" },
          { name: "chia seeds", amount: 15, unit: "g" },
          { name: "hemp seeds", amount: 10, unit: "g" },
          { name: "almond milk", amount: 200, unit: "ml" },
          { name: "blueberries", amount: 50, unit: "g" },
        ],
      },
    ],
    lunch: [
      {
        name: "Tempeh Buddha Bowl",
        description:
          "Marinated pan-seared organic tempeh, served over a colorful bed of red quinoa, steamed broccoli florets, shredded purple cabbage, avocado slices, and drizzled with a rich tahini ginger dressing.",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Probiotic Kombucha",
          description:
            "Chilled organic ginger-lemon kombucha for digestive health.",
          icon: "local_drink",
        },
        baseCalories: 650,
        baseProtein: 28,
        baseFat: 25,
        baseCarbs: 78,
        ingredients: [
          { name: "tempeh", amount: 150, unit: "g" },
          { name: "quinoa", amount: 100, unit: "g" },
          { name: "avocado", amount: 80, unit: "g" },
          { name: "broccoli", amount: 100, unit: "g" },
          { name: "tahini", amount: 30, unit: "g" },
        ],
      },
    ],
    dinner: [
      {
        name: "Lentil Chickpea Curry",
        description:
          "Slow-simmered brown lentils and chickpeas in a coconut milk, tomato, and aromatic spice curry base. Served with cauliflower rice and fresh coriander.",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Warm Ginger Tea",
          description: "Freshly brewed ginger and lemon root infusion.",
          icon: "coffee",
        },
        baseCalories: 550,
        baseProtein: 22,
        baseFat: 18,
        baseCarbs: 75,
        ingredients: [
          { name: "chickpeas", amount: 120, unit: "g" },
          { name: "brown lentils", amount: 80, unit: "g" },
          { name: "coconut milk", amount: 100, unit: "ml" },
          { name: "cauliflower rice", amount: 200, unit: "g" },
        ],
      },
    ],
    snack: [
      {
        name: "Edamame & Mixed Seeds",
        description:
          "Steamed edamame pods sprinkled with sea salt and paired with dry roasted pumpkin seeds.",
        image:
          "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Mineral Water",
          description: "Sparkling spring water with lime.",
          icon: "local_drink",
        },
        baseCalories: 250,
        baseProtein: 18,
        baseFat: 12,
        baseCarbs: 18,
        ingredients: [
          { name: "edamame", amount: 150, unit: "g" },
          { name: "pumpkin seeds", amount: 20, unit: "g" },
        ],
      },
    ],
  },
  vegetarian: {
    breakfast: [
      {
        name: "Ragi Dosa & Paneer Bhurji",
        description:
          "Crispy high-fiber finger millet dosa served with a side of scrambled paneer sautéed with tomatoes, green chillies, and fresh coriander.",
        image:
          "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Protein Coffee",
          description:
            "Double shot espresso blended with vanilla whey protein isolate and ice.",
          icon: "coffee",
        },
        baseCalories: 500,
        baseProtein: 30,
        baseFat: 18,
        baseCarbs: 55,
        ingredients: [
          { name: "finger millet flour", amount: 60, unit: "g" },
          { name: "paneer", amount: 100, unit: "g" },
          { name: "onion", amount: 30, unit: "g" },
          { name: "tomato", amount: 50, unit: "g" },
        ],
      },
    ],
    lunch: [
      {
        name: "Paneer Tikka High-Fiber Bowl",
        description:
          "Clay-oven roasted cottage cheese skewers marinated in Greek yogurt spices, served on a bed of sprouted mung beans and mixed greens salad.",
        image:
          "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Spiced Buttermilk",
          description:
            "Chilled low-fat buttermilk seasoned with ginger, cumin, and mint.",
          icon: "local_drink",
        },
        baseCalories: 650,
        baseProtein: 35,
        baseFat: 26,
        baseCarbs: 68,
        ingredients: [
          { name: "paneer", amount: 150, unit: "g" },
          { name: "greek yogurt", amount: 80, unit: "g" },
          { name: "mung bean sprouts", amount: 100, unit: "g" },
          { name: "mixed salad greens", amount: 100, unit: "g" },
        ],
      },
    ],
    dinner: [
      {
        name: "Tofu Quinoa Veggie Medley",
        description:
          "Firm organic tofu cubes stir-fried with bell peppers, mushrooms, and asparagus in a tamari sesame glaze over fluffy white quinoa.",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Green Tea",
          description: "Pure organic sencha green tea.",
          icon: "coffee",
        },
        baseCalories: 550,
        baseProtein: 25,
        baseFat: 16,
        baseCarbs: 76,
        ingredients: [
          { name: "tofu", amount: 150, unit: "g" },
          { name: "quinoa", amount: 80, unit: "g" },
          { name: "bell pepper", amount: 100, unit: "g" },
          { name: "mushrooms", amount: 80, unit: "g" },
        ],
      },
    ],
    snack: [
      {
        name: "Spiced Roasted Soya Chunks",
        description:
          "High-density plant protein soya chunks dry-roasted with chaat masala and olive oil spray.",
        image:
          "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Hydration Electrolytes",
          description: "Water with dynamic trace mineral electrolytes.",
          icon: "local_drink",
        },
        baseCalories: 200,
        baseProtein: 22,
        baseFat: 4,
        baseCarbs: 18,
        ingredients: [
          { name: "soy chunks", amount: 50, unit: "g" },
          { name: "olive oil", amount: 5, unit: "ml" },
        ],
      },
    ],
  },
  non_vegetarian: {
    breakfast: [
      {
        name: "Egg White Omelet & Oats Toast",
        description:
          "Omelet made from 5 organic egg whites and 1 whole egg, loaded with baby spinach and mushrooms, served with high-protein oats toast.",
        image:
          "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Black Coffee",
          description: "Double shot of fresh espresso with no sugars.",
          icon: "coffee",
        },
        baseCalories: 450,
        baseProtein: 38,
        baseFat: 10,
        baseCarbs: 52,
        ingredients: [
          { name: "egg whites", amount: 150, unit: "g" },
          { name: "egg", amount: 50, unit: "g" },
          { name: "spinach", amount: 50, unit: "g" },
          { name: "whole wheat bread", amount: 60, unit: "g" },
        ],
      },
    ],
    lunch: [
      {
        name: "Grilled Chicken Quinoa Bowl",
        description:
          "Herb-marinated grilled chicken breast slices, served over organic white quinoa, steamed broccoli, roasted sweet potatoes, and a side of light olive oil vinaigrette.",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Iced Lime Water",
          description: "Freshly squeezed lime in sparkling water with mint.",
          icon: "local_drink",
        },
        baseCalories: 700,
        baseProtein: 55,
        baseFat: 18,
        baseCarbs: 78,
        ingredients: [
          { name: "chicken breast", amount: 200, unit: "g" },
          { name: "quinoa", amount: 100, unit: "g" },
          { name: "broccoli", amount: 100, unit: "g" },
          { name: "sweet potato", amount: 120, unit: "g" },
        ],
      },
    ],
    dinner: [
      {
        name: "Baked Turkey & Stir-Fry Veggies",
        description:
          "Lean baked turkey breast cutlets served with garlic stir-fried green beans, zucchini, and carrots, alongside wild rice.",
        image:
          "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Chamomile Tea",
          description: "Warm chamomile herbal tea to promote restful recovery.",
          icon: "coffee",
        },
        baseCalories: 550,
        baseProtein: 45,
        baseFat: 12,
        baseCarbs: 65,
        ingredients: [
          { name: "turkey breast", amount: 180, unit: "g" },
          { name: "wild rice", amount: 80, unit: "g" },
          { name: "green beans", amount: 100, unit: "g" },
          { name: "zucchini", amount: 100, unit: "g" },
        ],
      },
    ],
    snack: [
      {
        name: "Hard Boiled Eggs & Almonds",
        description:
          "Two farm-fresh boiled eggs paired with a handful of raw activated almonds.",
        image:
          "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Filtered Water",
          description: "Purified water infused with cucumber slices.",
          icon: "local_drink",
        },
        baseCalories: 280,
        baseProtein: 18,
        baseFat: 20,
        baseCarbs: 6,
        ingredients: [
          { name: "eggs", amount: 100, unit: "g" },
          { name: "almonds", amount: 20, unit: "g" },
        ],
      },
    ],
  },
  pescatarian: {
    breakfast: [
      {
        name: "Smoked Salmon Avocado Toast",
        description:
          "Premium cold-smoked salmon slices laid over mashed ripe avocado on gluten-free multi-seed toast, topped with red onion slices and capers.",
        image:
          "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Organic Green Tea",
          description: "Unsweetened hot green tea.",
          icon: "coffee",
        },
        baseCalories: 480,
        baseProtein: 28,
        baseFat: 22,
        baseCarbs: 42,
        ingredients: [
          { name: "smoked salmon", amount: 80, unit: "g" },
          { name: "avocado", amount: 60, unit: "g" },
          { name: "gluten free bread", amount: 60, unit: "g" },
        ],
      },
    ],
    lunch: [
      {
        name: "Grilled Salmon Quinoa Salad",
        description:
          "Fillet of Atlantic salmon grilled to perfection, flaked over a mixed greens salad with cooked quinoa, cherry tomatoes, cucumbers, and lemon-herb dressing.",
        image:
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Lemon Soda",
          description: "Chilled sparkling water with organic lemon juice.",
          icon: "local_drink",
        },
        baseCalories: 680,
        baseProtein: 46,
        baseFat: 28,
        baseCarbs: 60,
        ingredients: [
          { name: "salmon fillet", amount: 150, unit: "g" },
          { name: "quinoa", amount: 80, unit: "g" },
          { name: "mixed salad greens", amount: 100, unit: "g" },
          { name: "cherry tomatoes", amount: 50, unit: "g" },
        ],
      },
    ],
    dinner: [
      {
        name: "Baked Cod & Couscous",
        description:
          "Lemon-pepper baked wild cod fillet, served over a bed of whole-wheat couscous and garlic-sautéed spinach.",
        image:
          "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Peppermint Infusion",
          description: "Soothing hot peppermint tea.",
          icon: "coffee",
        },
        baseCalories: 500,
        baseProtein: 38,
        baseFat: 10,
        baseCarbs: 62,
        ingredients: [
          { name: "cod fillet", amount: 180, unit: "g" },
          { name: "couscous", amount: 80, unit: "g" },
          { name: "spinach", amount: 120, unit: "g" },
        ],
      },
    ],
    snack: [
      {
        name: "Tuna Lettuce Wraps",
        description:
          "Canned tuna in spring water, mixed with low-fat Greek yogurt, wrapped in crisp iceberg lettuce leaves.",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Coconut Water",
          description:
            "Fresh natural coconut water for potassium replenishment.",
          icon: "local_drink",
        },
        baseCalories: 220,
        baseProtein: 26,
        baseFat: 4,
        baseCarbs: 10,
        ingredients: [
          { name: "tuna", amount: 120, unit: "g" },
          { name: "greek yogurt", amount: 30, unit: "g" },
          { name: "lettuce", amount: 50, unit: "g" },
        ],
      },
    ],
  },
  gluten_free: {
    breakfast: [
      {
        name: "Gluten-Free Berry Oats Bowl",
        description:
          "Gluten-free rolled oats cooked in almond milk, topped with dynamic mixed berries, chia seeds, and walnut halves.",
        image:
          "https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Espresso",
          description:
            "Double espresso shot brewed from organic Arabica beans.",
          icon: "coffee",
        },
        baseCalories: 440,
        baseProtein: 14,
        baseFat: 16,
        baseCarbs: 64,
        ingredients: [
          { name: "gluten free oats", amount: 80, unit: "g" },
          { name: "almond milk", amount: 200, unit: "ml" },
          { name: "mixed berries", amount: 80, unit: "g" },
          { name: "walnuts", amount: 15, unit: "g" },
        ],
      },
    ],
    lunch: [
      {
        name: "Avocado Chicken Quinoa Salad",
        description:
          "Sautéed chicken strips, cooked quinoa, fresh diced avocado, and cucumber slices tossed in a light cold-pressed olive oil vinaigrette.",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Sparkling Mineral Water",
          description: "Naturally sparkling water from volcanic springs.",
          icon: "local_drink",
        },
        baseCalories: 650,
        baseProtein: 42,
        baseFat: 24,
        baseCarbs: 68,
        ingredients: [
          { name: "chicken breast", amount: 150, unit: "g" },
          { name: "quinoa", amount: 100, unit: "g" },
          { name: "avocado", amount: 80, unit: "g" },
          { name: "cucumber", amount: 100, unit: "g" },
        ],
      },
    ],
    dinner: [
      {
        name: "Pan-Seared Salmon & Asparagus",
        description:
          "Wild salmon fillet seared in coconut oil, served over a rich portion of garlic-roasted asparagus and sweet potato mash.",
        image:
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Herbal Infusion",
          description: "Hibiscus and rosehip tea.",
          icon: "coffee",
        },
        baseCalories: 600,
        baseProtein: 38,
        baseFat: 26,
        baseCarbs: 56,
        ingredients: [
          { name: "salmon fillet", amount: 160, unit: "g" },
          { name: "asparagus", amount: 120, unit: "g" },
          { name: "sweet potato", amount: 150, unit: "g" },
        ],
      },
    ],
    snack: [
      {
        name: "Almond Butter & Apple",
        description:
          "Crisp organic apple slices paired with two tablespoons of pure unrefined almond butter.",
        image:
          "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Water",
          description: "Infused with fresh lemon juice.",
          icon: "local_drink",
        },
        baseCalories: 250,
        baseProtein: 6,
        baseFat: 18,
        baseCarbs: 22,
        ingredients: [
          { name: "apple", amount: 150, unit: "g" },
          { name: "almond butter", amount: 30, unit: "g" },
        ],
      },
    ],
  },
  keto: {
    breakfast: [
      {
        name: "Bacon & Avocado Scramble",
        description:
          "Three farm-fresh organic eggs scrambled in grass-fed butter, mixed with chopped crispy bacon and topped with half a sliced avocado.",
        image:
          "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Bulletproof Coffee",
          description:
            "Black coffee blended with MCT oil and unsalted grass-fed butter.",
          icon: "coffee",
        },
        baseCalories: 600,
        baseProtein: 30,
        baseFat: 52,
        baseCarbs: 6,
        ingredients: [
          { name: "eggs", amount: 150, unit: "g" },
          { name: "bacon", amount: 40, unit: "g" },
          { name: "avocado", amount: 80, unit: "g" },
          { name: "butter", amount: 15, unit: "g" },
        ],
      },
    ],
    lunch: [
      {
        name: "Keto Cobb Salad Bowl",
        description:
          "Diced grilled chicken breast, blue cheese crumbles, boiled egg, crispy bacon pieces, and cherry tomatoes on a bed of fresh romaine lettuce, dressed with extra virgin olive oil.",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Chilled Sparkling Water",
          description: "Carbonated water with a pinch of sea salt.",
          icon: "local_drink",
        },
        baseCalories: 750,
        baseProtein: 48,
        baseFat: 60,
        baseCarbs: 8,
        ingredients: [
          { name: "chicken breast", amount: 150, unit: "g" },
          { name: "bacon", amount: 30, unit: "g" },
          { name: "egg", amount: 50, unit: "g" },
          { name: "olive oil", amount: 25, unit: "ml" },
          { name: "romaine lettuce", amount: 100, unit: "g" },
        ],
      },
    ],
    dinner: [
      {
        name: "Ribeye Steak & Asparagus",
        description:
          "USDA Prime ribeye steak pan-seared in grass-fed garlic butter, served with a side of sautéed asparagus.",
        image:
          "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Warm Lemon Water",
          description: "Warm water with organic lemon juice.",
          icon: "coffee",
        },
        baseCalories: 700,
        baseProtein: 42,
        baseFat: 58,
        baseCarbs: 5,
        ingredients: [
          { name: "ribeye steak", amount: 200, unit: "g" },
          { name: "butter", amount: 20, unit: "g" },
          { name: "asparagus", amount: 100, unit: "g" },
        ],
      },
    ],
    snack: [
      {
        name: "Macadamia Nuts & Cheddar",
        description:
          "Dry roasted macadamia nuts served alongside aged cheddar cheese blocks.",
        image:
          "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=600&auto=format&fit=crop",
        pairing: {
          name: "Water",
          description: "Infused with fresh mint.",
          icon: "local_drink",
        },
        baseCalories: 300,
        baseProtein: 8,
        baseFat: 30,
        baseCarbs: 4,
        ingredients: [
          { name: "macadamia nuts", amount: 30, unit: "g" },
          { name: "cheddar cheese", amount: 30, unit: "g" },
        ],
      },
    ],
  },
};

// Generate Mock Meal Plan based on targets
function generateMockPlan(targetCalories, diet, mealsPerDay) {
  // Safe default for diet key in mock database
  let dietKey = diet ? diet.toLowerCase().replace("-", "_") : "vegetarian";
  if (!MOCK_MEALS_DB[dietKey]) {
    dietKey = "vegetarian"; // Fallback
  }

  const pool = MOCK_MEALS_DB[dietKey];
  const meals = [];

  // Decide calorie ratios and types per meal based on mealsPerDay
  let distribution = [];
  let types = [];

  if (mealsPerDay === 1) {
    distribution = [1.0];
    types = ["lunch"];
  } else if (mealsPerDay === 2) {
    distribution = [0.5, 0.5];
    types = ["breakfast", "dinner"];
  } else if (mealsPerDay === 3) {
    distribution = [0.3, 0.4, 0.3];
    types = ["breakfast", "lunch", "dinner"];
  } else {
    // 4 or more meals
    distribution = [0.25, 0.35, 0.15, 0.25];
    types = ["breakfast", "lunch", "snack", "dinner"];
  }

  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  const tags = {
    breakfast: "Pre-Load",
    lunch: "Anabolic Window",
    snack: "Mid-Day Fuel",
    dinner: "Night Rest",
  };

  const times = {
    breakfast: "08:00 AM",
    lunch: "01:30 PM",
    snack: "05:00 PM",
    dinner: "08:30 PM",
  };

  for (let i = 0; i < distribution.length; i++) {
    const mealType = types[i];
    const targetMealCal = Math.round(targetCalories * distribution[i]);

    // Pick from pool
    const options = pool[mealType] || pool["lunch"];
    const template = options[0]; // grab the primary option

    const scale = targetMealCal / template.baseCalories;

    // Scale ingredients and nutrition
    const scaledIngredients = template.ingredients.map((ing) => ({
      name: ing.name,
      amount: Math.round(ing.amount * scale),
      unit: ing.unit,
    }));

    const scaledNutrition = {
      calories: Math.round(template.baseCalories * scale),
      protein: Math.round(template.baseProtein * scale),
      fat: Math.round(template.baseFat * scale),
      carbohydrates: Math.round(template.baseCarbs * scale),
    };

    totalCalories += scaledNutrition.calories;
    totalProtein += scaledNutrition.protein;
    totalFat += scaledNutrition.fat;
    totalCarbs += scaledNutrition.carbohydrates;

    meals.push({
      mealType: mealType,
      name: template.name,
      time: times[mealType] || "12:00 PM",
      tag: tags[mealType] || "Protocol",
      description: template.description,
      image: template.image,
      nutrition: scaledNutrition,
      ingredients: scaledIngredients,
      pairing: template.pairing,
    });
  }

  return {
    targetCalories: parseInt(targetCalories),
    diet: diet,
    mealsPerDay: parseInt(mealsPerDay),
    totalNutrition: {
      calories: totalCalories,
      protein_g: totalProtein,
      carbohydrates_total_g: totalCarbs,
      fat_total_g: totalFat,
    },
    meals: meals,
  };
}

const INDIAN_INGREDIENTS_DB = {
  paneer: { calories: 265, proteinGrams: 18, carbsGrams: 1.2, fatGrams: 20.8 },
  "toor dal": {
    calories: 343,
    proteinGrams: 22,
    carbsGrams: 58,
    fatGrams: 1.5,
  },
  "moong dal": {
    calories: 348,
    proteinGrams: 24,
    carbsGrams: 59,
    fatGrams: 1.2,
  },
  "masoor dal": {
    calories: 352,
    proteinGrams: 25,
    carbsGrams: 59,
    fatGrams: 1.0,
  },
  ghee: { calories: 883, proteinGrams: 0, carbsGrams: 0, fatGrams: 99.8 },
  "mustard oil": {
    calories: 884,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 100,
  },
  roti: { calories: 120, proteinGrams: 3.5, carbsGrams: 24, fatGrams: 0.8 },
  "multigrain roti": {
    calories: 110,
    proteinGrams: 4,
    carbsGrams: 21,
    fatGrams: 1.0,
  },
  "wheat roti": {
    calories: 120,
    proteinGrams: 3.5,
    carbsGrams: 24,
    fatGrams: 0.8,
  },
  chapati: { calories: 120, proteinGrams: 3.5, carbsGrams: 24, fatGrams: 0.8 },
  "brown rice": {
    calories: 111,
    proteinGrams: 2.6,
    carbsGrams: 23,
    fatGrams: 0.9,
  },
  "white rice": {
    calories: 130,
    proteinGrams: 2.7,
    carbsGrams: 28,
    fatGrams: 0.3,
  },
  rice: { calories: 130, proteinGrams: 2.7, carbsGrams: 28, fatGrams: 0.3 },
  "chicken breast": {
    calories: 165,
    proteinGrams: 31,
    carbsGrams: 0,
    fatGrams: 3.6,
  },
  chicken: { calories: 165, proteinGrams: 31, carbsGrams: 0, fatGrams: 3.6 },
  fish: { calories: 110, proteinGrams: 20, carbsGrams: 0, fatGrams: 3.0 },
  egg: { calories: 143, proteinGrams: 12.6, carbsGrams: 0.7, fatGrams: 9.5 },
  "egg white": {
    calories: 52,
    proteinGrams: 11,
    carbsGrams: 0.7,
    fatGrams: 0.2,
  },
  tofu: { calories: 76, proteinGrams: 8, carbsGrams: 1.9, fatGrams: 4.8 },
  "greek yogurt": {
    calories: 59,
    proteinGrams: 10,
    carbsGrams: 3.6,
    fatGrams: 0.4,
  },
  curd: { calories: 60, proteinGrams: 3.1, carbsGrams: 4.0, fatGrams: 3.3 },
  yogurt: { calories: 60, proteinGrams: 3.1, carbsGrams: 4.0, fatGrams: 3.3 },
  sprouts: { calories: 30, proteinGrams: 3, carbsGrams: 6, fatGrams: 0.2 },
  "soya chunks": {
    calories: 345,
    proteinGrams: 52,
    carbsGrams: 33,
    fatGrams: 0.5,
  },
  "soy chunks": {
    calories: 345,
    proteinGrams: 52,
    carbsGrams: 33,
    fatGrams: 0.5,
  },
  "olive oil": { calories: 884, proteinGrams: 0, carbsGrams: 0, fatGrams: 100 },
  butter: { calories: 717, proteinGrams: 0.9, carbsGrams: 0.1, fatGrams: 81 },
  almonds: { calories: 579, proteinGrams: 21, carbsGrams: 22, fatGrams: 50 },
  "chia seeds": {
    calories: 486,
    proteinGrams: 16.5,
    carbsGrams: 42,
    fatGrams: 30.7,
  },
  oats: { calories: 389, proteinGrams: 16.9, carbsGrams: 66, fatGrams: 6.9 },
  broccoli: { calories: 34, proteinGrams: 2.8, carbsGrams: 7, fatGrams: 0.4 },
  besan: { calories: 387, proteinGrams: 22, carbsGrams: 58, fatGrams: 7 },
  "chickpea flour": {
    calories: 387,
    proteinGrams: 22,
    carbsGrams: 58,
    fatGrams: 7,
  },
  ragi: { calories: 354, proteinGrams: 7.3, carbsGrams: 72, fatGrams: 1.3 },
};

function parseIngredientString(ingStr) {
  const cleanStr = ingStr.trim();
  let normalizedStr = cleanStr.replace(
    /(\d+)\/(\d+)/g,
    (m, num, den) => parseFloat(num) / parseFloat(den),
  );

  const regex = /^([\d.]+)\s*([a-zA-Z]*)\s+(.+)$/;
  const match = normalizedStr.match(regex);
  if (match) {
    let amount = parseFloat(match[1]);
    let unit = match[2].trim();
    let name = match[3].trim();
    if (!unit) {
      unit = "pcs";
    }
    return { amount, unit, name };
  }
  return { amount: 1, unit: "serving", name: cleanStr };
}

function convertToGrams(amount, unit, name) {
  const u = unit.toLowerCase().trim();
  const n = name.toLowerCase().trim();
  if (u === "g" || u === "ml" || u === "grams") return amount;
  if (u === "tbsp" || u === "tablespoon" || u === "tablespoons")
    return amount * 15;
  if (u === "tsp" || u === "teaspoon" || u === "teaspoons") return amount * 5;
  if (u === "cup" || u === "cups") return amount * 200;
  if (u === "bowl" || u === "bowls") return amount * 150;
  if (
    n.includes("roti") ||
    n.includes("chapati") ||
    n.includes("bread") ||
    n.includes("paratha")
  ) {
    return amount * 40;
  }
  if (n.includes("egg")) {
    return amount * 50;
  }
  return amount * 50;
}

function normalizeIngredientName(name) {
  let cleaned = name.toLowerCase().trim();
  cleaned = cleaned.replace(
    /\b(cooked|raw|grilled|boiled|fresh|organic|sliced|chopped|steamed|roasted|pan-seared|marinated|scrambled)\b/g,
    "",
  );
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

async function fetchMealImage(mealName) {
  const query = encodeURIComponent(`${mealName} indian food`);

  if (process.env.UNSPLASH_ACCESS_KEY) {
    try {
      const response = await axios.get(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=1`,
        {
          headers: {
            Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
          },
          timeout: 3000,
        },
      );
      if (
        response.data &&
        response.data.results &&
        response.data.results.length > 0
      ) {
        return response.data.results[0].urls.regular;
      }
    } catch (err) {
      console.error(
        `Unsplash image fetch failed for ${mealName}:`,
        err.message,
      );
    }
  }

  if (process.env.PEXELS_API_KEY) {
    try {
      const response = await axios.get(
        `https://api.pexels.com/v1/search?query=${query}&per_page=1`,
        {
          headers: {
            Authorization: process.env.PEXELS_API_KEY,
          },
          timeout: 3000,
        },
      );
      if (
        response.data &&
        response.data.photos &&
        response.data.photos.length > 0
      ) {
        return response.data.photos[0].src.medium;
      }
    } catch (err) {
      console.error(`Pexels image fetch failed for ${mealName}:`, err.message);
    }
  }

  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop";
}

async function getIngredientNutrition(name) {
  const normName = normalizeIngredientName(name);

  // 1. Try exact match in INDIAN_INGREDIENTS_DB
  if (INDIAN_INGREDIENTS_DB[normName]) {
    return INDIAN_INGREDIENTS_DB[normName];
  }

  // 2. Try partial match in INDIAN_INGREDIENTS_DB (substring search)
  const dbKeys = Object.keys(INDIAN_INGREDIENTS_DB);
  const matchedKey = dbKeys.find(
    (key) => normName.includes(key) || key.includes(normName),
  );
  if (matchedKey) {
    return INDIAN_INGREDIENTS_DB[matchedKey];
  }

  try {
    const cached = await MealNutritionCache.findOne({
      ingredientName: normName,
    });
    if (cached) {
      return {
        calories: cached.calories,
        proteinGrams: cached.proteinGrams,
        carbsGrams: cached.carbsGrams,
        fatGrams: cached.fatGrams,
      };
    }
  } catch (err) {
    console.error(
      `MealNutritionCache lookup failed for ${normName}:`,
      err.message,
    );
  }

  if (process.env.USDA_API_KEY) {
    try {
      const usdaRes = await axios.get(
        "https://api.nal.usda.gov/fdc/v1/foods/search",
        {
          params: {
            query: normName,
            pageSize: 1,
            api_key: process.env.USDA_API_KEY,
          },
          timeout: 1500,
        },
      );

      if (usdaRes.data && usdaRes.data.foods && usdaRes.data.foods.length > 0) {
        const food = usdaRes.data.foods[0];
        const nutrients = food.foodNutrients || [];

        const calories = getNutrientVal(nutrients, [1008], ["energy", "kcal"]);
        const proteinGrams = getNutrientVal(nutrients, [1003], ["protein"]);
        const fatGrams = getNutrientVal(
          nutrients,
          [1004],
          ["total lipid", "fat"],
        );
        const carbsGrams = getNutrientVal(nutrients, [1005], ["carbohydrate"]);

        try {
          const newCache = new MealNutritionCache({
            ingredientName: normName,
            calories,
            proteinGrams,
            carbsGrams,
            fatGrams,
          });
          await newCache.save();
        } catch (saveErr) {
          console.error(
            `Failed to save cache for ${normName}:`,
            saveErr.message,
          );
        }

        return { calories, proteinGrams, carbsGrams, fatGrams };
      }
    } catch (usdaErr) {
      console.error(
        `USDA lookup failed for ingredient ${normName}:`,
        usdaErr.message,
      );
    }
  }

  return {
    calories: 150,
    proteinGrams: 4,
    carbsGrams: 20,
    fatGrams: 5,
  };
}

// Endpoint: Generate Meal Plan
router.post("/plan/generate", async (req, res) => {
  try {
    const { targetCalories, diet, mealsPerDay, refresh } = req.body;

    if (!targetCalories || !diet || !mealsPerDay) {
      return res.status(400).json({
        error: "Missing targetCalories, diet, or mealsPerDay in request",
      });
    }

    const tCals = parseInt(targetCalories);
    const mPerDay = parseInt(mealsPerDay);

    if (!refresh) {
      const cachedPlan = await MealPlanCache.findOne({
        targetCalories: { $gte: tCals - 50, $lte: tCals + 50 },
        diet: diet.toLowerCase(),
        mealsPerDay: mPerDay,
      });

      if (cachedPlan) {
        console.log("Serving meal plan from MealPlanCache (fuzzy match)");
        return res.json(cachedPlan.planData);
      }
    } else {
      console.log("Bypassing MealPlanCache lookup due to refresh request");
    }

    console.log("Executing live Gemini, Unsplash/Pexels, & USDA APIs flow");

    let vegOrNonveg = diet;
    if (diet === "vegetarian" || diet === "vegan") {
      vegOrNonveg = "Vegetarian";
    } else if (diet === "non_vegetarian" || diet === "pescatarian") {
      vegOrNonveg = "Non-Vegetarian";
    } else {
      vegOrNonveg = "Both (Vegetarian/Non-Vegetarian allowed)";
    }

    let extraRules = "";
    if (diet === "vegan") {
      extraRules = "\n- Strictly vegan (no dairy, no honey, no eggs).";
    } else if (diet === "pescatarian") {
      extraRules =
        "\n- Pescatarian (vegetarian diet plus fish/seafood allowed).";
    } else if (diet === "gluten_free") {
      extraRules =
        "\n- Strictly gluten-free (no wheat, barley, rye; use millet, ragi, oats, rice instead).";
    } else if (diet === "keto") {
      extraRules =
        "\n- Strictly ketogenic (high fat, moderate protein, extremely low carbs, no sugar, no grains).";
    }

    const promptText = `You are an expert Indian fitness nutritionist who creates meal plans for gym-goers in India.

Generate a ${mPerDay}-meal Indian diet plan totaling EXACTLY ${tCals} calories for the day. This is a strict requirement — the sum of all meal calories must be between ${tCals - 50} and ${tCals + 100}. Distribute the calories across meals so they add up precisely to this target. Do not exceed ${tCals + 100} total calories under any circumstance.
Diet preference: ${vegOrNonveg}${extraRules}


Rules:
- Target Audience & Vibe: This plan is for a young, modern Indian gym-goer who tracks macros and follows fitness influencers. Meal names and descriptions should sound like something you'd see on a fitness Instagram page — punchy, appetizing, performance-oriented — not like a hospital diet chart. Avoid bland clinical phrasing like "boiled vegetables with curd."
- Target Fitness Macros: Optimize for lean muscle growth/retention. Prioritize high protein density (aim for protein leading every meal description), complex carbs (millets, oats, brown rice, quinoa, multigrain), and clean fats (ghee, olive oil, almonds, peanut butter).
- Protein Sourcing: If non-vegetarian, emphasize egg whites, chicken breast, fish, and prawns — rotate sources across meals instead of repeating chicken breast every time. If vegetarian, use high-yield sources like low-fat paneer, soy chunks/nuggets, sprouts, tofu, Greek yogurt, and whey if a snack/shake meal is included (avoid basic dahi/dal loops, and avoid relying on lentils alone for protein since they're carb-heavy).
- Modern Gym Staples: Where appropriate, weave in foods common in current Indian fitness culture — peanut butter, protein shakes/smoothies, overnight oats, Greek yogurt bowls, egg white bhurji, makhana, roasted chana, sprinkled flax/chia seeds — alongside traditional staples, so the plan feels current rather than generic.
- Authenticity & Portions: Use realistic Indian portions with precise measurements (e.g., "150g grilled chicken breast", "50g boiled soy chunks", "1 large multigrain roti", "30g whey protein scoop") — portions should look like they came from a macro-tracking app, not a vague home-cooking guess.
- Flavor & Prep Style: Favor grilled, sautéed, stir-fried, or air-fried preparations over deep-fried or excessively oily ones. Use bold, appealing flavor cues (e.g., "peri-peri", "tandoori spiced", "garlic chili") to keep meals exciting, while keeping the cooking method lean.
- Each meal must include: meal name, short description, estimated calories, protein (g), carbs (g), fat (g), and 3-5 ingredient list with portions.
- Calorie & Macro Spread: Balance macronutrients logically across all meals based on the total daily target — front-load protein and carbs around the meal closest to a workout if context allows, and ensure protein is spread fairly evenly rather than dumped into one meal.
- Variety: Avoid repeating the same hero ingredient (e.g., paneer, chicken breast) in back-to-back meals; rotate across the day for variety.
- Searchable Names: Keep meal names short, distinct, and searchable (2-4 words maximum) to map cleanly to a stock photo API (e.g., "Egg Podi Oats", "Peri Peri Paneer Bowl", "Tandoori Soy Chunks").

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
}`;

    // Commented out Gemini block for history:
    // if (!process.env.GEMINI_API_KEY) {
    //   throw new Error('GEMINI_API_KEY environment variable is not defined.');
    // }
    //
    // let geminiRes;
    // const modelsToTry = [
    //   'gemini-3.5-flash',
    //   'gemini-2.5-flash',
    //   'gemini-2.0-flash',
    //   'gemini-flash-latest'
    // ];
    // let lastGeminiError = null;
    //
    // for (const modelName of modelsToTry) {
    //   try {
    //     console.log(`Trying Gemini model: ${modelName}`);
    //     geminiRes = await axios.post(
    //       `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    //       {
    //         contents: [{ parts: [{ text: promptText }] }],
    //         generationConfig: {
    //           responseMimeType: "application/json"
    //         }
    //       },
    //       { timeout: 20000 } // 20s timeout per attempt
    //     );
    //
    //     if (
    //       geminiRes.data.candidates &&
    //       geminiRes.data.candidates.length > 0 &&
    //       geminiRes.data.candidates[0].content &&
    //       geminiRes.data.candidates[0].content.parts &&
    //       geminiRes.data.candidates[0].content.parts.length > 0
    //     ) {
    //       console.log(`Successfully generated meal plan using model: ${modelName}`);
    //       break;
    //     }
    //   } catch (err) {
    //     console.error(`Gemini model ${modelName} failed:`, err.response?.data || err.message);
    //     lastGeminiError = err;
    //     geminiRes = null; // Reset to ensure fallback continues
    //   }
    // }
    //
    // if (!geminiRes) {
    //   throw lastGeminiError || new Error('All Gemini model fallbacks failed.');
    // }
    //
    // let geminiRawText = geminiRes.data.candidates[0].content.parts[0].text;
    // geminiRawText = geminiRawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    //
    // const geminiPlan = JSON.parse(geminiRawText);
    // if (!geminiPlan.meals || !Array.isArray(geminiPlan.meals)) {
    //   throw new Error('Gemini API returned an invalid meal plan structure.');
    // }

    if (!process.env.OPENROUTER_API_KEY) {
      console.log("No OPENROUTER_API_KEY found, falling back to mock plan");
      const mockPlan = generateMockPlan(tCals, diet, mPerDay);
      const newCache = new MealPlanCache({
        targetCalories: tCals,
        diet: diet.toLowerCase(),
        mealsPerDay: mPerDay,
        planData: mockPlan,
      });
      await newCache
        .save()
        .catch((e) => console.error("Cache save failed:", e.message));
      return res.json(mockPlan);
    }

    let aiResponseText = null;
    let aiError = null;

    // const openRouterModels = [
    //   'meta-llama/llama-3.3-70b-instruct:free',
    //   'meta-llama/llama-3.1-8b-instruct:free',
    //   'qwen/qwen3-8b:free'
    // ];

    const openRouterModels = [
      "google/gemma-4-26b-a4b:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "nousresearch/hermes-3-405b-instruct:free",
      "openrouter/auto:free",
    ];

    for (const model of openRouterModels) {
      try {
        console.log(`Trying OpenRouter model: ${model}`);
        const orRes = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: model,
            messages: [{ role: "user", content: promptText }],
            response_format: { type: "json_object" },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://bodymatrix.app",
            },
            timeout: 30000,
          },
        );

        const content = orRes.data?.choices?.[0]?.message?.content;
        if (content) {
          aiResponseText = content
            .replace(/^```json\s*/i, "")
            .replace(/```$/, "")
            .trim();
          console.log(`OpenRouter success with model: ${model}`);
          break;
        }
      } catch (err) {
        console.error(
          `OpenRouter model ${model} failed:`,
          err.response?.data || err.message,
        );
        aiError = err;
      }
    }

    // If all AI models failed, fall back to mock plan instead of crashing
    if (!aiResponseText) {
      console.log(
        "All AI models failed or quota exceeded. Falling back to mock plan.",
      );
      const mockPlan = generateMockPlan(tCals, diet, mPerDay);
      const newCache = new MealPlanCache({
        targetCalories: tCals,
        diet: diet.toLowerCase(),
        mealsPerDay: mPerDay,
        planData: mockPlan,
      });
      await newCache
        .save()
        .catch((e) => console.error("Cache save failed:", e.message));
      return res.json(mockPlan);
    }

    const geminiPlan = JSON.parse(aiResponseText);
    if (!geminiPlan.meals || !Array.isArray(geminiPlan.meals)) {
      console.log("AI returned invalid structure. Falling back to mock plan.");
      const mockPlan = generateMockPlan(tCals, diet, mPerDay);
      return res.json(mockPlan);
    }

    const times = ["08:00 AM", "01:30 PM", "05:00 PM", "08:30 PM"];
    const tags = ["Pre-Load", "Anabolic Window", "Mid-Day Fuel", "Night Rest"];

    // Map each meal from Gemini to a promise resolving to the final meal object
    const mealPromises = geminiPlan.meals.map(async (meal, i) => {
      const slot = meal.meal_slot ? meal.meal_slot.toLowerCase() : "lunch";

      const time =
        slot === "breakfast"
          ? "08:00 AM"
          : slot === "lunch"
            ? "01:30 PM"
            : slot === "snack"
              ? "05:00 PM"
              : slot === "dinner"
                ? "08:30 PM"
                : times[i] || "12:00 PM";

      const tag =
        slot === "breakfast"
          ? "Pre-Load"
          : slot === "lunch"
            ? "Anabolic Window"
            : slot === "snack"
              ? "Mid-Day Fuel"
              : slot === "dinner"
                ? "Night Rest"
                : tags[i] || "Protocol";

      // Parallelize fetching of meal image and processing of all ingredients for this meal
      const imagePromise = fetchMealImage(meal.name);

      const ingredients = meal.ingredients || [];
      const ingredientPromises = ingredients.map(async (ingStr) => {
        const parsed = parseIngredientString(ingStr);
        const amount = parsed.amount;
        const unit = parsed.unit;
        const name = parsed.name;

        try {
          const nutData = await getIngredientNutrition(name);
          const grams = convertToGrams(amount, unit, name);
          const scaleFactor = grams / 100;

          const ingCals = Math.round(nutData.calories * scaleFactor);
          const ingProt = Math.round(nutData.proteinGrams * scaleFactor);
          const ingFat = Math.round(nutData.fatGrams * scaleFactor);
          const ingCarb = Math.round(nutData.carbsGrams * scaleFactor);

          return {
            name,
            amount: Math.round(amount * 100) / 100,
            unit,
            ingCals,
            ingProt,
            ingFat,
            ingCarb,
          };
        } catch (ingErr) {
          console.error(
            `Error fetching nutrition for ingredient ${name}:`,
            ingErr.message,
          );
          // Fallback values if fetching nutrition fails completely
          return {
            name,
            amount: Math.round(amount * 100) / 100,
            unit,
            ingCals: 0,
            ingProt: 0,
            ingFat: 0,
            ingCarb: 0,
          };
        }
      });

      const [imageUrl, processedIngredients] = await Promise.all([
        imagePromise,
        Promise.all(ingredientPromises),
      ]);

      const ingredientsList = [];
      let recipeCalories = 0;
      let recipeProtein = 0;
      let recipeFat = 0;
      let recipeCarbs = 0;

      for (const ing of processedIngredients) {
        recipeCalories += ing.ingCals;
        recipeProtein += ing.ingProt;
        recipeFat += ing.ingFat;
        recipeCarbs += ing.ingCarb;

        ingredientsList.push({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        });
      }

      // Always trust AI-provided macro values as the source of truth.
      // Ingredient-level recalculation is unreliable due to lookup fallbacks.
      recipeCalories = meal.calories || recipeCalories || 300;
      recipeProtein = meal.protein_g || recipeProtein || 15;
      recipeFat = meal.fat_g || recipeFat || 8;
      recipeCarbs = meal.carbs_g || recipeCarbs || 30;

      let pairing = {
        name: "Mineral Water",
        description: "Sparkling spring water with lime.",
        icon: "local_drink",
      };
      if (slot === "breakfast") {
        pairing = {
          name: "Protein Coffee Pairing",
          description: "Whey-infused cold brew for immediate cognitive focus.",
          icon: "coffee",
        };
      } else if (slot === "lunch") {
        pairing = {
          name: "Spiced Buttermilk",
          description:
            "Chilled probiotic blend with ginger to accelerate digestion.",
          icon: "local_drink",
        };
      } else if (slot === "dinner") {
        pairing = {
          name: "Chamomile Tea",
          description: "Warm chamomile herbal tea to promote restful recovery.",
          icon: "coffee",
        };
      }

      return {
        mealType: slot,
        name: meal.name,
        time: time,
        tag: tag,
        description:
          meal.description || "Premium meal tailored to performance macros.",
        image: imageUrl,
        nutrition: {
          calories: recipeCalories,
          protein: recipeProtein,
          fat: recipeFat,
          carbohydrates: recipeCarbs,
        },
        ingredients: ingredientsList,
        pairing: pairing,
      };
    });

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
      console.log(
        `Calorie overshoot detected: ${totalCalories} vs target ${tCals}. Scaling down.`,
      );
      const scaleFactor = tCals / totalCalories;

      for (const meal of generatedMeals) {
        meal.nutrition.calories = Math.round(
          meal.nutrition.calories * scaleFactor,
        );
        meal.nutrition.protein = Math.round(
          meal.nutrition.protein * scaleFactor,
        );
        meal.nutrition.fat = Math.round(meal.nutrition.fat * scaleFactor);
        meal.nutrition.carbohydrates = Math.round(
          meal.nutrition.carbohydrates * scaleFactor,
        );
        meal.ingredients = meal.ingredients.map((ing) => ({
          ...ing,
          amount: Math.round(ing.amount * scaleFactor * 10) / 10,
        }));
      }

      // Recompute totals after scaling
      totalCalories = generatedMeals.reduce(
        (s, m) => s + m.nutrition.calories,
        0,
      );
      totalProtein = generatedMeals.reduce(
        (s, m) => s + m.nutrition.protein,
        0,
      );
      totalFat = generatedMeals.reduce((s, m) => s + m.nutrition.fat, 0);
      totalCarbs = generatedMeals.reduce(
        (s, m) => s + m.nutrition.carbohydrates,
        0,
      );
    }

    const finalPlan = {
      targetCalories: tCals,
      diet: diet,
      mealsPerDay: mPerDay,
      totalNutrition: {
        calories: totalCalories,
        protein_g: totalProtein,
        carbohydrates_total_g: totalCarbs,
        fat_total_g: totalFat,
      },
      meals: generatedMeals,
    };

    const newCache = new MealPlanCache({
      targetCalories: tCals,
      diet: diet.toLowerCase(),
      mealsPerDay: mPerDay,
      planData: finalPlan,
    });
    await newCache.save();

    res.json(finalPlan);
  } catch (error) {
    console.error(
      "Error generating meal plan:",
      error.response?.data || error.message || error,
    );
    const errorDetails =
      error.response?.data?.error?.message || error.message || "Server error";
    res
      .status(500)
      .json({ error: `Server error generating meal plan: ${errorDetails}` });
  }
});

module.exports = router;
