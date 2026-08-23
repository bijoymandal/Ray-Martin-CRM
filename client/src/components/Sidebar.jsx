import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGuide } from '../context/GuideContext';
import { getVisibleMenusAPI } from '../services/api';
import * as Icons from 'lucide-react';

const Sidebar = () => {
  const { user, permissions } = useAuth();
  const { openGuide, startTour } = useGuide();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await getVisibleMenusAPI();
        if (res.success) {
          setMenuItems(res.data);
        }
      } catch (err) {
        console.error('Error loading sidebar menus:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchMenus();
    }
  }, [user, permissions]);

  const renderIcon = (iconName) => {
    const IconComponent = Icons[iconName] || Icons.HelpCircle;
    const extraClass = iconName === 'Settings' 
      ? 'group-hover:rotate-90 transition-transform duration-500 ease-out' 
      : '';
    return <IconComponent size={18} className={extraClass} />;
  };

  if (loading) {
    return (
      <aside className="w-[260px] hidden md:flex flex-col p-8 gap-4 border-r backdrop-blur-md bg-white/40 border-slate-200/80 dark:bg-dark-card/40 dark:border-white/5">
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="skeleton h-10 w-full rounded-xl" />
      </aside>
    );
  }

  return (
    <aside
      data-tour="sidebar"
      className="w-[260px] hidden md:flex flex-col justify-between p-6 gap-6 border-r backdrop-blur-md bg-white/40 border-slate-200/80 dark:bg-dark-card/40 dark:border-white/5 md:fixed md:top-0 md:left-0 md:bottom-0 md:h-screen md:z-[90] overflow-y-auto"
    >
      <div className="flex flex-col gap-1.5">
        <div className="px-4 py-2 mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Navigation Menu
          </span>
        </div>
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? 'bg-indigo-50/80 border-indigo-200/80 text-indigo-600 shadow-sm shadow-indigo-100/50 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 dark:shadow-none font-bold'
                  : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
              }`
            }
          >
            <span className="mr-3.5 flex items-center">{renderIcon(item.iconName)}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Persistent Help & Guide Card in Sidebar Footer */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200/60 dark:border-white/10 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Icons.Compass size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Need Help?
            </h4>
            <span className="text-[10px] text-slate-400">Full System Guide</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={() => openGuide()}
            className="px-2 py-1.5 rounded-lg bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/5 transition-all text-center cursor-pointer shadow-2xs"
          >
            Open Guide
          </button>
          <button
            onClick={() => startTour()}
            className="px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all text-center cursor-pointer shadow-2xs"
          >
            Start Tour
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
