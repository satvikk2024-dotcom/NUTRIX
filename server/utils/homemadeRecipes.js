// Deterministic homemade-recipe generator. We don't call an LLM or add any
// dependency, so recipes come from a small keyword-matched knowledge base of
// common packaged-food categories, each with a realistic-ish per-serving macro
// and cost estimate (INR). A generic whole-food fallback covers anything that
// doesn't match a category. All numbers are clearly labelled as estimates on
// the frontend.
//
// Each recipe normalises its comparison to `servingGrams` so the packaged
// product (whose nutrients arrive per 100g) can be scaled to the same serving
// for a fair side-by-side. Macros below are PER SERVING already:
//   calories kcal, protein/carbs/fat/sugar grams, sodium milligrams.

const RECIPES = [
  {
    match: ['oreo', 'cookie', 'biscuit', 'choco chip', 'digestive'],
    title: 'Homemade Oat & Banana Cookies',
    servingDesc: '2 cookies (~40g)',
    servingGrams: 40,
    ingredients: [
      '1 cup rolled oats',
      '1 ripe banana, mashed',
      '2 tbsp honey or jaggery',
      '1 tbsp peanut butter',
      'A pinch of cinnamon',
    ],
    steps: [
      'Mash the banana, then stir in honey and peanut butter.',
      'Fold in the oats and cinnamon until a sticky dough forms.',
      'Spoon onto a lined tray and flatten into cookie shapes.',
      'Bake at 180°C for 12–15 minutes until golden.',
    ],
    macros: { calories: 150, protein: 4, carbs: 24, fat: 5, sugar: 9, sodium: 40 },
    homemadeCostINR: 12,
    packagedCostINR: 25,
  },
  {
    match: ['chips', 'crisp', 'wafer', 'nachos', 'kurkure'],
    title: 'Oven-Baked Potato Crisps',
    servingDesc: '1 small bowl (~30g)',
    servingGrams: 30,
    ingredients: [
      '1 large potato, very thinly sliced',
      '1 tsp olive oil',
      'Salt and pepper to taste',
      'A pinch of chilli or chaat masala',
    ],
    steps: [
      'Soak the potato slices in cold water for 10 minutes, then pat dry.',
      'Toss with oil and seasoning.',
      'Spread in a single layer on a tray.',
      'Bake at 200°C for 15–20 minutes, flipping once, until crisp.',
    ],
    macros: { calories: 120, protein: 2, carbs: 18, fat: 4, sugar: 1, sodium: 120 },
    homemadeCostINR: 10,
    packagedCostINR: 20,
  },
  {
    match: ['chocolate', 'choco', 'candy', 'gems', 'kitkat', 'dairy milk'],
    title: 'Dark Chocolate Energy Balls',
    servingDesc: '2 balls (~30g)',
    servingGrams: 30,
    ingredients: [
      '6 soft dates, pitted',
      '2 tbsp cocoa powder',
      '2 tbsp almonds or peanuts',
      '1 tsp coconut oil',
    ],
    steps: [
      'Blend the dates and nuts into a coarse paste.',
      'Mix in cocoa powder and coconut oil.',
      'Roll into bite-sized balls.',
      'Chill for 20 minutes before serving.',
    ],
    macros: { calories: 140, protein: 3, carbs: 16, fat: 8, sugar: 10, sodium: 15 },
    homemadeCostINR: 18,
    packagedCostINR: 40,
  },
  {
    match: ['cola', 'soda', 'soft drink', 'pepsi', 'coke', 'juice', 'drink', 'fanta', 'sprite'],
    title: 'Fresh Citrus Cooler',
    servingDesc: '1 glass (~250ml)',
    servingGrams: 250,
    ingredients: [
      'Juice of 1 lemon or 1 orange',
      '1 cup water or soda',
      '1 tsp honey',
      'A few mint leaves',
      'Ice cubes',
    ],
    steps: [
      'Squeeze the citrus juice into a glass.',
      'Stir in honey until dissolved.',
      'Top with water or soda and add mint.',
      'Serve over ice.',
    ],
    macros: { calories: 70, protein: 1, carbs: 17, fat: 0, sugar: 14, sodium: 10 },
    homemadeCostINR: 12,
    packagedCostINR: 40,
  },
  {
    match: ['noodle', 'maggi', 'ramen', 'pasta', 'macaroni'],
    title: 'Veggie Whole-Wheat Noodles',
    servingDesc: '1 bowl (~100g cooked)',
    servingGrams: 100,
    ingredients: [
      '1 portion whole-wheat noodles',
      '1 cup mixed vegetables (carrot, beans, capsicum)',
      '1 tsp oil',
      'Soy sauce, garlic and pepper to taste',
    ],
    steps: [
      'Boil the noodles until just tender and drain.',
      'Sauté garlic and vegetables in oil.',
      'Toss in the noodles with soy sauce and pepper.',
      'Stir-fry for 2 minutes and serve hot.',
    ],
    macros: { calories: 220, protein: 7, carbs: 38, fat: 5, sugar: 3, sodium: 320 },
    homemadeCostINR: 25,
    packagedCostINR: 14,
  },
  {
    match: ['bread', 'bun', 'loaf', 'pav'],
    title: 'Whole-Wheat Soft Bread',
    servingDesc: '2 slices (~50g)',
    servingGrams: 50,
    ingredients: [
      '2 cups whole-wheat flour',
      '1 tsp instant yeast',
      '1 tsp sugar',
      '1 tsp salt',
      '3/4 cup warm water, 1 tbsp oil',
    ],
    steps: [
      'Mix yeast and sugar into warm water; rest 5 minutes.',
      'Knead with flour, salt and oil into a soft dough.',
      'Let it rise for 1 hour, then shape into a loaf tin.',
      'Bake at 200°C for 25–30 minutes.',
    ],
    macros: { calories: 130, protein: 5, carbs: 24, fat: 2, sugar: 2, sodium: 200 },
    homemadeCostINR: 8,
    packagedCostINR: 14,
  },
  {
    match: ['peanut butter', 'spread', 'nutella', 'jam', 'butter'],
    title: 'Two-Ingredient Peanut Butter',
    servingDesc: '1 tbsp (~20g)',
    servingGrams: 20,
    ingredients: [
      '1 cup roasted unsalted peanuts',
      'A pinch of salt',
      '1 tsp honey (optional)',
    ],
    steps: [
      'Blend the peanuts on high, scraping down the sides.',
      'Keep blending until oils release and it turns creamy.',
      'Add salt and honey to taste.',
      'Store in an airtight jar.',
    ],
    macros: { calories: 110, protein: 5, carbs: 4, fat: 9, sugar: 1, sodium: 40 },
    homemadeCostINR: 10,
    packagedCostINR: 25,
  },
  {
    match: ['ice cream', 'frozen dessert', 'kulfi'],
    title: 'Banana Nice Cream',
    servingDesc: '1 scoop (~80g)',
    servingGrams: 80,
    ingredients: [
      '2 frozen bananas',
      '2 tbsp milk or curd',
      '1 tsp cocoa or vanilla',
      'A few chopped nuts',
    ],
    steps: [
      'Blend the frozen bananas with milk until smooth.',
      'Add cocoa or vanilla and blend again.',
      'Fold in chopped nuts.',
      'Freeze for 30 minutes for a firmer scoop.',
    ],
    macros: { calories: 120, protein: 2, carbs: 26, fat: 1, sugar: 16, sodium: 20 },
    homemadeCostINR: 15,
    packagedCostINR: 40,
  },
  {
    match: ['cereal', 'cornflakes', 'muesli', 'granola', 'oats'],
    title: 'Homemade Oat Muesli',
    servingDesc: '1 bowl (~40g)',
    servingGrams: 40,
    ingredients: [
      '1 cup rolled oats',
      '2 tbsp mixed nuts and seeds',
      '1 tbsp raisins or chopped dates',
      '1 tsp honey, pinch of cinnamon',
    ],
    steps: [
      'Lightly toast the oats and nuts on a dry pan.',
      'Cool, then mix in raisins and cinnamon.',
      'Drizzle with a little honey and toss.',
      'Store airtight; serve with milk or curd.',
    ],
    macros: { calories: 150, protein: 5, carbs: 27, fat: 3, sugar: 6, sodium: 10 },
    homemadeCostINR: 12,
    packagedCostINR: 30,
  },
  {
    match: ['namkeen', 'sev', 'mixture', 'bhujia', 'chivda', 'snack'],
    title: 'Roasted Poha Chivda',
    servingDesc: '1 small bowl (~30g)',
    servingGrams: 30,
    ingredients: [
      '1 cup thick poha (flattened rice)',
      '2 tbsp roasted peanuts',
      '1 tsp oil, curry leaves, turmeric',
      'Salt and a pinch of sugar',
    ],
    steps: [
      'Dry-roast the poha until crisp; set aside.',
      'Temper oil with curry leaves, peanuts and turmeric.',
      'Toss in the poha with salt and sugar.',
      'Cool fully before storing.',
    ],
    macros: { calories: 130, protein: 4, carbs: 18, fat: 5, sugar: 2, sodium: 150 },
    homemadeCostINR: 8,
    packagedCostINR: 18,
  },
];

const GENERIC = {
  title: 'Fresh Whole-Food Version',
  servingDesc: '1 serving (~100g)',
  servingGrams: 100,
  ingredients: [
    'Fresh whole ingredients of your choice (grains, vegetables, fruit or legumes)',
    'Minimal oil and natural sweeteners (honey/jaggery)',
    'Herbs and spices instead of packaged flavouring',
  ],
  steps: [
    'Pick the closest fresh, whole ingredients to the packaged item.',
    'Cook simply — boil, bake or sauté with a little oil.',
    'Season with herbs and spices rather than additives.',
    'Make a small batch and store airtight.',
  ],
  macros: { calories: 180, protein: 6, carbs: 28, fat: 5, sugar: 6, sodium: 100 },
  homemadeCostINR: 20,
  packagedCostINR: 35,
};

const round1 = (n) => Math.round((n || 0) * 10) / 10;

// packagedNutrients are PER 100g: { calories, protein, carbs, fat, sugar, sodium(g) }.
const generateHomemade = (name, packagedNutrients = {}) => {
  const lower = (name || '').toLowerCase();
  const recipe = RECIPES.find((r) => r.match.some((k) => lower.includes(k))) || GENERIC;

  const factor = recipe.servingGrams / 100;
  const pkg = {
    calories: round1((packagedNutrients.calories || 0) * factor),
    protein: round1((packagedNutrients.protein || 0) * factor),
    carbs: round1((packagedNutrients.carbs || 0) * factor),
    fat: round1((packagedNutrients.fat || 0) * factor),
    sugar: round1((packagedNutrients.sugar || 0) * factor),
    // OFF sodium is grams per 100g — present as mg per serving to match homemade.
    sodium: Math.round((packagedNutrients.sodium || 0) * factor * 1000),
  };

  const rows = [
    { label: 'Calories', unit: 'kcal', homemade: recipe.macros.calories, packaged: pkg.calories },
    { label: 'Protein', unit: 'g', homemade: recipe.macros.protein, packaged: pkg.protein },
    { label: 'Carbs', unit: 'g', homemade: recipe.macros.carbs, packaged: pkg.carbs },
    { label: 'Fat', unit: 'g', homemade: recipe.macros.fat, packaged: pkg.fat },
    { label: 'Sugar', unit: 'g', homemade: recipe.macros.sugar, packaged: pkg.sugar },
    { label: 'Sodium', unit: 'mg', homemade: recipe.macros.sodium, packaged: pkg.sodium },
  ];

  return {
    food: name || 'this food',
    matched: recipe !== GENERIC,
    recipe: {
      title: recipe.title,
      servingDesc: recipe.servingDesc,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    },
    perServing: recipe.macros,
    comparison: {
      note: 'Estimated values per comparable serving.',
      servingDesc: recipe.servingDesc,
      rows,
      cost: { homemade: recipe.homemadeCostINR, packaged: recipe.packagedCostINR, unit: 'INR' },
    },
  };
};

module.exports = { generateHomemade };
