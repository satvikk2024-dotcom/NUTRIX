import { useState } from 'react';
import { Plus, X, Clock, Flame, Wheat, Beef, Candy, Trash2, Edit3, Check } from 'lucide-react';

const MEAL_TIMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function MealLogger({ meals, onSave, onDelete, onEdit }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', mealTime: 'Snack', calories: '', protein: '', carbs: '', fat: '' });

  const resetForm = () => {
    setForm({ name: '', mealTime: 'Snack', calories: '', protein: '', carbs: '', fat: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.name) return;
    onSave({
      id: editingId || undefined,
      name: form.name,
      mealTime: form.mealTime,
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      source: 'manual',
    });
    resetForm();
  };

  const startEdit = (meal) => {
    setForm({
      name: meal.name, mealTime: meal.mealTime,
      calories: meal.calories.toString(), protein: meal.protein.toString(),
      carbs: meal.carbs.toString(), fat: meal.fat.toString(),
    });
    setEditingId(meal.id);
    setShowForm(true);
  };

  const grouped = {};
  for (const t of MEAL_TIMES) grouped[t] = [];
  for (const m of meals) {
    const key = MEAL_TIMES.includes(m.mealTime) ? m.mealTime : 'Snack';
    grouped[key].push(m);
  }

  return (
    <div className="space-y-3">
      {/* Add Meal Button */}
      <button
        onClick={() => { resetForm(); setShowForm(true); }}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition active:scale-[0.98]"
      >
        <Plus size={18} /> Log a Meal
      </button>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 border border-blue-200 dark:border-slate-700 animate-fade-in-down">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {editingId ? 'Edit Meal' : 'Add Meal'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
          </div>

          <input
            type="text" placeholder="Food name..."
            className="w-full h-11 px-3 mb-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="flex gap-2 mb-3">
            {MEAL_TIMES.map((t) => (
              <button key={t}
                onClick={() => setForm({ ...form, mealTime: t })}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${form.mealTime === t ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { key: 'calories', label: 'Cal', icon: Flame },
              { key: 'protein', label: 'Protein', icon: Beef },
              { key: 'carbs', label: 'Carbs', icon: Wheat },
              { key: 'fat', label: 'Fat', icon: Candy },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
                <input
                  type="number" inputMode="decimal" placeholder="0"
                  className="w-full h-9 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <button onClick={handleSubmit}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
            <Check size={16} /> {editingId ? 'Update' : 'Add'}
          </button>
        </div>
      )}

      {/* Meal List by Time */}
      {MEAL_TIMES.map((time) => {
        const items = grouped[time];
        if (!items.length) return null;
        return (
          <div key={time} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={12} /> {time}
            </h3>
            <div className="space-y-2">
              {items.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{meal.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {meal.calories}cal • {meal.protein}g P • {meal.carbs}g C • {meal.fat}g F
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(meal)} className="p-1.5 text-slate-400 hover:text-blue-500 transition">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => onDelete(meal.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
