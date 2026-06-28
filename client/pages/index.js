import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import {
  Search, Scan, Leaf, AlertCircle, Info, Sparkles, ChevronRight, ChevronDown,
  User, History as HistoryIcon, Trash2, Home as HomeIcon
} from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';

const DEFAULT_PROFILE = { name: '', age: '', gender: '', allergies: '' };
const PROFILE_KEY = 'nutrix_profile';
const HISTORY_KEY = 'nutrix_history';
const HISTORY_LIMIT = 50;

// Map the 0–100 health score to an A–E grade for the score ring.
const scoreToGrade = (score) => {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'E';
};
const GRADE_COLOR = { A: '#4CAF78', B: '#4CAF78', C: '#F59E0B', D: '#E8734A', E: '#E8734A' };

const formatDate = (ts) => {
  try {
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

export default function Home() {
  // --- STATE ---
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'search' | 'history' | 'profile'
  const [query, setQuery] = useState('');
  const [foodData, setFoodData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  // Persistent profile (name, age, gender, allergies). Allergies feed the diet
  // check on every search automatically.
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  // Persistent search history.
  const [history, setHistory] = useState([]);

  // Homemade alternative (shown when the product scores C or below, <= 59).
  const [homemade, setHomemade] = useState(null);
  const [homemadeLoading, setHomemadeLoading] = useState(false);
  const [showHomemade, setShowHomemade] = useState(false);

  const searchInputRef = useRef(null);

  // Load saved profile + history once on mount (localStorage is client-only).
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) });
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (e) { /* ignore corrupt/unavailable storage */ }
  }, []);

  // Persist the profile whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) { /* ignore unavailable storage */ }
  }, [profile]);

  // Persist history whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) { /* ignore unavailable storage */ }
  }, [history]);

  const updateProfile = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  const saveToHistory = (d) => {
    if (!d || !d.data) return;
    const entry = {
      timestamp: Date.now(),
      productName: d.data.name,
      brand: d.data.brand,
      image: d.data.image || null,
      customScore: d.customScore,
      nutriScore: d.data.nutriScore,
      macros: {
        calories: d.data.nutrients.calories,
        protein: d.data.nutrients.protein,
        carbs: d.data.nutrients.carbs,
        fat: d.data.nutrients.fat,
      },
      isSuitable: d.suitability ? d.suitability.isSuitable : true,
      barcode: d.data.barcode,
    };
    // Drop any earlier entry for the same product, then prepend the fresh one.
    setHistory((prev) => {
      const deduped = prev.filter((h) => !(entry.barcode && entry.barcode !== 'N/A' && h.barcode === entry.barcode));
      return [entry, ...deduped].slice(0, HISTORY_LIMIT);
    });
  };

  const clearHistory = () => setHistory([]);

  // --- HANDLERS ---
  const searchFood = async (searchTerm) => {
    const term = searchTerm || query;
    if (!term) return;

    setLoading(true);
    setError('');
    setFoodData(null);
    setHomemade(null);
    setShowHomemade(false);

    try {
      const type = /^\d+$/.test(term) ? 'barcode' : 'name';
      const res = await axios.get(`http://localhost:5055/api/v1/food/search`, {
        params: {
          query: term,
          type,
          forbidden: profile.allergies
        }
      });
      setFoodData(res.data);
      saveToHistory(res.data);
      fetchHomemade(res.data);
    } catch (err) {
      console.error(err);
      setError('Food not found. Please try another name or barcode.');
    } finally {
      setLoading(false);
    }
  };

  // For products scoring C or below (<= 59), fetch a homemade recipe + a
  // side-by-side macro/cost comparison. Reuses the nutrients we already have.
  const fetchHomemade = async (data) => {
    if (!data || data.customScore > 59) return;

    setHomemadeLoading(true);
    try {
      const n = data.data.nutrients;
      const res = await axios.get(`http://localhost:5055/api/v1/food/homemade`, {
        params: {
          name: data.data.name,
          calories: n.calories,
          protein: n.protein,
          carbs: n.carbs,
          fat: n.fat,
          sugar: n.sugar,
          sodium: n.sodium
        }
      });
      setHomemade(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHomemadeLoading(false);
    }
  };

  const handleScanResult = (barcode) => {
    setIsScanning(false);
    setQuery(barcode);
    searchFood(barcode);
  };

  // Re-display a past result in the Search tab (re-fetches for the full view).
  const openFromHistory = (item) => {
    const term = item.barcode && item.barcode !== 'N/A' ? item.barcode : item.productName;
    setTab('search');
    setQuery(term);
    searchFood(term);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const suitable = foodData?.suitability ? foodData.suitability.isSuitable : true;

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <Head>
        <title>NUTRIX | Nutrition Tracker</title>
      </Head>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 bg-surface shadow-soft">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-2xl font-extrabold tracking-tight text-accent">NUTRIX</span>
          <button
            onClick={() => setTab('profile')}
            title="My Profile"
            className="w-10 h-10 rounded-full bg-accent-light text-accent-dark flex items-center justify-center font-extrabold hover:shadow-soft transition"
          >
            {profile.name ? profile.name.trim().charAt(0).toUpperCase() : <User size={18} />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-28">

        {/* ====================== DASHBOARD TAB ====================== */}
        {tab === 'dashboard' && (
          <Dashboard
            profile={profile}
            history={history}
            onSeeAll={() => setTab('history')}
            onOpenItem={openFromHistory}
          />
        )}

        {/* ====================== SEARCH TAB ====================== */}
        {tab === 'search' && (
          <div className="space-y-5">
            {/* Search bar */}
            <div className="relative rounded-full bg-surface shadow-soft focus-within:shadow-focus transition-shadow">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search a food or scan a barcode…"
                className="w-full h-14 rounded-full bg-transparent pl-6 pr-28 text-[15px] text-ink placeholder:text-subtle focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchFood()}
              />
              <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1.5">
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-subtle hover:text-accent-dark hover:bg-accent-light transition"
                  title="Scan barcode"
                >
                  <Scan size={20} />
                </button>
                <button
                  onClick={() => searchFood()}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white hover:bg-accent-dark transition active:scale-95"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Search size={20} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-coral-light border border-coral/20 rounded-2xl flex items-center gap-3 text-coral">
                <AlertCircle size={18} />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            )}

            {/* Results */}
            {foodData && (
              <div className="space-y-5 animate-fade-in-up">

                {/* 1. RESULT CARD */}
                <div className="bg-surface rounded-2xl shadow-card p-6 overflow-hidden">
                  {/* Suitability banner */}
                  <div
                    className={`-mx-6 -mt-6 mb-5 px-6 py-3 flex items-center gap-2 text-sm font-bold ${
                      suitable ? 'bg-accent-light text-accent-dark' : 'bg-coral-light text-coral'
                    }`}
                  >
                    {suitable
                      ? <><Leaf size={16} /> Fits your diet</>
                      : <><AlertCircle size={16} /> {foodData.suitability.reasons[0]}</>}
                  </div>

                  {/* Product image (if available) */}
                  {foodData.data.image && (
                    <div className="flex justify-center mb-4">
                      <div className="w-28 h-28 rounded-2xl bg-base p-3 flex items-center justify-center">
                        <img
                          src={foodData.data.image}
                          alt={foodData.data.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                    </div>
                  )}

                  {/* Name / brand */}
                  <div className="text-center">
                    <h2 className="font-extrabold text-xl text-ink leading-snug">{foodData.data.name}</h2>
                    <p className="text-sm text-subtle font-medium">{foodData.data.brand}</p>
                  </div>

                  {/* Score ring + macro pills */}
                  <div className="mt-5 flex items-center gap-5">
                    <ScoreRing score={foodData.customScore} />
                    <div className="flex flex-wrap gap-2 flex-1">
                      <MacroPill label="Calories" value={foodData.data.nutrients.calories} unit="kcal" />
                      <MacroPill label="Protein" value={foodData.data.nutrients.protein} unit="g" />
                      <MacroPill label="Carbs" value={foodData.data.nutrients.carbs} unit="g" />
                      <MacroPill label="Fat" value={foodData.data.nutrients.fat} unit="g" />
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
                    className="group cursor-pointer bg-surface rounded-2xl shadow-card p-5 hover:shadow-soft transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-accent rounded-full text-white shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-accent-dark mb-2 flex items-center gap-2 text-sm">
                          Better Choice Available
                          <span className="text-[10px] font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            Tap to view →
                          </span>
                        </h4>

                        <div className="flex items-center gap-3 bg-base p-3 rounded-xl">
                          <img src={foodData.alternative.image} alt="Alt" className="w-12 h-12 object-contain shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-ink truncate group-hover:text-accent-dark transition-colors">
                              {foodData.alternative.name}
                            </p>
                            <p className="text-xs text-subtle truncate">{foodData.alternative.brand} • {foodData.alternative.calories} kcal</p>
                          </div>
                          <span className="shrink-0 text-[10px] font-extrabold px-2 py-1 bg-accent-light text-accent-dark rounded-md uppercase">
                            Nutri {foodData.alternative.nutriScore?.toUpperCase()}
                          </span>
                          <ChevronRight className="text-subtle group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2b. HOMEMADE ALTERNATIVE (score C or below) */}
                {foodData.customScore <= 59 && (homemadeLoading || homemade) && (
                  <div className="bg-[#FFFBF5] rounded-2xl shadow-card overflow-hidden">
                    <button
                      onClick={() => setShowHomemade((s) => !s)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl" aria-hidden>🍳</span>
                        <span className="min-w-0">
                          <span className="block font-extrabold text-coral text-sm">Make it at home</span>
                          <span className="block text-xs text-subtle truncate">A healthier, cheaper version you can cook yourself</span>
                        </span>
                      </span>
                      {homemadeLoading
                        ? <div className="w-4 h-4 border-2 border-coral/30 border-t-coral rounded-full animate-spin shrink-0" />
                        : <ChevronDown size={18} className={`text-subtle shrink-0 transition-transform ${showHomemade ? 'rotate-180' : ''}`} />}
                    </button>

                    {showHomemade && homemade && (
                      <div className="px-5 pb-5 space-y-5 animate-fade-in-down">
                        {/* Recipe */}
                        <div className="bg-surface rounded-xl p-4 shadow-soft">
                          <h4 className="font-extrabold text-ink">{homemade.recipe.title}</h4>
                          <p className="text-xs text-subtle mb-3">Serving: {homemade.recipe.servingDesc}</p>

                          <p className="text-[11px] font-bold text-subtle uppercase tracking-wide mb-1.5">Ingredients</p>
                          <ul className="list-disc list-inside space-y-0.5 text-sm text-ink/80 mb-3">
                            {homemade.recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                          </ul>

                          <p className="text-[11px] font-bold text-subtle uppercase tracking-wide mb-2">Steps</p>
                          <ol className="space-y-2">
                            {homemade.recipe.steps.map((step, i) => (
                              <li key={i} className="flex gap-3 text-sm text-ink/80">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-coral-light text-coral font-bold text-xs flex items-center justify-center">{i + 1}</span>
                                <span className="pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Comparison table */}
                        <div className="bg-surface rounded-xl shadow-soft overflow-hidden">
                          <div className="grid grid-cols-3 text-[11px] font-bold text-subtle uppercase tracking-wide px-4 py-2.5 border-b border-line">
                            <span>Per serving</span>
                            <span className="text-right">🍳 Homemade</span>
                            <span className="text-right">Packaged</span>
                          </div>
                          {homemade.comparison.rows.map((row, i) => {
                            const winner = betterSide(row.label, row.homemade, row.packaged);
                            return (
                              <div key={row.label} className={`grid grid-cols-3 items-center px-4 py-2.5 text-sm ${i % 2 === 1 ? 'bg-base/60' : ''}`}>
                                <span className="font-medium text-ink/80">{row.label}</span>
                                <span className={`text-right ${winner === 'homemade' ? 'font-extrabold text-accent-dark' : 'font-semibold text-ink/70'}`}>
                                  {row.homemade}{row.unit}
                                </span>
                                <span className={`text-right ${winner === 'packaged' ? 'font-extrabold text-accent-dark' : 'font-semibold text-ink/70'}`}>
                                  {row.packaged}{row.unit}
                                </span>
                              </div>
                            );
                          })}
                          <div className="grid grid-cols-3 items-center px-4 py-3 border-t border-line">
                            <span className="font-bold text-ink text-sm">Cost</span>
                            {(() => {
                              const cw = betterSide('Cost', homemade.comparison.cost.homemade, homemade.comparison.cost.packaged);
                              return (
                                <>
                                  <span className={`text-right text-sm ${cw === 'homemade' ? 'font-extrabold text-accent-dark' : 'font-semibold text-ink/70'}`}>₹{homemade.comparison.cost.homemade}</span>
                                  <span className={`text-right text-sm ${cw === 'packaged' ? 'font-extrabold text-accent-dark' : 'font-semibold text-ink/70'}`}>₹{homemade.comparison.cost.packaged}</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <p className="text-[11px] text-subtle">{homemade.comparison.note}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. NUTRITION FACTS */}
                <section className="bg-surface rounded-2xl shadow-card p-6">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-extrabold text-ink tracking-tight">Nutrition Facts</h3>
                    <span className="text-xs font-semibold text-subtle">per 100g</span>
                  </div>
                  <div className="h-px bg-line my-3" />
                  <div className="flex items-center justify-between py-1">
                    <span className="text-base font-extrabold text-ink">Calories</span>
                    <span className="text-3xl font-extrabold text-ink">{foodData.data.nutrients.calories || 0}</span>
                  </div>
                  <div className="h-0.5 bg-line my-1" />

                  <NutritionRow label="Total Fat" value={foodData.data.nutrients.fat} unit="g" />
                  <NutritionRow label="Total Carbohydrate" value={foodData.data.nutrients.carbs} unit="g" />
                  <NutritionRow label="Sugars" value={foodData.data.nutrients.sugar} unit="g" indent highlight={foodData.data.nutrients.sugar > 10} />
                  <NutritionRow label="Protein" value={foodData.data.nutrients.protein} unit="g" />
                  <NutritionRow label="Sodium" value={Math.round((foodData.data.nutrients.sodium || 0) * 1000)} unit="mg" last />
                </section>

                {/* 4. NUTRIENT LEVELS */}
                <section className="bg-surface rounded-2xl shadow-card p-6">
                  <h3 className="text-sm font-bold text-subtle uppercase tracking-wider mb-4">Nutrient Levels</h3>
                  <div className="space-y-3.5">
                    <LevelBar label="Fat" level={foodData.data.nutrientLevels?.fat} />
                    <LevelBar label="Saturated Fat" level={foodData.data.nutrientLevels?.['saturated-fat']} />
                    <LevelBar label="Sugars" level={foodData.data.nutrientLevels?.sugars} />
                    <LevelBar label="Salt" level={foodData.data.nutrientLevels?.salt} />
                  </div>
                </section>

                {/* 5. INGREDIENTS */}
                <section className="bg-surface rounded-2xl shadow-card p-6">
                  <h3 className="text-sm font-bold text-subtle uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Info size={15} /> Ingredients
                  </h3>
                  <p className="text-sm leading-relaxed text-ink/80">
                    {foodData.data.ingredientsText}
                  </p>

                  {foodData.data.additives.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {foodData.data.additives.map(tag => (
                        <span key={tag} className="text-[11px] font-mono font-semibold bg-base text-subtle px-2 py-1 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

              </div>
            )}
          </div>
        )}

        {/* ====================== HISTORY TAB ====================== */}
        {tab === 'history' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-ink">History</h2>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1.5 text-sm font-semibold text-coral hover:text-coral/80 transition"
                >
                  <Trash2 size={15} /> Clear history
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-surface rounded-2xl shadow-card p-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-base flex items-center justify-center text-subtle mb-3">
                  <HistoryIcon size={24} />
                </div>
                <p className="font-bold text-ink">No searches yet</p>
                <p className="text-sm text-subtle mt-1">Foods you look up will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <button
                    key={item.timestamp}
                    onClick={() => openFromHistory(item)}
                    className="w-full text-left bg-surface rounded-2xl shadow-card p-3 flex items-center gap-3 hover:shadow-soft transition-shadow"
                  >
                    <div className="w-14 h-14 rounded-xl bg-base p-1.5 shrink-0 flex items-center justify-center">
                      {item.image
                        ? <img src={item.image} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply" />
                        : <span className="text-subtle"><Search size={18} /></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-ink truncate">{item.productName}</p>
                      {item.brand && <p className="text-xs text-subtle truncate">{item.brand}</p>}
                      <p className="text-[11px] text-subtle mt-0.5">{formatDate(item.timestamp)}</p>
                    </div>
                    <ScoreRing score={item.customScore} size={46} showValue={false} />
                    <ChevronRight size={18} className="text-subtle shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====================== PROFILE TAB ====================== */}
        {tab === 'profile' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent-light text-accent-dark flex items-center justify-center font-extrabold text-lg">
                {profile.name ? profile.name.trim().charAt(0).toUpperCase() : <User size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-ink leading-tight">My Profile</h2>
                <p className="text-xs text-subtle">Saved on this device</p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-card p-6 space-y-4">
              <p className="text-xs text-subtle">We'll flag any food containing your allergens automatically.</p>

              <div className="grid grid-cols-2 gap-3">
                <FloatField label="Name" type="text" value={profile.name} onChange={(e) => updateProfile('name', e.target.value)} />
                <FloatField label="Age" type="number" min="0" value={profile.age} onChange={(e) => updateProfile('age', e.target.value)} />
              </div>

              <div className="relative">
                <select
                  className="peer w-full rounded-xl border border-line bg-base/60 px-3 pt-5 pb-2 text-sm text-ink focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15 transition appearance-none"
                  value={profile.gender}
                  onChange={(e) => updateProfile('gender', e.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
                <label className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-subtle">Gender</label>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle" />
              </div>

              <FloatField
                label="Allergies / ingredients to avoid"
                textarea
                rows={3}
                value={profile.allergies}
                onChange={(e) => updateProfile('allergies', e.target.value)}
                hint="Separate each with a comma."
              />
            </div>
          </div>
        )}

      </main>

      {/* --- BOTTOM TAB BAR --- */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface shadow-[0_-2px_14px_rgba(26,26,46,0.06)]">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          <TabItem icon={HomeIcon} label="Dashboard" active={tab === 'dashboard'} onClick={() => setTab('dashboard')} />
          <TabItem icon={Search} label="Search" active={tab === 'search'} onClick={() => setTab('search')} />
          <TabItem icon={HistoryIcon} label="History" active={tab === 'history'} onClick={() => setTab('history')} />
          <TabItem icon={User} label="Profile" active={tab === 'profile'} onClick={() => setTab('profile')} />
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
  );
}

// --- Sub-components ---

// 30 rotating nutrition tips, indexed by day-of-year (see Dashboard).
const DAILY_TIPS = [
  'Read the ingredients list, not just the front of the pack. Ingredients are listed by weight, so the first few make up most of the product.',
  '"Sugar-free" often just means artificial sweeteners were swapped in. Check whether that actually suits you before assuming it\'s healthier.',
  'Sugar hides under many names — corn syrup, maltose, dextrose, fruit-juice concentrate. If several show up, the product is sugar-heavy.',
  'Aim for protein at every meal. Spreading 20–30g across the day supports muscle better than one big serving at dinner.',
  'The more ingredients you can\'t pronounce, the more processed a food usually is. Whole foods have short labels.',
  'Drink a glass of water before meals. Thirst is often mistaken for hunger, and it helps with portion control.',
  'Target around 25–30g of fibre a day. It keeps you full, steadies blood sugar, and feeds healthy gut bacteria.',
  '"Low-fat" products often add sugar to replace lost flavour. Compare the sugar line against the regular version.',
  'Check the serving size first. Nutrition numbers can look low simply because the listed serving is tiny.',
  'Eat protein and fibre before the carbs in a meal to blunt the blood-sugar spike that follows.',
  'Colour your plate. Different coloured fruits and vegetables deliver different vitamins and antioxidants.',
  'Sodium adds up fast in packaged food. Aim to stay under 2,000mg a day, and rinse canned beans to cut salt.',
  'Swap refined grains for whole grains — brown rice, oats and whole wheat keep you fuller and add fibre.',
  'Front-of-pack claims like "natural" or "wholesome" aren\'t tightly regulated. Trust the nutrition panel instead.',
  'A 30-minute walk after eating helps your body manage blood sugar far more than sitting still does.',
  'Healthy fats matter — nuts, olive oil and avocado support your heart. It\'s the type of fat, not all fat, to watch.',
  'If sugar is in the top three ingredients, treat the product as a dessert, however it\'s marketed.',
  'Frozen fruit and veg are picked ripe and frozen fast — often as nutritious as fresh, and usually cheaper.',
  'Eat slowly. It takes about 20 minutes for your brain to register fullness, which helps prevent overeating.',
  '"Made with real fruit" can mean a tiny amount. Check how far down the ingredient list the fruit actually appears.',
  'Plan and prep meals ahead. Having a healthy option ready makes you far less likely to reach for junk.',
  'Liquid calories from juice and soda don\'t fill you up like solid food. Choose whole fruit over juice.',
  'Greek yogurt has roughly twice the protein of regular yogurt — a great swap for a filling snack.',
  'Watch portions on calorie-dense foods like nuts and cheese. A small handful, not a whole bowl.',
  'Cook more at home. You control the salt, sugar and oil that restaurant and packaged meals hide.',
  'Pair iron-rich plant foods (spinach, lentils) with vitamin C (citrus, peppers) to absorb more iron.',
  '"Multigrain" isn\'t the same as "whole grain." Look for "100% whole grain" as the first ingredient.',
  'Keep a water bottle in sight. Steady hydration through the day beats chugging it all at once.',
  'Snack with intention: pair a carb with protein or fat (apple + peanut butter) to stay full longer.',
  'Ultra-processed foods are engineered to be over-eaten. Notice when a snack vanishes before you\'ve tasted it.',
];

// Lower-is-better for everything except protein; used to green-highlight the
// winning value in each comparison row.
const betterSide = (label, homemade, packaged) => {
  if (homemade === packaged) return null;
  const higherIsBetter = label === 'Protein';
  const homemadeWins = higherIsBetter ? homemade > packaged : homemade < packaged;
  return homemadeWins ? 'homemade' : 'packaged';
};

const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const Dashboard = ({ profile, history, onSeeAll, onOpenItem }) => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const todayLabel = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  // Tip of the day — rotate through 30 tips by day-of-year.
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - startOfYear) / 86400000);
  const tip = DAILY_TIPS[Math.floor(dayOfYear % 30)];

  // Score average across all history entries (read from localStorage upstream).
  const scores = history.map((h) => h.customScore).filter((s) => typeof s === 'number');
  const average = scores.length ? Math.round(mean(scores)) : 0;
  const grade = scoreToGrade(average);
  const enoughForAvg = scores.length >= 2;

  // This week vs last week.
  const ts = now.getTime();
  const WEEK = 7 * 86400000;
  const thisWeek = history.filter((h) => ts - h.timestamp <= WEEK).map((h) => h.customScore);
  const lastWeek = history.filter((h) => ts - h.timestamp > WEEK && ts - h.timestamp <= 2 * WEEK).map((h) => h.customScore);
  const delta = thisWeek.length && lastWeek.length ? mean(thisWeek) - mean(lastWeek) : null;

  const recent = history.slice(0, 3);
  const empty = history.length === 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-extrabold text-ink leading-tight">
          {greeting}{profile.name ? `, ${profile.name.trim()}` : ''}.
        </h1>
        <p className="text-sm text-subtle mt-0.5">{todayLabel}</p>
      </div>

      {empty ? (
        /* Empty state replaces both the Score Average and Recent Scans. */
        <div className="bg-surface rounded-2xl shadow-card p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-accent-light text-accent-dark flex items-center justify-center mb-3">
            <Sparkles size={24} />
          </div>
          <p className="font-bold text-ink">Start scanning to build your nutrition picture.</p>
          <p className="text-sm text-subtle mt-1">Your scores and trends will show up here.</p>
        </div>
      ) : (
        /* Health Score Average */
        <div className="bg-surface rounded-2xl shadow-card p-6">
          <h3 className="text-sm font-bold text-subtle uppercase tracking-wider mb-3">Health Score Average</h3>
          {enoughForAvg ? (
            <>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-extrabold leading-none" style={{ color: GRADE_COLOR[grade] }}>{average}</span>
                <span className="text-sm text-subtle font-semibold mb-1">/ 100</span>
                <span
                  className="ml-auto w-12 h-12 rounded-full flex items-center justify-center text-2xl font-extrabold text-white"
                  style={{ background: GRADE_COLOR[grade] }}
                >
                  {grade}
                </span>
              </div>
              {delta !== null && (
                <p className="mt-3 text-sm font-semibold flex items-center gap-1.5">
                  {delta > 0
                    ? <span className="text-accent-dark">↑ +{delta.toFixed(1)}</span>
                    : delta < 0
                      ? <span className="text-coral">↓ {delta.toFixed(1)}</span>
                      : <span className="text-subtle">→ 0.0</span>}
                  <span className="text-subtle font-normal">vs last week</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-subtle">Scan some foods to see your average.</p>
          )}
        </div>
      )}

      {/* Tip of the Day */}
      <div className="bg-surface rounded-2xl shadow-card p-6">
        <h3 className="text-sm font-bold text-subtle uppercase tracking-wider mb-2">Tip of the Day 💡</h3>
        <p className="text-[15px] leading-relaxed text-ink/90">{tip}</p>
      </div>

      {/* Recent Scans (hidden in the empty state) */}
      {!empty && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-subtle uppercase tracking-wider">Recent Scans</h3>
            <button onClick={onSeeAll} className="text-sm font-semibold text-accent-dark hover:text-accent transition">See all</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {recent.map((item) => {
              const g = scoreToGrade(item.customScore);
              return (
                <button
                  key={item.timestamp}
                  onClick={() => onOpenItem(item)}
                  className="shrink-0 w-36 bg-surface rounded-2xl shadow-card p-3 text-left hover:shadow-soft transition-shadow"
                >
                  <div className="relative w-full h-20 rounded-xl bg-base p-2 flex items-center justify-center mb-2">
                    {item.image
                      ? <img src={item.image} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply" />
                      : <Search size={18} className="text-subtle" />}
                    <span
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white"
                      style={{ background: GRADE_COLOR[g] }}
                    >
                      {g}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-ink truncate">{item.productName}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreRing = ({ score = 0, size = 100, showValue = true }) => {
  const clamped = Math.max(0, Math.min(score, 100));
  const grade = scoreToGrade(clamped);
  const color = GRADE_COLOR[grade];
  const big = size >= 80;
  const stroke = big ? 9 : 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamped / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEEBE6" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold leading-none" style={{ color, fontSize: size * 0.36 }}>{grade}</span>
        {showValue && big && <span className="text-[10px] font-bold text-subtle mt-1">{clamped}/100</span>}
      </div>
    </div>
  );
};

const MacroPill = ({ label, value, unit }) => (
  <span className="inline-flex items-baseline gap-1 rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-accent-dark">
    {label}
    <span className="font-extrabold">{value || 0}{unit}</span>
  </span>
);

const NutritionRow = ({ label, value, unit, indent, last, highlight }) => (
  <div className={`flex items-center justify-between py-2 ${!last ? 'border-b border-line' : ''}`}>
    <span className={`text-sm ${indent ? 'pl-4 text-subtle' : 'font-bold text-ink'}`}>{label}</span>
    <span className={`text-sm font-bold ${highlight ? 'text-coral' : 'text-ink'}`}>{value || 0}{unit}</span>
  </div>
);

// Traffic-light nutrient levels in brand colours.
const LEVEL_CONFIG = {
  low: { width: '33%', bar: 'bg-accent', text: 'text-accent-dark' },
  moderate: { width: '66%', bar: 'bg-warn', text: 'text-warn' },
  high: { width: '100%', bar: 'bg-coral', text: 'text-coral' },
};

const LevelBar = ({ label, level }) => {
  if (!level) return null;
  const config = LEVEL_CONFIG[level] || { width: '10%', bar: 'bg-line', text: 'text-subtle' };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-ink/80">{label}</span>
        <span className={`text-xs font-bold uppercase ${config.text}`}>{level}</span>
      </div>
      <div className="h-2 bg-line rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${config.bar}`} style={{ width: config.width }} />
      </div>
    </div>
  );
};

const TabItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors"
    style={{ color: active ? '#4CAF78' : '#6B7280' }}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    {label}
  </button>
);

// Floating-label text / number / textarea field.
const FloatField = ({ label, textarea, hint, rows, ...props }) => {
  const shared =
    'peer w-full rounded-xl border border-line bg-base/60 px-3 pt-5 pb-2 text-sm text-ink placeholder-transparent focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15 transition';
  const labelCls =
    'pointer-events-none absolute left-3 top-2 text-[11px] font-semibold text-subtle transition-all ' +
    'peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal ' +
    'peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-accent-dark';

  return (
    <div>
      <div className="relative">
        {textarea ? (
          <textarea {...props} rows={rows} placeholder=" " className={shared} />
        ) : (
          <input {...props} placeholder=" " className={shared} />
        )}
        <label className={labelCls}>{label}</label>
      </div>
      {hint && <p className="mt-1 text-[11px] text-subtle">{hint}</p>}
    </div>
  );
};
