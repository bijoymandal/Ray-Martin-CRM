import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import KpiCard from '../components/KpiCard';
import { FlipkartStatCardSkeleton, FlipkartTableSkeleton, FlipkartSchoolCardSkeleton } from '../components/Skeleton';
import {
  createVisitAPI,
  getVisitsAPI,
  getVisitSummaryAPI,
  updateVisitAPI,
  updateVisitStatusAPI,
  deleteVisitAPI,
  getSchoolsAPI,
  getDistrictsAPI,
  getZonesAPI,
} from '../services/api';
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  User,
  Building2,
  FileText,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Phone,
  BookOpen,
  Footprints,
  LayoutGrid,
  List,
  Camera,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  SCHEDULED: {
    label: 'Scheduled',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  COMPLETED: {
    label: 'Completed',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  },
};

const PURPOSE_LABELS = {
  SPECIMEN_DISTRIBUTION: 'Specimen Distribution',
  CURRICULUM_REVIEW: 'Curriculum Review',
  ANNUAL_ADOPTION: 'Annual Book Adoption',
  PAYMENT_COLLECTION: 'Payment Collection',
  NEW_PROMOTION: 'New Academic Promotion',
  COMPLAINT_RESOLVE: 'Teacher Support / Feedback',
  GENERAL: 'General Outreach',
};

const OUTCOME_CONFIG = {
  POSITIVE: {
    label: 'Positive Meeting',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  },
  ORDER_EXPECTED: {
    label: 'Order Expected',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
  },
  SPECIMEN_DELIVERED: {
    label: 'Specimens Delivered',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  },
  FOLLOW_UP_REQUIRED: {
    label: 'Follow-up Needed',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  DECISION_DEFERRED: {
    label: 'Decision Deferred',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  },
  NOT_INTERESTED: {
    label: 'Not Interested',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  },
};

const INITIAL_FORM = {
  schoolId: '',
  schoolName: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  location: '',
  visitDate: new Date().toISOString().split('T')[0],
  purpose: 'SPECIMEN_DISTRIBUTION',
  status: 'SCHEDULED',
  outcome: '',
  specimensGiven: '',
  followUpDate: '',
  notes: '',
  photo: null,
};

const Visits = () => {
  const { user, permissions } = useAuth();
  const visitsPerm = permissions?.find((p) => p.menu?.path === '/visits');
  const isSuperadmin = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
  const canCreate = isSuperadmin || (visitsPerm?.actions?.includes('canCreate') ?? true);
  const canEdit = isSuperadmin || (visitsPerm?.actions?.includes('canEdit') ?? true);
  const canDelete = isSuperadmin || (visitsPerm?.actions?.includes('canDelete') ?? true);

  // Visits Data
  const [visits, setVisits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [purposeFilter, setPurposeFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Master References for School Selector
  const [schools, setSchools] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [zones, setZones] = useState([]);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Cascading Selector inside Modal
  const [modalDistrictId, setModalDistrictId] = useState('');
  const [modalZoneId, setModalZoneId] = useState('');
  const [useCustomSchool, setUseCustomSchool] = useState(false);

  // Detail Modal
  const [selectedVisit, setSelectedVisit] = useState(null);
  // Full Photo Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const fetchVisits = async (page = currentPage) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (purposeFilter !== 'ALL') params.purpose = purposeFilter;
      if (districtFilter !== 'ALL') params.districtId = districtFilter;

      const [visitsRes, summaryRes] = await Promise.all([
        getVisitsAPI(params),
        getVisitSummaryAPI().catch(() => ({ success: false })),
      ]);

      if (visitsRes.success) {
        setVisits(visitsRes.data || []);
        setCurrentPage(visitsRes.currentPage || page);
        setTotalPages(visitsRes.totalPages || 1);
        setTotalCount(visitsRes.total || (visitsRes.data || []).length);
      } else {
        setError(visitsRes.message || 'Failed to load visits.');
      }

      if (summaryRes && summaryRes.success) {
        setSummary(summaryRes.data);
      }
    } catch (err) {
      console.error('Error loading visits:', err);
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [schoolsRes, distRes, zonesRes] = await Promise.all([
        getSchoolsAPI({ limit: 1000 }).catch(() => ({ success: false })),
        getDistrictsAPI().catch(() => ({ success: false })),
        getZonesAPI().catch(() => ({ success: false })),
      ]);
      if (schoolsRes.success) setSchools(schoolsRes.data || []);
      if (distRes.success) setDistricts(distRes.data || []);
      if (zonesRes.success) setZones(zonesRes.data || []);
    } catch (err) {
      console.error('Error loading references:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReferences();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVisits(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, purposeFilter, districtFilter]);

  // ── Quick Status Change ───────────────────────────────────────────────────
  const handleQuickStatusChange = async (visitId, newStatus) => {
    try {
      setError('');
      setSuccess('');
      const res = await updateVisitStatusAPI(visitId, newStatus);
      if (res.success) {
        setSuccess(`Status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
        setVisits((prev) =>
          prev.map((v) => (v.id === visitId ? { ...v, status: newStatus } : v))
        );
        getVisitSummaryAPI().then((s) => s.success && setSummary(s.data));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to change status:', err);
      setError(err?.response?.data?.message || 'Failed to update status.');
    }
  };

  // ── Delete Visit ──────────────────────────────────────────────────────────
  const handleDeleteVisit = async (visitId, schoolName) => {
    if (!window.confirm(`Are you sure you want to delete the visit record for "${schoolName}"?`)) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      const res = await deleteVisitAPI(visitId);
      if (res.success) {
        setSuccess('Visit record deleted successfully.');
        setVisits((prev) => prev.filter((v) => v.id !== visitId));
        if (selectedVisit?.id === visitId) setSelectedVisit(null);
        getVisitSummaryAPI().then((s) => s.success && setSummary(s.data));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to delete visit:', err);
      setError(err?.response?.data?.message || 'Failed to delete visit.');
    }
  };

  // ── Open Edit Modal ───────────────────────────────────────────────────────
  const openEditModal = (visit) => {
    setIsEditing(true);
    setEditingId(visit.id);
    setUseCustomSchool(!visit.schoolId);
    setFormData({
      schoolId: visit.schoolId || '',
      schoolName: visit.schoolName || '',
      contactPerson: visit.contactPerson || '',
      contactPhone: visit.contactPhone || '',
      contactEmail: visit.contactEmail || '',
      location: visit.location || '',
      visitDate: visit.visitDate ? visit.visitDate.split('T')[0] : '',
      purpose: visit.purpose || 'SPECIMEN_DISTRIBUTION',
      status: visit.status || 'SCHEDULED',
      outcome: visit.outcome || '',
      specimensGiven: visit.specimensGiven || '',
      followUpDate: visit.followUpDate ? visit.followUpDate.split('T')[0] : '',
      notes: visit.notes || '',
      photo: null,
    });
    setPhotoPreview(visit.photoUrl || null);
    setShowModal(true);
  };

  const resetModal = () => {
    setFormData(INITIAL_FORM);
    setFormError('');
    setPhotoPreview(null);
    setIsEditing(false);
    setEditingId(null);
    setModalDistrictId('');
    setModalZoneId('');
    setUseCustomSchool(false);
    setShowModal(false);
  };

  // ── Form Input Change ─────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo' && files && files[0]) {
      setFormData((prev) => ({ ...prev, photo: files[0] }));
      setPhotoPreview(URL.createObjectURL(files[0]));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ── School Dropdown Pick Handler ──────────────────────────────────────────
  const handleSelectSchool = (schoolId) => {
    if (!schoolId) {
      setFormData((prev) => ({ ...prev, schoolId: '' }));
      return;
    }
    const school = schools.find((s) => s.id === schoolId);
    if (school) {
      const locStr = `${school.zone?.name || ''}${school.zone?.district ? `, ${school.zone.district.name}` : ''} · West Bengal`.trim();
      setFormData((prev) => ({
        ...prev,
        schoolId: school.id,
        schoolName: school.name,
        location: locStr,
      }));
    }
  };

  // ── Submit Visit (Create / Edit) ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.schoolName.trim() || !formData.visitDate || !formData.purpose) {
      setFormError('School name, visit date, and purpose are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val !== null && val !== '') {
          payload.append(key, val);
        }
      });

      let res;
      if (isEditing && editingId) {
        res = await updateVisitAPI(editingId, payload);
      } else {
        res = await createVisitAPI(payload);
      }

      if (res.success) {
        setSuccess(isEditing ? 'Visit updated successfully!' : 'School visit logged successfully!');
        resetModal();
        fetchVisits(1);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setFormError(res.message || 'Failed to save visit record.');
      }
    } catch (err) {
      console.error('Error submitting visit:', err);
      setFormError(err?.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-main text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto md:pl-[260px] pt-[70px]">
        <Navbar />

        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto animate-fade-in space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 dark:border-white/5 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Footprints size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    School Visits & Field Outreach
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Track teacher meetings, specimen distribution records, curriculum consultations, and field proofs across West Bengal.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchVisits()}
                title="Reload Visits"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>

              {canCreate && (
                <button
                  id="btn-log-visit"
                  onClick={() => {
                    resetModal();
                    setShowModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Log School Visit</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200/60 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200/60 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* KPI Summary Cards */}
          {loading && !summary ? (
            <FlipkartStatCardSkeleton count={6} colsClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              title="Total Visits"
              value={summary?.totalVisits ?? totalCount}
              icon={<Footprints size={18} />}
              accentColor="indigo"
              subtitle="Logged records"
            />
            <KpiCard
              title="Scheduled"
              value={summary?.scheduledCount ?? 0}
              icon={<Clock size={18} />}
              accentColor="blue"
              subtitle="Upcoming visits"
              onClick={() => setStatusFilter(statusFilter === 'SCHEDULED' ? 'ALL' : 'SCHEDULED')}
              isActive={statusFilter === 'SCHEDULED'}
            />
            <KpiCard
              title="In Progress"
              value={summary?.inProgressCount ?? 0}
              icon={<RefreshCw size={18} />}
              accentColor="amber"
              subtitle="Field active"
              onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
              isActive={statusFilter === 'IN_PROGRESS'}
            />
            <KpiCard
              title="Completed"
              value={summary?.completedCount ?? 0}
              icon={<CheckCircle2 size={18} />}
              accentColor="emerald"
              subtitle="Successful visits"
              onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
              isActive={statusFilter === 'COMPLETED'}
            />
            <KpiCard
              title="Today's Visits"
              value={summary?.todayCount ?? 0}
              icon={<Calendar size={18} />}
              accentColor="purple"
              subtitle="Today's agenda"
            />
            <KpiCard
              title="Schools Reached"
              value={summary?.uniqueSchoolsCount ?? 0}
              icon={<Building2 size={18} />}
              accentColor="cyan"
              subtitle="Distinct campuses"
            />
          </div>
          )}

          {/* Filters & Search Toolbar */}
          <div className="glass-card p-4 flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-search-visits"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchVisits(1);
                }}
                placeholder="Search by school, contact, phone, location, or notes..."
                className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchVisits(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-400 font-bold uppercase tracking-wider pl-1">
              <Filter size={13} className="text-slate-400 shrink-0" />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Purpose Filter */}
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[190px]"
            >
              <option value="ALL">All Purposes</option>
              {Object.entries(PURPOSE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* District Filter */}
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[170px]"
            >
              <option value="ALL">All Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl p-1 bg-slate-50 dark:bg-dark-deep">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>

          {/* Visits Content */}
          {loading ? (
            viewMode === 'cards' ? (
              <FlipkartSchoolCardSkeleton count={6} />
            ) : (
              <div className="glass-card p-6">
                <FlipkartTableSkeleton rows={6} cols={8} hasThumbnail={true} />
              </div>
            )
          ) : visits.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                <Footprints size={28} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No school visits found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {searchQuery || statusFilter !== 'ALL' || purposeFilter !== 'ALL' || districtFilter !== 'ALL'
                  ? 'No records match your active search or filter criteria. Try resetting filters.'
                  : 'Start recording school visits, curriculum reviews, and specimen drop-offs.'}
              </p>
              {canCreate && (
                <button
                  onClick={() => {
                    resetModal();
                    setShowModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Log First School Visit</span>
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="glass-card p-0 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/40 dark:bg-white/1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      <th className="p-4">School & Location</th>
                      <th className="p-4">Contact Person</th>
                      <th className="p-4">Visit Date</th>
                      <th className="p-4">Purpose & Outcome</th>
                      <th className="p-4">Representative</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Proof Photo</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/3">
                    {visits.map((visit) => {
                      const statusObj = STATUS_CONFIG[visit.status] || STATUS_CONFIG.SCHEDULED;
                      const outcomeObj = visit.outcome ? OUTCOME_CONFIG[visit.outcome] : null;

                      return (
                        <tr
                          key={visit.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-white/1 transition-colors"
                        >
                          {/* School */}
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5 max-w-[240px]">
                              <span
                                className="font-bold text-xs text-slate-800 dark:text-slate-100 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 truncate"
                                onClick={() => setSelectedVisit(visit)}
                              >
                                <Building2 size={13} className="text-indigo-500 shrink-0" />
                                <span className="truncate">{visit.schoolName}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                                <MapPin size={10} className="text-rose-500 shrink-0" />
                                <span className="truncate">
                                  {visit.school?.zone?.name || visit.location || 'West Bengal'}
                                  {visit.school?.zone?.district ? `, ${visit.school.zone.district.name}` : ''}
                                </span>
                              </span>
                            </div>
                          </td>

                          {/* Contact Person */}
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {visit.contactPerson || '—'}
                              </span>
                              {visit.contactPhone && (
                                <a
                                  href={`tel:${visit.contactPhone}`}
                                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                  <Phone size={10} />
                                  <span>{visit.contactPhone}</span>
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{formatDate(visit.visitDate)}</span>
                            </div>
                          </td>

                          {/* Purpose & Outcome */}
                          <td className="p-4">
                            <div className="flex flex-col gap-1 max-w-[200px]">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {PURPOSE_LABELS[visit.purpose] || visit.purpose || 'General Outreach'}
                              </span>
                              {outcomeObj && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold w-max ${outcomeObj.badge}`}>
                                  {outcomeObj.label}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Representative */}
                          <td className="p-4">
                            {visit.visitor ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {visit.visitor.name ? visit.visitor.name[0].toUpperCase() : 'U'}
                                </div>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                  {visit.visitor.name || visit.visitor.email}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Unassigned</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            {canEdit ? (
                              <select
                                value={visit.status}
                                onChange={(e) => handleQuickStatusChange(visit.id, e.target.value)}
                                className={`text-[11px] font-bold rounded-lg px-2 py-1 border focus:outline-none cursor-pointer ${statusObj.badge}`}
                              >
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusObj.badge}`}>
                                {statusObj.label}
                              </span>
                            )}
                          </td>

                          {/* Photo */}
                          <td className="p-4">
                            {visit.photoUrl ? (
                              <button
                                onClick={() => setPreviewPhotoUrl(visit.photoUrl)}
                                className="group relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 hover:border-indigo-500 transition-all cursor-pointer"
                                title="Click to preview visit photo"
                              >
                                <img
                                  src={visit.photoUrl}
                                  alt="Visit Proof"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye size={12} />
                                </div>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                                <Camera size={12} className="text-slate-300" />
                                <span>None</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setSelectedVisit(visit)}
                                title="Inspect Visit Details"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                              >
                                <Eye size={15} />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => openEditModal(visit)}
                                  title="Edit Visit Record"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                                >
                                  <Edit2 size={15} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteVisit(visit.id, visit.schoolName)}
                                  title="Delete Visit Record"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visits.map((visit) => {
                const statusObj = STATUS_CONFIG[visit.status] || STATUS_CONFIG.SCHEDULED;
                const outcomeObj = visit.outcome ? OUTCOME_CONFIG[visit.outcome] : null;

                return (
                  <div
                    key={visit.id}
                    className="glass-card p-5 flex flex-col justify-between gap-4 hover:border-indigo-500/40 transition-all shadow-xs group"
                  >
                    <div>
                      {/* Card Top: Photo (if present) & Header */}
                      {visit.photoUrl && (
                        <div
                          onClick={() => setPreviewPhotoUrl(visit.photoUrl)}
                          className="w-full h-36 rounded-xl overflow-hidden mb-3.5 relative cursor-pointer border border-slate-200/60 dark:border-white/5"
                        >
                          <img
                            src={visit.photoUrl}
                            alt="Visit"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                            <span className="text-[10px] text-white font-bold flex items-center gap-1">
                              <Eye size={12} /> View Photo Proof
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3
                            className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 cursor-pointer line-clamp-1"
                            onClick={() => setSelectedVisit(visit)}
                          >
                            {visit.schoolName}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <MapPin size={11} className="text-rose-500 shrink-0" />
                            <span className="truncate">
                              {visit.school?.zone?.name || visit.location || 'West Bengal'}
                              {visit.school?.zone?.district ? `, ${visit.school.zone.district.name}` : ''}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusObj.badge}`}>
                          {statusObj.label}
                        </span>
                      </div>

                      {/* Purpose & Outcome */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {PURPOSE_LABELS[visit.purpose] || visit.purpose}
                        </span>
                        {outcomeObj && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${outcomeObj.badge}`}>
                            {outcomeObj.label}
                          </span>
                        )}
                      </div>

                      {/* Contact & Notes */}
                      {visit.contactPerson && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                          <User size={13} className="text-slate-400" />
                          <span className="font-semibold">{visit.contactPerson}</span>
                          {visit.contactPhone && (
                            <span className="text-[11px] text-slate-400">({visit.contactPhone})</span>
                          )}
                        </div>
                      )}

                      {visit.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 italic">
                          "{visit.notes}"
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>{formatDate(visit.visitDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedVisit(visit)}
                          title="View Details"
                          className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(visit)}
                            title="Edit Visit"
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteVisit(visit.id, visit.schoolName)}
                            title="Delete Visit"
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Showing page <strong className="text-slate-700 dark:text-slate-200">{currentPage}</strong> of{' '}
                <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong> ({totalCount} total visits)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Log / Edit Visit Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && resetModal()}
        >
          <div className="glass-card w-full max-w-2xl max-h-[92vh] flex flex-col p-6 shadow-2xl relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Footprints size={18} />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {isEditing ? 'Update School Visit Record' : 'Log School Visit'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Record teacher interactions, textbook proposals, and specimen handouts.
                  </p>
                </div>
              </div>
              <button
                onClick={resetModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 text-xs font-semibold">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 pt-1 space-y-4">
              {/* School Selection Choice */}
              <div className="p-4 bg-slate-50 dark:bg-white/2 border border-slate-200/60 dark:border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-indigo-500" />
                    Target School <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomSchool(!useCustomSchool)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {useCustomSchool ? '← Pick from West Bengal Directory' : '+ Enter School Manually'}
                  </button>
                </div>

                {!useCustomSchool ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Filter by District
                        </label>
                        <select
                          value={modalDistrictId}
                          onChange={(e) => {
                            setModalDistrictId(e.target.value);
                            setModalZoneId('');
                          }}
                          className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="">All Districts</option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Filter by Zone
                        </label>
                        <select
                          value={modalZoneId}
                          onChange={(e) => setModalZoneId(e.target.value)}
                          disabled={!modalDistrictId && zones.length > 20}
                          className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">All Zones</option>
                          {zones
                            .filter((z) => !modalDistrictId || z.districtId === modalDistrictId)
                            .map((z) => (
                              <option key={z.id} value={z.id}>
                                {z.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Select Campus
                      </label>
                      <select
                        value={formData.schoolId}
                        onChange={(e) => handleSelectSchool(e.target.value)}
                        className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Choose Registered School --</option>
                        {schools
                          .filter((s) => {
                            if (modalZoneId) return s.zoneId === modalZoneId;
                            if (modalDistrictId) return s.zone?.districtId === modalDistrictId || s.zone?.district?.id === modalDistrictId;
                            return true;
                          })
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.zone?.name || 'Zone'}{s.zone?.district ? `, ${s.zone.district.name}` : ''})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. St. Xavier's Collegiate School"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Two-col: Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Person
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="e.g. Fr. Sebastian / HOD English"
                      className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98301 23456"
                      className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Two-col: Visit Date & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Visit Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      required
                      name="visitDate"
                      value={formData.visitDate}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Location / Area
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. College Street, Kolkata"
                      className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Two-col: Purpose & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Purpose of Visit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {Object.entries(PURPOSE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Visit Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Outcome & Specimens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Visit Outcome
                  </label>
                  <select
                    name="outcome"
                    value={formData.outcome}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Select Outcome (Optional) --</option>
                    {Object.entries(OUTCOME_CONFIG).map(([key, obj]) => (
                      <option key={key} value={key}>
                        {obj.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Specimens / Samples Handed Over
                  </label>
                  <div className="relative">
                    <BookOpen size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="specimensGiven"
                      value={formData.specimensGiven}
                      onChange={handleChange}
                      placeholder="e.g. Class 10 Math Booster (2 copies)"
                      className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Discussion Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Discussion Notes & Observations
                </label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Provide details about teacher feedback, student strength, syllabus alignment, or wholesale order potential..."
                    className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Field Visit Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Visit Photo Proof (Optional)
                </label>
                <label
                  htmlFor="input-photo-upload"
                  className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 transition-all relative overflow-hidden group"
                >
                  {photoPreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                        <Camera size={16} />
                        <span>Click to Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-indigo-500">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Upload School Visit Photo
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Campus sign, principal desk, or specimen receipt (JPEG, PNG up to 10MB)
                      </span>
                    </div>
                  )}
                  <input
                    id="input-photo-upload"
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleChange}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>{isEditing ? 'Save Changes' : 'Log Visit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Visit Details Modal ─────────────────────────────────────────── */}
      {selectedVisit && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setSelectedVisit(null)}
        >
          <div className="glass-card w-full max-w-lg max-h-[92vh] flex flex-col p-6 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Building2 size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {selectedVisit.schoolName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_CONFIG[selectedVisit.status]?.badge || ''}`}>
                      {STATUS_CONFIG[selectedVisit.status]?.label || selectedVisit.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {PURPOSE_LABELS[selectedVisit.purpose] || selectedVisit.purpose}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Visit Date & Representative */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-200/60 dark:border-white/5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Visit Date</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {formatDate(selectedVisit.visitDate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Field Representative</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
                  {selectedVisit.visitor?.name || selectedVisit.visitor?.email || 'Field Staff'}
                </span>
              </div>
            </div>

            {/* Photo Preview if Available */}
            {selectedVisit.photoUrl && (
              <div
                onClick={() => setPreviewPhotoUrl(selectedVisit.photoUrl)}
                className="w-full h-48 rounded-xl overflow-hidden relative cursor-pointer group border border-slate-200 dark:border-white/10"
              >
                <img
                  src={selectedVisit.photoUrl}
                  alt="Visit Proof"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                  <ExternalLink size={14} /> Click to View Full Size
                </div>
              </div>
            )}

            {/* Contact Person Details */}
            {(selectedVisit.contactPerson || selectedVisit.contactPhone) && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Key Contact</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedVisit.contactPerson || 'School Authority'}
                  </span>
                </div>
                {selectedVisit.contactPhone && (
                  <a
                    href={`tel:${selectedVisit.contactPhone}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                  >
                    <Phone size={12} />
                    <span>{selectedVisit.contactPhone}</span>
                  </a>
                )}
              </div>
            )}

            {/* Specimens Given */}
            {selectedVisit.specimensGiven && (
              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-1">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={12} /> Specimens / Samples Distributed
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedVisit.specimensGiven}
                </p>
              </div>
            )}

            {/* Meeting Notes */}
            {selectedVisit.notes && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Discussion Notes & Observations
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-dark-deep p-3 rounded-xl border border-slate-200/60 dark:border-white/5 whitespace-pre-line leading-relaxed">
                  {selectedVisit.notes}
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-white/5">
              {canEdit && (
                <button
                  onClick={() => {
                    const visit = selectedVisit;
                    setSelectedVisit(null);
                    openEditModal(visit);
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Edit Record</span>
                </button>
              )}
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full Photo Preview Modal ─────────────────────────────────────────── */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white cursor-pointer"
            >
              <X size={24} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Full Visit Proof"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Visits;
