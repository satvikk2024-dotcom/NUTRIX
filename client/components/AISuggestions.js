import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function AISuggestions({ weeklyData, goals, profile }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const daysWithData = weeklyData.filter((d) => d.count > 0);
      const mealSummary = daysWithData.length > 0
        ? daysWithData.map((d) => `${d.day}: ${d.calories}cal, ${d.protein}g protein, ${d.carbs}g carbs, ${d.fat}g fat`).join('\n')
        : 'No meals logged yet. Give general nutrition advice for a beginner.';

      const res = await fetch('http://localhost:5055/api/v1/food/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealSummary,
          goals: { calories: goals.calories, protein: goals.protein, carbs: goals.carbs, fat: goals.fat },
          profile: { age: profile.age, weight: profile.weight, height: profile.height, sex: profile.sex, activityLevel: profile.activityLevel },
        }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch {
      setSuggestions('Could not generate suggestions. Make sure Ollama or Gemini is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Sparkles size={15} className="text-purple-500" /> AI Nutrition Coach
        </h3>
        <button onClick={fetchSuggestions} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
        >
          {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {loading ? 'Thinking...' : suggestions ? 'Refresh' : 'Get Advice'}
        </button>
      </div>

      {suggestions ? (
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {suggestions}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">
          Tap "Get Advice" for personalized nutrition suggestions based on your meal history and goals.
        </p>
      )}
    </div>
  );
}
