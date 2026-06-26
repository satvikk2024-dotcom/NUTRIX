import { saveMeal, saveProfile, saveGoals, getMeals } from './storage';

const SEED_KEY = 'nutrix_seeded';

const indianMeals = [
  // Day 1 (6 days ago)
  { name: 'Poha with Peanuts', mealTime: 'Breakfast', calories: 270, protein: 7, carbs: 42, fat: 8, sugar: 3 },
  { name: 'Dal Tadka with Roti (2)', mealTime: 'Lunch', calories: 520, protein: 18, carbs: 68, fat: 14, sugar: 4 },
  { name: 'Masala Chai + Marie Biscuit', mealTime: 'Snack', calories: 150, protein: 3, carbs: 22, fat: 5, sugar: 12 },
  { name: 'Paneer Butter Masala + Rice', mealTime: 'Dinner', calories: 650, protein: 22, carbs: 72, fat: 28, sugar: 6 },

  // Day 2 (5 days ago)
  { name: 'Idli (3) + Coconut Chutney', mealTime: 'Breakfast', calories: 230, protein: 6, carbs: 38, fat: 6, sugar: 2 },
  { name: 'Chicken Biryani', mealTime: 'Lunch', calories: 580, protein: 28, carbs: 65, fat: 18, sugar: 3 },
  { name: 'Banana + Almonds (10)', mealTime: 'Snack', calories: 180, protein: 5, carbs: 24, fat: 8, sugar: 14 },
  { name: 'Chole Bhature', mealTime: 'Dinner', calories: 700, protein: 16, carbs: 82, fat: 32, sugar: 5 },

  // Day 3 (4 days ago)
  { name: 'Aloo Paratha (2) + Curd', mealTime: 'Breakfast', calories: 420, protein: 10, carbs: 52, fat: 18, sugar: 4 },
  { name: 'Rajma Chawal', mealTime: 'Lunch', calories: 480, protein: 15, carbs: 72, fat: 10, sugar: 3 },
  { name: 'Samosa (2) + Chai', mealTime: 'Snack', calories: 350, protein: 6, carbs: 38, fat: 18, sugar: 8 },
  { name: 'Egg Curry + Roti (2)', mealTime: 'Dinner', calories: 520, protein: 24, carbs: 54, fat: 20, sugar: 4 },

  // Day 4 (3 days ago)
  { name: 'Upma + Coconut Chutney', mealTime: 'Breakfast', calories: 280, protein: 7, carbs: 40, fat: 10, sugar: 3 },
  { name: 'Fish Curry + Rice', mealTime: 'Lunch', calories: 550, protein: 32, carbs: 58, fat: 16, sugar: 2 },
  { name: 'YogaBar Muesli + Milk', mealTime: 'Snack', calories: 220, protein: 8, carbs: 35, fat: 6, sugar: 15 },
  { name: 'Mixed Veg Sabzi + Chapati (3)', mealTime: 'Dinner', calories: 450, protein: 12, carbs: 62, fat: 14, sugar: 5 },

  // Day 5 (2 days ago)
  { name: 'Dosa (2) + Sambar', mealTime: 'Breakfast', calories: 320, protein: 9, carbs: 48, fat: 10, sugar: 4 },
  { name: 'Butter Chicken + Naan', mealTime: 'Lunch', calories: 720, protein: 35, carbs: 60, fat: 32, sugar: 5 },
  { name: 'The Whole Truth Protein Bar', mealTime: 'Snack', calories: 210, protein: 15, carbs: 23, fat: 9, sugar: 8 },
  { name: 'Palak Paneer + Roti (2)', mealTime: 'Dinner', calories: 540, protein: 20, carbs: 48, fat: 26, sugar: 4 },

  // Day 6 (yesterday)
  { name: 'Besan Chilla (2) + Green Chutney', mealTime: 'Breakfast', calories: 260, protein: 12, carbs: 30, fat: 10, sugar: 3 },
  { name: 'Mutton Keema + Pav (2)', mealTime: 'Lunch', calories: 620, protein: 30, carbs: 52, fat: 28, sugar: 4 },
  { name: 'Happilo Almonds + Chai', mealTime: 'Snack', calories: 200, protein: 7, carbs: 14, fat: 14, sugar: 6 },
  { name: 'Kadhi Pakora + Rice', mealTime: 'Dinner', calories: 500, protein: 14, carbs: 65, fat: 18, sugar: 5 },

  // Day 7 (today)
  { name: 'Moong Dal Cheela + Curd', mealTime: 'Breakfast', calories: 240, protein: 14, carbs: 28, fat: 8, sugar: 3 },
  { name: 'Veg Thali (Dal, Sabzi, Roti, Rice, Salad)', mealTime: 'Lunch', calories: 580, protein: 18, carbs: 78, fat: 16, sugar: 6 },
  { name: 'SuperYou Protein Bar', mealTime: 'Snack', calories: 210, protein: 20, carbs: 18, fat: 6, sugar: 4 },
  { name: 'Tandoori Chicken + Rumali Roti', mealTime: 'Dinner', calories: 480, protein: 38, carbs: 35, fat: 18, sugar: 2 },
];

export const seedDummyData = () => {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_KEY)) return;

  const mealsPerDay = 4;
  const totalDays = 7;

  for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
    const d = new Date();
    d.setDate(d.getDate() - (totalDays - 1 - dayIdx));
    const date = d.toISOString().split('T')[0];

    for (let m = 0; m < mealsPerDay; m++) {
      const meal = indianMeals[dayIdx * mealsPerDay + m];
      if (!meal) continue;
      saveMeal({ ...meal, date, source: 'manual' });
    }
  }

  saveProfile({ name: 'Satvik', age: '22', weight: '70', height: '175', sex: 'male', activityLevel: 'moderate' });
  saveGoals({ preset: 'general', calories: 2000, protein: 50, carbs: 250, fat: 65 });

  localStorage.setItem(SEED_KEY, 'true');
};
