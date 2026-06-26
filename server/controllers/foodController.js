const axios = require('axios');
const { calculateHealthScore } = require('../utils/healthScore');
const { checkDietSuitability } = require('../utils/dietChecker');
const { checkAdditives, calculateTransparencyScore } = require('../utils/safetyChecker');
const { generateHomemadeAlternative } = require('../utils/homemadeGenerator');
const { estimateNutrition } = require('../utils/nutritionEstimator');

const OFF_HEADERS = { 'User-Agent': 'NUTRIX-NutritionApp/1.0 (satvik.k2024@gmail.com)' };
const OFF_TIMEOUT = 10000;

const offGet = async (url, retries = 2) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await axios.get(url, { headers: OFF_HEADERS, timeout: OFF_TIMEOUT });
    } catch (err) {
      if (err.response?.status !== 503 || attempt === retries) throw err;
    }
  }
};

const round1 = (n) => Math.round((n || 0) * 10) / 10;
const tokenize = (s) => (s || '').toLowerCase().match(/[a-z0-9]+/g) || [];

const hasUsableNutrition = (rawData) => {
  const n = rawData?.nutriments;
  if (!n) return false;
  const cal = n['energy-kcal_100g'] || 0;
  const protein = n.proteins_100g || 0;
  const carbs = n.carbohydrates_100g || 0;
  const fat = n.fat_100g || 0;
  return (cal > 0 || protein > 0 || carbs > 0 || fat > 0);
};

const buildProcessedFood = (rawData) => ({
  barcode: rawData.code || 'N/A',
  name: rawData.product_name || 'Unknown Food',
  brand: rawData.brands || 'Unknown Brand',
  image: rawData.image_url || null,
  nutriScore: rawData.nutriscore_grade || 'unknown',
  ecoScore: rawData.ecoscore_grade || 'unknown',
  ingredientsText: rawData.ingredients_text || 'Ingredients not listed.',
  ingredients: rawData.ingredients_tags || [],
  allergens: rawData.allergens_tags || [],
  additives: rawData.additives_tags?.map((t) => t.replace('en:', '').toUpperCase()) || [],
  nutrientLevels: rawData.nutrient_levels || {},
  nutrients: {
    calories: round1(rawData.nutriments?.['energy-kcal_100g']),
    protein: round1(rawData.nutriments?.proteins_100g),
    carbs: round1(rawData.nutriments?.carbohydrates_100g),
    sugar: round1(rawData.nutriments?.sugars_100g),
    fat: round1(rawData.nutriments?.fat_100g),
    sodium: round1(rawData.nutriments?.sodium_100g),
  },
});

const buildFromAI = (aiData, query) => {
  // AI models often return sodium in mg instead of g. Sodium per 100g
  // rarely exceeds 2g even for salty foods (soy sauce ~6g is extreme).
  let sodium = aiData.nutrients?.sodium || 0;
  if (sodium > 6) sodium = sodium / 1000;

  return {
    barcode: 'N/A',
    name: aiData.name || query,
    brand: aiData.brand || 'Unknown Brand',
    image: null,
    nutriScore: aiData.nutriScore || 'unknown',
    ecoScore: 'unknown',
    ingredientsText: aiData.ingredientsText || 'AI-estimated ingredients.',
    ingredients: [],
    allergens: [],
    additives: [],
    nutrientLevels: aiData.nutrientLevels || {},
    nutrients: {
      calories: round1(aiData.nutrients?.calories),
      protein: round1(aiData.nutrients?.protein),
      carbs: round1(aiData.nutrients?.carbs),
      sugar: round1(aiData.nutrients?.sugar),
      fat: round1(aiData.nutrients?.fat),
      sodium: round1(sodium),
    },
  };
};

const healthScoreFromAI = (aiData) => {
  let score = 100;
  const grade = (aiData.nutriScore || 'c').toLowerCase();
  const penalties = { a: 0, b: 8, c: 18, d: 30, e: 42 };
  score -= penalties[grade] || 18;

  const levels = aiData.nutrientLevels || {};
  for (const key of ['fat', 'saturated-fat', 'sugars', 'salt']) {
    const lvl = (levels[key] || '').toLowerCase();
    if (lvl === 'high') score -= 8;
    else if (lvl === 'moderate') score -= 3;
  }

  const nova = aiData.novaGroup || 1;
  if (nova === 4) score -= 12;
  else if (nova === 3) score -= 4;

  return Math.max(0, Math.min(100, score));
};

exports.searchFood = async (req, res) => {
  const { query, type, forbidden, country } = req.query;

  try {
    let processedFood;
    let healthScore;
    let source = 'ai';
    let rawData = null;

    if (type === 'barcode') {
      // BARCODE: always use OFF (barcodes need exact DB lookup)
      const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(query)}.json`;
      const response = await offGet(url);
      if (response.data.status === 0 || !response.data.product) {
        return res.status(404).json({ message: 'Food not found' });
      }
      rawData = response.data.product;

      if (hasUsableNutrition(rawData)) {
        processedFood = buildProcessedFood(rawData);
        healthScore = calculateHealthScore(rawData);
        source = 'off';
      } else {
        // OFF has the product but no nutrition — use AI to fill in
        const name = rawData.product_name || query;
        const brand = rawData.brands || '';
        const aiData = await estimateNutrition(name, brand);
        if (aiData) {
          processedFood = buildFromAI(aiData, name);
          processedFood.barcode = rawData.code;
          processedFood.image = rawData.image_url || null;
          processedFood.brand = rawData.brands || aiData.brand || 'Unknown Brand';
          healthScore = healthScoreFromAI(aiData);
          source = 'ai';
        } else {
          processedFood = buildProcessedFood(rawData);
          healthScore = calculateHealthScore(rawData);
          source = 'off';
        }
      }
    } else {
      // NAME SEARCH: AI first, OFF as fallback
      const aiData = await estimateNutrition(query, '').catch(() => null);

      if (aiData && aiData.nutrients?.calories > 0) {
        processedFood = buildFromAI(aiData, query);
        healthScore = healthScoreFromAI(aiData);
        source = 'ai';

        // Try to get image from OFF — only if product name closely matches
        try {
          const searchUrl = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=10`;
          const searchRes = await offGet(searchUrl);
          const hits = searchRes.data.hits || [];
          const qTokens = new Set(tokenize(query));
          const match = hits.find((h) => {
            if (!h.image_url) return false;
            const nameSet = new Set(tokenize(`${h.product_name || ''} ${h.brands || ''}`));
            return [...qTokens].every((t) => nameSet.has(t));
          });
          if (match) {
            processedFood.image = match.image_url;
            if (match.code) processedFood.barcode = match.code;
          }
        } catch {}
      } else {
        // AI failed — fall back to OFF
        const searchUrl = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=50`;
        const searchRes = await offGet(searchUrl);
        const hits = searchRes.data.hits || [];
        const queryTokens = tokenize(query);

        let best = hits[0] || null;
        let bestScore = -1;
        for (const hit of hits) {
          const haystack = new Set(tokenize(`${hit.product_name || ''} ${hit.brands || ''}`));
          let overlap = queryTokens.filter((t) => haystack.has(t)).length;
          const countries = (hit.countries_tags || []).map((c) => c.toLowerCase());
          if (countries.includes(`en:${country || 'india'}`)) overlap += 0.5;
          if (overlap > bestScore || (overlap === bestScore && (hit._score || 0) > (best?._score || 0))) {
            bestScore = overlap;
            best = hit;
          }
        }

        if (!best?.code) return res.status(404).json({ message: 'Food not found' });

        const productUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(best.code)}.json`;
        const productRes = await offGet(productUrl);
        if (productRes.data.status === 0 || !productRes.data.product) {
          return res.status(404).json({ message: 'Food not found' });
        }
        rawData = productRes.data.product;
        processedFood = buildProcessedFood(rawData);
        healthScore = calculateHealthScore(rawData);
        source = 'off';
      }
    }

    // CHECK SUITABILITY + SAFETY
    const forbiddenList = forbidden ? forbidden.split(',') : [];
    const suitability = checkDietSuitability(processedFood, forbiddenList);
    const safetyWarnings = checkAdditives(processedFood.additives);
    const transparencyScore = calculateTransparencyScore(
      processedFood.ingredientsText,
      processedFood.additives.map((a) => `en:${a.toLowerCase()}`)
    );

    // FIND ALTERNATIVE (OFF-based, only if we have rawData)
    let alternative = null;
    if (rawData && (!suitability.isSuitable || healthScore < 60)) {
      const ALT_FIELDS = 'code,product_name,brands,image_url,nutriscore_grade,nutrient_levels,nova_group,nutriments,ingredients_text,ingredients_tags,allergens_tags,additives_tags';
      const categoryTags = [...(rawData.categories_tags || [])].reverse().slice(0, 6);

      for (const tag of categoryTags) {
        let candidates;
        try {
          const altUrl = `https://world.openfoodfacts.org/api/v2/search?categories_tags=${encodeURIComponent(tag)}&sort_by=popularity&page_size=20&fields=${ALT_FIELDS}&json=true`;
          const altRes = await offGet(altUrl);
          candidates = altRes.data.products || [];
        } catch (err) {
          continue;
        }

        for (const item of candidates) {
          if (!item.code || item.code === processedFood.barcode) continue;
          const itemProcessed = {
            name: item.product_name || '', brand: item.brands || '',
            ingredientsText: item.ingredients_text || '', ingredients: item.ingredients_tags || [],
            allergens: item.allergens_tags || [], additives: item.additives_tags || [],
          };
          const altSuitability = checkDietSuitability(itemProcessed, forbiddenList);
          if (!suitability.isSuitable && !altSuitability.isSuitable) continue;
          const altScore = calculateHealthScore(item);
          if (altScore <= healthScore) continue;
          if (!alternative || altScore > alternative.score) {
            alternative = {
              name: item.product_name || 'Unknown product', brand: item.brands || '',
              image: item.image_url, nutriScore: item.nutriscore_grade, score: altScore,
              calories: item.nutriments?.['energy-kcal_100g'], barcode: item.code,
              reason: !suitability.isSuitable
                ? `Doesn't contain your flagged ingredients and scores ${altScore} vs ${healthScore}.`
                : `A healthier choice in the same category — scores ${altScore} vs ${healthScore}.`,
            };
          }
        }
        if (alternative) break;
      }
    }

    res.json({
      source,
      data: processedFood,
      customScore: healthScore,
      suitability,
      alternative,
      safetyWarnings,
      transparencyScore,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getHomemadeAlternative = async (req, res) => {
  const { name, brand, ingredientsText, calories, protein, carbs, sugar, fat, sodium } = req.query;
  if (!name) return res.status(400).json({ message: 'Product name is required' });

  try {
    const productData = {
      name: name || 'Unknown', brand: brand || 'Unknown', ingredientsText: ingredientsText || '',
      nutrients: {
        calories: parseFloat(calories) || 0, protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0, sugar: parseFloat(sugar) || 0,
        fat: parseFloat(fat) || 0, sodium: parseFloat(sodium) || 0,
      },
    };
    const result = await generateHomemadeAlternative(productData);
    if (!result) return res.status(503).json({ message: 'Ollama is not running' });
    res.json(result);
  } catch (err) {
    console.error('Homemade generation failed:', err.message);
    if (err.message?.includes('timed out')) {
      return res.status(504).json({ message: 'Recipe generation timed out. Try again.' });
    }
    res.status(500).json({ message: 'Failed to generate recipe' });
  }
};
