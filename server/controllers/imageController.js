const { analyzeImage } = require('../utils/ollamaClient');
const { geminiAnalyzeImage, isGeminiAvailable } = require('../utils/geminiClient');

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const IMAGE_PROMPT = `You are a nutrition expert. Identify the food item(s) in this image and provide detailed nutritional information.

Return ONLY a valid JSON object with these exact fields:
{
  "name": "name of the food",
  "description": "brief 1-2 sentence description",
  "estimatedIngredients": ["ingredient1", "ingredient2"],
  "estimatedNutrition": {
    "calories": number (kcal per serving),
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "sugar": number (grams),
    "sodium": number (grams, NOT mg — most foods 0.01-0.5g),
    "fiber": number (grams)
  },
  "servingSize": "estimated serving size description",
  "confidence": "high" or "medium" or "low",
  "hygieneCategory": "fresh_produce" if raw fruit/vegetable/herb, otherwise "other",
  "washInstructions": "specific washing instructions if fresh produce, otherwise null",
  "storageAdvice": "storage advice if fresh produce, otherwise null"
}

Be accurate with nutrition estimates. Return ONLY valid JSON, no other text.`;

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

    res.json({ source: `ai-vision-${source}`, data: normalizeResult(result) });
  } catch (error) {
    console.error('Image analysis failed:', error.message);
    res.status(500).json({ message: 'Failed to analyze image. Please try again.' });
  }
};
