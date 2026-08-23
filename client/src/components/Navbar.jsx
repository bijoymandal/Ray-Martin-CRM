import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGuide } from '../context/GuideContext';
import { LogOut, Sun, Moon, User, Settings, ChevronDown, Compass, Sparkles, BookOpen } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { openGuide, startTour } = useGuide();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut for quick guide
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openGuide();
      } else if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        openGuide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openGuide]);

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
      <div className="flex items-center gap-4">
        <span className="text-2xl font-extrabold tracking-tight text-gradient-accent">CRM Pro</span>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Guide & Tour Quick Launch Button */}
        <button
          onClick={() => openGuide()}
          data-tour="guide-btn"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-all shadow-xs cursor-pointer group"
          title="Open User Guide & Navigation Hub (Ctrl+K / ⌘K)"
        >
          <Compass size={16} className="text-indigo-500 group-hover:rotate-45 transition-transform duration-300" />
          <span className="hidden sm:inline">Guide & Tour</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-dark-deep border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-mono text-indigo-500 font-normal">
            ⌘K
          </kbd>
        </button>

        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          data-tour="theme-toggle"
          className="p-2.5 rounded-lg border transition-all duration-200 hover:bg-slate-100 border-slate-200 text-slate-600 dark:hover:bg-white/5 dark:border-white/5 dark:text-slate-300 cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && (
          <div className="relative" ref={dropdownRef} data-tour="user-menu">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 group cursor-pointer select-none bg-slate-50 hover:bg-slate-100 border border-slate-200/50 dark:bg-white/3 dark:hover:bg-white/5 dark:border-white/5 px-3 py-1.5 rounded-xl transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-indigo-500/20 group-hover:scale-102 transition-transform duration-200">
                {getInitials(user.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 leading-tight">
                  {user.name}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold dark:text-slate-500 leading-none">
                  {user.role}
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180 text-slate-600 dark:text-slate-300' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl border bg-white/95 dark:bg-dark-card/95 backdrop-blur-lg border-slate-200/80 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none p-2 flex flex-col gap-1 animate-fade-in z-[110]">
                {/* Header User info */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex flex-col mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{user.email}</span>
                </div>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <User size={15} className="text-slate-400" />
                  <span>My Profile</span>
                </Link>

                {/* System Guide Modal Trigger */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    openGuide();
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all cursor-pointer text-left w-full border-none bg-transparent"
                >
                  <BookOpen size={15} className="text-indigo-500" />
                  <span>System User Guide</span>
                </button>

                {/* Interactive Tour Trigger */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    startTour();
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all cursor-pointer text-left w-full border-none bg-transparent"
                >
                  <Sparkles size={15} className="text-purple-500" />
                  <span>Start App Tour</span>
                </button>

                {/* Admin/Settings Link */}
                {(user.role === 'SUPERADMIN' || user.role === 'ADMIN') && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                  >
                    <Settings size={15} className="text-slate-400" />
                    <span>Admin Center</span>
                  </Link>
                )}

                <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-1" />

                {/* Logout button */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 transition-all cursor-pointer text-left w-full border-none bg-transparent"
                >
                  <LogOut size={15} className="text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
