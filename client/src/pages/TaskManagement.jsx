import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import KpiCard from '../components/KpiCard';
import { FlipkartStatCardSkeleton, FlipkartTableSkeleton, FlipkartKanbanSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import {
  getTaskSummaryAPI,
  getTasksAPI,
  createTaskAPI,
  updateTaskAPI,
  updateTaskStatusAPI,
  deleteTaskAPI,
  addTaskCommentAPI,
  getUsersAPI,
  getSchoolsAPI,
  getDistrictsAPI,
  getZonesAPI,
  submitTaskReportAPI,
  initWestBengalMasterDataAPI,
} from '../services/api';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  Calendar,
  User,
  MessageSquare,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Kanban,
  List,
  Building,
  DollarSign,
  Tag,
  Send,
  MapPin,
  FileCheck,
  Check,
} from 'lucide-react';

const PRIORITY_CONFIG = {
  URGENT: { label: 'URGENT', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30' },
  HIGH: { label: 'HIGH', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  MEDIUM: { label: 'MEDIUM', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
  LOW: { label: 'LOW', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30' },
};

const CATEGORY_LABELS = {
  SCHOOL_VISIT: 'School Visit',
  TEACHER_FOLLOWUP: 'Teacher Follow-up',
  SPECIMEN_DISTRIBUTION: 'Specimen Distribution',
  DEAL_CLOSING: 'Deal Closing',
  MARKETING_CAMPAIGN: 'Marketing Campaign',
  GENERAL: 'General Task',
};

const STATUS_COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'border-slate-400 text-slate-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-indigo-500 text-indigo-500' },
  { id: 'UNDER_REVIEW', title: 'Under Review', color: 'border-amber-500 text-amber-500' },
  { id: 'COMPLETED', title: 'Completed', color: 'border-emerald-500 text-emerald-500' },
];

const TaskManagement = () => {
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState('kanban'); // kanban | list | overdue
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // References for dropdowns
  const [usersList, setUsersList] = useState([]);
  const [schoolsList, setSchoolsList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);

  // Location Filters
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  // Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [modalDistrictId, setModalDistrictId] = useState('');
  const [modalZoneId, setModalZoneId] = useState('');
  const [isBatchSchoolWise, setIsBatchSchoolWise] = useState(false);
  const [selectedBatchSchoolIds, setSelectedBatchSchoolIds] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    category: 'SCHOOL_VISIT',
    dueDate: '',
    assignedToId: '',
    schoolId: '',
    dealId: '',
    contactId: '',
  });
  const [modalError, setModalError] = useState(null);

  // Submission Modal State
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    status: 'COMPLETED',
    teacherMet: '',
    teacherPhone: '',
    specimenDetails: '',
    visitOutcome: 'Specimen Handed Over',
    notes: '',
    followUpDate: '',
  });
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  // View Submitted Report Modal
  const [viewingReportTask, setViewingReportTask] = useState(null);

  // Comment Drawer State
  const [activeTaskComments, setActiveTaskComments] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');

  const fetchSummary = async () => {
    try {
      const res = await getTaskSummaryAPI();
      if (res.success) setSummary(res.data);
    } catch (err) {
      console.error('Error fetching task summary:', err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getTasksAPI({
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        myTasksOnly: myTasksOnly ? 'true' : 'false',
        search: search || undefined,
        districtId: districtFilter !== 'ALL' ? districtFilter : undefined,
        zoneId: zoneFilter !== 'ALL' ? zoneFilter : undefined,
      });
      if (res.success) setTasks(res.data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [uRes, schRes, disRes, zoRes] = await Promise.all([
        getUsersAPI(),
        getSchoolsAPI(),
        getDistrictsAPI(),
        getZonesAPI(),
      ]);
      if (uRes.success) setUsersList(uRes.data || []);
      if (schRes.success) setSchoolsList(schRes.data || []);
      if (disRes.success) setDistrictsList(disRes.data || []);
      if (zoRes.success) setZonesList(zoRes.data || []);

      // If no districts found, auto-sync West Bengal master data
      if (!disRes.data || disRes.data.length === 0) {
        try {
          const initRes = await initWestBengalMasterDataAPI();
          if (initRes.success) {
            const [newDis, newZo, newSch] = await Promise.all([
              getDistrictsAPI(),
              getZonesAPI(),
              getSchoolsAPI(),
            ]);
            if (newDis.success) setDistrictsList(newDis.data || []);
            if (newZo.success) setZonesList(newZo.data || []);
            if (newSch.success) setSchoolsList(newSch.data || []);
          }
        } catch (e) {
          console.error('Auto init WB master data error:', e);
        }
      }
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  const handleSyncWestBengal = async () => {
    setActionLoading(true);
    try {
      const res = await initWestBengalMasterDataAPI();
      if (res.success) {
        setSuccessToast('West Bengal master copy (districts, zones & schools) synchronized successfully!');
        setTimeout(() => setSuccessToast(null), 5000);
        await loadReferences();
      }
    } catch (err) {
      console.error('Failed to sync WB master data:', err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSummary();
    loadReferences();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorityFilter, categoryFilter, statusFilter, myTasksOnly, search, districtFilter, zoneFilter]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditTaskId(null);
    setModalError(null);
    setModalDistrictId('');
    setModalZoneId('');
    setIsBatchSchoolWise(false);
    setSelectedBatchSchoolIds([]);
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      category: 'SCHOOL_VISIT',
      dueDate: new Date().toISOString().slice(0, 10),
      assignedToId: user ? user.id : '',
      schoolId: '',
      dealId: '',
      contactId: '',
    });
    setShowTaskModal(true);
  };

  const openEditModal = (task) => {
    setIsEditing(true);
    setEditTaskId(task.id);
    setModalError(null);
    setIsBatchSchoolWise(false);
    setSelectedBatchSchoolIds([]);
    if (task.school?.zone) {
      setModalDistrictId(task.school.zone.district?.id || task.school.zone.districtId || '');
      setModalZoneId(task.school.zone.id || task.school.zoneId || '');
    } else {
      setModalDistrictId('');
      setModalZoneId('');
    }
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      category: task.category,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      assignedToId: task.assignedToId || '',
      schoolId: task.schoolId || '',
      dealId: task.dealId || '',
      contactId: task.contactId || '',
    });
    setShowTaskModal(true);
  };

  const getTaskSubmissionReport = (task) => {
    if (!task.comments || task.comments.length === 0) return null;
    return task.comments.find(
      (c) => c.content && c.content.includes('[SCHOOL SUBMISSION REPORT]')
    );
  };

  const openSubmissionModal = (task) => {
    setSubmittingTask(task);
    setSubmissionError(null);
    setSubmissionForm({
      status: 'COMPLETED',
      teacherMet: '',
      teacherPhone: '',
      specimenDetails: '',
      visitOutcome: 'Specimen Handed Over',
      notes: '',
      followUpDate: '',
    });
    setShowSubmissionModal(true);
  };

  const handleTaskReportSubmit = async (e) => {
    e.preventDefault();
    if (!submittingTask) return;
    setSubmissionLoading(true);
    setSubmissionError(null);
    try {
      const res = await submitTaskReportAPI(submittingTask.id, submissionForm);
      if (res.success) {
        setShowSubmissionModal(false);
        setSuccessToast(`Report successfully submitted for "${submittingTask.title}"! Status updated to ${submissionForm.status}.`);
        setTimeout(() => setSuccessToast(null), 5000);
        fetchSummary();
        fetchTasks();
      }
    } catch (err) {
      setSubmissionError(err.response?.data?.message || err.message || 'Failed to submit task report');
    } finally {
      setSubmissionLoading(false);
    }
  };

  const [successToast, setSuccessToast] = useState(null);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.title) {
      setModalError('Task title is required');
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (isEditing) {
        res = await updateTaskAPI(editTaskId, formData);
      } else {
        if (isBatchSchoolWise && selectedBatchSchoolIds.length > 0) {
          res = await createTaskAPI({
            ...formData,
            schoolIds: selectedBatchSchoolIds,
          });
        } else {
          res = await createTaskAPI(formData);
        }
      }

      if (res.success) {
        setShowTaskModal(false);
        const assignedUser = usersList.find((u) => u.id === formData.assignedToId);
        const assigneeName = assignedUser ? assignedUser.name : 'Assignee';
        const countMessage = isBatchSchoolWise && selectedBatchSchoolIds.length > 1
          ? `${selectedBatchSchoolIds.length} school-wise tasks successfully created and assigned to ${assigneeName}!`
          : `Task successfully created and assigned to ${assigneeName}! Pop-up notification sent.`;

        setSuccessToast(countMessage);
        setTimeout(() => setSuccessToast(null), 5000);

        setSelectedBatchSchoolIds([]);
        setIsBatchSchoolWise(false);
        fetchSummary();
        fetchTasks();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to save task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await updateTaskStatusAPI(taskId, newStatus);
      if (res.success) {
        fetchSummary();
        fetchTasks();
      }
    } catch (err) {
      console.error('Error changing task status:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await deleteTaskAPI(taskId);
      if (res.success) {
        fetchSummary();
        fetchTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeTaskComments) return;

    try {
      const res = await addTaskCommentAPI(activeTaskComments.id, newCommentText);
      if (res.success) {
        setNewCommentText('');
        // Refresh comments list
        setActiveTaskComments({
          ...activeTaskComments,
          comments: [...(activeTaskComments.comments || []), res.data],
        });
        fetchTasks();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-100 flex flex-col">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pt-[70px]">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-l-4 border-l-indigo-500">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <CheckSquare size={22} />
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Task & Activity Management</h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Track sales activities, school visits, teacher follow-ups, specimen distributions, and deal closings.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <Plus size={16} /> Create New Task
            </button>
          </div>

          {/* Success Toast Banner */}
          {successToast && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center justify-between animate-fade-in shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{successToast}</span>
              </div>
              <button onClick={() => setSuccessToast(null)} className="p-1 hover:text-rose-500">
                <X size={14} />
              </button>
            </div>
          )}

          {/* KPI Overview Summary Widgets */}
          {loading && !summary ? (
            <FlipkartStatCardSkeleton count={4} />
          ) : summary ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Total System Tasks"
                value={summary.totalTasks}
                subtitle={`${summary.urgentCount} Urgent · ${summary.highCount} High Priority`}
                icon={<CheckSquare size={16} />}
                accentColor="indigo"
              />

              <KpiCard
                title="Pending Action"
                value={summary.pendingCount}
                subtitle={`${summary.inProgressCount} in progress · ${summary.todoCount} to do`}
                icon={<Clock size={16} />}
                accentColor="amber"
              />

              <KpiCard
                title="Completed Tasks"
                value={summary.completedCount}
                subtitle="Successfully closed activities"
                icon={<CheckCircle2 size={16} />}
                accentColor="emerald"
              />

              <KpiCard
                title="Overdue Alerts"
                value={summary.overdueCount}
                subtitle="Tasks past target due date"
                icon={<AlertCircle size={16} />}
                accentColor="rose"
              />
            </div>
          ) : null}

          {/* View Modes & Filters Toolbar */}
          <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-dark-card text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Kanban size={14} /> Kanban Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-dark-card text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <List size={14} /> List View
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
              <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <SearchSelect
                placeholder="All Priority"
                searchPlaceholder="Filter priority..."
                options={[
                  { value: 'ALL', label: 'All Priority' },
                  { value: 'URGENT', label: 'URGENT' },
                  { value: 'HIGH', label: 'HIGH' },
                  { value: 'MEDIUM', label: 'MEDIUM' },
                  { value: 'LOW', label: 'LOW' },
                ]}
                value={priorityFilter}
                onChange={setPriorityFilter}
                accentColor="rose"
              />

              <SearchSelect
                placeholder="All Categories"
                searchPlaceholder="Filter category..."
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  { value: 'SCHOOL_VISIT', label: 'School Visit' },
                  { value: 'TEACHER_FOLLOWUP', label: 'Teacher Follow-up' },
                  { value: 'SPECIMEN_DISTRIBUTION', label: 'Specimen Distribution' },
                  { value: 'DEAL_CLOSING', label: 'Deal Closing' },
                  { value: 'MARKETING_CAMPAIGN', label: 'Marketing Campaign' },
                  { value: 'GENERAL', label: 'General Task' },
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                accentColor="indigo"
              />

              {viewMode === 'list' && (
                <SearchSelect
                  placeholder="All Status"
                  searchPlaceholder="Filter status..."
                  options={[
                    { value: 'ALL', label: 'All Status' },
                    { value: 'TODO', label: 'To Do' },
                    { value: 'IN_PROGRESS', label: 'In Progress' },
                    { value: 'UNDER_REVIEW', label: 'Under Review' },
                    { value: 'COMPLETED', label: 'Completed' },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  accentColor="purple"
                />
              )}

              <SearchSelect
                placeholder="All Districts"
                searchPlaceholder="Filter WB district..."
                options={[
                  { value: 'ALL', label: 'All WB Districts' },
                  ...districtsList.map((d) => ({ value: d.id, label: d.name })),
                ]}
                value={districtFilter}
                onChange={(val) => {
                  setDistrictFilter(val);
                  setZoneFilter('ALL');
                }}
                accentColor="cyan"
              />

              <SearchSelect
                placeholder="All Zones"
                searchPlaceholder="Filter zone..."
                options={[
                  { value: 'ALL', label: 'All Zones' },
                  ...(districtFilter !== 'ALL'
                    ? zonesList.filter((z) => z.districtId === districtFilter || z.district?.id === districtFilter)
                    : zonesList
                  ).map((z) => ({ value: z.id, label: z.name })),
                ]}
                value={zoneFilter}
                onChange={setZoneFilter}
                accentColor="emerald"
              />

              <button
                onClick={() => setMyTasksOnly(!myTasksOnly)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1 ${
                  myTasksOnly
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-dark-deep border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300'
                }`}
              >
                <User size={13} /> My Tasks Only
              </button>

              {user?.role === 'SUPERADMIN' && (
                <button
                  onClick={handleSyncWestBengal}
                  disabled={actionLoading}
                  title="Synchronize all West Bengal Districts & Zones from master copy"
                  className="px-2.5 py-2 bg-indigo-50 dark:bg-white/5 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-200 dark:border-white/10 flex items-center gap-1"
                >
                  <RefreshCw size={12} className={actionLoading ? 'animate-spin' : ''} />
                  <span className="hidden lg:inline">Sync WB Master Copy</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: KANBAN BOARD */}
          {viewMode === 'kanban' && (
            loading ? (
              <FlipkartKanbanSkeleton columns={4} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATUS_COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.id);
                return (
                  <div key={col.id} className="glass-card p-4 flex flex-col min-h-[500px]">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5 mb-3">
                      <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.id === 'TODO' ? 'bg-slate-400' : col.id === 'IN_PROGRESS' ? 'bg-indigo-500' : col.id === 'UNDER_REVIEW' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span>{col.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-extrabold text-slate-500">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {colTasks.map((t) => {
                        const pConfig = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
                        return (
                          <div
                            key={t.id}
                            className={`p-3.5 rounded-2xl border bg-white dark:bg-dark-card space-y-2 shadow-sm transition-all hover:shadow-md ${
                              t.isOverdue ? 'border-rose-500/40 ring-1 ring-rose-500/20' : 'border-slate-200/80 dark:border-white/5'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}>
                                {t.priority}
                              </span>

                              <div className="flex items-center gap-1">
                                <button onClick={() => openEditModal(t)} className="p-1 text-slate-400 hover:text-indigo-500">
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteTask(t.id)} className="p-1 text-slate-400 hover:text-rose-500">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-snug">{t.title}</h4>

                            {t.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
                            )}

                            {/* Category Tag */}
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                              <Tag size={11} className="text-indigo-400" />
                              <span>{CATEGORY_LABELS[t.category] || t.category}</span>
                            </div>

                            {/* Linked CRM Entities */}
                            {(t.school || t.deal || t.contact) && (
                              <div className="pt-1 space-y-1.5 text-[10px]">
                                {t.school && (
                                  <div className="w-full p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400">
                                      <Building size={12} className="shrink-0 text-emerald-600" />
                                      <span className="truncate">{t.school.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                      <MapPin size={10} className="text-rose-500 shrink-0" />
                                      <span className="truncate">
                                        {t.school.zone?.name || 'Zone'}
                                        {t.school.zone?.district ? `, ${t.school.zone.district.name}` : ''}
                                      </span>
                                      <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/20 px-1 rounded text-[9px]">WB</span>
                                    </div>
                                  </div>
                                )}
                                {t.deal && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 inline-flex">
                                    <DollarSign size={10} /> {t.deal.title}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* School Task Submission Status & Actions */}
                            {(() => {
                              const submission = getTaskSubmissionReport(t);
                              if (submission) {
                                return (
                                  <div className="pt-1.5 flex items-center justify-between border-t border-dashed border-emerald-500/20">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1">
                                      <FileCheck size={11} /> School Report Submitted
                                    </span>
                                    <button
                                      onClick={() => setViewingReportTask(t)}
                                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                    >
                                      View Report
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <div className="pt-1">
                                  <button
                                    onClick={() => openSubmissionModal(t)}
                                    className="w-full py-1.5 px-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[10px] rounded-xl shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-all"
                                  >
                                    <CheckSquare size={12} /> Submit School Report
                                  </button>
                                </div>
                              );
                            })()}

                            {/* Footer: Due date & Assigned user & Comments */}
                            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px]">
                              {t.dueDate ? (
                                <span className={`flex items-center gap-1 font-semibold ${t.isOverdue ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                                  <Calendar size={11} />
                                  {new Date(t.dueDate).toLocaleDateString()}
                                </span>
                              ) : <span />}

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setActiveTaskComments(t)}
                                  className="text-slate-400 hover:text-indigo-500 flex items-center gap-0.5 font-bold"
                                >
                                  <MessageSquare size={11} /> {t.comments?.length || 0}
                                </button>
                                <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                  {t.assignedTo?.name?.split(' ')[0] || 'User'}
                                </span>
                              </div>
                            </div>

                            {/* Quick Status Shift Button */}
                            <div className="pt-1 flex gap-1 justify-end">
                              {t.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleStatusChange(t.id, t.status === 'TODO' ? 'IN_PROGRESS' : t.status === 'IN_PROGRESS' ? 'UNDER_REVIEW' : 'COMPLETED')}
                                  className="px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-600 font-bold text-[9px] rounded transition-all"
                                >
                                  Move to {t.status === 'TODO' ? 'In Progress' : t.status === 'IN_PROGRESS' ? 'Review' : 'Completed'} →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            )
          )}

          {/* VIEW MODE 2: LIST TABLE VIEW */}
          {viewMode === 'list' && (
            <div className="glass-card p-6">
              {loading ? (
                <FlipkartTableSkeleton rows={6} cols={7} hasThumbnail={false} />
              ) : tasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <CheckSquare size={36} className="mx-auto opacity-30 mb-2" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">No tasks found matching criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/50 dark:bg-white/5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 px-3">Priority & Title</th>
                        <th className="px-3">Category</th>
                        <th className="px-3">Status</th>
                        <th className="px-3">Due Date</th>
                        <th className="px-3">Assigned To</th>
                        <th className="px-3">Linked Context</th>
                        <th className="px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                      {tasks.map((t) => {
                        const pConfig = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}>
                                  {t.priority}
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{t.title}</span>
                              </div>
                              {t.description && (
                                <p className="text-[10px] text-slate-400 pl-8 mt-0.5 line-clamp-1">{t.description}</p>
                              )}
                            </td>

                            <td className="px-3 font-semibold text-slate-600 dark:text-slate-300">
                              {CATEGORY_LABELS[t.category] || t.category}
                            </td>

                            <td className="px-3">
                              <select
                                value={t.status}
                                onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold bg-slate-50 dark:bg-dark-deep border outline-none cursor-pointer ${
                                  t.status === 'COMPLETED'
                                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : t.status === 'IN_PROGRESS'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-slate-300 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <option value="TODO">TO DO</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </td>

                            <td className="px-3">
                              {t.dueDate ? (
                                <span className={`font-semibold ${t.isOverdue ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {new Date(t.dueDate).toLocaleDateString()}
                                  {t.isOverdue && <span className="ml-1 text-[9px] px-1 bg-rose-500 text-white rounded">OVERDUE</span>}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="px-3 font-bold text-slate-700 dark:text-slate-200">
                              {t.assignedTo?.name || 'Unassigned'}
                            </td>

                            <td className="px-3">
                              {t.school ? (
                                <div className="flex flex-col">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    <Building size={11} /> {t.school.name}
                                  </span>
                                  {t.school.zone && (
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      📍 {t.school.zone.name}{t.school.zone.district ? `, ${t.school.zone.district.name}` : ''}
                                    </span>
                                  )}
                                </div>
                              ) : t.deal ? (
                                <span className="text-purple-600 dark:text-purple-400 font-semibold">{t.deal.title}</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="px-3 text-right space-x-1.5 whitespace-nowrap">
                              {(() => {
                                const submission = getTaskSubmissionReport(t);
                                if (submission) {
                                  return (
                                    <button
                                      onClick={() => setViewingReportTask(t)}
                                      title="View Submitted Report"
                                      className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded text-[10px] font-bold inline-flex items-center gap-1 transition-all"
                                    >
                                      <FileCheck size={11} /> Report
                                    </button>
                                  );
                                }
                                return (
                                  <button
                                    onClick={() => openSubmissionModal(t)}
                                    title="Submit School Activity Report"
                                    className="px-2 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white rounded text-[10px] font-bold inline-flex items-center gap-1 transition-all"
                                  >
                                    <CheckSquare size={11} /> Submit
                                  </button>
                                );
                              })()}
                              <button onClick={() => openEditModal(t)} className="p-1 hover:text-indigo-500">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => handleDeleteTask(t.id)} className="p-1 hover:text-rose-500">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CREATE / EDIT TASK MODAL */}
          {showTaskModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
              <div className="glass-card w-full max-w-xl p-6 relative shadow-2xl max-h-[90vh] flex flex-col my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={18} className="text-indigo-500" />
                    <h2 className="text-base font-extrabold">{isEditing ? 'Edit Task' : 'Create New CRM Task'}</h2>
                  </div>
                  <button onClick={() => setShowTaskModal(false)} className="p-1 hover:text-rose-500 cursor-pointer">
                    <X size={16} />
                  </button>
                </div>

                {modalError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold shrink-0 mt-3">
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleTaskSubmit} className="flex-1 overflow-y-auto pr-1 pt-1 flex flex-col justify-between text-xs">
                  <div className="space-y-4 pt-3 pb-4">
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Task Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Conduct Specimen Book Handoff at St. Xavier's"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Description & Instructions</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Add activity details, teacher contact notes, or delivery objectives..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SearchSelect
                      label="Priority"
                      required
                      placeholder="Select Priority..."
                      options={[
                        { value: 'URGENT', label: 'URGENT' },
                        { value: 'HIGH', label: 'HIGH' },
                        { value: 'MEDIUM', label: 'MEDIUM' },
                        { value: 'LOW', label: 'LOW' },
                      ]}
                      value={formData.priority}
                      onChange={(v) => setFormData({ ...formData, priority: v })}
                      accentColor="rose"
                    />

                    <SearchSelect
                      label="Category"
                      required
                      placeholder="Select Category..."
                      options={[
                        { value: 'SCHOOL_VISIT', label: 'School Visit' },
                        { value: 'TEACHER_FOLLOWUP', label: 'Teacher Follow-up' },
                        { value: 'SPECIMEN_DISTRIBUTION', label: 'Specimen Distribution' },
                        { value: 'DEAL_CLOSING', label: 'Deal Closing' },
                        { value: 'MARKETING_CAMPAIGN', label: 'Marketing Campaign' },
                        { value: 'GENERAL', label: 'General Task' },
                      ]}
                      value={formData.category}
                      onChange={(v) => setFormData({ ...formData, category: v })}
                      accentColor="indigo"
                    />

                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  {/* Assignee Selection */}
                  <div>
                    <SearchSelect
                      label="Assign To Team Member *"
                      required
                      placeholder="Select Assignee..."
                      searchPlaceholder="Search users..."
                      options={usersList.map((u) => ({
                        value: u.id,
                        label: `${u.name} (${u.role})`,
                      }))}
                      value={formData.assignedToId}
                      onChange={(v) => setFormData({ ...formData, assignedToId: v })}
                      accentColor="purple"
                    />
                  </div>

                  {/* WEST BENGAL DISTRICT & ZONE-WISE SCHOOL SELECTION */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-deep/80 border border-slate-200/80 dark:border-white/5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center gap-1.5 font-black text-slate-800 dark:text-slate-100 text-xs">
                        <Building size={14} className="text-emerald-500" />
                        <span>Link School (West Bengal District & Zone Wise)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] self-start sm:self-auto">
                        Fixed: West Bengal (WB)
                      </span>
                    </div>

                    {/* District & Zone Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <SearchSelect
                          label="1. Select District (West Bengal)"
                          placeholder="All Districts..."
                          searchPlaceholder="Search 15 WB districts..."
                          options={[
                            { value: '', label: 'All Districts' },
                            ...districtsList.map((d) => ({ value: d.id, label: d.name })),
                          ]}
                          value={modalDistrictId}
                          onChange={(val) => {
                            setModalDistrictId(val);
                            setModalZoneId('');
                            if (!isBatchSchoolWise) {
                              setFormData({ ...formData, schoolId: '' });
                            }
                          }}
                          accentColor="cyan"
                        />
                      </div>

                      <div>
                        <SearchSelect
                          label="2. Select Zone"
                          placeholder={modalDistrictId ? 'Select Zone in District...' : 'Select District first...'}
                          searchPlaceholder="Search zones..."
                          options={[
                            { value: '', label: 'All Zones in District' },
                            ...(modalDistrictId
                              ? zonesList.filter((z) => z.districtId === modalDistrictId || z.district?.id === modalDistrictId)
                              : zonesList
                            ).map((z) => ({
                              value: z.id,
                              label: `${z.name} ${!modalDistrictId && z.district ? `(${z.district.name})` : ''}`,
                            })),
                          ]}
                          value={modalZoneId}
                          onChange={(val) => {
                            setModalZoneId(val);
                            if (!isBatchSchoolWise) {
                              setFormData({ ...formData, schoolId: '' });
                            }
                          }}
                          accentColor="emerald"
                        />
                      </div>
                    </div>

                    {/* Mode Toggle: Single School vs Batch Multi-School */}
                    {!isEditing && (
                      <div className="flex items-center justify-between pt-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isBatchSchoolWise}
                            onChange={(e) => {
                              setIsBatchSchoolWise(e.target.checked);
                              if (!e.target.checked) setSelectedBatchSchoolIds([]);
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span>Batch Task Creation: Create separate task for each selected school</span>
                        </label>

                        {isBatchSchoolWise && (
                          <button
                            type="button"
                            onClick={() => {
                              const available = schoolsList.filter((s) => {
                                if (modalZoneId) return s.zoneId === modalZoneId || s.zone?.id === modalZoneId;
                                if (modalDistrictId) return s.zone?.districtId === modalDistrictId || s.zone?.district?.id === modalDistrictId;
                                return true;
                              });
                              if (selectedBatchSchoolIds.length === available.length) {
                                setSelectedBatchSchoolIds([]);
                              } else {
                                setSelectedBatchSchoolIds(available.map((s) => s.id));
                              }
                            }}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            {(() => {
                              const available = schoolsList.filter((s) => {
                                if (modalZoneId) return s.zoneId === modalZoneId || s.zone?.id === modalZoneId;
                                if (modalDistrictId) return s.zone?.districtId === modalDistrictId || s.zone?.district?.id === modalDistrictId;
                                return true;
                              });
                              return selectedBatchSchoolIds.length === available.length ? 'Deselect All' : 'Select All';
                            })()}
                          </button>
                        )}
                      </div>
                    )}

                    {/* School Picker: Single or Multi-Select */}
                    {!isBatchSchoolWise ? (
                      <div>
                        {(() => {
                          const availableSchools = schoolsList.filter((s) => {
                            if (modalZoneId) return s.zoneId === modalZoneId || s.zone?.id === modalZoneId;
                            if (modalDistrictId) return s.zone?.districtId === modalDistrictId || s.zone?.district?.id === modalDistrictId;
                            return true;
                          });
                          return (
                            <SearchSelect
                              label={`3. Select School (${availableSchools.length} available)`}
                              placeholder="Choose School..."
                              searchPlaceholder="Search available schools..."
                              options={[
                                { value: '', label: 'No School (General Task)' },
                                ...availableSchools.map((s) => ({
                                  value: s.id,
                                  label: `${s.name} (${s.zone?.name || 'Zone'}${s.zone?.district ? `, ${s.zone.district.name}` : ''})`,
                                })),
                              ]}
                              value={formData.schoolId}
                              onChange={(v) => setFormData({ ...formData, schoolId: v })}
                              accentColor="emerald"
                            />
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex justify-between">
                          <span>Check Schools ({selectedBatchSchoolIds.length} selected)</span>
                        </div>
                        {(() => {
                          const availableSchools = schoolsList.filter((s) => {
                            if (modalZoneId) return s.zoneId === modalZoneId || s.zone?.id === modalZoneId;
                            if (modalDistrictId) return s.zone?.districtId === modalDistrictId || s.zone?.district?.id === modalDistrictId;
                            return true;
                          });
                          if (availableSchools.length === 0) {
                            return (
                              <div className="p-3 text-center text-xs text-slate-400 bg-white/50 dark:bg-dark-card rounded-xl">
                                No schools found in this zone/district.
                              </div>
                            );
                          }
                          return (
                            <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-xl bg-white dark:bg-dark-card border border-slate-200/60 dark:border-white/5">
                              {availableSchools.map((s) => {
                                const isChecked = selectedBatchSchoolIds.includes(s.id);
                                return (
                                  <label
                                    key={s.id}
                                    className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                                      isChecked
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedBatchSchoolIds([...selectedBatchSchoolIds, s.id]);
                                        } else {
                                          setSelectedBatchSchoolIds(selectedBatchSchoolIds.filter((id) => id !== s.id));
                                        }
                                      }}
                                      className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="flex-1 truncate">
                                      <span>{s.name}</span>
                                      <span className="text-[10px] text-slate-400 ml-1.5">
                                        ({s.zone?.name || 'Zone'}{s.zone?.district ? `, ${s.zone.district.name}` : ''})
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/60 dark:border-white/5 shrink-0 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-xl shadow-md inline-flex items-center gap-1 cursor-pointer"
                    >
                      {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      {isEditing ? 'Save Changes' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TASK COMMENTS DRAWER */}
          {activeTaskComments && (
            <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
              <div className="w-full max-w-md bg-white dark:bg-dark-card h-full p-6 space-y-4 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-indigo-500" />
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Task Activity & Comments</h3>
                  </div>
                  <button onClick={() => setActiveTaskComments(null)} className="p-1 hover:text-rose-500">
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{activeTaskComments.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{activeTaskComments.description}</p>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {(!activeTaskComments.comments || activeTaskComments.comments.length === 0) ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No comments on this task yet. Leave an update below!
                    </div>
                  ) : (
                    activeTaskComments.comments.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-dark-deep border border-slate-200/60 dark:border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{c.user?.name || 'User'}</span>
                          <span className="text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* New Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-3 border-t border-slate-200/60 dark:border-white/5">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a progress comment..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* SCHOOL TASK SUBMISSION MODAL */}
          {showSubmissionModal && submittingTask && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
              <div className="glass-card w-full max-w-lg p-6 relative shadow-2xl max-h-[90vh] flex flex-col my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FileCheck size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                        Submit School Activity Report
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Task: {submittingTask.title}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowSubmissionModal(false)} className="p-1 hover:text-rose-500 cursor-pointer">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 pt-3 space-y-4 text-xs">

                {/* Linked School Information Banner */}
                {submittingTask.school && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Building size={13} /> {submittingTask.school.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} className="text-rose-500" />
                        <span>{submittingTask.school.zone?.name || 'Zone'}{submittingTask.school.zone?.district ? `, ${submittingTask.school.zone.district.name}` : ''}</span>
                        <span className="font-bold text-indigo-500">· West Bengal</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-white">
                      {submittingTask.school.type || 'PRIVATE'}
                    </span>
                  </div>
                )}

                {submissionError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    {submissionError}
                  </div>
                )}

                <form onSubmit={handleTaskReportSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Task Status *
                      </label>
                      <select
                        value={submissionForm.status}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, status: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl font-bold focus:outline-none"
                      >
                        <option value="COMPLETED">COMPLETED (Closed)</option>
                        <option value="UNDER_REVIEW">UNDER REVIEW</option>
                        <option value="IN_PROGRESS">IN PROGRESS (Follow-up needed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Visit Outcome *
                      </label>
                      <select
                        value={submissionForm.visitOutcome}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, visitOutcome: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl font-bold focus:outline-none"
                      >
                        <option value="Specimen Handed Over">Specimen Handed Over</option>
                        <option value="Syllabus Prescription Agreed">Syllabus Prescription Agreed</option>
                        <option value="Order Discussed / Placed">Order Discussed / Placed</option>
                        <option value="Follow-up Meeting Scheduled">Follow-up Meeting Scheduled</option>
                        <option value="School Closed / Revisit Required">School Closed / Revisit Required</option>
                        <option value="General Visit Done">General Visit Done</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Teacher / Contact Person Met
                      </label>
                      <input
                        type="text"
                        value={submissionForm.teacherMet}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, teacherMet: e.target.value })}
                        placeholder="e.g. Mr. A. Roy (HOD Science)"
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Teacher Phone / Contact
                      </label>
                      <input
                        type="tel"
                        value={submissionForm.teacherPhone}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, teacherPhone: e.target.value })}
                        placeholder="e.g. 9830012345"
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Specimen Books Distributed / Details
                    </label>
                    <input
                      type="text"
                      value={submissionForm.specimenDetails}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, specimenDetails: e.target.value })}
                      placeholder="e.g. Class 10 Physical Science Question Bank (2 copies), Math (2 copies)"
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Notes & Teacher Feedback
                    </label>
                    <textarea
                      rows={3}
                      value={submissionForm.notes}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
                      placeholder="Add observations, teacher reactions, competitor books mentioned, or future requirements..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Next Follow-up Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={submissionForm.followUpDate}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, followUpDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl font-bold focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/60 dark:border-white/5 shrink-0 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmissionModal(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submissionLoading}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {submissionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                      Submit Report
                    </button>
                  </div>
                </form>
                </div>
              </div>
            </div>
          )}

          {/* VIEW SUBMISSION REPORT MODAL */}
          {viewingReportTask && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
              <div className="glass-card w-full max-w-lg p-6 relative shadow-2xl max-h-[90vh] flex flex-col my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FileCheck size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                        School Submission Report
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        {viewingReportTask.title}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setViewingReportTask(null)} className="p-1 hover:text-rose-500 cursor-pointer">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 pt-3 space-y-4">
                  {viewingReportTask.school && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 font-extrabold text-xs text-emerald-800 dark:text-emerald-300">
                        <Building size={14} /> {viewingReportTask.school.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin size={11} className="text-rose-500" />
                        <span>{viewingReportTask.school.zone?.name || 'Zone'}{viewingReportTask.school.zone?.district ? `, ${viewingReportTask.school.zone.district.name}` : ''} · West Bengal</span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-deep border border-slate-200/60 dark:border-white/5 whitespace-pre-line text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                    {getTaskSubmissionReport(viewingReportTask)?.content || 'No submission report text recorded.'}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-200/60 dark:border-white/5 shrink-0 mt-2">
                  <span className="text-[10px] text-slate-400">
                    Status: <span className="font-extrabold text-emerald-600">{viewingReportTask.status}</span>
                  </span>
                  <button
                    onClick={() => setViewingReportTask(null)}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TaskManagement;
