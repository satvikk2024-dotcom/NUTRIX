const { generateText, isOllamaRunning } = require('./ollamaClient');
const { geminiEstimateNutrition, isGeminiAvailable } = require('./geminiClient');

const estimateNutrition = async (productName, brand) => {
  // Gemini first (more accurate)
  if (isGeminiAvailable()) {
    try {
      const result = await geminiEstimateNutrition(productName, brand);
      if (result && result.nutrients?.calories > 0) {
        result._source = 'gemini';
        return result;
      }
    } catch (err) {
      console.error('Gemini nutrition failed:', err.message);
    }
  }

  // Ollama fallback
  if (!(await isOllamaRunning())) return null;

  const prompt = `You are a precise nutrition database. Give accurate nutrition data for this food product.

Product: ${productName}
Brand: ${brand || 'generic'}

Return ONLY valid JSON:
{"name":"exact product name","brand":"brand name","ingredientsText":"comma-separated ingredients list","nutrients":{"calories":0,"protein":0,"carbs":0,"sugar":0,"fat":0,"sodium":0.05,"fiber":0},"nutrientLevels":{"fat":"low","saturated-fat":"low","sugars":"low","salt":"low"},"nutriScore":"a","novaGroup":1,"servingSize":"per 100g","confidence":"high"}

CRITICAL RULES:
- All values are per 100g
- sodium MUST be in GRAMS not milligrams. Most foods have 0.01-0.5g sodium per 100g. Even very salty foods rarely exceed 2g.
- calories in kcal, protein/carbs/sugar/fat/fiber in grams
- nutriScore: a (healthiest) to e (least healthy)
- novaGroup: 1-4 (1=unprocessed, 4=ultra-processed)
- nutrientLevels: "low", "moderate", or "high" per EU traffic light thresholds
- Use real nutritional data for known products. Be accurate.
- confidence: "high" for well-known products, "medium" for estimates
Return ONLY the JSON.`;

  const result = await generateText(prompt);
  if (result) result._source = 'ollama';
  return result;
};

module.exports = { estimateNutrition };
