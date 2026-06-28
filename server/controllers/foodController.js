const axios = require('axios');
const { calculateHealthScore } = require('../utils/healthScore');
const { checkDietSuitability } = require('../utils/dietChecker');
const { generateHomemade } = require('../utils/homemadeRecipes');

// OpenFoodFacts blocks/rate-limits requests that send axios's default
// User-Agent (returns HTML "temporarily unavailable" pages or 503s instead
// of JSON), so every request needs an identifying UA.
const OFF_HEADERS = { 'User-Agent': 'NUTRIX-NutritionApp/1.0 (satvik.k2024@gmail.com)' };
const OFF_TIMEOUT = 10000;
const ALT_FIELDS = 'code,product_name,brands,image_url,nutriscore_grade,nutrient_levels,nova_group,nutriments,ingredients_text,ingredients_tags,allergens_tags,additives_tags';
const MAX_CATEGORY_ATTEMPTS = 6;

// OpenFoodFacts intermittently returns 503s on otherwise-valid requests
// (~50% of the time on some endpoints) — a couple of immediate retries
// clears most of them without adding noticeable latency on success.
const offGet = async (url, retries = 2) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await axios.get(url, { headers: OFF_HEADERS, timeout: OFF_TIMEOUT });
    } catch (err) {
      if (err.response?.status !== 503 || attempt === retries) throw err;
    }
  }
};

// OpenFoodFacts nutriment values often come back with long floating-point
// tails (e.g. 590.285714285714) from unit conversions — round to 1 decimal
// for display.
const round1 = (n) => Math.round((n || 0) * 10) / 10;

const tokenize = (s) => (s || '').toLowerCase().match(/[a-z0-9]+/g) || [];

// search-a-licious's relevance ranking runs across many fields (including
// ingredients/generic name), so a multi-word query like "sundrop peanut
// butter" can rank an unrelated "peanut butter"-flavoured snack above the
// actual Sundrop product. Re-rank the top hits by how many query words
// actually appear in the product name/brand — the signal a user means when
// they type a brand + product name. If nothing overlaps at all (e.g. a pure
// typo like "bananna"), trust search-a-licious's own top relevance result.
const pickBestMatch = (hits, query) => {
  if (!hits?.length) return null;
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return hits[0];

  let best = hits[0];
  let bestOverlap = -1;
  for (const hit of hits) {
    const haystack = new Set(tokenize(`${hit.product_name || ''} ${hit.brands || ''}`));
    const overlap = queryTokens.filter((t) => haystack.has(t)).length;
    if (overlap > bestOverlap || (overlap === bestOverlap && (hit._score || 0) > (best._score || 0))) {
      bestOverlap = overlap;
      best = hit;
    }
  }
  return bestOverlap > 0 ? best : hits[0];
};

// Extract the per-100g nutrients we care about from a raw OFF product record.
const nutrientsFromRaw = (rawData) => ({
  calories: round1(rawData.nutriments?.['energy-kcal_100g']),
  protein: round1(rawData.nutriments?.proteins_100g),
  carbs: round1(rawData.nutriments?.carbohydrates_100g),
  sugar: round1(rawData.nutriments?.sugars_100g),
  fat: round1(rawData.nutriments?.fat_100g),
  sodium: round1(rawData.nutriments?.sodium_100g),
});

// Fallback used by the homemade endpoint when the caller doesn't pass the
// already-fetched nutrients: look the product up by name (same search-a-licious
// + full-product flow as searchFood) and return its per-100g nutrients.
const fetchNutrientsByName = async (name) => {
  const searchUrl = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(name)}&page_size=24`;
  const searchRes = await offGet(searchUrl);
  const hit = pickBestMatch(searchRes.data.hits, name);
  if (!hit?.code) return null;

  const productUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(hit.code)}.json`;
  const productRes = await offGet(productUrl);
  if (productRes.data.status === 0 || !productRes.data.product) return null;
  return nutrientsFromRaw(productRes.data.product);
};

exports.searchFood = async (req, res) => {
  const { query, type, forbidden } = req.query;

  try {
    // 1. FETCH MAIN PRODUCT
    let rawData;

    if (type === 'barcode') {
      const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(query)}.json`;
      const response = await offGet(url);
      if (response.data.status === 0 || !response.data.product) {
        return res.status(404).json({ message: 'Food not found' });
      }
      rawData = response.data.product;
    } else {
      // The legacy cgi/search.pl endpoint is heavily rate-limited and not
      // typo-tolerant. search-a-licious (Elasticsearch-backed) handles
      // misspellings and is far more reliable.
      const searchUrl = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=24`;
      const searchRes = await offGet(searchUrl);
      const hit = pickBestMatch(searchRes.data.hits, query);
      if (!hit?.code) return res.status(404).json({ message: 'Food not found' });

      // The search index doesn't include ingredients/allergens/additives,
      // so fetch the full product record for the matched barcode.
      const productUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(hit.code)}.json`;
      const productRes = await offGet(productUrl);
      if (productRes.data.status === 0 || !productRes.data.product) {
        return res.status(404).json({ message: 'Food not found' });
      }
      rawData = productRes.data.product;
    }

    // 2. PROCESS MAIN PRODUCT
    const processedFood = {
      barcode: rawData.code || 'N/A',
      name: rawData.product_name || 'Unknown Food',
      brand: rawData.brands || 'Unknown Brand',
      image: rawData.image_url,
      nutriScore: rawData.nutriscore_grade || 'unknown',
      ecoScore: rawData.ecoscore_grade || 'unknown',
      ingredientsText: rawData.ingredients_text || 'Ingredients not listed.',
      ingredients: rawData.ingredients_tags || [],
      allergens: rawData.allergens_tags || [],
      additives: rawData.additives_tags?.map((t) => t.replace('en:', '').toUpperCase()) || [],
      nutrientLevels: rawData.nutrient_levels || {},
      nutrients: nutrientsFromRaw(rawData),
    };

    // 3. CHECK SUITABILITY + SCORE
    const forbiddenList = forbidden ? forbidden.split(',') : [];
    const suitability = checkDietSuitability(processedFood, forbiddenList);
    const healthScore = calculateHealthScore(rawData);

    // 4. FIND ALTERNATIVE (if unsuitable or scoring poorly)
    let alternative = null;

    if (!suitability.isSuitable || healthScore < 60) {
      // categories_tags is ordered broad -> specific. Search the most
      // specific categories first so suggestions stay on-topic (e.g. a
      // peanut butter shouldn't get suggested a loaf of bread).
      const categoryTags = [...(rawData.categories_tags || [])].reverse().slice(0, MAX_CATEGORY_ATTEMPTS);

      for (const tag of categoryTags) {
        let candidates;
        try {
          const altUrl = `https://world.openfoodfacts.org/api/v2/search?categories_tags=${encodeURIComponent(tag)}&sort_by=popularity&page_size=20&fields=${ALT_FIELDS}&json=true`;
          const altRes = await offGet(altUrl);
          candidates = altRes.data.products || [];
        } catch (err) {
          console.error(`Alternative search failed for category ${tag}:`, err.message);
          continue;
        }

        for (const item of candidates) {
          if (!item.code || item.code === processedFood.barcode) continue;

          const itemProcessed = {
            name: item.product_name || '',
            brand: item.brands || '',
            ingredientsText: item.ingredients_text || '',
            ingredients: item.ingredients_tags || [],
            allergens: item.allergens_tags || [],
            additives: item.additives_tags || [],
          };
          const altSuitability = checkDietSuitability(itemProcessed, forbiddenList);

          // If the original was unsafe, the alternative must fix that.
          if (!suitability.isSuitable && !altSuitability.isSuitable) continue;

          const altScore = calculateHealthScore(item);
          if (altScore <= healthScore) continue; // must be a genuine improvement

          if (!alternative || altScore > alternative.score) {
            alternative = {
              name: item.product_name || 'Unknown product',
              brand: item.brands || '',
              image: item.image_url,
              nutriScore: item.nutriscore_grade,
              score: altScore,
              calories: item.nutriments?.['energy-kcal_100g'],
              barcode: item.code,
              reason: !suitability.isSuitable
                ? `Doesn't contain your flagged ingredients and scores ${altScore} vs ${healthScore}.`
                : `A healthier choice in the same category — scores ${altScore} vs ${healthScore}.`,
            };
          }
        }

        if (alternative) break;
      }
    }

    // 5. SEND RESPONSE
    res.json({
      source: 'api',
      data: processedFood,
      customScore: healthScore,
      suitability,
      alternative,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/v1/food/homemade?name=<foodName>&calories=&protein=&carbs=&fat=&sugar=&sodium=
// Generates a homemade-recipe alternative for a low-scoring product. The
// frontend passes the per-100g nutrients it already fetched (so we don't hit
// OFF again); if they're absent we look the product up by name as a fallback.
exports.getHomemade = async (req, res) => {
  const { name, calories, protein, carbs, fat, sugar, sodium } = req.query;

  if (!name) return res.status(400).json({ message: 'name is required' });

  try {
    const num = (v) => (v === undefined || v === '' ? undefined : Number(v));
    const passed = {
      calories: num(calories),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
      sugar: num(sugar),
      sodium: num(sodium),
    };

    let nutrients = passed;
    const anyPassed = Object.values(passed).some((v) => v !== undefined && !Number.isNaN(v));
    if (!anyPassed) {
      nutrients = (await fetchNutrientsByName(name)) || {};
    }

    res.json(generateHomemade(name, nutrients));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
