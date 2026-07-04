import React from 'react';

const StatCard = ({ title, value, icon, color = 'indigo' }) => {
  const getColors = () => {
    switch (color) {
      case 'purple':
        return {
          iconBg: 'bg-purple-500/10',
          iconText: 'text-purple-600 dark:text-purple-400',
          borderHover: 'hover:border-purple-300 dark:hover:border-purple-500/30',
          shadowGlow: 'shadow-purple-100/50 dark:shadow-purple-950/10',
        };
      case 'cyan':
        return {
          iconBg: 'bg-cyan-500/10',
          iconText: 'text-cyan-600 dark:text-cyan-400',
          borderHover: 'hover:border-cyan-300 dark:hover:border-cyan-500/30',
          shadowGlow: 'shadow-cyan-100/50 dark:shadow-cyan-950/10',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10',
          iconText: 'text-emerald-600 dark:text-emerald-400',
          borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-500/30',
          shadowGlow: 'shadow-emerald-100/50 dark:shadow-emerald-950/10',
        };
      case 'indigo':
      default:
        return {
          iconBg: 'bg-indigo-500/10',
          iconText: 'text-indigo-600 dark:text-indigo-400',
          borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-500/30',
          shadowGlow: 'shadow-indigo-100/50 dark:shadow-indigo-950/10',
        };
    }
  };

  const themeColors = getColors();

  return (
    <div className={`glass-card p-6 relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${themeColors.borderHover} ${themeColors.shadowGlow}`}>
      {/* Background glow detail */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 blur-xl dark:opacity-15 ${themeColors.iconBg}`} />

      <div className="flex justify-between items-center relative z-10">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider dark:text-slate-500">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${themeColors.iconBg} ${themeColors.iconText}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
