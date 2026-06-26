import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, Eye } from 'lucide-react';

const SEVERITY_STYLES = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

const SEVERITY_DOT = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400',
};

export default function SafetyWarnings({ warnings, transparencyScore }) {
  const [expanded, setExpanded] = useState(false);

  if (!warnings?.length && (transparencyScore === undefined || transparencyScore === null)) return null;

  const getTransparencyColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTransparencyBg = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-3">
      {/* Transparency Score */}
      {transparencyScore != null && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Eye size={15} className="text-blue-500" /> Ingredient Transparency
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-extrabold ${getTransparencyColor(transparencyScore)}`}>
                {transparencyScore}
              </span>
              <span className="text-xs text-slate-400 font-bold">/100</span>
            </div>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getTransparencyBg(transparencyScore)}`}
              style={{ width: `${transparencyScore}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {transparencyScore >= 80
              ? 'Clean and recognizable ingredient list'
              : transparencyScore >= 50
              ? 'Some processed or complex ingredients'
              : 'Highly processed with many additives'}
          </p>
        </div>
      )}

      {/* Safety Warnings */}
      {warnings?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <ShieldAlert size={16} />
              {warnings.length} Additive Warning{warnings.length > 1 ? 's' : ''}
            </h3>
            {expanded ? <ChevronUp size={16} className="text-amber-500" /> : <ChevronDown size={16} className="text-amber-500" />}
          </button>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {warnings.map((w) => (
              <span
                key={w.code}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${SEVERITY_STYLES[w.severity]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[w.severity]}`} />
                {w.code}
              </span>
            ))}
          </div>

          {expanded && (
            <div className="mt-4 space-y-2.5 animate-fade-in-down">
              {warnings.map((w) => (
                <div
                  key={w.code}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl"
                >
                  <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${w.severity === 'high' ? 'text-red-500' : w.severity === 'medium' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {w.code} — {w.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {w.concern}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
