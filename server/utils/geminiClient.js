const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

const extractJSON = (text) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in response');
  let jsonStr = text.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    jsonStr = jsonStr
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\x00-\x1f]/g, ' ')
      .replace(/\\'/g, "'");
    return JSON.parse(jsonStr);
  }
};

const geminiEstimateNutrition = async (productName, brand) => {
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `You are a precise nutrition database. Give accurate nutrition data for this food product.

Product: ${productName}
Brand: ${brand || 'generic'}

Return ONLY valid JSON:
{"name":"exact product name","brand":"brand name","ingredientsText":"comma-separated ingredients list","nutrients":{"calories":0,"protein":0,"carbs":0,"sugar":0,"fat":0,"sodium":0.05,"fiber":0},"nutrientLevels":{"fat":"low","saturated-fat":"low","sugars":"low","salt":"low"},"nutriScore":"a","novaGroup":1,"servingSize":"per 100g","confidence":"high"}

CRITICAL RULES:
- All values are per 100g
- sodium MUST be in GRAMS (most foods: 0.01-0.5g, salty foods: 0.5-2g max)
- calories in kcal, protein/carbs/sugar/fat/fiber in grams
- nutriScore: a (healthiest) to e (least healthy)
- novaGroup: 1=unprocessed, 2=processed ingredients, 3=processed, 4=ultra-processed
- nutrientLevels: "low", "moderate", or "high" per EU traffic light thresholds
- Use real nutritional data for known branded products. Be very accurate.
- For Indian brands (SuperYou, The Whole Truth, YogaBar, Amul, Cosmix, Raw Pressery, Happilo, etc.), use their actual product nutrition labels.
- confidence: "high" for well-known products, "medium" for estimates
Return ONLY the JSON object, no other text.`;

  const result = await model.generateContent(prompt);
  return extractJSON(result.response.text());
};

const geminiAnalyzeImage = async (base64Image, mediaType) => {
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `You are a nutrition expert. Identify the food item(s) in this image and provide detailed nutritional information.

Return ONLY a valid JSON object:
{"name":"food name","description":"brief description","estimatedIngredients":["ingredient1","ingredient2"],"estimatedNutrition":{"calories":0,"protein":0,"carbs":0,"fat":0,"sugar":0,"sodium":0.05,"fiber":0},"servingSize":"estimated serving size","confidence":"high","hygieneCategory":"fresh_produce or other","washInstructions":"washing instructions if fresh produce, null otherwise","storageAdvice":"storage advice if fresh produce, null otherwise"}

RULES:
- All nutrition values per serving
- sodium in GRAMS (0.01-0.5g typical)
- Be accurate with portion size estimation from the image
- confidence: high/medium/low based on how clearly you can identify the food
- hygieneCategory: "fresh_produce" only for raw fruits/vegetables/herbs
Return ONLY the JSON.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType: mediaType, data: base64Image } },
  ]);
  return extractJSON(result.response.text());
};

const geminiHomemadeAlternative = async (productData) => {
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `Create a healthier homemade version of this product.

Product: ${productData.name} by ${productData.brand}
Ingredients: ${productData.ingredientsText}
Nutrition per 100g: ${productData.nutrients.calories}kcal, ${productData.nutrients.protein}g protein, ${productData.nutrients.carbs}g carbs, ${productData.nutrients.sugar}g sugar, ${productData.nutrients.fat}g fat

Return ONLY valid JSON:
{"recipeName":"string","ingredients":[{"name":"string","amount":"string","estimatedCost":"string"}],"estimatedTotalCost":"string","estimatedCostPerServing":"string","servings":4,"estimatedNutrition":{"calories":0,"protein":0,"carbs":0,"sugar":0,"fat":0,"sodium":0},"prepTime":"string","difficulty":"easy","instructions":"string","comparison":{"storeBought":{"calories":${productData.nutrients.calories},"protein":${productData.nutrients.protein},"sugar":${productData.nutrients.sugar},"fat":${productData.nutrients.fat},"sodium":${productData.nutrients.sodium},"costPerServing":"$0.30"},"homemade":{"calories":0,"protein":0,"sugar":0,"fat":0,"sodium":0,"costPerServing":"$0.00"}},"healthBenefits":["string"]}

Fill all values with realistic data. Homemade must be healthier. Use Indian Rupee prices if the product is Indian. Return ONLY JSON.`;

  const result = await model.generateContent(prompt);
  return extractJSON(result.response.text());
};

const isGeminiAvailable = () => !!genAI;

module.exports = { geminiEstimateNutrition, geminiAnalyzeImage, geminiHomemadeAlternative, isGeminiAvailable };
