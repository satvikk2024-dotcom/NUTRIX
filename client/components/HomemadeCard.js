import { useState } from 'react';
import { ChefHat, Clock, ChevronDown, ChevronUp, Check, DollarSign, ArrowDown, ArrowUp, Minus } from 'lucide-react';

const DIFFICULTY_STYLES = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const CompareValue = ({ label, storeBought, homemade, unit, lowerIsBetter = true }) => {
  const diff = homemade - storeBought;
  const isBetter = lowerIsBetter ? diff < 0 : diff > 0;
  const isSame = Math.abs(diff) < 0.1;

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-24">{label}</span>
      <span className="text-sm text-slate-500 dark:text-slate-400 w-20 text-center">
        {storeBought}{unit}
      </span>
      <span className={`text-sm font-bold w-20 text-center ${isSame ? 'text-slate-500' : isBetter ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
        {homemade}{unit}
      </span>
      <span className="w-5">
        {isSame ? <Minus size={14} className="text-slate-400" /> :
          isBetter ? <ArrowDown size={14} className="text-green-500" /> :
          <ArrowUp size={14} className="text-red-500" />}
      </span>
    </div>
  );
};

export default function HomemadeCard({ data }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!data) return null;

  const { recipeName, ingredients, estimatedTotalCost, estimatedCostPerServing, servings,
    estimatedNutrition, prepTime, difficulty, instructions, comparison, healthBenefits } = data;

  const comp = comparison || {};
  const sb = comp.storeBought || {};
  const hm = comp.homemade || {};

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 bg-emerald-600 rounded-full text-white shrink-0">
          <ChefHat size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-emerald-700 dark:text-emerald-300 text-sm mb-1">
            Make It at Home
          </h4>
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-white leading-snug">
            {recipeName}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.medium}`}>
              {difficulty}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock size={12} /> {prepTime}
            </span>
            {servings && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {servings} servings
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cost Comparison */}
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl mb-3">
        <DollarSign size={18} className="text-emerald-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Cost per serving: {estimatedCostPerServing || hm.costPerServing || '—'}
          </p>
          <p className="text-xs text-slate-400">
            Total recipe cost: {estimatedTotalCost || '—'}
          </p>
        </div>
      </div>

      {/* Nutrition Comparison Table */}
      {(sb.calories !== undefined || hm.calories !== undefined) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-slate-200 dark:border-slate-600">
            <span className="text-xs font-bold text-slate-400 uppercase w-24">Nutrient</span>
            <span className="text-xs font-bold text-slate-400 uppercase w-20 text-center">Store</span>
            <span className="text-xs font-bold text-emerald-500 uppercase w-20 text-center">Home</span>
            <span className="w-5" />
          </div>
          <CompareValue label="Calories" storeBought={sb.calories} homemade={hm.calories || estimatedNutrition?.calories} unit=" kcal" />
          <CompareValue label="Sugar" storeBought={sb.sugar} homemade={hm.sugar || estimatedNutrition?.sugar} unit="g" />
          <CompareValue label="Fat" storeBought={sb.fat} homemade={hm.fat || estimatedNutrition?.fat} unit="g" />
          <CompareValue label="Sodium" storeBought={sb.sodium} homemade={hm.sodium || estimatedNutrition?.sodium} unit="g" />
          <CompareValue label="Protein" storeBought={sb.protein} homemade={hm.protein || estimatedNutrition?.protein} unit="g" lowerIsBetter={false} />
        </div>
      )}

      {/* Health Benefits */}
      {healthBenefits?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {healthBenefits.map((benefit, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full">
              <Check size={12} /> {benefit}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition pt-2"
      >
        {showDetails ? 'Hide' : 'Show'} Recipe Details
        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showDetails && (
        <div className="mt-3 space-y-3 animate-fade-in-down">
          {/* Ingredients */}
          {ingredients?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ingredients</h4>
              <ul className="space-y-1.5">
                {ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">
                      {ing.name} — <span className="text-slate-400">{ing.amount}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{ing.estimatedCost}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {instructions && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {instructions}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
