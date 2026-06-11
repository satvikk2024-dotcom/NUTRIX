import { useState, useRef } from 'react';
import Head from 'next/head';
import axios from 'axios';
import {
  Search, Scan, Leaf, AlertCircle, Settings, Moon, Sun, ChevronRight, X, Info,
  Sparkles, Home as HomeIcon, Flame, Wheat, Beef, Candy
} from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';

export default function Home() {
  // --- STATE ---
  const [query, setQuery] = useState('');
  const [foodData, setFoodData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  // Custom Diet State
  const [forbiddenText, setForbiddenText] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  const searchInputRef = useRef(null);

  // --- HANDLERS ---
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const searchFood = async (searchTerm) => {
    const term = searchTerm || query;
    if (!term) return;

    setLoading(true);
    setError('');
    setFoodData(null);

    try {
      const type = /^\d+$/.test(term) ? 'barcode' : 'name';
      const res = await axios.get(`http://localhost:5055/api/v1/food/search`, {
        params: {
          query: term,
          type,
          forbidden: forbiddenText
        }
      });
      setFoodData(res.data);
    } catch (err) {
      console.error(err);
      setError('Food not found. Please try another name or barcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanResult = (barcode) => {
    setIsScanning(false);
    setQuery(barcode);
    searchFood(barcode);
  };

  // Helper for Score Badge Color
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // --- RENDER ---
  return (
    <div className={darkMode ? "dark" : ""}>
      <Head>
        <title>NUTRIX | Nutrition Tracker</title>
      </Head>
      <div className="min-h-screen transition-colors duration-300 bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">

        {/* --- TOP APP BAR --- */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-sm shadow-blue-600/30">
                N
              </div>
              <div className="leading-tight">
                <p className="font-extrabold text-slate-800 dark:text-white tracking-tight">NUTRIX</p>
                <p className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">Nutrition Tracker</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 transition"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-5 pb-28 space-y-4">

          {/* --- SEARCH CARD --- */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
              <Search size={15} className="text-blue-500" /> Search a food or scan a barcode
            </h2>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="e.g. Oreo, Greek Yogurt, 7622300336738..."
                className="w-full h-14 pl-4 pr-24 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-slate-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchFood()}
              />

              <div className="absolute right-1.5 top-1.5 bottom-1.5 flex gap-1.5">
                <button
                  onClick={() => setIsScanning(true)}
                  className="aspect-square h-full flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition"
                  title="Scan Barcode"
                >
                  <Scan size={20} />
                </button>
                <button
                  onClick={() => searchFood()}
                  className="aspect-square h-full flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all active:scale-95"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
                </button>
              </div>
            </div>
          </section>

          {/* --- DIET PREFERENCES TOGGLE --- */}
          <section>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Settings size={16} className={showSettings ? 'text-blue-500' : 'text-slate-400'} />
                Diet Preferences
              </span>
              <ChevronRight size={18} className={`text-slate-400 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
            </button>

            {showSettings && (
              <div className="mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 border border-blue-100 dark:border-slate-700 animate-fade-in-down">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-slate-400">We'll flag foods that contain these ingredients.</p>
                  <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-red-500 -mt-1"><X size={16} /></button>
                </div>
                <textarea
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm dark:text-white"
                  placeholder="e.g. peanuts, milk, sugar, palm oil..."
                  rows="2"
                  value={forbiddenText}
                  onChange={(e) => setForbiddenText(e.target.value)}
                />
              </div>
            )}
          </section>

          {/* --- ERROR --- */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* --- RESULTS --- */}
          {foodData && (
            <div className="space-y-4 animate-fade-in-up">

              {/* 1. PRODUCT HEADER CARD */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-slate-50 rounded-xl p-2 flex items-center justify-center">
                    <img
                      src={foodData.data.image || 'https://placehold.co/200?text=No+Image'}
                      alt={foodData.data.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="font-extrabold text-lg text-slate-800 dark:text-white leading-snug truncate">{foodData.data.name}</h2>
                    <p className="text-sm text-slate-400 font-medium truncate">{foodData.data.brand}</p>

                    <div className="mt-2">
                      {foodData.suitability && !foodData.suitability.isSuitable ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full text-xs font-bold">
                          <AlertCircle size={13} /> {foodData.suitability.reasons[0]}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                          <Leaf size={13} /> Fits your diet
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-extrabold text-white shadow-md ${getScoreColor(foodData.customScore)}`}>
                      {foodData.customScore}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Score</span>
                  </div>
                </div>
              </div>

              {/* 2. ALTERNATIVE SUGGESTION (Clickable) */}
              {foodData.alternative && (
                <div
                  onClick={() => {
                    setQuery(foodData.alternative.barcode);
                    searchFood(foodData.alternative.barcode);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group cursor-pointer bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-5 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-600 rounded-full text-white shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2 text-sm">
                        Better Choice Available
                        <span className="text-[10px] font-semibold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Tap to view →
                        </span>
                      </h4>

                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm">
                        <img src={foodData.alternative.image} alt="Alt" className="w-12 h-12 object-contain shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                            {foodData.alternative.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{foodData.alternative.brand} • {foodData.alternative.calories} kcal</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-extrabold px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md uppercase">
                          Nutri {foodData.alternative.nutriScore?.toUpperCase()}
                        </span>
                        <ChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MACRO SUMMARY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MacroCard icon={Flame} label="Calories" value={foodData.data.nutrients.calories} unit="kcal" color="slate" />
                <MacroCard icon={Wheat} label="Carbs" value={foodData.data.nutrients.carbs} unit="g" color="blue" />
                <MacroCard icon={Beef} label="Protein" value={foodData.data.nutrients.protein} unit="g" color="rose" />
                <MacroCard
                  icon={Candy}
                  label="Sugar"
                  value={foodData.data.nutrients.sugar}
                  unit="g"
                  color="amber"
                  highlight={foodData.data.nutrients.sugar > 10}
                />
              </div>

              {/* 4. NUTRITION FACTS LABEL */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Nutrition Facts</h3>
                  <span className="text-xs font-semibold text-slate-400">per 100g</span>
                </div>
                <div className="border-b-8 border-slate-800 dark:border-slate-100 my-2"></div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-base font-extrabold text-slate-800 dark:text-white">Calories</span>
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{foodData.data.nutrients.calories || 0}</span>
                </div>
                <div className="border-b-4 border-slate-800 dark:border-slate-100 mb-1"></div>

                <NutritionRow label="Total Fat" value={foodData.data.nutrients.fat} unit="g" />
                <NutritionRow label="Total Carbohydrate" value={foodData.data.nutrients.carbs} unit="g" />
                <NutritionRow label="Sugars" value={foodData.data.nutrients.sugar} unit="g" indent highlight={foodData.data.nutrients.sugar > 10} />
                <NutritionRow label="Protein" value={foodData.data.nutrients.protein} unit="g" />
                <NutritionRow label="Sodium" value={Math.round((foodData.data.nutrients.sodium || 0) * 1000)} unit="mg" last />
              </div>

              {/* 5. NUTRIENT LEVELS */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Nutrient Levels</h3>
                <div className="space-y-3.5">
                  <LevelBar label="Fat" level={foodData.data.nutrientLevels?.fat} />
                  <LevelBar label="Saturated Fat" level={foodData.data.nutrientLevels?.['saturated-fat']} />
                  <LevelBar label="Sugars" level={foodData.data.nutrientLevels?.sugars} />
                  <LevelBar label="Salt" level={foodData.data.nutrientLevels?.salt} />
                </div>
              </div>

              {/* 6. INGREDIENTS */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Info size={15} /> Ingredients
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {foodData.data.ingredientsText}
                </p>

                {foodData.data.additives.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {foodData.data.additives.map(tag => (
                      <span key={tag} className="text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </main>

        {/* --- BOTTOM NAV --- */}
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto grid grid-cols-4">
            <BottomNavItem
              icon={HomeIcon}
              label="Home"
              active={!showSettings}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <BottomNavItem
              icon={Search}
              label="Search"
              onClick={() => searchInputRef.current?.focus()}
            />
            <BottomNavItem
              icon={Settings}
              label="Goals"
              active={showSettings}
              onClick={() => setShowSettings(s => !s)}
            />
            <BottomNavItem
              icon={darkMode ? Sun : Moon}
              label="Theme"
              onClick={toggleTheme}
            />
          </div>
        </nav>

        {/* --- SCANNER MODAL --- */}
        {isScanning && (
          <BarcodeScanner
            onResult={handleScanResult}
            onClose={() => setIsScanning(false)}
          />
        )}

      </div>
    </div>
  );
}

// --- Sub-components ---

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

const NutritionRow = ({ label, value, unit, indent, last, highlight }) => (
  <div className={`flex items-center justify-between py-2 ${!last ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
    <span className={`text-sm ${indent ? 'pl-4 text-slate-500 dark:text-slate-400' : 'font-bold text-slate-700 dark:text-slate-200'}`}>{label}</span>
    <span className={`text-sm font-bold ${highlight ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>{value || 0}{unit}</span>
  </div>
);

// Traffic Light Levels
const LEVEL_CONFIG = {
  low: { width: '33%', bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  moderate: { width: '66%', bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  high: { width: '100%', bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
};

const LevelBar = ({ label, level }) => {
  if (!level) return null;
  const config = LEVEL_CONFIG[level] || { width: '10%', bar: 'bg-slate-300', text: 'text-slate-400' };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <span className={`text-xs font-bold uppercase ${config.text}`}>{level}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${config.bar}`} style={{ width: config.width }} />
      </div>
    </div>
  );
};

const BottomNavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    {label}
  </button>
);
