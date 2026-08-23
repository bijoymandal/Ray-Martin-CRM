import React, { useState } from 'react';
import { useGuide } from '../../context/GuideContext';
import { useAuth } from '../../context/AuthContext';
import * as Icons from 'lucide-react';

const WelcomeOnboardingModal = () => {
  const { isWelcomeOpen, dismissWelcome, startTour, openGuide } = useGuide();
  const { user } = useAuth();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isWelcomeOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-dark-main border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        {/* Top Decorative Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={() => dismissWelcome(dontShowAgain)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
          >
            <Icons.X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Icons.Sparkles className="text-yellow-300" size={24} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                Welcome to CRM Pro
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Hello, {user?.name || 'Valued User'}! 👋
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed">
            Your all-in-one publishing CRM & educational operations platform is ready. You are logged in with{' '}
            <span className="font-bold underline decoration-yellow-400 decoration-2">{user?.role}</span> permissions.
          </p>
        </div>

        {/* Action Choices Body */}
        <div className="p-6 sm:p-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Start Interactive Tour Card */}
            <div
              onClick={() => {
                dismissWelcome(dontShowAgain);
                startTour();
              }}
              className="group p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100/60 dark:hover:bg-indigo-500/20 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Icons.Navigation size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Interactive Tour
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    1-minute guided spotlight of the sidebar, navigation, search, and themes.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Start Tour</span>
                <Icons.ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Menu-Wise Guide Card */}
            <div
              onClick={() => {
                dismissWelcome(dontShowAgain);
                openGuide();
              }}
              className="group p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Icons.BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Menu-Wise Guide
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Browse all 12+ modules, operating procedures, and keyboard shortcuts.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>Browse Guide</span>
                <Icons.ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Quick module highlight bullet */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/3 border border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Icons.ShieldCheck className="text-emerald-500 shrink-0" size={20} />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold">Dynamic RBAC Active:</span> You will see only the menus and actions authorized for your account role.
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/10">
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <span>Don't show this welcome guide on startup</span>
            </label>

            <button
              onClick={() => dismissWelcome(dontShowAgain)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white dark:bg-white/10 dark:hover:bg-white/20 transition-all cursor-pointer self-end sm:self-auto"
            >
              Go to Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOnboardingModal;
