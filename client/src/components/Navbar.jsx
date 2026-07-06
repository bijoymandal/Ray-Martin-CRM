import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="h-[70px] px-8 flex items-center justify-between fixed top-0 right-0 left-0 md:left-[260px] z-[100] backdrop-blur-md border-b bg-white/70 border-slate-200/80 dark:bg-dark-main/70 dark:border-white/5">
      <div className="flex items-center">
        <span className="text-2xl font-extrabold tracking-tight text-gradient-accent">CRM Pro</span>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg border transition-all duration-200 hover:bg-slate-100 border-slate-200 text-slate-600 dark:hover:bg-white/5 dark:border-white/5 dark:text-slate-300"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && (
          <div className="flex items-center gap-6">
            <Link to="/profile" className="flex items-center gap-3 group cursor-pointer select-none">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                {getInitials(user.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">{user.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold dark:text-slate-500">{user.role}</span>
              </div>
            </Link>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-transparent border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/5"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
