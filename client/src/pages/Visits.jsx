import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { createVisitAPI, getVisitsAPI } from '../services/api';
import { Plus, Search, MapPin, Calendar, User, Building2, FileText, X, AlertCircle, ChevronLeft, ChevronRight, Upload, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  PENDING:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  COMPLETED:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED:  'bg-red-500/10 text-red-400 border-red-500/20',
  SCHEDULED:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const INITIAL_FORM = {
  schoolName: '',
  contactPerson: '',
  visitDate: '',
  purpose: '',
  notes: '',
  status: 'SCHEDULED',
  location: '',
  photo: null,
};

const Visits = () => {
  const { user, permissions } = useAuth();
  const visitsPerm = permissions.find((p) => p.menu.path === '/visits');
  const canCreate =
    user?.role === 'SUPERADMIN' || (visitsPerm?.actions?.includes('canCreate') ?? false);

  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchVisits = async (page = 1) => {
    try {
      setError('');
      const res = await getVisitsAPI(page, limit);
      if (res.success) {
        setVisits(res.data);
        setFilteredVisits(res.data);
        setCurrentPage(res.currentPage || page);
        setTotalPages(res.totalPages || 1);
      } else {
        setError('Failed to load visits.');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits(currentPage);
  }, [currentPage]);

  // ── Search / Filter ───────────────────────────────────────────────────────
  useEffect(() => {
    let result = visits;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.schoolName?.toLowerCase().includes(q) ||
          v.contactPerson?.toLowerCase().includes(q) ||
          v.location?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((v) => v.status === statusFilter);
    }
    setFilteredVisits(result);
  }, [searchQuery, statusFilter, visits]);

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo' && files[0]) {
      setFormData((prev) => ({ ...prev, photo: files[0] }));
      setPhotoPreview(URL.createObjectURL(files[0]));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetModal = () => {
    setFormData(INITIAL_FORM);
    setFormError('');
    setPhotoPreview(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.schoolName.trim() || !formData.visitDate || !formData.purpose.trim()) {
      setFormError('School name, visit date, and purpose are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val !== null && val !== '') payload.append(key, val);
      });
      const res = await createVisitAPI(payload);
      if (res.success) {
        resetModal();
        fetchVisits(1);
      } else {
        setFormError(res.message || 'Failed to log visit.');
      }
    } catch (err) {
      console.error(err);
      setFormError(err?.response?.data?.message || 'An error occurred.');
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

  const statusBadge = (status) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
    >
      {status}
    </span>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-dark-deep overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-[fadeIn_0.3s_ease-out_forwards]">
            <div>
              <h1 className="text-2xl font-bold text-gradient">School Visits</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Track and manage all school outreach visits
              </p>
            </div>
            {canCreate && (
              <button
                id="btn-log-visit"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={16} />
                Log Visit
              </button>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-search-visits"
                type="text"
                placeholder="Search by school, contact, or location…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-9 text-sm"
              />
            </div>
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input w-full sm:w-44 text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton h-14 rounded-xl"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
              <MapPin size={48} className="text-indigo-500/30 mb-4" />
              <p className="text-slate-400 font-medium">No visits found</p>
              <p className="text-slate-500 text-sm mt-1">
                {canCreate ? 'Click "Log Visit" to record your first school visit.' : 'No visit records available.'}
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden p-0 animate-[slideUp_0.45s_cubic-bezier(0.16,1,0.3,1)_forwards]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="text-left px-5 py-3.5 font-medium">School</th>
                      <th className="text-left px-5 py-3.5 font-medium">Contact</th>
                      <th className="text-left px-5 py-3.5 font-medium">Location</th>
                      <th className="text-left px-5 py-3.5 font-medium">Date</th>
                      <th className="text-left px-5 py-3.5 font-medium">Purpose</th>
                      <th className="text-left px-5 py-3.5 font-medium">Status</th>
                      {/* photo column */}
                      <th className="text-left px-5 py-3.5 font-medium">Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredVisits.map((visit) => (
                      <tr
                        key={visit._id}
                        className="hover:bg-white/[0.03] transition-colors duration-150"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                              <Building2 size={14} className="text-indigo-400" />
                            </div>
                            <span className="font-medium text-slate-100 truncate max-w-[140px]">
                              {visit.schoolName || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{visit.contactPerson || '—'}</td>
                        <td className="px-5 py-4 text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-500" />
                            {visit.location || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-300 whitespace-nowrap">
                          {formatDate(visit.visitDate)}
                        </td>
                        <td className="px-5 py-4 text-slate-400 max-w-[160px] truncate">
                          {visit.purpose || '—'}
                        </td>
                        <td className="px-5 py-4">{statusBadge(visit.status)}</td>
                        <td className="px-5 py-4">
                          {visit.photoUrl ? (
                            <a
                              href={visit.photoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs transition-colors"
                            >
                              <Eye size={13} /> View
                            </a>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 text-sm text-slate-400">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-prev-page"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      id="btn-next-page"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Log Visit Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out_forwards]"
          onClick={(e) => e.target === e.currentTarget && resetModal()}
        >
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-[slideUp_0.35s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gradient">Log School Visit</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the visit details below</p>
              </div>
              <button
                id="btn-close-modal"
                onClick={resetModal}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {formError}
              </div>
            )}

            <form id="form-log-visit" onSubmit={handleSubmit} className="space-y-4">
              {/* School Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  School Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="input-school-name"
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    placeholder="e.g. St. Mary's High School"
                    className="glass-input pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Two-col: Contact Person + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Contact Person
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input-contact-person"
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="Principal / HOD name"
                      className="glass-input pl-9 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input-location"
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City / Area"
                      className="glass-input pl-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Two-col: Visit Date + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Visit Date <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input-visit-date"
                      type="date"
                      name="visitDate"
                      value={formData.visitDate}
                      onChange={handleChange}
                      className="glass-input pl-9 text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    id="select-visit-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="glass-input text-sm"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Purpose <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-3 text-slate-500" />
                  <textarea
                    id="input-purpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    placeholder="e.g. Product demo, enrolment drive, follow-up…"
                    rows={2}
                    className="glass-input pl-9 text-sm resize-none"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  id="input-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any follow-up actions, key takeaways…"
                  rows={2}
                  className="glass-input text-sm resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Visit Photo (optional)
                </label>
                <label
                  htmlFor="input-photo-upload"
                  className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-200 relative overflow-hidden"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <Upload size={20} />
                      <span className="text-xs">Click to upload image</span>
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
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  id="btn-cancel-visit"
                  onClick={resetModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-visit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/20"
                >
                  {submitting ? 'Saving…' : 'Log Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visits;
