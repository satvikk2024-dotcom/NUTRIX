import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, Flame, Beef, Wheat } from 'lucide-react';
import { getWeeklyData, getMonthlyData, getMeals } from '../utils/storage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AnalyticsView() {
  const [period, setPeriod] = useState('week');

  const data = useMemo(() => period === 'week' ? getWeeklyData() : getMonthlyData(), [period]);
  const allMeals = useMemo(() => getMeals(), []);

  const avgCalories = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.calories, 0) / data.filter((d) => d.count > 0).length || 0)
    : 0;
  const avgProtein = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.protein, 0) / data.filter((d) => d.count > 0).length || 0)
    : 0;
  const totalMeals = allMeals.length;

  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0];
      const dayMeals = allMeals.filter((m) => m.date === date);
      if (dayMeals.length > 0) count++;
      else break;
    }
    return count;
  }, [allMeals]);

  const chartData = period === 'week'
    ? data.map((d) => ({ name: d.day, calories: d.calories, protein: d.protein, carbs: d.carbs }))
    : data.filter((_, i) => i % 3 === 0).map((d) => ({ name: d.day, calories: d.calories, protein: d.protein, carbs: d.carbs }));

  return (
    <div className="space-y-4">
      <h2 className="font-extrabold text-xl text-slate-800 dark:text-white">Analytics</h2>

      {/* Period Toggle */}
      <div className="flex gap-2">
        {[
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setPeriod(key)}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${period === key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-2">
            <Flame size={18} />
          </div>
          <p className="text-lg font-extrabold text-slate-800 dark:text-white">{avgCalories}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Cal/Day</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-2">
            <Beef size={18} />
          </div>
          <p className="text-lg font-extrabold text-slate-800 dark:text-white">{avgProtein}g</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Protein</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-2">
            <TrendingUp size={18} />
          </div>
          <p className="text-lg font-extrabold text-slate-800 dark:text-white">{streak}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Day Streak</p>
        </div>
      </div>

      {/* Calorie Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 size={15} /> Calories
        </h3>
        {chartData.some((d) => d.calories > 0) ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No meal data yet. Start logging meals!</p>
        )}
      </div>

      {/* Protein Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Beef size={15} /> Protein & Carbs
        </h3>
        {chartData.some((d) => d.protein > 0 || d.carbs > 0) ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="protein" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="carbs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Calendar size={14} /> Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <p className="text-xs text-slate-400">Total meals logged</p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">{totalMeals}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <p className="text-xs text-slate-400">Tracking since</p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">
              {allMeals.length > 0
                ? new Date(allMeals[allMeals.length - 1].createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                : 'Today'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
