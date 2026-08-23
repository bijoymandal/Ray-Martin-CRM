import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import KpiCard from '../components/KpiCard';
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
  getDealsAPI,
  getContactsAPI,
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
  ChevronRight,
  Flame,
  Send,
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
  const [dealsList, setDealsList] = useState([]);
  const [contactsList, setContactsList] = useState([]);

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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    category: 'GENERAL',
    dueDate: '',
    assignedToId: '',
    schoolId: '',
    dealId: '',
    contactId: '',
  });
  const [modalError, setModalError] = useState(null);

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
      const [uRes, schRes, dRes, cRes] = await Promise.all([
        getUsersAPI(),
        getSchoolsAPI(),
        getDealsAPI(),
        getContactsAPI(),
      ]);
      if (uRes.success) setUsersList(uRes.data || []);
      if (schRes.success) setSchoolsList(schRes.data || []);
      if (dRes.success) setDealsList(dRes.data || []);
      if (cRes.success) setContactsList(cRes.data || []);
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
    loadReferences();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [priorityFilter, categoryFilter, statusFilter, myTasksOnly, search]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditTaskId(null);
    setModalError(null);
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      category: 'GENERAL',
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
        res = await createTaskAPI(formData);
      }

      if (res.success) {
        setShowTaskModal(false);
        const assignedUser = usersList.find((u) => u.id === formData.assignedToId);
        const assigneeName = assignedUser ? assignedUser.name : 'Assignee';
        setSuccessToast(`Task successfully created and assigned to ${assigneeName}! Pop-up notification sent.`);
        setTimeout(() => setSuccessToast(null), 5000);

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
          {summary && (
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
          )}

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
            </div>
          </div>

          {/* VIEW MODE 1: KANBAN BOARD */}
          {viewMode === 'kanban' && (
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
                              <div className="pt-1 flex flex-wrap gap-1 text-[10px]">
                                {t.school && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <Building size={10} /> {t.school.name}
                                  </span>
                                )}
                                {t.deal && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                                    <DollarSign size={10} /> {t.deal.title}
                                  </span>
                                )}
                              </div>
                            )}

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
          )}

          {/* VIEW MODE 2: LIST TABLE VIEW */}
          {viewMode === 'list' && (
            <div className="glass-card p-6">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-indigo-500" /> Loading task list...
                </div>
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
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.school.name}</span>
                              ) : t.deal ? (
                                <span className="text-purple-600 dark:text-purple-400 font-semibold">{t.deal.title}</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="px-3 text-right space-x-1">
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="glass-card w-full max-w-xl p-6 space-y-4 relative shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={18} className="text-indigo-500" />
                    <h2 className="text-base font-extrabold">{isEditing ? 'Edit Task' : 'Create New CRM Task'}</h2>
                  </div>
                  <button onClick={() => setShowTaskModal(false)} className="p-1 hover:text-rose-500">
                    <X size={16} />
                  </button>
                </div>

                {modalError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleTaskSubmit} className="space-y-4 text-xs">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SearchSelect
                      label="Assign To Team Member"
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

                    <SearchSelect
                      label="Linked Master Data School (Optional)"
                      placeholder="Select School..."
                      searchPlaceholder="Search schools..."
                      options={schoolsList.map((s) => ({
                        value: s.id,
                        label: `${s.name} (${s.type})`,
                      }))}
                      value={formData.schoolId}
                      onChange={(v) => setFormData({ ...formData, schoolId: v })}
                      accentColor="emerald"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/60 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-xl shadow-md inline-flex items-center gap-1"
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
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
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
        </main>
      </div>
    </div>
  );
};

export default TaskManagement;
