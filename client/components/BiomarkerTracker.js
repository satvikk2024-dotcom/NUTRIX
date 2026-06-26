import { useState, useEffect } from 'react';
import { Activity, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const BIOMARKER_TYPES = [
  { key: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', low: 70, high: 100, criticalHigh: 126 },
  { key: 'cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', low: 0, high: 200, criticalHigh: 240 },
  { key: 'hdl', label: 'HDL', unit: 'mg/dL', low: 40, high: 60, criticalHigh: 999 },
  { key: 'ldl', label: 'LDL', unit: 'mg/dL', low: 0, high: 100, criticalHigh: 160 },
  { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', low: 0, high: 150, criticalHigh: 200 },
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', low: 60, high: 100, criticalHigh: 120 },
  { key: 'bp_systolic', label: 'BP (Systolic)', unit: 'mmHg', low: 90, high: 120, criticalHigh: 140 },
  { key: 'bp_diastolic', label: 'BP (Diastolic)', unit: 'mmHg', low: 60, high: 80, criticalHigh: 90 },
];

const STORAGE_KEY = 'nutrix_biomarkers';

const getBiomarkers = () => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

const saveBiomarkers = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const getStatus = (type, value) => {
  const config = BIOMARKER_TYPES.find((t) => t.key === type);
  if (!config) return { label: 'Unknown', color: 'text-slate-400' };
  if (value < config.low) return { label: 'Low', color: 'text-blue-500', icon: TrendingDown };
  if (value > config.criticalHigh) return { label: 'High Risk', color: 'text-red-600', icon: TrendingUp };
  if (value > config.high) return { label: 'Elevated', color: 'text-amber-500', icon: TrendingUp };
  return { label: 'Normal', color: 'text-green-500', icon: Minus };
};

export default function BiomarkerTracker() {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'blood_sugar', value: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => { setEntries(getBiomarkers()); }, []);

  const handleAdd = () => {
    if (!form.value) return;
    const entry = { id: Date.now().toString(36), type: form.type, value: parseFloat(form.value), date: form.date, createdAt: new Date().toISOString() };
    const updated = [entry, ...entries];
    setEntries(updated);
    saveBiomarkers(updated);
    setForm({ type: 'blood_sugar', value: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveBiomarkers(updated);
  };

  const latestByType = {};
  for (const e of entries) {
    if (!latestByType[e.type] || e.date > latestByType[e.type].date) latestByType[e.type] = e;
  }

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Activity size={15} className="text-red-500" /> Biomarkers
          </h3>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-200 transition"
          >
            <Plus size={12} /> Add
          </button>
        </div>

        {showForm && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 space-y-2 animate-fade-in-down">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {BIOMARKER_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label} ({t.unit})</option>)}
            </select>
            <div className="flex gap-2">
              <input type="number" inputMode="decimal" placeholder="Value"
                className="flex-1 h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
              <input type="date"
                className="flex-1 h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <button onClick={handleAdd}
              className="w-full py-2 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 transition"
            >
              Save
            </button>
          </div>
        )}

        {/* Latest readings */}
        {Object.keys(latestByType).length > 0 ? (
          <div className="space-y-2">
            {BIOMARKER_TYPES.map((t) => {
              const entry = latestByType[t.key];
              if (!entry) return null;
              const status = getStatus(t.key, entry.value);
              const StatusIcon = status.icon || Minus;
              return (
                <div key={t.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.label}</p>
                    <p className="text-[10px] text-slate-400">{entry.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-800 dark:text-white">{entry.value}</span>
                    <span className="text-[10px] text-slate-400">{t.unit}</span>
                    <span className={`flex items-center gap-0.5 text-[10px] font-bold ${status.color}`}>
                      <StatusIcon size={10} /> {status.label}
                    </span>
                    <button onClick={() => handleDelete(entry.id)} className="p-1 text-slate-300 hover:text-red-500 transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">No biomarkers logged yet. Track your blood sugar, cholesterol, and more.</p>
        )}
      </div>
    </div>
  );
}
