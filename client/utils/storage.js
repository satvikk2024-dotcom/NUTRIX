const MEALS_KEY = 'nutrix_meals';
const PROFILE_KEY = 'nutrix_profile';
const GOALS_KEY = 'nutrix_goals';

const isBrowser = typeof window !== 'undefined';

// --- MEALS ---
export const getMeals = () => {
  if (!isBrowser) return [];
  try { return JSON.parse(localStorage.getItem(MEALS_KEY) || '[]'); }
  catch { return []; }
};

export const saveMeal = (meal) => {
  const meals = getMeals();
  const entry = {
    id: meal.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: meal.name,
    brand: meal.brand || '',
    mealTime: meal.mealTime || 'Snack',
    date: meal.date || new Date().toISOString().split('T')[0],
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fat: meal.fat || 0,
    sugar: meal.sugar || 0,
    sodium: meal.sodium || 0,
    fiber: meal.fiber || 0,
    image: meal.image || null,
    source: meal.source || 'manual',
    createdAt: meal.createdAt || new Date().toISOString(),
  };
  const idx = meals.findIndex((m) => m.id === entry.id);
  if (idx >= 0) meals[idx] = entry;
  else meals.unshift(entry);
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  return entry;
};

export const deleteMeal = (id) => {
  const meals = getMeals().filter((m) => m.id !== id);
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
};

export const getMealsByDate = (date) => getMeals().filter((m) => m.date === date);

export const getDailyTotals = (date) => {
  const meals = getMealsByDate(date);
  return {
    calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
    protein: meals.reduce((s, m) => s + (m.protein || 0), 0),
    carbs: meals.reduce((s, m) => s + (m.carbs || 0), 0),
    fat: meals.reduce((s, m) => s + (m.fat || 0), 0),
    sugar: meals.reduce((s, m) => s + (m.sugar || 0), 0),
    count: meals.length,
  };
};

export const getWeeklyData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    const totals = getDailyTotals(date);
    data.push({
      date,
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      ...totals,
    });
  }
  return data;
};

export const getMonthlyData = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    const totals = getDailyTotals(date);
    data.push({ date, day: d.getDate().toString(), ...totals });
  }
  return data;
};

// --- PROFILE ---
const DEFAULT_PROFILE = {
  name: '', age: '', weight: '', height: '', sex: 'male', activityLevel: 'moderate',
};

export const getProfile = () => {
  if (!isBrowser) return DEFAULT_PROFILE;
  try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') }; }
  catch { return DEFAULT_PROFILE; }
};

export const saveProfile = (profile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

// --- GOALS ---
const DEFAULT_GOALS = {
  preset: 'general',
  calories: 2000, protein: 50, carbs: 250, fat: 65,
};

const PRESETS = {
  general: { calories: 2000, protein: 50, carbs: 250, fat: 65 },
  weightLoss: { calories: 1500, protein: 60, carbs: 150, fat: 50 },
  muscleGain: { calories: 2500, protein: 120, carbs: 300, fat: 70 },
};

export const getGoals = () => {
  if (!isBrowser) return DEFAULT_GOALS;
  try { return { ...DEFAULT_GOALS, ...JSON.parse(localStorage.getItem(GOALS_KEY) || '{}') }; }
  catch { return DEFAULT_GOALS; }
};

export const saveGoals = (goals) => {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
};

export const applyPreset = (presetName) => {
  const preset = PRESETS[presetName] || PRESETS.general;
  const goals = { ...preset, preset: presetName };
  saveGoals(goals);
  return goals;
};

export { PRESETS };
