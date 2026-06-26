const { geminiEstimateNutrition, isGeminiAvailable } = require('../utils/geminiClient');
const { generateText, isOllamaRunning } = require('../utils/ollamaClient');
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.getSuggestions = async (req, res) => {
  const { mealSummary, goals, profile } = req.body;

  if (!mealSummary) return res.status(400).json({ message: 'Meal summary required' });

  const prompt = `You are a certified nutritionist. Based on this person's meal data from the past week, provide personalized, actionable nutrition advice.

PERSON:
Age: ${profile?.age || 'unknown'}, Weight: ${profile?.weight || 'unknown'}kg, Height: ${profile?.height || 'unknown'}cm
Sex: ${profile?.sex || 'unknown'}, Activity: ${profile?.activityLevel || 'moderate'}

DAILY GOALS:
Calories: ${goals?.calories || 2000}kcal, Protein: ${goals?.protein || 50}g, Carbs: ${goals?.carbs || 250}g, Fat: ${goals?.fat || 65}g

LAST 7 DAYS MEALS:
${mealSummary}

Give 4-5 specific, practical suggestions. Be direct and friendly. Focus on:
1. Are they meeting their goals? What's lacking?
2. Specific foods to add or reduce
3. Meal timing advice
4. Any nutritional gaps visible from the data

Keep it concise — bullet points, no fluff. Use Indian food examples where relevant.`;

  try {
    let suggestions = null;

    if (isGeminiAvailable()) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        suggestions = result.response.text();
      } catch (err) {
        console.error('Gemini suggestions failed:', err.message);
      }
    }

    if (!suggestions && await isOllamaRunning()) {
      try {
        const response = await require('../utils/ollamaClient').ollama.chat({
          model: process.env.OLLAMA_TEXT_MODEL || 'qwen2.5:7b',
          messages: [{ role: 'user', content: prompt }],
        });
        suggestions = response.message.content;
      } catch (err) {
        console.error('Ollama suggestions failed:', err.message);
      }
    }

    if (!suggestions) return res.status(503).json({ message: 'AI service unavailable' });
    res.json({ suggestions });
  } catch (err) {
    console.error('Suggestions failed:', err.message);
    res.status(500).json({ message: 'Failed to generate suggestions' });
  }
};
