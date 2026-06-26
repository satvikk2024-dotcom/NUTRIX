import { useState, useEffect } from 'react';
import { User, Target, Save, Zap, Dumbbell, Heart } from 'lucide-react';
import { getProfile, saveProfile, getGoals, saveGoals, applyPreset, PRESETS } from '../utils/storage';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little/no exercise' },
  { value: 'light', label: 'Light', desc: '1-3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
  { value: 'active', label: 'Active', desc: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Athlete level' },
];

const PRESET_INFO = [
  { key: 'general', label: 'General Health', icon: Heart, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  { key: 'weightLoss', label: 'Weight Loss', icon: Zap, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  { key: 'muscleGain', label: 'Muscle Gain', icon: Dumbbell, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
];

export default function ProfileGoals({ onUpdate }) {
  const [profile, setProfile] = useState(getProfile());
  const [goals, setGoals] = useState(getGoals());
  const [saved, setSaved] = useState(false);

  const handleProfileChange = (key, value) => {
    const updated = { ...profile, [key]: value };
    setProfile(updated);
    saveProfile(updated);
  };

  const handleGoalChange = (key, value) => {
    const updated = { ...goals, [key]: parseFloat(value) || 0, preset: 'custom' };
    setGoals(updated);
    saveGoals(updated);
    onUpdate?.();
  };

  const handlePreset = (presetKey) => {
    const updated = applyPreset(presetKey);
    setGoals(updated);
    onUpdate?.();
  };

  const handleSave = () => {
    saveProfile(profile);
    saveGoals(goals);
    setSaved(true);
    onUpdate?.();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Profile */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
          <User size={15} className="text-blue-500" /> Health Profile
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { key: 'age', label: 'Age', type: 'number', placeholder: '25' },
            { key: 'weight', label: 'Weight (kg)', type: 'number', placeholder: '70' },
            { key: 'height', label: 'Height (cm)', type: 'number', placeholder: '170' },
            { key: 'name', label: 'Name', type: 'text', placeholder: 'Your name' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
              <input type={type} placeholder={placeholder}
                className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={profile[key]} onChange={(e) => handleProfileChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="mb-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Sex</label>
          <div className="flex gap-2">
            {['male', 'female'].map((s) => (
              <button key={s} onClick={() => handleProfileChange('sex', s)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${profile.sex === s ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Activity Level</label>
          <div className="space-y-1.5">
            {ACTIVITY_LEVELS.map(({ value, label, desc }) => (
              <button key={value} onClick={() => handleProfileChange('activityLevel', value)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition ${profile.activityLevel === value ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900'}`}
              >
                <span className={`text-xs font-bold ${profile.activityLevel === value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>{label}</span>
                <span className="text-[10px] text-slate-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
          <Target size={15} className="text-green-500" /> Daily Goals
        </h3>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {PRESET_INFO.map(({ key, label, icon: Icon, color }) => (
            <button key={key} onClick={() => handlePreset(key)}
              className={`p-3 rounded-xl text-center transition ${goals.preset === key ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1.5 ${color}`}>
                <Icon size={16} />
              </div>
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{label}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'calories', label: 'Calories (kcal)' },
            { key: 'protein', label: 'Protein (g)' },
            { key: 'carbs', label: 'Carbs (g)' },
            { key: 'fat', label: 'Fat (g)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
              <input type="number" inputMode="decimal"
                className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={goals[key]} onChange={(e) => handleGoalChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave}
        className={`w-full py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        <Save size={16} /> {saved ? 'Saved!' : 'Save Profile & Goals'}
      </button>
    </div>
  );
}
