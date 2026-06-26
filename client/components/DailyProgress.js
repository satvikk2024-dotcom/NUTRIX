import { Flame, Beef, Wheat, Droplets, Target } from 'lucide-react';

const ProgressRing = ({ value, max, size = 80, strokeWidth = 6, color, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / (max || 1), 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-slate-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth}
          stroke={color} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const MacroBar = ({ icon: Icon, label, value, max, unit, color, bgColor }) => {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {Math.round(value)}<span className="text-slate-400 font-normal">/{max}{unit}</span>
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
};

export default function DailyProgress({ totals, goals }) {
  const calPct = Math.round((totals.calories / (goals.calories || 1)) * 100);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Target size={15} className="text-blue-500" /> Daily Progress
        </h3>
        <span className="text-xs text-slate-400">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      </div>

      <div className="flex items-center gap-5 mb-5">
        <ProgressRing value={totals.calories} max={goals.calories} size={90} strokeWidth={7} color={calPct >= 100 ? '#ef4444' : calPct >= 80 ? '#f59e0b' : '#3b82f6'}>
          <span className="text-lg font-extrabold text-slate-800 dark:text-white">{Math.round(totals.calories)}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase">kcal</span>
        </ProgressRing>

        <div className="flex-1 space-y-3">
          <MacroBar icon={Beef} label="Protein" value={totals.protein} max={goals.protein} unit="g"
            color="bg-rose-500" bgColor="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
          <MacroBar icon={Wheat} label="Carbs" value={totals.carbs} max={goals.carbs} unit="g"
            color="bg-blue-500" bgColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <MacroBar icon={Droplets} label="Fat" value={totals.fat} max={goals.fat} unit="g"
            color="bg-amber-500" bgColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-slate-400">
          {goals.calories - totals.calories > 0
            ? `${Math.round(goals.calories - totals.calories)} kcal remaining`
            : `${Math.round(totals.calories - goals.calories)} kcal over target`}
        </p>
      </div>
    </div>
  );
}
