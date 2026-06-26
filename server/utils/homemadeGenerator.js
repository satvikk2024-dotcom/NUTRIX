const { generateText, isOllamaRunning } = require('./ollamaClient');
const { geminiHomemadeAlternative, isGeminiAvailable } = require('./geminiClient');

const generateHomemadeAlternative = async (productData, retries = 1) => {
  // Gemini first
  if (isGeminiAvailable()) {
    try {
      const result = await geminiHomemadeAlternative(productData);
      if (result && result.recipeName) return result;
    } catch (err) {
      console.error('Gemini homemade failed:', err.message);
    }
  }

  // Ollama fallback
  if (!(await isOllamaRunning())) return null;

  const prompt = `You are a nutrition expert. Create a healthier homemade version of this product.

Product: ${productData.name} by ${productData.brand}
Ingredients: ${productData.ingredientsText}
Nutrition per 100g: ${productData.nutrients.calories}kcal, ${productData.nutrients.protein}g protein, ${productData.nutrients.carbs}g carbs, ${productData.nutrients.sugar}g sugar, ${productData.nutrients.fat}g fat

Respond with ONLY valid JSON, no other text:
{"recipeName":"string","ingredients":[{"name":"string","amount":"string","estimatedCost":"string"}],"estimatedTotalCost":"string","estimatedCostPerServing":"string","servings":4,"estimatedNutrition":{"calories":0,"protein":0,"carbs":0,"sugar":0,"fat":0,"sodium":0},"prepTime":"string","difficulty":"easy","instructions":"string","comparison":{"storeBought":{"calories":${productData.nutrients.calories},"protein":${productData.nutrients.protein},"sugar":${productData.nutrients.sugar},"fat":${productData.nutrients.fat},"sodium":${productData.nutrients.sodium},"costPerServing":"$0.30"},"homemade":{"calories":0,"protein":0,"sugar":0,"fat":0,"sodium":0,"costPerServing":"$0.00"}},"healthBenefits":["string"]}

Fill in all values with realistic data. The homemade version must be healthier. Return ONLY the JSON object.`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await generateText(prompt);
    } catch (err) {
      if (attempt === retries) throw err;
    }
  }
};

module.exports = { generateHomemadeAlternative };
