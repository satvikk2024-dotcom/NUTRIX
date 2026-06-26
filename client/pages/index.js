import { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import axios from 'axios';
import {
  Search, Scan, Leaf, AlertCircle, Settings, Moon, Sun, ChevronRight, X, Info,
  Sparkles, Home as HomeIcon, Flame, Wheat, Beef, Candy, Camera,
  BarChart3, History, TrendingUp, Target, Apple, Utensils, BookOpen, User, Plus
} from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import ImageAnalyzer from '../components/ImageAnalyzer';
import ImageResults from '../components/ImageResults';
import SafetyWarnings from '../components/SafetyWarnings';
import HomemadeCard from '../components/HomemadeCard';
import MealLogger from '../components/MealLogger';
import DailyProgress from '../components/DailyProgress';
import ProfileGoals from '../components/ProfileGoals';
import AnalyticsView from '../components/AnalyticsView';
import AISuggestions from '../components/AISuggestions';
import BiomarkerTracker from '../components/BiomarkerTracker';
import { getMealsByDate, getDailyTotals, saveMeal, deleteMeal, getGoals, getWeeklyData, getProfile } from '../utils/storage';
import { seedDummyData } from '../utils/seedData';

export default function Home() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('home');
  const [query, setQuery] = useState('');
  const [foodData, setFoodData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageResult, setImageResult] = useState(null);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [homemadeData, setHomemadeData] = useState(null);
  const [homemadeLoading, setHomemadeLoading] = useState(false);

  // Custom Diet State
  const [forbiddenText, setForbiddenText] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // Diary State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dateMeals, setDateMeals] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, count: 0 });
  const [goals, setGoals] = useState({ calories: 2000, protein: 50, carbs: 250, fat: 65 });

  const refreshDiary = useCallback(() => {
    setDateMeals(getMealsByDate(selectedDate));
    setDailyTotals(getDailyTotals(selectedDate));
    setGoals(getGoals());
  }, [selectedDate]);

  useEffect(() => { seedDummyData(); refreshDiary(); }, [refreshDiary]);

  const handleSaveMeal = (meal) => {
    saveMeal({ ...meal, date: selectedDate });
    refreshDiary();
  };

  const handleDeleteMeal = (id) => {
    deleteMeal(id);
    refreshDiary();
  };

  const logFoodToDiary = (name, nutrients, mealTime) => {
    saveMeal({
      name, mealTime: mealTime || 'Snack', date: selectedDate,
      calories: nutrients.calories || 0, protein: nutrients.protein || 0,
      carbs: nutrients.carbs || 0, fat: nutrients.fat || 0,
      sugar: nutrients.sugar || 0, source: 'search',
    });
    refreshDiary();
  };

  const searchInputRef = useRef(null);

  // --- HANDLERS ---
  const toggleTheme = () => setDarkMode(!darkMode);

  const searchFood = async (searchTerm) => {
    const term = searchTerm || query;
    if (!term) return;

    setLoading(true);
    setError('');
    setFoodData(null);
    setImageResult(null);
    setHomemadeData(null);
    setHomemadeLoading(false);
    setActiveTab('home');

    try {
      const type = /^\d+$/.test(term) ? 'barcode' : 'name';
      const res = await axios.get(`http://localhost:5055/api/v1/food/search`, {
        params: { query: term, type, forbidden: forbiddenText, country: 'india' }
      });
      setFoodData(res.data);
      setSearchHistory((prev) => {
        const entry = { name: res.data.data.name, brand: res.data.data.brand, score: res.data.customScore, barcode: res.data.data.barcode, time: Date.now() };
        return [entry, ...prev.filter((h) => h.barcode !== entry.barcode)].slice(0, 20);
      });

      if (type === 'barcode' && res.data.customScore < 60) {
        setHomemadeLoading(true);
        const d = res.data.data;
        axios.get(`http://localhost:5055/api/v1/food/homemade`, {
          params: {
            name: d.name, brand: d.brand, ingredientsText: d.ingredientsText,
            calories: d.nutrients.calories, protein: d.nutrients.protein,
            carbs: d.nutrients.carbs, sugar: d.nutrients.sugar,
            fat: d.nutrients.fat, sodium: d.nutrients.sodium,
          },
          timeout: 60000,
        }).then((r) => setHomemadeData(r.data))
          .catch(() => {})
          .finally(() => setHomemadeLoading(false));
      }
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

  const handleImageResult = (data) => {
    setIsAnalyzing(false);
    setImageResult(data);
    setFoodData(null);
    setError('');
    setActiveTab('home');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
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

          {/* ===== HOME TAB ===== */}
          {activeTab === 'home' && (
            <>
              {/* SEARCH CARD */}
              <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <Search size={15} className="text-blue-500" /> Search a food or scan a barcode
                </h2>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="e.g. Oreo, Greek Yogurt, 7622300336738..."
                    className="w-full h-14 pl-4 pr-32 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-slate-400"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchFood()}
                  />
                  <div className="absolute right-1.5 top-1.5 bottom-1.5 flex gap-1.5">
                    <button
                      onClick={() => setIsAnalyzing(true)}
                      className="aspect-square h-full flex items-center justify-center rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700 transition"
                      title="Analyze Food Image"
                    >
                      <Camera size={20} />
                    </button>
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

              {/* DIET PREFERENCES */}
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

              {/* ERROR */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* IMAGE RESULTS */}
              {imageResult && (
                <ImageResults data={imageResult} onClose={() => setImageResult(null)} onLogToDiary={logFoodToDiary} />
              )}

              {/* SEARCH/BARCODE RESULTS */}
              {foodData && (
                <div className="space-y-4 animate-fade-in-up">
                  {/* PRODUCT HEADER */}
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
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {foodData.source === 'ai' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold">
                              <Sparkles size={10} /> AI Estimated
                            </span>
                          )}
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

                  {/* LOG TO DIARY */}
                  <button
                    onClick={() => logFoodToDiary(foodData.data.name, foodData.data.nutrients)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-300 font-bold text-sm rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition active:scale-[0.98]"
                  >
                    <Plus size={16} /> Log to Diary
                  </button>

                  {/* ALTERNATIVE */}
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
                            <span className="text-[10px] font-semibold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Tap to view →</span>
                          </h4>
                          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm">
                            <img src={foodData.alternative.image} alt="Alt" className="w-12 h-12 object-contain shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-blue-600 transition-colors">{foodData.alternative.name}</p>
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

                  {/* HOMEMADE ALTERNATIVE */}
                  {homemadeLoading && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5 flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-emerald-400/40 border-t-emerald-500 rounded-full animate-spin shrink-0" />
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Generating homemade recipe alternative...</p>
                    </div>
                  )}
                  {homemadeData && (
                    <HomemadeCard data={homemadeData} />
                  )}

                  {/* MACRO CARDS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MacroCard icon={Flame} label="Calories" value={foodData.data.nutrients.calories} unit="kcal" color="slate" />
                    <MacroCard icon={Wheat} label="Carbs" value={foodData.data.nutrients.carbs} unit="g" color="blue" />
                    <MacroCard icon={Beef} label="Protein" value={foodData.data.nutrients.protein} unit="g" color="rose" />
                    <MacroCard icon={Candy} label="Sugar" value={foodData.data.nutrients.sugar} unit="g" color="amber" highlight={foodData.data.nutrients.sugar > 10} />
                  </div>

                  {/* NUTRITION FACTS */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Nutrition Facts</h3>
                      <span className="text-xs font-semibold text-slate-400">per 100g</span>
                    </div>
                    <div className="border-b-8 border-slate-800 dark:border-slate-100 my-2" />
                    <div className="flex items-center justify-between py-1">
                      <span className="text-base font-extrabold text-slate-800 dark:text-white">Calories</span>
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{foodData.data.nutrients.calories || 0}</span>
                    </div>
                    <div className="border-b-4 border-slate-800 dark:border-slate-100 mb-1" />
                    <NutritionRow label="Total Fat" value={foodData.data.nutrients.fat} unit="g" />
                    <NutritionRow label="Total Carbohydrate" value={foodData.data.nutrients.carbs} unit="g" />
                    <NutritionRow label="Sugars" value={foodData.data.nutrients.sugar} unit="g" indent highlight={foodData.data.nutrients.sugar > 10} />
                    <NutritionRow label="Protein" value={foodData.data.nutrients.protein} unit="g" />
                    <NutritionRow label="Sodium" value={Math.round((foodData.data.nutrients.sodium || 0) * 1000)} unit="mg" last />
                  </div>

                  {/* NUTRIENT LEVELS */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Nutrient Levels</h3>
                    <div className="space-y-3.5">
                      <LevelBar label="Fat" level={foodData.data.nutrientLevels?.fat} />
                      <LevelBar label="Saturated Fat" level={foodData.data.nutrientLevels?.['saturated-fat']} />
                      <LevelBar label="Sugars" level={foodData.data.nutrientLevels?.sugars} />
                      <LevelBar label="Salt" level={foodData.data.nutrientLevels?.salt} />
                    </div>
                  </div>

                  {/* SAFETY WARNINGS */}
                  <SafetyWarnings warnings={foodData.safetyWarnings} transparencyScore={foodData.transparencyScore} />

                  {/* INGREDIENTS */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Info size={15} /> Ingredients
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{foodData.data.ingredientsText}</p>
                    {foodData.data.additives.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {foodData.data.additives.map(tag => (
                          <span key={tag} className="text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-1 rounded-md">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NO RESULTS YET — QUICK ACTIONS */}
              {!foodData && !imageResult && !error && !loading && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsScanning(true)}
                      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 flex flex-col items-center gap-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition group"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <Scan size={22} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Scan Barcode</p>
                        <p className="text-[11px] text-slate-400">Scan a product</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setIsAnalyzing(true)}
                      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 flex flex-col items-center gap-3 hover:bg-purple-50 dark:hover:bg-slate-700 transition group"
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                        <Camera size={22} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Snap Food</p>
                        <p className="text-[11px] text-slate-400">AI nutrition analysis</p>
                      </div>
                    </button>
                  </div>

                  {/* Recent searches */}
                  {searchHistory.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <History size={14} /> Recent
                      </h3>
                      <div className="space-y-2">
                        {searchHistory.slice(0, 5).map((h, i) => (
                          <button
                            key={h.barcode + i}
                            onClick={() => { setQuery(h.barcode); searchFood(h.barcode); }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{h.name}</p>
                              <p className="text-xs text-slate-400 truncate">{h.brand}</p>
                            </div>
                            <span className={`text-sm font-extrabold ${getScoreTextColor(h.score)}`}>{h.score}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ===== SCAN TAB ===== */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                  <Scan size={28} />
                </div>
                <h2 className="font-extrabold text-xl text-slate-800 dark:text-white mb-2">Barcode Scanner</h2>
                <p className="text-sm text-slate-400 mb-5">Scan any food product barcode to get instant nutrition info, health scores, and safety analysis.</p>
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-600/30 transition-all active:scale-[0.98]"
                >
                  Open Scanner
                </button>
              </section>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Or enter barcode manually</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter barcode number..."
                    className="flex-1 h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchFood()}
                  />
                  <button
                    onClick={() => searchFood()}
                    className="h-12 px-5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition active:scale-95"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Go'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== CAMERA TAB ===== */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
                  <Camera size={28} />
                </div>
                <h2 className="font-extrabold text-xl text-slate-800 dark:text-white mb-2">Food Recognition</h2>
                <p className="text-sm text-slate-400 mb-5">Take a photo of any food and our AI will identify it, estimate ingredients, and provide nutrition info.</p>
                <button
                  onClick={() => setIsAnalyzing(true)}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm shadow-purple-600/30 transition-all active:scale-[0.98]"
                >
                  Take Photo or Upload
                </button>
              </section>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">How it works</h3>
                <div className="space-y-3">
                  {[
                    { icon: Camera, text: 'Take a photo or upload an image of your food' },
                    { icon: Sparkles, text: 'AI identifies the food and estimates nutrition' },
                    { icon: Apple, text: 'Get ingredients, calories, macros, and hygiene tips' },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 shrink-0">
                        <Icon size={14} />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Show image result here too if exists */}
              {imageResult && (
                <ImageResults data={imageResult} onClose={() => setImageResult(null)} onLogToDiary={logFoodToDiary} />
              )}
            </div>
          )}

          {/* ===== DIARY TAB ===== */}
          {activeTab === 'diary' && (
            <div className="space-y-4">
              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm text-slate-500 hover:text-blue-600 transition font-bold"
                >‹</button>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border-none text-sm font-bold text-slate-700 dark:text-white text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0]); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm text-slate-500 hover:text-blue-600 transition font-bold"
                >›</button>
                {selectedDate !== todayStr && (
                  <button onClick={() => setSelectedDate(todayStr)}
                    className="px-3 h-10 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
                  >Today</button>
                )}
              </div>

              <DailyProgress totals={dailyTotals} goals={goals} />
              <MealLogger meals={dateMeals} onSave={handleSaveMeal} onDelete={handleDeleteMeal} />
            </div>
          )}

          {/* ===== ANALYTICS TAB ===== */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <AnalyticsView />
              <AISuggestions weeklyData={getWeeklyData()} goals={goals} profile={getProfile()} />
            </div>
          )}

          {/* ===== PROFILE TAB ===== */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <ProfileGoals onUpdate={refreshDiary} />
              <BiomarkerTracker />

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Settings size={14} /> Diet Preferences
                </h3>
                <textarea
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm dark:text-white"
                  placeholder="e.g. peanuts, milk, sugar, palm oil..."
                  rows="2"
                  value={forbiddenText}
                  onChange={(e) => setForbiddenText(e.target.value)}
                />
              </div>
            </div>
          )}

        </main>

        {/* --- BOTTOM NAV --- */}
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto grid grid-cols-5">
            <BottomNavItem icon={HomeIcon} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <BottomNavItem icon={BookOpen} label="Diary" active={activeTab === 'diary'} onClick={() => { setActiveTab('diary'); refreshDiary(); }} />
            <BottomNavItem icon={Camera} label="Snap" active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} />
            <BottomNavItem icon={BarChart3} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
            <BottomNavItem icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </nav>

        {/* --- MODALS --- */}
        {isScanning && (
          <BarcodeScanner onResult={handleScanResult} onClose={() => setIsScanning(false)} />
        )}
        {isAnalyzing && (
          <ImageAnalyzer onResult={handleImageResult} onClose={() => setIsAnalyzing(false)} />
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
    className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    {label}
  </button>
);
