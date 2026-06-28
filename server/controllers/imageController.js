const { analyzeImage } = require('../utils/ollamaClient');
const { geminiAnalyzeImage, isGeminiAvailable } = require('../utils/geminiClient');
const { findMatch } = require('../utils/indianFoodDB');

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const IMAGE_PROMPT = `You are a nutrition expert specializing in Indian cuisine. Identify the food item(s) in this image.

IMPORTANT: This app is used in India. Look carefully for Indian dishes like:
- Rice dishes: dal chawal, rajma chawal, kadhi chawal, curd rice, biryani, pulao, khichdi, lemon rice
- Bread: roti, chapati, naan, paratha, puri, bhatura, dosa, uttapam, appam
- Curries: dal (toor/moong/masoor/chana), rajma, chole, paneer butter masala, palak paneer, aloo gobi, bhindi, baingan
- Snacks: samosa, pakora, vada pav, pav bhaji, chaat, bhel puri, dhokla, kachori, jalebi
- Drinks: chai, lassi, buttermilk, nimbu pani
- Thali: identify individual items on the plate separately

If you see rice with a curry/dal on the side or mixed together, identify the SPECIFIC dish (e.g. "Dal Chawal" not just "rice with sauce").

Return ONLY a valid JSON object:
{"name":"specific food name","description":"brief description","estimatedIngredients":["ingredient1","ingredient2"],"estimatedNutrition":{"calories":0,"protein":0,"carbs":0,"fat":0,"sugar":0,"sodium":0.05,"fiber":0},"servingSize":"estimated serving size","confidence":"high","hygieneCategory":"other","washInstructions":null,"storageAdvice":null}

Rules:
- All nutrition values per serving, sodium in GRAMS (0.01-0.5g typical)
- For plates with multiple items, name the combination (e.g. "Rajma Chawal with Salad")
- hygieneCategory: "fresh_produce" ONLY for raw fruits/vegetables
Return ONLY the JSON.`;

const normalizeResult = (result) => ({
  name: result.name || 'Unknown Food',
  description: result.description || '',
  estimatedIngredients: result.estimatedIngredients || [],
  estimatedNutrition: {
    calories: result.estimatedNutrition?.calories || 0,
    protein: result.estimatedNutrition?.protein || 0,
    carbs: result.estimatedNutrition?.carbs || 0,
    fat: result.estimatedNutrition?.fat || 0,
    sugar: result.estimatedNutrition?.sugar || 0,
    sodium: (() => {
      let s = result.estimatedNutrition?.sodium || 0;
      if (s > 6) s = s / 1000;
      return s;
    })(),
    fiber: result.estimatedNutrition?.fiber || 0,
  },
  servingSize: result.servingSize || 'Standard serving',
  confidence: result.confidence || 'low',
  hygieneCategory: result.hygieneCategory || 'other',
  washInstructions: result.washInstructions || null,
  storageAdvice: result.storageAdvice || null,
});

exports.analyzeImage = async (req, res) => {
  try {
    const { image, mediaType } = req.body;

    if (!image || !mediaType) {
      return res.status(400).json({ message: 'Image data and mediaType are required' });
    }
    if (!VALID_TYPES.includes(mediaType)) {
      return res.status(400).json({ message: `Invalid mediaType. Supported: ${VALID_TYPES.join(', ')}` });
    }

    let result = null;
    let source = 'ollama';

    // Gemini first
    if (isGeminiAvailable()) {
      try {
        result = await geminiAnalyzeImage(image, mediaType);
        source = 'gemini';
      } catch (err) {
        console.error('Gemini image analysis failed:', err.message);
      }
    }

    // Ollama fallback
    if (!result) {
      try {
        result = await analyzeImage(image, IMAGE_PROMPT);
        source = 'ollama';
      } catch (err) {
        console.error('Ollama image analysis failed:', err.message);

        if (err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch failed')) {
          return res.status(503).json({ message: 'AI service unavailable. Ensure Ollama is running: ollama serve' });
        }
        if (err.message?.includes('not found') || err.message?.includes('pull')) {
          return res.status(503).json({ message: 'Vision model not installed. Run: ollama pull llava:7b' });
        }
        return res.status(500).json({ message: 'Failed to analyze image. Please try again.' });
      }
    }

    const normalized = normalizeResult(result);

    // Cross-reference with Indian food database for accurate nutrition
    const dbMatch = findMatch(normalized.name, normalized.description);
    if (dbMatch) {
      normalized.name = dbMatch.name;
      normalized.description = dbMatch.description;
      normalized.estimatedIngredients = dbMatch.ingredients;
      normalized.estimatedNutrition = dbMatch.nutrition;
      normalized.servingSize = dbMatch.serving;
      normalized.confidence = 'high';
    }

    res.json({ source: `ai-vision-${source}`, data: normalized });
  } catch (error) {
    console.error('Image analysis failed:', error.message);
    res.status(500).json({ message: 'Failed to analyze image. Please try again.' });
  }
};
