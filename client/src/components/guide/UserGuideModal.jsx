import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuide } from '../../context/GuideContext';
import { useAuth } from '../../context/AuthContext';
import { CRM_MODULES, WORKFLOW_GUIDES, KEYBOARD_SHORTCUTS } from './guideData';
import * as Icons from 'lucide-react';

const UserGuideModal = () => {
  const {
    isGuideOpen,
    closeGuide,
    activeGuideTab,
    setActiveGuideTab,
    selectedModuleId,
    setSelectedModuleId,
    startTour,
  } = useGuide();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeWorkflowId, setActiveWorkflowId] = useState(WORKFLOW_GUIDES[0]?.id);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isGuideOpen) {
        closeGuide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuideOpen, closeGuide]);

  // Categories extracted from modules
  const categories = useMemo(() => {
    const set = new Set(['All']);
    CRM_MODULES.forEach((m) => set.add(m.category));
    return Array.from(set);
  }, []);

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    return CRM_MODULES.filter((mod) => {
      const matchCat = selectedCategory === 'All' || mod.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchSearch =
        mod.name.toLowerCase().includes(q) ||
        mod.tagline.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q) ||
        mod.keyFeatures.some((f) => f.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  const activeModule = useMemo(() => {
    if (!selectedModuleId) return null;
    return CRM_MODULES.find((m) => m.id === selectedModuleId) || null;
  }, [selectedModuleId]);

  const handleNavigateToModule = (path) => {
    closeGuide();
    navigate(path);
  };

  const renderIcon = (iconName, size = 20, className = '') => {
    const IconComponent = Icons[iconName] || Icons.HelpCircle;
    return <IconComponent size={size} className={className} />;
  };

  if (!isGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-white dark:bg-dark-main border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Banner */}
        <div className="relative px-6 py-5 sm:px-8 sm:py-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-700/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Icons.Compass className="text-white animate-spin-slow" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  CRM Pro System Guide
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/20 text-indigo-100 uppercase tracking-wide">
                  Navigation Hub
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 font-medium">
                Complete menu-wise user handbook, operational workflows, and interactive guidance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={startTour}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Launch step-by-step interactive UI tour"
            >
              <Icons.Sparkles size={15} className="text-yellow-300" />
              <span>Interactive Tour</span>
            </button>
            <button
              onClick={closeGuide}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
              aria-label="Close Guide"
            >
              <Icons.X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 sm:px-8 pt-3 border-b border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-dark-card/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveGuideTab('modules')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeGuideTab === 'modules'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-dark-main'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icons.Grid size={16} />
              <span>All Modules ({CRM_MODULES.length})</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('workflows')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeGuideTab === 'workflows'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-dark-main'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icons.GitMerge size={16} />
              <span>Operational Workflows</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('shortcuts')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeGuideTab === 'shortcuts'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-dark-main'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icons.Command size={16} />
              <span>Shortcuts & Tips</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pb-2 hidden sm:block">
            Signed in as: <span className="font-bold text-slate-600 dark:text-slate-300">{user?.name}</span> ({user?.role})
          </div>
        </div>

        {/* Tab 1: Modules Explorer */}
        {activeGuideTab === 'modules' && (
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col gap-6">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Icons.Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search modules, features, ISBN, inventory, permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <Icons.X size={16} />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => setSelectedModuleId(module.id)}
                  className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-lg ${
                    selectedModuleId === module.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20'
                      : 'border-slate-200/80 dark:border-white/5 bg-white dark:bg-dark-card hover:border-indigo-300 dark:hover:border-indigo-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white shadow-md`}
                      >
                        {renderIcon(module.icon, 20)}
                      </div>
                      <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {module.badge}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {module.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 mb-3">
                      {module.tagline}
                    </p>

                    <div className="space-y-1.5 mb-4">
                      {module.keyFeatures.slice(0, 2).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                          <Icons.CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {module.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToModule(module.path);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                    >
                      <span>Open Menu</span>
                      <Icons.ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredModules.length === 0 && (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <Icons.SearchX size={40} className="text-slate-400 mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No matching CRM modules found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching with different keywords like 'stock', 'contact', 'specimen' or 'visit'.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Operational Workflows */}
        {activeGuideTab === 'workflows' && (
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Workflow Selector */}
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Standard Operating Procedures
              </h3>
              {WORKFLOW_GUIDES.map((wf) => (
                <div
                  key={wf.id}
                  onClick={() => setActiveWorkflowId(wf.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeWorkflowId === wf.id
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10 shadow-sm'
                      : 'border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                      {renderIcon(wf.icon, 18)}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        {wf.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-indigo-500">
                          {wf.category}
                        </span>
                        <span className="text-[10px] text-slate-400">• {wf.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Workflow Steps Detail */}
            <div className="lg:col-span-7 bg-slate-50 dark:bg-dark-card/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/5 flex flex-col justify-between">
              {(() => {
                const currentWf =
                  WORKFLOW_GUIDES.find((w) => w.id === activeWorkflowId) ||
                  WORKFLOW_GUIDES[0];
                return (
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                          {currentWf.category}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                          {currentWf.title}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        {currentWf.steps.length} Steps
                      </span>
                    </div>

                    <div className="space-y-4">
                      {currentWf.steps.map((st) => (
                        <div key={st.step} className="flex items-start gap-3.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            {st.step}
                          </div>
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                              {st.title}
                            </h5>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {st.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tab 3: Keyboard Shortcuts & Tips */}
        {activeGuideTab === 'shortcuts' && (
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Keyboard Navigation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {KEYBOARD_SHORTCUTS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/60 dark:bg-dark-card/40 flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {item.action}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2.5 py-1 rounded-md bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-500/20">
              <div className="flex items-center gap-2.5 mb-2">
                <Icons.Lightbulb className="text-amber-500" size={20} />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  CRM Pro Best Practices
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pl-6 list-disc">
                <li>
                  <strong>Lock Screen Protection:</strong> Use the Lock Screen feature to safely pause your session when away from your desk.
                </li>
                <li>
                  <strong>Specimen Anti-Tamper:</strong> Always double check supervisor audit status on flagged requests to ensure compliance.
                </li>
                <li>
                  <strong>Instant Task Notifications:</strong> Task assignments automatically trigger a popup so team members never miss high-priority deadlines.
                </li>
                <li>
                  <strong>Role Isolation:</strong> Only users with Superadmin or Admin roles have access to Master Data and RBAC permission boards.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Selected Module Detail Modal Drawer */}
        {activeModule && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[130] animate-fade-in">
            <div className="w-full max-w-2xl bg-white dark:bg-dark-main border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeModule.color} flex items-center justify-center text-white shadow-lg`}
                  >
                    {renderIcon(activeModule.icon, 24)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                        {activeModule.name}
                      </h3>
                      <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        {activeModule.badge}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Category: {activeModule.category} • Path: {activeModule.path}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedModuleId(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <Icons.X size={18} />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeModule.description}
              </p>

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Key Capabilities
                </h4>
                <div className="space-y-2">
                  {activeModule.keyFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                      <Icons.CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 flex items-start gap-2.5">
                <Icons.AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <span className="font-bold">Pro Tip: </span>
                  {activeModule.workflowTip}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10">
                <div className="text-[11px] text-slate-400">
                  Allowed Roles:{' '}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {activeModule.roles.join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedModuleId(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleNavigateToModule(activeModule.path)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    <span>Go to {activeModule.name}</span>
                    <Icons.ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-dark-deep border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Icons.HelpCircle size={14} className="text-indigo-500" />
            <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/10 font-bold text-[10px]">Esc</kbd> to exit anytime</span>
          </div>
          <button
            onClick={closeGuide}
            className="px-4 py-1.5 rounded-lg font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
