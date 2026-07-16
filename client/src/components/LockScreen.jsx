import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyPasswordAPI } from '../services/api';
import { Lock, LogOut, ShieldAlert, KeyRound } from 'lucide-react';

export const LockScreen = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const timeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Inactivity limit in milliseconds (60 seconds for quick testing/safety)
  const INACTIVITY_TIMEOUT = 60 * 1000;

  // Reset the inactivity timeout
  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isAuthenticated && !isLocked) {
      timeoutRef.current = setTimeout(() => {
        setIsLocked(true);
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Bind/unbind activity event listeners
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    if (isAuthenticated && !isLocked) {
      resetTimer();
      events.forEach((event) => {
        window.addEventListener(event, handleActivity);
      });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, isLocked]);

  // Focus input automatically on lock
  useEffect(() => {
    if (isLocked && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isLocked]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await verifyPasswordAPI(password);
      if (res.success) {
        setIsLocked(false);
        setPassword('');
        setAttempts(3);
        setError('');
        resetTimer();
      }
    } catch (err) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);

      const nextAttempts = attempts - 1;
      setAttempts(nextAttempts);

      if (nextAttempts <= 0) {
        // Log out immediately
        logout();
        setIsLocked(false);
        setPassword('');
        setAttempts(3);
        setError('');
      } else {
        setError(`Incorrect password. ${nextAttempts} attempt${nextAttempts > 1 ? 's' : ''} remaining.`);
        setPassword('');
        inputRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogout = () => {
    logout();
    setIsLocked(false);
    setPassword('');
    setAttempts(3);
    setError('');
  };

  // If locked, render the premium blurred screen overlay, protecting child nodes
  return (
    <>
      {isLocked && isAuthenticated ? (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-[#0a0a0f]/90 backdrop-blur-2xl select-none animate-fade-in font-sans">
          <div className={`glass-card max-w-md w-full p-8 border-indigo-500/25 shadow-2xl flex flex-col items-center text-center animate-scale-up ${isShaking ? 'animate-shake' : ''}`}>
            
            {/* Pulsing Lock Icon Header */}
            <div className="relative w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 ring-4 ring-indigo-500/25 animate-pulse">
              <Lock className="text-indigo-400" size={24} />
            </div>

            {/* Title / App Brand */}
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
              Session Locked
            </h2>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-6">
              Locked due to inactivity
            </p>

            {/* Profile Area */}
            {user && (
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white mb-2 shadow-md">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <h3 className="text-sm font-semibold text-slate-200">{user.name}</h3>
                <p className="text-xs text-slate-400 mb-2">{user.email}</p>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {user.role}
                </span>
              </div>
            )}

            {/* Password input form */}
            <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3" autoComplete="off">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password to Unlock"
                  disabled={loading}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition-all font-sans"
                  autoComplete="new-password"
                />
                <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 justify-center text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-lg">
                  <ShieldAlert size={14} className="shrink-0 animate-bounce" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Unlocking...' : 'Unlock Screen'}
              </button>
            </form>

            {/* Force log out manually */}
            <button
              onClick={handleManualLogout}
              className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign out of user</span>
            </button>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
};
