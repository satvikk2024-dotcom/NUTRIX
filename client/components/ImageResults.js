import { Flame, Wheat, Beef, Candy, Droplets, Refrigerator, Sparkles, Info, X, Plus } from 'lucide-react';

const CONFIDENCE_STYLES = {
  high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const MACRO_COLORS = {
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
};

const MacroCard = ({ icon: Icon, label, value, unit, color, highlight }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 flex flex-col items-center text-center gap-2 ${highlight ? 'ring-2 ring-red-400' : ''}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${MACRO_COLORS[color]}`}>
      <Icon size={18} />
    </div>
    <p className="text-lg font-extrabold leading-none text-slate-800 dark:text-white">
      {value || 0}<span className="text-xs font-medium text-slate-400 ml-0.5">{unit}</span>
    </p>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
  </div>
);

export default function ImageResults({ data, onClose, onLogToDiary }) {
  if (!data?.data) return null;

  const { name, description, estimatedIngredients, estimatedNutrition, servingSize, confidence, hygieneCategory, washInstructions, storageAdvice } = data.data;
  const n = estimatedNutrition || {};

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">AI Food Analysis</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition">
            <X size={18} />
          </button>
        </div>

        <h2 className="font-extrabold text-xl text-slate-800 dark:text-white leading-snug">{name}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>

        <div className="flex items-center gap-2 mt-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CONFIDENCE_STYLES[confidence] || CONFIDENCE_STYLES.low}`}>
            {confidence?.charAt(0).toUpperCase() + confidence?.slice(1)} confidence
          </span>
          <span className="text-xs text-slate-400">
            {servingSize}
          </span>
        </div>

        {/* Log to Diary */}
        {onLogToDiary && (
          <button
            onClick={() => onLogToDiary(name, n)}
            className="w-full flex items-center justify-center gap-2 py-2.5 mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-300 font-bold text-sm rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition active:scale-[0.98]"
          >
            <Plus size={16} /> Log to Diary
          </button>
        )}
      </div>

      {/* Macros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MacroCard icon={Flame} label="Calories" value={n.calories} unit="kcal" color="slate" />
        <MacroCard icon={Wheat} label="Carbs" value={n.carbs} unit="g" color="blue" />
        <MacroCard icon={Beef} label="Protein" value={n.protein} unit="g" color="rose" />
        <MacroCard icon={Candy} label="Sugar" value={n.sugar} unit="g" color="amber" highlight={n.sugar > 10} />
      </div>

      {/* Detailed Nutrition */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Estimated Nutrition</h3>
        <div className="space-y-2">
          {[
            { label: 'Calories', value: n.calories, unit: 'kcal' },
            { label: 'Protein', value: n.protein, unit: 'g' },
            { label: 'Carbohydrates', value: n.carbs, unit: 'g' },
            { label: 'Fat', value: n.fat, unit: 'g' },
            { label: 'Sugar', value: n.sugar, unit: 'g', highlight: n.sugar > 10 },
            { label: 'Sodium', value: Math.round((n.sodium || 0) * 1000), unit: 'mg' },
            { label: 'Fiber', value: n.fiber, unit: 'g' },
          ].map((row, i) => (
            <div key={row.label} className={`flex items-center justify-between py-2 ${i < 6 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{row.label}</span>
              <span className={`text-sm font-bold ${row.highlight ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                {row.value || 0}{row.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Ingredients */}
      {estimatedIngredients?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info size={15} /> Estimated Ingredients
          </h3>
          <div className="flex flex-wrap gap-2">
            {estimatedIngredients.map((ing, i) => (
              <span key={i} className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full">
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hygiene Tips for Fresh Produce */}
      {hygieneCategory === 'fresh_produce' && (washInstructions || storageAdvice) && (
        <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/40 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-teal-700 dark:text-teal-300 flex items-center gap-2 mb-3">
            <Droplets size={16} /> Hygiene & Storage Tips
          </h3>
          {washInstructions && (
            <div className="mb-3">
              <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">Washing</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{washInstructions}</p>
            </div>
          )}
          {storageAdvice && (
            <div>
              <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Refrigerator size={12} /> Storage
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{storageAdvice}</p>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-center text-slate-400 italic px-4">
        These are AI estimates based on visual analysis — not verified lab data. Actual nutrition may vary.
      </p>
    </div>
  );
}
