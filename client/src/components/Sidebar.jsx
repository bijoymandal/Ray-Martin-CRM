import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVisibleMenusAPI } from '../services/api';
import * as Icons from 'lucide-react';

const Sidebar = () => {
  const { user, permissions } = useAuth();
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
    <aside className="w-[260px] hidden md:flex flex-col p-8 gap-8 border-r backdrop-blur-md bg-white/40 border-slate-200/80 dark:bg-dark-card/40 dark:border-white/5">
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? 'bg-indigo-50/80 border-indigo-200/80 text-indigo-600 shadow-sm shadow-indigo-100/50 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 dark:shadow-none'
                  : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
              }`
            }
          >
            <span className="mr-4 flex items-center">{renderIcon(item.iconName)}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
