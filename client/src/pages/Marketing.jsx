import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import { useAuth } from '../context/AuthContext';
import {
  Megaphone, Plus, Search, Filter, MoreHorizontal, Mail,
  Send, Users, Eye, MousePointerClick, TrendingUp, TrendingDown,
  Calendar, Tag, ChevronDown, X, Check, Edit2, Trash2,
  BarChart2, RefreshCw, Zap, Globe, Star, AlertCircle,
  Clock, CheckCircle2, PauseCircle, PlayCircle, Archive,
} from 'lucide-react';

/* ─────────────── Static mock data ─────────────── */
const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Back to School 2025', type: 'Email', status: 'Active', audience: 'All Students', sent: 12400, opened: 5890, clicked: 1230, createdAt: '2025-07-10', scheduledAt: '2025-07-15' },
  { id: '2', name: 'CBSE Board Prep Offer', type: 'Email', status: 'Draft', audience: 'CBSE Students', sent: 0, opened: 0, clicked: 0, createdAt: '2025-07-18', scheduledAt: '2025-07-25' },
  { id: '3', name: 'Mega Discount Week', type: 'SMS', status: 'Completed', audience: 'Premium Users', sent: 8700, opened: 8700, clicked: 3100, createdAt: '2025-06-01', scheduledAt: '2025-06-05' },
  { id: '4', name: 'New Subject Launch — Physics', type: 'Email', status: 'Paused', audience: 'Class 11 & 12', sent: 4500, opened: 1800, clicked: 320, createdAt: '2025-07-01', scheduledAt: '2025-07-08' },
  { id: '5', name: 'Summer Holiday Bundle', type: 'Email', status: 'Completed', audience: 'All Users', sent: 21000, opened: 9800, clicked: 4200, createdAt: '2025-05-15', scheduledAt: '2025-05-20' },
  { id: '6', name: 'Referral Bonus Program', type: 'Email', status: 'Active', audience: 'Existing Customers', sent: 3200, opened: 1640, clicked: 890, createdAt: '2025-07-20', scheduledAt: '2025-07-22' },
];

const MOCK_SEGMENTS = [
  { id: '1', name: 'All Students',      count: 24500, color: 'indigo' },
  { id: '2', name: 'CBSE Students',     count: 9800,  color: 'purple' },
  { id: '3', name: 'Premium Users',     count: 4200,  color: 'emerald' },
  { id: '4', name: 'Class 11 & 12',     count: 6100,  color: 'cyan' },
  { id: '5', name: 'Existing Customers',count: 18000, color: 'amber' },
  { id: '6', name: 'All Users',         count: 31000, color: 'rose' },
];

const STATUS_CONFIG = {
  Active:    { label: 'Active',    icon: PlayCircle,   bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Draft:     { label: 'Draft',     icon: Edit2,        bg: 'bg-slate-500/10',   text: 'text-slate-500 dark:text-slate-400',     dot: 'bg-slate-400'  },
  Completed: { label: 'Completed', icon: CheckCircle2, bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500'   },
  Paused:    { label: 'Paused',    icon: PauseCircle,  bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500'  },
  Archived:  { label: 'Archived',  icon: Archive,      bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',       dot: 'bg-rose-500'   },
};

const TYPE_CONFIG = {
  Email: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
  SMS:   { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
};

const ACCENT_COLORS = {
  indigo:  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20',
  purple:  'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20',
  cyan:    'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200/60 dark:border-cyan-500/20',
  amber:   'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20',
  rose:    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20',
};

const fmtNum = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

/* ─────────────── Stat Card ─────────────── */
const MarketingStat = ({ icon: Icon, label, value, sub, trend, color = 'indigo' }) => {
  const colors = {
    indigo:  'from-indigo-500 to-purple-600 shadow-indigo-500/20',
    emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/20',
    cyan:    'from-cyan-500 to-blue-500 shadow-cyan-500/20',
    amber:   'from-amber-500 to-orange-500 shadow-amber-500/20',
  };
  return (
    <div className="glass-card p-5 flex items-start gap-4 hover:scale-[1.01] transition-transform duration-200">
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {trend !== undefined && (
            trend >= 0
              ? <TrendingUp size={11} className="text-emerald-500" />
              : <TrendingDown size={11} className="text-rose-500" />
          )}
          <span className="text-[10px] text-slate-400">{sub}</span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Status Badge ─────────────── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
};

/* ─────────────── Mini progress bar ─────────────── */
const MiniBar = ({ value, max, color = 'indigo' }) => {
  const pctVal = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const barColors = {
    indigo:  'bg-gradient-to-r from-indigo-500 to-purple-500',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    cyan:    'bg-gradient-to-r from-cyan-500 to-blue-400',
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColors[color]} transition-all duration-700`} style={{ width: `${pctVal}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 w-7 text-right">{pctVal}%</span>
    </div>
  );
};

/* ─────────────── Create Campaign Modal ─────────────── */
const CreateModal = ({ onClose, onSave, segments }) => {
  const [form, setForm] = useState({ name: '', type: 'Email', audience: '', scheduledAt: '', subject: '', body: '' });
  const [step, setStep] = useState(1);

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, id: Date.now().toString(), status: 'Draft', sent: 0, opened: 0, clicked: 0, createdAt: new Date().toISOString().slice(0, 10) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/80 dark:border-white/8 animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Megaphone size={16} className="text-indigo-500" />
              New Campaign
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors cursor-pointer"><X size={16} /></button>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-2 px-6 py-3">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-white/5'}`} />
          ))}
        </div>

        <div className="px-6 pb-6 space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Campaign Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Summer Promo 2025"
                  className="w-full bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-white/8 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Campaign Type</label>
                <div className="flex gap-2">
                  {['Email', 'SMS'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        form.type === t
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-white/8 text-slate-500 hover:border-slate-300 dark:hover:border-white/15'
                      }`}>
                      {t === 'Email' ? <Mail size={13} /> : <Send size={13} />} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
              <SearchSelect
                label="Target Audience"
                placeholder="-- Select Segment --"
                searchPlaceholder="Search segments..."
                options={segments.map(s => ({ value: s.name, label: `${s.name} (${fmtNum(s.count)})` }))}
                value={form.audience}
                onChange={v => setForm({ ...form, audience: v })}
                accentColor="pink"
              />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Schedule Date</label>
                <input
                  type="date"
                  value={form.scheduledAt}
                  onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-white/8 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
            </>
          ) : (
            <>
              {form.type === 'Email' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="Exciting offer just for you!"
                    className="w-full bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-white/8 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Message Body</label>
                <textarea
                  rows={5}
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  placeholder="Write your campaign message here..."
                  className="w-full bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-white/8 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
                />
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/5 rounded-xl border border-indigo-200/60 dark:border-indigo-500/20 text-[11px] text-indigo-600 dark:text-indigo-400">
                <p className="font-bold mb-0.5">Summary</p>
                <p>Type: <span className="font-semibold">{form.type}</span> · Audience: <span className="font-semibold">{form.audience || '—'}</span> · Scheduled: <span className="font-semibold">{form.scheduledAt || 'Unscheduled'}</span></p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={step === 1 ? onClose : () => setStep(1)}
              className="flex-1 py-2.5 border border-slate-200 dark:border-white/8 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">
              {step === 1 ? 'Cancel' : '← Back'}
            </button>
            <button type="button"
              onClick={step === 1 ? () => { if (form.name.trim()) setStep(2); } : handleSave}
              disabled={step === 1 && !form.name.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              {step === 1 ? 'Next →' : 'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Main Page ─────────────── */
const Marketing = () => {
  const { user, permissions } = useAuth();
  const marketingPerm = permissions.find(p => p.menu.path === '/marketing');
  const canCreate = user?.role === 'SUPERADMIN' || (marketingPerm?.actions?.includes('canCreate') ?? false);
  const canEdit   = user?.role === 'SUPERADMIN' || (marketingPerm?.actions?.includes('canEdit')   ?? false);
  const canDelete = user?.role === 'SUPERADMIN' || (marketingPerm?.actions?.includes('canDelete') ?? false);

  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [success, setSuccess] = useState('');

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.audience.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchType   = filterType   === 'All' || c.type   === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const totalSent    = campaigns.reduce((s, c) => s + c.sent, 0);
  const totalOpened  = campaigns.reduce((s, c) => s + c.opened, 0);
  const totalClicked = campaigns.reduce((s, c) => s + c.clicked, 0);
  const avgOpenRate  = pct(totalOpened, totalSent);

  const handleSaveCampaign = (data) => {
    setCampaigns(prev => [data, ...prev]);
    flash(`Campaign "${data.name}" created as Draft.`);
  };

  const handleDelete = (id) => {
    const c = campaigns.find(x => x.id === id);
    setCampaigns(prev => prev.filter(x => x.id !== id));
    setDeleteConfirm(null);
    flash(`Campaign "${c?.name}" deleted.`);
  };

  const handleToggleStatus = (id) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = c.status === 'Active' ? 'Paused' : c.status === 'Paused' ? 'Active' : c.status;
      return { ...c, status: next };
    }));
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pt-[70px]">
        <Navbar />

        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Megaphone size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Marketing Hub</h1>
                  <p className="text-[11px] text-slate-400">Create and track campaigns, reach your audience</p>
                </div>
              </div>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-500/20 hover:brightness-110 transition-all cursor-pointer"
              >
                <Plus size={14} /> New Campaign
              </button>
            )}
          </div>

          {/* ── Success Toast ── */}
          {success && (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in">
              <CheckCircle2 size={14} /> {success}
            </div>
          )}

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MarketingStat icon={Send}             label="Total Sent"    value={fmtNum(totalSent)}    sub="Across all campaigns"  color="indigo" />
            <MarketingStat icon={Eye}              label="Total Opened"  value={fmtNum(totalOpened)}  sub={`${avgOpenRate}% open rate`} trend={avgOpenRate - 40} color="emerald" />
            <MarketingStat icon={MousePointerClick}label="Total Clicks"  value={fmtNum(totalClicked)} sub={`${pct(totalClicked, totalOpened)}% CTR`} color="cyan" />
            <MarketingStat icon={Megaphone}        label="Campaigns"     value={campaigns.length}     sub={`${campaigns.filter(c => c.status === 'Active').length} active`} color="amber" />
          </div>

          {/* ── Main Two-col Layout ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Campaigns Table (2/3) ── */}
            <div className="xl:col-span-2 space-y-4">
              <div className="glass-card p-5">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search campaigns..."
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-dark-input text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                    />
                    {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={11} /></button>}
                  </div>
                  <div className="flex gap-2">
                    <SearchSelect
                      placeholder="All Status"
                      searchPlaceholder="Filter status..."
                      options={[{ value: 'All', label: 'All Status' }, ...Object.keys(STATUS_CONFIG).map(s => ({ value: s, label: s }))]}
                      value={filterStatus}
                      onChange={setFilterStatus}
                      accentColor="pink"
                    />
                    <SearchSelect
                      placeholder="All Types"
                      searchPlaceholder="Filter type..."
                      options={[
                        { value: 'All', label: 'All Types' },
                        { value: 'Email', label: 'Email' },
                        { value: 'SMS', label: 'SMS' },
                      ]}
                      value={filterType}
                      onChange={setFilterType}
                      accentColor="pink"
                    />
                  </div>
                </div>

                {/* Results count */}
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                  {filtered.length} Campaign{filtered.length !== 1 ? 's' : ''}
                  {(filterStatus !== 'All' || filterType !== 'All' || search) && ' (filtered)'}
                </p>

                {/* Campaign rows */}
                <div className="space-y-2">
                  {filtered.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">
                      <Megaphone size={28} className="mx-auto mb-2 opacity-30" />
                      No campaigns match your filters
                    </div>
                  ) : filtered.map(c => {
                    const typeCfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.Email;
                    const openRate = pct(c.opened, c.sent);
                    const ctr = pct(c.clicked, c.opened);
                    return (
                      <div key={c.id}
                        className="group border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:border-pink-200/60 dark:hover:border-pink-500/20 hover:bg-pink-50/20 dark:hover:bg-pink-500/3 transition-all duration-150">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${typeCfg.bg} ${typeCfg.text}`}>{c.type}</span>
                              <StatusBadge status={c.status} />
                              <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={9} />{c.scheduledAt}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{c.name}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><Users size={10} />{c.audience}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (c.status === 'Active' || c.status === 'Paused') && (
                              <button onClick={() => handleToggleStatus(c.id)} title={c.status === 'Active' ? 'Pause' : 'Resume'}
                                className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500 transition-colors cursor-pointer">
                                {c.status === 'Active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => setDeleteConfirm(c.id)} title="Delete"
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Metrics */}
                        {c.sent > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Send size={8} />Sent</p>
                              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{fmtNum(c.sent)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Eye size={8} />Open Rate</p>
                              <MiniBar value={c.opened} max={c.sent} color="indigo" />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MousePointerClick size={8} />CTR</p>
                              <MiniBar value={c.clicked} max={c.opened} color="emerald" />
                            </div>
                          </div>
                        )}
                        {c.sent === 0 && (
                          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                            <Clock size={10} /> Scheduled for {c.scheduledAt || 'TBD'} · Not sent yet
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right Col (1/3) ── */}
            <div className="space-y-5">
              {/* Audience Segments */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Users size={14} className="text-pink-500" />Audience Segments</h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{MOCK_SEGMENTS.length} total</span>
                </div>
                <div className="space-y-2">
                  {MOCK_SEGMENTS.map(seg => (
                    <div key={seg.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${ACCENT_COLORS[seg.color]} transition-colors`}>
                      <span className="text-[11px] font-semibold truncate">{seg.name}</span>
                      <span className="text-[10px] font-extrabold ml-2 shrink-0">{fmtNum(seg.count)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Summary */}
              <div className="glass-card p-5">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4"><BarChart2 size={14} className="text-pink-500" />Performance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1"><Eye size={9} />Avg Open Rate</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{avgOpenRate}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${avgOpenRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1"><MousePointerClick size={9} />Avg Click Rate</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{pct(totalClicked, totalOpened)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${pct(totalClicked, totalOpened)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1"><Zap size={9} />Conversion</span>
                      <span className="text-amber-600 dark:text-amber-400">{pct(totalClicked, totalSent)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${pct(totalClicked, totalSent)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Status breakdown */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-2">
                  {Object.entries(
                    campaigns.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {})
                  ).map(([status, count]) => {
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <div key={status} className={`flex items-center justify-between p-2 rounded-lg ${cfg?.bg}`}>
                        <span className={`text-[10px] font-bold ${cfg?.text}`}>{status}</span>
                        <span className={`text-xs font-extrabold ${cfg?.text}`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="glass-card p-5 bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-pink-500/5 dark:to-rose-500/5 border-pink-200/50 dark:border-pink-500/15">
                <h3 className="text-xs font-bold text-pink-600 dark:text-pink-400 flex items-center gap-2 mb-3"><Star size={13} />Marketing Tips</h3>
                <ul className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <li className="flex items-start gap-2"><Check size={11} className="text-emerald-500 mt-0.5 shrink-0" />Personalize subject lines for +26% open rate</li>
                  <li className="flex items-start gap-2"><Check size={11} className="text-emerald-500 mt-0.5 shrink-0" />Send emails Tuesday–Thursday 9–11 AM</li>
                  <li className="flex items-start gap-2"><Check size={11} className="text-emerald-500 mt-0.5 shrink-0" />Keep SMS under 160 chars for best delivery</li>
                  <li className="flex items-start gap-2"><Check size={11} className="text-emerald-500 mt-0.5 shrink-0" />A/B test subject lines before bulk sends</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Modal ── */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSave={handleSaveCampaign} segments={MOCK_SEGMENTS} />}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200/80 dark:border-white/8 p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Trash2 size={18} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Delete Campaign?</h3>
                <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-white/8 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;
