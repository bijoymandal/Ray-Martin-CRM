import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import { useAuth } from '../context/AuthContext';
import {
  getProductsAPI,
  getSpecimensAPI,
  checkSpecimenDuplicateAPI,
  createSpecimenAPI,
  updateSpecimenStatusAPI,
  deleteSpecimenAPI,
  getSpecimenAuditAPI,
  verifySpecimenRecordAPI,
} from '../services/api';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Search,
  User,
  Phone,
  School,
  Book,
  Trash2,
  RefreshCw,
  Plus,
  X,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BadgeAlert,
  UserCheck,
  Camera,
  Upload,
  Eye,
  Check,
  XCircle,
  FileSearch,
  Filter,
  Layers,
  Image as ImageIcon,
  AlertCircle,
  Shield,
} from 'lucide-react';

const SpecimenTracker = () => {
  const { user, permissions } = useAuth();
  const menuPerm = permissions.find((p) => p.menu.path === '/specimen');

  const isSuperadmin = ['SUPERADMIN', 'ADMIN'].includes(user?.role);
  const canCreate = user?.role === 'SUPERADMIN' || (menuPerm?.actions?.includes('canCreate') ?? false);
  const canEdit = user?.role === 'SUPERADMIN' || (menuPerm?.actions?.includes('canEdit') ?? false);
  const canDelete = user?.role === 'SUPERADMIN' || (menuPerm?.actions?.includes('canDelete') ?? false);

  // Tab View: 'records' | 'audit'
  const [activeTab, setActiveTab] = useState('records');

  // Audit Stats State
  const [auditSummary, setAuditSummary] = useState({
    totalRecords: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    flaggedCount: 0,
    duplicateImageCount: 0,
  });

  // Data states
  const [books, setBooks] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Form states
  const [selectedBookId, setSelectedBookId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherSchool, setTeacherSchool] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  const [notes, setNotes] = useState('');

  // Proof Image states (File or Camera)
  const [proofImageFile, setProofImageFile] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);

  // Camera modal state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  // Realtime Duplicate Check State
  const [dupCheckStatus, setDupCheckStatus] = useState('idle'); // 'idle' | 'checking' | 'duplicate' | 'clear'
  const [dupResult, setDupResult] = useState(null);

  // Image Lightbox Modal
  const [previewImage, setPreviewImage] = useState(null);

  // Delete Confirm Modal
  const [deleteId, setDeleteId] = useState(null);

  // 1. Fetch available books
  const fetchBooks = async () => {
    try {
      const res = await getProductsAPI(null, 1, 100);
      if (res.success) {
        setBooks(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load books:', err);
    }
  };

  // 2. Fetch Audit Summary for Superadmin
  const fetchAuditSummary = async () => {
    if (!isSuperadmin) return;
    try {
      const res = await getSpecimenAuditAPI();
      if (res.success) {
        setAuditSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit summary:', err);
    }
  };

  // 3. Fetch specimen records
  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (verificationFilter) params.verificationStatus = verificationFilter;
      if (flaggedOnly) params.flaggedOnly = 'true';

      const res = await getSpecimensAPI(params);
      if (res.success) {
        setRecords(res.data || []);
        setCurrentPage(res.currentPage || 1);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load specimen records:', err);
      setError('Could not fetch specimen distribution history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchAuditSummary();
  }, []);

  useEffect(() => {
    fetchRecords(currentPage);
  }, [currentPage, statusFilter, verificationFilter, flaggedOnly]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 4. Realtime Duplicate Check Trigger: same book + same teacher + same school
  useEffect(() => {
    if (selectedBookId && teacherName.trim().length >= 2 && teacherSchool.trim().length >= 2) {
      performDuplicateCheck(selectedBookId, teacherName.trim(), teacherSchool.trim());
    } else {
      setDupCheckStatus('idle');
      setDupResult(null);
    }
  }, [selectedBookId, teacherName, teacherSchool]);

  const performDuplicateCheck = async (bookId, name, school) => {
    setDupCheckStatus('checking');
    try {
      const res = await checkSpecimenDuplicateAPI(bookId, name, school);
      if (res.success) {
        if (res.isDuplicate) {
          setDupCheckStatus('duplicate');
          setDupResult(res);
        } else {
          setDupCheckStatus('clear');
          setDupResult(res);
        }
      }
    } catch (err) {
      console.error('Duplicate check error:', err);
      setDupCheckStatus('idle');
    }
  };

  // Camera Functions
  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Unable to access camera. You can upload an image file instead.');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `proof_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      setProofImageFile(file);
      setProofImagePreview(previewUrl);
      stopCamera();
    }, 'image/jpeg', 0.85);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProofImageFile(file);
    setProofImagePreview(URL.createObjectURL(file));
  };

  // Submit Handler (Salesperson)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedBookId) return setError('Please select a specimen book');
    if (!teacherName.trim()) return setError('Please enter the teacher name');
    if (!teacherSchool.trim()) return setError('Please enter the school name');

    if (dupCheckStatus === 'duplicate') {
      return setError(`DUPLICATE REJECTED: Same book was already issued to ${teacherName} at ${teacherSchool}.`);
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('bookId', selectedBookId);
      formData.append('teacherName', teacherName.trim());
      formData.append('teacherSchool', teacherSchool.trim());
      if (teacherPhone.trim()) formData.append('teacherPhone', teacherPhone.trim());
      if (teacherSubject.trim()) formData.append('teacherSubject', teacherSubject.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      if (proofImageFile) {
        formData.append('proofImage', proofImageFile);
      }

      const res = await createSpecimenAPI(formData);

      if (res.success) {
        if (res.isDuplicateImage) {
          setError('RECORD FLAGGED: Proof image matches a previously uploaded image! Superadmin review required.');
        } else {
          setSuccess(`Specimen record registered! Issued to ${teacherName} (${teacherSchool}).`);
        }

        // Reset form
        setSelectedBookId('');
        setTeacherName('');
        setTeacherSchool('');
        setTeacherPhone('');
        setTeacherSubject('');
        setNotes('');
        setProofImageFile(null);
        setProofImagePreview(null);
        setDupCheckStatus('idle');
        setDupResult(null);

        // Refresh list & summary
        fetchRecords(1);
        fetchAuditSummary();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to submit specimen record');
    } finally {
      setSubmitting(false);
    }
  };

  // Superadmin Verification Handler (Approve / Reject)
  const handleVerify = async (id, status, flagReason = null) => {
    try {
      const res = await verifySpecimenRecordAPI(id, status, flagReason);
      if (res.success) {
        setSuccess(`Record marked as ${status}!`);
        fetchRecords(currentPage);
        fetchAuditSummary();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Verification update failed');
    }
  };

  // Status Change Handler (GIVEN, RETURNED, LOST)
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateSpecimenStatusAPI(id, newStatus);
      if (res.success) {
        setSuccess(`Status updated to ${newStatus}`);
        fetchRecords(currentPage);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update status');
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await deleteSpecimenAPI(deleteId);
      if (res.success) {
        setSuccess('Specimen record deleted');
        setDeleteId(null);
        fetchRecords(currentPage);
        fetchAuditSummary();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete record');
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pt-[70px]">
        <Navbar />

        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                  <BookOpen size={20} />
                </div>
                Specimen Book Distribution Tracker
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Record sample handoffs with proof image upload & Superadmin duplicate verification (Image, Teacher & Book duplicates).
              </p>
            </div>

            {/* Navigation Tabs (Records vs Superadmin Verification Hub) */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/80 dark:border-white/5">
              <button
                onClick={() => {
                  setActiveTab('records');
                  setFlaggedOnly(false);
                  setVerificationFilter('');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'records'
                    ? 'bg-white dark:bg-dark-card text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Layers size={14} /> Distribution Log
              </button>

              {isSuperadmin && (
                <button
                  onClick={() => {
                    setActiveTab('audit');
                    setFlaggedOnly(true);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <ShieldAlert size={14} /> Superadmin Verification Hub
                  {auditSummary.flaggedCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-white text-rose-600 text-[10px] font-black rounded-full">
                      {auditSummary.flaggedCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Superadmin Audit Widgets */}
          {isSuperadmin && activeTab === 'audit' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
              <div className="glass-card p-4 border-slate-200/60 dark:border-white/5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Issued</div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{auditSummary.totalRecords}</div>
              </div>

              <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Pending Review
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{auditSummary.pendingCount}</div>
              </div>

              <div className="glass-card p-4 border-rose-500/30 bg-rose-500/5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <BadgeAlert size={12} /> Flagged / Duplicates
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{auditSummary.flaggedCount}</div>
              </div>

              <div className="glass-card p-4 border-indigo-500/20 bg-indigo-500/5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Duplicate Image Hashes
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {auditSummary.duplicateImageCount}
                </div>
              </div>
            </div>
          )}

          {/* Alert Banners */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError('')} className="p-1 hover:bg-rose-500/20 rounded-lg">
                <X size={14} />
              </button>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
              <button onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-500/20 rounded-lg">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Salesperson Handoff Form (5 cols) */}
            {canCreate && activeTab === 'records' && (
              <div className="lg:col-span-5 space-y-4">
                <div className="glass-card p-6 border-slate-200/60 dark:border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-3">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Plus size={16} className="text-amber-500" /> Record Specimen Handoff
                    </h2>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Proof Upload Active
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 1. Book Selection */}
                    <SearchSelect
                      label="Select Specimen Book"
                      required
                      placeholder="Search and select book..."
                      searchPlaceholder="Type book title..."
                      options={books.map((b) => ({
                        value: b.id,
                        label: `${b.name} (${b.category?.subject?.class?.board?.shortName || ''} Class ${
                          b.category?.subject?.class?.name || ''
                        })`,
                      }))}
                      value={selectedBookId}
                      onChange={setSelectedBookId}
                      accentColor="indigo"
                      icon={<Book size={14} />}
                    />

                    {/* 2. Teacher Name */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Teacher Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <User size={14} />
                        </div>
                        <input
                          type="text"
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          placeholder="e.g. Prof. Rajesh Sharma"
                          required
                          className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* 3. School Name & Duplicate Detection Indicator */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none flex items-center gap-1">
                          School Name <span className="text-rose-500">*</span>
                        </label>
                        {dupCheckStatus === 'checking' && (
                          <span className="text-[9px] font-bold text-amber-500 animate-pulse flex items-center gap-1">
                            <RefreshCw size={10} className="animate-spin" /> Verifying uniqueness...
                          </span>
                        )}
                        {dupCheckStatus === 'clear' && (
                          <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
                            <ShieldCheck size={11} /> Ready to issue
                          </span>
                        )}
                        {dupCheckStatus === 'duplicate' && (
                          <span className="text-[9px] font-bold text-rose-500 flex items-center gap-1">
                            <ShieldAlert size={11} /> DUPLICATE REJECTED
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <School size={14} />
                        </div>
                        <input
                          type="text"
                          value={teacherSchool}
                          onChange={(e) => setTeacherSchool(e.target.value)}
                          placeholder="e.g. St. Xavier High School"
                          required
                          className={`w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl border focus:outline-none transition-all ${
                            dupCheckStatus === 'duplicate'
                              ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-400 text-rose-700 dark:text-rose-300'
                              : dupCheckStatus === 'clear'
                              ? 'bg-emerald-50/40 dark:bg-emerald-500/5 border-emerald-400 text-slate-800 dark:text-slate-100'
                              : 'bg-white dark:bg-dark-deep border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-amber-500'
                          }`}
                        />
                      </div>

                      {/* DUPLICATE REJECTION BANNER */}
                      {dupCheckStatus === 'duplicate' && dupResult && (
                        <div className="mt-3 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs space-y-1.5 animate-fade-in shadow-sm">
                          <div className="font-extrabold flex items-center gap-1.5 text-rose-600 dark:text-rose-400 uppercase tracking-wide text-[11px]">
                            <BadgeAlert size={16} /> REJECTION: Duplicate Record Found!
                          </div>
                          <p className="leading-relaxed text-[11px] font-medium">{dupResult.message}</p>
                        </div>
                      )}
                    </div>

                    {/* 4. Teacher Phone & Subject (Optional details) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Teacher Phone
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Phone size={14} />
                          </div>
                          <input
                            type="text"
                            value={teacherPhone}
                            onChange={(e) => setTeacherPhone(e.target.value)}
                            placeholder="9876543210"
                            className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Subject Taught
                        </label>
                        <input
                          type="text"
                          value={teacherSubject}
                          onChange={(e) => setTeacherSubject(e.target.value)}
                          placeholder="e.g. Physics"
                          className="w-full px-3 py-2.5 text-xs font-semibold bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* 5. Proof Image Upload (Camera Snap or File Upload) */}
                    <div className="space-y-1.5 border-t border-slate-200/60 dark:border-white/5 pt-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Proof Image Upload (Camera / File)
                      </label>

                      <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-xl p-3 text-center flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/2 min-h-[100px]">
                        {proofImagePreview ? (
                          <div className="relative w-full h-28 rounded-lg overflow-hidden group">
                            <img src={proofImagePreview} alt="Proof" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setProofImageFile(null);
                                setProofImagePreview(null);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Upload photo proof of handing book to teacher
                            </p>
                            <div className="flex items-center gap-2 justify-center">
                              <button
                                type="button"
                                onClick={startCamera}
                                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-amber-600 transition-colors"
                              >
                                <Camera size={13} /> Camera Snap
                              </button>
                              <label className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-300 transition-colors">
                                <Upload size={13} /> Choose File
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Salesperson Auto-tag Notice */}
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-400 flex items-center justify-between">
                      <span className="font-semibold">Logged Salesperson:</span>
                      <span className="font-extrabold flex items-center gap-1">
                        <UserCheck size={13} /> {user?.name || 'Current User'}
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting || dupCheckStatus === 'duplicate'}
                      className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer ${
                        dupCheckStatus === 'duplicate'
                          ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 hover:brightness-110'
                      }`}
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw size={14} className="animate-spin" /> Verifying & Saving...
                        </span>
                      ) : dupCheckStatus === 'duplicate' ? (
                        'Duplicate Rejection Active'
                      ) : (
                        'Save Specimen Record'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Right / Full Col: Log & Superadmin Audit View */}
            <div className={`${canCreate && activeTab === 'records' ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
              <div className="glass-card p-5 space-y-4">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative flex-1 w-full">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search teacher, school, book, rep..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <SearchSelect
                      placeholder="All Verification"
                      searchPlaceholder="Filter status..."
                      options={[
                        { value: '', label: 'All Verification' },
                        { value: 'PENDING', label: 'PENDING' },
                        { value: 'APPROVED', label: 'APPROVED' },
                        { value: 'REJECTED', label: 'REJECTED' },
                      ]}
                      value={verificationFilter}
                      onChange={setVerificationFilter}
                      accentColor="amber"
                    />

                    <button
                      onClick={() => setFlaggedOnly(!flaggedOnly)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1 shrink-0 ${
                        flaggedOnly
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-dark-deep border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <BadgeAlert size={13} /> Flagged Only
                    </button>
                  </div>
                </div>

                {/* Records List */}
                {loading ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-amber-500" /> Loading distribution records...
                  </div>
                ) : records.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <BookOpen size={32} className="mx-auto opacity-30" />
                    <p>No specimen distribution records found matching filters.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {records.map((rec) => (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          rec.flagReason
                            ? 'border-rose-300 dark:border-rose-500/30 bg-rose-500/5'
                            : 'border-slate-200/70 dark:border-white/5 bg-white/50 dark:bg-white/2 hover:bg-slate-50/80 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* Uploaded proof image thumbnail */}
                          {rec.proofImage ? (
                            <img
                              src={rec.proofImage}
                              alt="Proof"
                              onClick={() => setPreviewImage(rec.proofImage)}
                              className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-dark-card shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
                              title="Click to view image proof"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0 flex items-center justify-center font-bold">
                              <Book size={20} />
                            </div>
                          )}

                          {/* Record details */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">
                                {rec.teacherName}
                              </h3>
                              {rec.teacherPhone && (
                                <span className="text-[10px] font-bold text-slate-400">({rec.teacherPhone})</span>
                              )}
                              {rec.teacherSubject && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-500/10 text-indigo-500">
                                  {rec.teacherSubject}
                                </span>
                              )}

                              {/* Flagged Badge */}
                              {rec.flagReason && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white flex items-center gap-1 animate-pulse">
                                  <BadgeAlert size={10} /> Duplicate Image Flagged
                                </span>
                              )}

                              {/* Verification Status Badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                  rec.verificationStatus === 'APPROVED'
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                    : rec.verificationStatus === 'REJECTED'
                                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                }`}
                              >
                                {rec.verificationStatus}
                              </span>
                            </div>

                            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 truncate flex items-center gap-1">
                              <Book size={11} /> {rec.book?.name}
                            </p>

                            {/* Flag Explanation */}
                            {rec.flagReason && (
                              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                {rec.flagReason}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                                <School size={10} className="text-amber-500" /> {rec.teacherSchool}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User size={10} /> Rep: <strong className="text-slate-700 dark:text-slate-200">{rec.salesPerson?.name}</strong>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar size={10} /> {new Date(rec.handedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Superadmin Verification Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-white/5">
                          {isSuperadmin && (
                            <div className="flex items-center gap-1">
                              {rec.verificationStatus !== 'APPROVED' && (
                                <button
                                  onClick={() => handleVerify(rec.id, 'APPROVED')}
                                  className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-600 transition-colors shadow-sm"
                                  title="Approve Record"
                                >
                                  <Check size={11} /> Approve
                                </button>
                              )}
                              {rec.verificationStatus !== 'REJECTED' && (
                                <button
                                  onClick={() => handleVerify(rec.id, 'REJECTED')}
                                  className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-rose-600 transition-colors shadow-sm"
                                  title="Reject Record"
                                >
                                  <XCircle size={11} /> Reject
                                </button>
                              )}
                            </div>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => setDeleteId(rec.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-white/5 pt-4">
                    <span className="text-[10px] font-bold text-slate-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Camera size={16} className="text-amber-400" />
                Capture Proof Photo
              </h3>
              <button onClick={stopCamera} className="p-1 hover:bg-white/10 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-2.5 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 hover:brightness-110 flex items-center justify-center gap-1.5"
              >
                <Camera size={14} /> Snap Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img src={previewImage} alt="Enlarged proof" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <Trash2 size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Delete Specimen Record?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this distribution record?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecimenTracker;
