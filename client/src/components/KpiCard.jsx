import React from 'react';

const COLOR_MAPS = {
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
    activeRing: 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    activeRing: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    activeRing: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    activeRing: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    activeRing: 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-500/5',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    activeRing: 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-500/5',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    activeRing: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5',
  },
};

const KpiCard = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = 'indigo',
  onClick,
  isActive = false,
  badgeText,
}) => {
  const colors = COLOR_MAPS[accentColor] || COLOR_MAPS.indigo;

  return (
    <div
      onClick={onClick}
      className={[
        'glass-card p-5 space-y-2 relative overflow-hidden transition-all duration-200',
        onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : '',
        isActive ? colors.activeRing : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
        <span className="truncate">{title}</span>
        {icon && <span className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</span>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
          {value !== undefined && value !== null ? value : '0'}
        </div>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${colors.bg} ${colors.text} ${colors.border}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{subtitle}</p>}
    </div>
  );
};

export default KpiCard;
