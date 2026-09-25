import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import {
  getUsersAPI,
  updateUserRoleAPI,
  getAllMenusAPI,
  createMenuAPI,
  updateMenuAPI,
  deleteMenuAPI,
  transferMenuPermissionsAPI,
  getPermissionsAPI,
  updatePermissionAPI,
  getRolesAPI,
  createRoleAPI,
  updateRoleAPI,
  deleteRoleAPI,
  getPermissionActionsAPI,
  createPermissionActionAPI,
  updatePermissionActionAPI,
  deletePermissionActionAPI,
  getActivityLogsAPI,
  getSettingsAPI,
  updateSettingsAPI,
  getTaskSummaryAPI,
  getTasksAPI,
  createTaskAPI,
  updateTaskStatusAPI,
  deleteTaskAPI,
  getSchoolsAPI,
  getDistrictsAPI,
  getZonesAPI,
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KpiCard from '../components/KpiCard';
import {
  Shield,
  Mail,
  Calendar,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Settings,
  ChevronRight,
  RefreshCw,
  Server,
  CreditCard,
  Save,
  Eye,
  EyeOff,
  CheckSquare,
  Clock,
  ExternalLink,
  CheckCircle2,
  School as SchoolIcon,
  MapPin,
  FileCheck,
  Search,
  Filter,
  User,
  X,
  Phone,
  Building,
} from 'lucide-react';

const TASK_PRIORITY_BADGES = {
  URGENT: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  HIGH: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  MEDIUM: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
  LOW: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
};

const TASK_CATEGORY_LABELS = {
  SCHOOL_VISIT: 'School Visit',
  TEACHER_FOLLOWUP: 'Teacher Follow-up',
  SPECIMEN_DISTRIBUTION: 'Specimen Distribution',
  DEAL_CLOSING: 'Deal Closing',
  MARKETING_CAMPAIGN: 'Marketing Campaign',
  GENERAL: 'General Task',
};

const Admin = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'menus', 'permissions'

  // User states
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Menu states
  const [menus, setMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(false);

  // Permission states
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // Error/Success statuses
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New Menu Form State
  const [newMenu, setNewMenu] = useState({
    name: '',
    path: '',
    iconName: 'HelpCircle',
    roles: [],
    order: '0',
  });

  // Transfer Perms State
  const [transfer, setTransfer] = useState({
    fromRole: 'SALESMAN',
    toRole: 'EDITOR',
    action: 'copy', // 'copy' or 'move'
  });

  // Settings state
  const [settings, setSettings] = useState({
    payment_credentials: {
      stripePublishableKey: '',
      stripeSecretKey: '',
      stripeWebhookSecret: '',
    },
    s3_credentials: {
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      bucket: '',
      endpoint: '',
    },
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    stripeSecretKey: false,
    stripeWebhookSecret: false,
    secretAccessKey: false,
  });

  // Role states
  const [roles, setRoles] = useState([
    { name: 'SUPERADMIN', description: 'Super Administrator with full bypass rights' },
    { name: 'ADMIN', description: 'Administrator with full system privileges' },
    { name: 'EDITOR', description: 'Editor with read and write access to resources' },
    { name: 'ACCOUNT', description: 'Accountant with limited view and financial access' },
    { name: 'SALESMAN', description: 'Sales representative with lead and deal access' }
  ]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [editingRole, setEditingRole] = useState(null);

  const rolesList = roles.map((r) => r.name);

  // Permission actions states
  const [permissionActions, setPermissionActions] = useState([
    { name: 'canView', label: 'View', description: 'Access and view menu' },
    { name: 'canCreate', label: 'Create', description: 'Create new records' },
    { name: 'canEdit', label: 'Edit', description: 'Edit existing records' },
    { name: 'canDelete', label: 'Delete', description: 'Delete records' }
  ]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [newAction, setNewAction] = useState({ name: '', label: '', description: '' });
  const [editingAction, setEditingAction] = useState(null);

  // Activity logs states
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState(null);

  // Pagination states for Users
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const usersLimit = 10;

  // Pagination states for Activities
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const activityLimit = 20;

  // Task Operations states in Superadmin Center
  const [adminTasks, setAdminTasks] = useState([]);
  const [adminTasksLoading, setAdminTasksLoading] = useState(false);
  const [adminTaskSummary, setAdminTaskSummary] = useState(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('ALL');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('ALL');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('ALL');
  const [taskDistrictFilter, setTaskDistrictFilter] = useState('ALL');

  // Reference data for task operations
  const [adminSchools, setAdminSchools] = useState([]);
  const [adminDistricts, setAdminDistricts] = useState([]);
  const [adminZones, setAdminZones] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);

  // Task Modals & Creation
  const [showAdminTaskModal, setShowAdminTaskModal] = useState(false);
  const [adminTaskSubmitting, setAdminTaskSubmitting] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
  const [adminModalDistrictId, setAdminModalDistrictId] = useState('');
  const [adminModalZoneId, setAdminModalZoneId] = useState('');
  const [adminTaskFormData, setAdminTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'SCHOOL_VISIT',
    dueDate: '',
    assignedToId: '',
    schoolId: '',
  });

  const fetchUsers = async (page = 1) => {
    setUsersLoading(true);
    try {
      setError('');
      const res = await getUsersAPI(page, usersLimit);
      if (res.success) {
        setUsers(res.data);
        setUsersPage(res.currentPage || page);
        setUsersTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading users list');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMenus = async () => {
    setMenusLoading(true);
    try {
      setError('');
      const res = await getAllMenusAPI();
      if (res.success) {
        setMenus(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading system menus');
    } finally {
      setMenusLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      setError('');
      const res = await getPermissionsAPI();
      if (res.success) {
        setPermissions(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      setError('');
      const res = await getRolesAPI();
      if (res.success) {
        setRoles(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading roles list');
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchPermissionActions = async () => {
    setActionsLoading(true);
    try {
      setError('');
      const res = await getPermissionActionsAPI();
      if (res.success) {
        setPermissionActions(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading permission actions');
    } finally {
      setActionsLoading(false);
    }
  };

  const fetchActivityLogs = async (page = 1) => {
    setActivityLoading(true);
    try {
      setError('');
      const res = await getActivityLogsAPI(page, activityLimit);
      if (res.success) {
        setActivityLogs(res.data);
        setActivityPage(res.currentPage || page);
        setActivityTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading activity logs');
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      setError('');
      const res = await getSettingsAPI();
      if (res.success) {
        // Ensure default structures are preserved
        const data = res.data;
        if (!data.payment_credentials) {
          data.payment_credentials = {
            stripePublishableKey: '',
            stripeSecretKey: '',
            stripeWebhookSecret: '',
          };
        }
        if (!data.s3_credentials) {
          data.s3_credentials = {
            accessKeyId: '',
            secretAccessKey: '',
            region: '',
            bucket: '',
            endpoint: '',
          };
        }
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading system settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateSettings = async (key, value) => {
    try {
      setSavingSettings(true);
      setError('');
      setSuccess('');
      const res = await updateSettingsAPI(key, value);
      if (res.success) {
        setSuccess(`Successfully updated ${key.replace('_', ' ')}`);
        fetchSettings();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchAdminTasks = async () => {
    setAdminTasksLoading(true);
    try {
      setError('');
      const params = { limit: 100 };
      if (taskSearch.trim()) params.search = taskSearch.trim();
      if (taskStatusFilter !== 'ALL') params.status = taskStatusFilter;
      if (taskPriorityFilter !== 'ALL') params.priority = taskPriorityFilter;
      if (taskAssigneeFilter !== 'ALL') params.assignedToId = taskAssigneeFilter;
      if (taskDistrictFilter !== 'ALL') params.districtId = taskDistrictFilter;

      const [tasksRes, summaryRes] = await Promise.all([
        getTasksAPI(params),
        getTaskSummaryAPI(),
      ]);

      if (tasksRes.success) {
        setAdminTasks(tasksRes.data);
      }
      if (summaryRes.success) {
        setAdminTaskSummary(summaryRes.data);
      }
    } catch (err) {
      console.error('Error loading admin tasks:', err);
      setError(err.response?.data?.message || 'Error loading task list');
    } finally {
      setAdminTasksLoading(false);
    }
  };

  const loadAdminTaskReferences = async () => {
    try {
      const [schoolsRes, distRes, zonesRes, usersRes] = await Promise.all([
        getSchoolsAPI({ limit: 1000 }),
        getDistrictsAPI(),
        getZonesAPI(),
        getUsersAPI(1, 100),
      ]);

      if (schoolsRes.success) setAdminSchools(schoolsRes.data);
      if (distRes.success) setAdminDistricts(distRes.data);
      if (zonesRes.success) setAdminZones(zonesRes.data);
      if (usersRes.success) setAllUsersList(usersRes.data);
    } catch (err) {
      console.error('Error loading task references:', err);
    }
  };

  const handleAdminTaskStatusChange = async (taskId, newStatus) => {
    try {
      setError('');
      setSuccess('');
      const res = await updateTaskStatusAPI(taskId, newStatus);
      if (res.success) {
        setSuccess(`Task status updated to ${newStatus}`);
        setAdminTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
        getTaskSummaryAPI().then((s) => s.success && setAdminTaskSummary(s.data));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(err.response?.data?.message || 'Error updating task status');
    }
  };

  const handleAdminDeleteTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Are you sure you want to delete task "${taskTitle}"?`)) return;
    try {
      setError('');
      setSuccess('');
      const res = await deleteTaskAPI(taskId);
      if (res.success) {
        setSuccess('Task deleted successfully');
        setAdminTasks((prev) => prev.filter((t) => t.id !== taskId));
        getTaskSummaryAPI().then((s) => s.success && setAdminTaskSummary(s.data));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.message || 'Error deleting task');
    }
  };

  const handleAdminCreateTask = async (e) => {
    e.preventDefault();
    if (!adminTaskFormData.title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!adminTaskFormData.dueDate) {
      setError('Due date is required');
      return;
    }
    if (!adminTaskFormData.assignedToId) {
      setError('Please assign the task to a user');
      return;
    }

    try {
      setAdminTaskSubmitting(true);
      setError('');
      setSuccess('');
      const payload = {
        title: adminTaskFormData.title.trim(),
        description: adminTaskFormData.description.trim(),
        priority: adminTaskFormData.priority,
        category: adminTaskFormData.category,
        dueDate: adminTaskFormData.dueDate,
        assignedToId: adminTaskFormData.assignedToId,
        schoolId: adminTaskFormData.schoolId || undefined,
      };

      const res = await createTaskAPI(payload);
      if (res.success) {
        setSuccess('Task created successfully!');
        setShowAdminTaskModal(false);
        setAdminTaskFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          category: 'SCHOOL_VISIT',
          dueDate: '',
          assignedToId: '',
          schoolId: '',
        });
        setAdminModalDistrictId('');
        setAdminModalZoneId('');
        fetchAdminTasks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setAdminTaskSubmitting(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissionActions();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(usersPage);
    } else if (activeTab === 'menus') {
      fetchMenus();
    } else if (activeTab === 'permissions') {
      fetchMenus(); // Needed to align rows
      fetchPermissionActions();
      fetchPermissions();
    } else if (activeTab === 'roles') {
      fetchRoles();
      fetchPermissionActions();
    } else if (activeTab === 'activity') {
      fetchActivityLogs(activityPage);
    } else if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'tasks') {
      fetchAdminTasks();
      loadAdminTaskReferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, usersPage, activityPage, taskStatusFilter, taskPriorityFilter, taskAssigneeFilter, taskDistrictFilter]);

  // Handle user role changes
  const handleRoleChange = async (userId, newRole) => {
    try {
      setError('');
      setSuccess('');
      const res = await updateUserRoleAPI(userId, newRole);
      if (res.success) {
        setSuccess(`Successfully updated role to ${newRole}`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating user role');
    }
  };

  // Handle dynamic permissions checkbox toggles (SUPERADMIN controls)
  const handleTogglePerm = async (permId, actionName, enabled) => {
    try {
      setError('');
      setSuccess('');
      const res = await updatePermissionAPI(permId, { actionName, enabled });
      if (res.success) {
        setSuccess('Permission updated successfully.');
        fetchPermissions();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating permission');
    }
  };

  // Handle menu checkbox toggles (Attach/Detach permissions)
  const handleMenuRoleToggle = async (menu, role) => {
    try {
      setError('');
      setSuccess('');
      let updatedRoles = [...menu.roles];
      if (updatedRoles.includes(role)) {
        updatedRoles = updatedRoles.filter((r) => r !== role);
      } else {
        updatedRoles.push(role);
      }

      const res = await updateMenuAPI(menu.id, { roles: updatedRoles });
      if (res.success) {
        setSuccess(`Permissions updated for '${menu.name}'`);
        fetchMenus();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error toggling permissions');
    }
  };

  // Handle creating menu
  const handleCreateMenuSubmit = async (e) => {
    e.preventDefault();
    if (!newMenu.name || !newMenu.path) {
      setError('Please fill in all menu fields');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await createMenuAPI({
        ...newMenu,
        order: parseInt(newMenu.order, 10) || 0,
      });
      if (res.success) {
        setSuccess(`Menu '${newMenu.name}' created successfully`);
        setNewMenu({
          name: '',
          path: '',
          iconName: 'HelpCircle',
          roles: [],
          order: '0',
        });
        fetchMenus();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error creating menu');
    }
  };

  // Handle menu deletion
  const handleDeleteMenu = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      setError('');
      setSuccess('');
      const res = await deleteMenuAPI(id);
      if (res.success) {
        setSuccess('Menu deleted successfully');
        fetchMenus();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error deleting menu');
    }
  };

  // Handle transferring permissions
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (transfer.fromRole === transfer.toRole) {
      setError('Cannot transfer permissions to the same role');
      return;
    }
    if (!window.confirm(`Are you sure you want to ${transfer.action} permissions from ${transfer.fromRole} to ${transfer.toRole}?`)) return;

    try {
      setError('');
      setSuccess('');
      const res = await transferMenuPermissionsAPI(transfer);
      if (res.success) {
        setSuccess(res.message);
        fetchMenus();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error transferring permissions');
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!newRole.name.trim()) {
      setError('Role name is required');
      return;
    }
    try {
      setError('');
      setSuccess('');
      if (editingRole) {
        // Update role
        const res = await updateRoleAPI(editingRole.id, newRole);
        if (res.success) {
          setSuccess(`Successfully updated role to '${res.data.name}'`);
          setEditingRole(null);
          setNewRole({ name: '', description: '' });
          fetchRoles();
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        // Create role
        const res = await createRoleAPI(newRole);
        if (res.success) {
          setSuccess(`Successfully created role '${res.data.name}'`);
          setNewRole({ name: '', description: '' });
          fetchRoles();
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error processing role request');
    }
  };

  const handleDeleteRole = async (id, name) => {
    if (['SUPERADMIN', 'ADMIN'].includes(name)) {
      setError('System roles cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role '${name}'? This will remove its permissions and pull it from any assigned menus.`)) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      const res = await deleteRoleAPI(id);
      if (res.success) {
        setSuccess(`Successfully deleted role '${name}'`);
        fetchRoles();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error deleting role');
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!newAction.name.trim() || !newAction.label.trim()) {
      setError('Name and Label are required');
      return;
    }
    try {
      setError('');
      setSuccess('');
      if (editingAction) {
        // Update action
        const res = await updatePermissionActionAPI(editingAction.id, newAction);
        if (res.success) {
          setSuccess(`Successfully updated action to '${res.data.label}'`);
          setEditingAction(null);
          setNewAction({ name: '', label: '', description: '' });
          fetchPermissionActions();
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        // Create action
        const res = await createPermissionActionAPI(newAction);
        if (res.success) {
          setSuccess(`Successfully created permission action '${res.data.label}'`);
          setNewAction({ name: '', label: '', description: '' });
          fetchPermissionActions();
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error processing action request');
    }
  };

  const handleDeleteAction = async (id, name) => {
    const isSystemAction = ['canView', 'canCreate', 'canEdit', 'canDelete'].includes(name);
    if (isSystemAction) {
      setError('System core actions cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete permission action '${name}'? This will pull it from all roles' permissions across the system.`)) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      const res = await deletePermissionActionAPI(id);
      if (res.success) {
        setSuccess(`Successfully deleted permission action '${name}'`);
        fetchPermissionActions();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error deleting permission action');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      case 'ADMIN':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      case 'EDITOR':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'ACCOUNT':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
      case 'SALESMAN':
      default:
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-main text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto md:pl-[260px] pt-[70px]">
        <Navbar />

        <div className="flex-1 p-8 max-w-[1600px] w-full mx-auto animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-2">Admin Center</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage user accounts, roles, custom menus, and dynamic routing permissions.</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 border-b border-slate-200 dark:border-white/5 mb-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              User Accounts
            </button>
            <button
              onClick={() => setActiveTab('menus')}
              className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'menus'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Menu & Permissions Panel
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Role Settings
            </button>
            {currentUser?.role === 'SUPERADMIN' && (
              <>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                    activeTab === 'permissions'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  Dynamic Permissions Matrix
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                    activeTab === 'activity'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  User Activity Logs
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  System Settings
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'tasks'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <CheckSquare size={16} />
                  <span>Task Operations</span>
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200/60 rounded-xl p-4 mb-6 text-sm text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200/60 rounded-xl p-4 mb-6 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
              <CheckCircle size={18} className="shrink-0" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'roles' ? (
            rolesLoading || actionsLoading ? (
              <div className="skeleton h-[350px] rounded-2xl" />
            ) : (
              <div className="flex flex-col gap-12 animate-fade-in">
                {/* 1. Dynamic Roles Section */}
                <div>
                  <div className="border-b border-slate-200/60 dark:border-white/5 pb-3 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="text-xs bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-md dark:bg-indigo-500/20 dark:text-indigo-400 font-bold">01</span>
                      Dynamic Roles Configuration
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Manage system user roles. Renaming propagations and cascading deletes are processed automatically.</p>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Roles list */}
                    <div className="flex-1">
                      <div className="glass-card p-0 overflow-hidden">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-white/1">
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Role Name</th>
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Description</th>
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                            {roles.map((r) => {
                              const isSystem = ['SUPERADMIN', 'ADMIN'].includes(r.name);
                              return (
                                <tr key={r.id || r.name} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                                    <span className={getRoleBadgeClass(r.name)}>
                                      {r.name}
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                                    {r.description}
                                  </td>
                                  <td className="p-4 text-right">
                                    {isSystem ? (
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200/25 dark:border-white/5">System</span>
                                    ) : (
                                      <div className="inline-flex gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingRole(r);
                                            setNewRole({ name: r.name, description: r.description });
                                          }}
                                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteRole(r.id, r.name)}
                                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Create/Edit Form card */}
                    <div className="w-full lg:w-[380px]">
                      <div className="glass-card p-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-4 flex items-center gap-2">
                          <Plus size={16} className="text-indigo-500" />
                          {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Dynamic Role'}
                        </h3>
                        <form onSubmit={handleRoleSubmit} className="flex flex-col gap-4" autoComplete="off">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Role Name</label>
                            <input
                              type="text"
                              placeholder="e.g. MARKETING"
                              value={newRole.name}
                              disabled={editingRole && ['SUPERADMIN', 'ADMIN'].includes(editingRole.name)}
                              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                              className="glass-input w-full px-3 py-2 text-xs"
                              autoComplete="off"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                            <textarea
                              placeholder="Role description and business function..."
                              value={newRole.description}
                              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                              className="glass-input w-full px-3 py-2 text-xs min-h-[80px]"
                            />
                          </div>
                          <div className="flex gap-2.5 mt-2">
                            <button
                              type="submit"
                              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all cursor-pointer"
                            >
                              {editingRole ? 'Save Changes' : 'Create Role'}
                            </button>
                            {editingRole && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRole(null);
                                  setNewRole({ name: '', description: '' });
                                }}
                                className="bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Dynamic Permission Actions Section */}
                <div>
                  <div className="border-b border-slate-200/60 dark:border-white/5 pb-3 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="text-xs bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-md dark:bg-indigo-500/20 dark:text-indigo-400 font-bold">02</span>
                      Dynamic Permission Actions Configuration
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Define dynamic permission action identifiers (like <code>canView</code>, <code>canCreate</code>, or custom <code>canExport</code>, <code>canApprove</code>).</p>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Actions list */}
                    <div className="flex-1">
                      <div className="glass-card p-0 overflow-hidden">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-white/1">
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Action Code</th>
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Label</th>
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Description</th>
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                            {permissionActions.map((a) => {
                              const isSystem = ['canView', 'canCreate', 'canEdit', 'canDelete'].includes(a.name);
                              return (
                                <tr key={a.id || a.name} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                    <code>{a.name}</code>
                                  </td>
                                  <td className="p-4 text-slate-800 dark:text-slate-200 font-semibold text-xs">
                                    {a.label}
                                  </td>
                                  <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                                    {a.description}
                                  </td>
                                  <td className="p-4 text-right">
                                    {isSystem ? (
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200/25 dark:border-white/5">System</span>
                                    ) : (
                                      <div className="inline-flex gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingAction(a);
                                            setNewAction({ name: a.name, label: a.label, description: a.description });
                                          }}
                                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteAction(a.id, a.name)}
                                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Actions form */}
                    <div className="w-full lg:w-[380px]">
                      <div className="glass-card p-6">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-4 flex items-center gap-2">
                          <Plus size={16} className="text-indigo-500" />
                          {editingAction ? `Edit Action: ${editingAction.label}` : 'Create Dynamic Action'}
                        </h3>
                        <form onSubmit={handleActionSubmit} className="flex flex-col gap-4" autoComplete="off">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Action Name (camelCase starting with "can")</label>
                            <input
                              type="text"
                              placeholder="e.g. canExport"
                              value={newAction.name}
                              disabled={!!editingAction}
                              onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                              className="glass-input w-full px-3 py-2 text-xs"
                              autoComplete="off"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Display Label</label>
                            <input
                              type="text"
                              placeholder="e.g. Export"
                              value={newAction.label}
                              onChange={(e) => setNewAction({ ...newAction, label: e.target.value })}
                              className="glass-input w-full px-3 py-2 text-xs"
                              autoComplete="off"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                            <textarea
                              placeholder="Describe the access privilege..."
                              value={newAction.description}
                              onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                              className="glass-input w-full px-3 py-2 text-xs min-h-[80px]"
                            />
                          </div>
                          <div className="flex gap-2.5 mt-2">
                            <button
                              type="submit"
                              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all cursor-pointer"
                            >
                              {editingAction ? 'Save Changes' : 'Create Action'}
                            </button>
                            {editingAction && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAction(null);
                                  setNewAction({ name: '', label: '', description: '' });
                                }}
                                className="bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : activeTab === 'users' ? (
            usersLoading ? (
              <div className="skeleton h-[350px] rounded-2xl" />
            ) : (
              <div className="glass-card p-0 overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-white/1">
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Name</th>
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Email</th>
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Joined Date</th>
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Current Role</th>
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-right">Change Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <UserCheck size={16} className="text-slate-400 dark:text-slate-500" />
                            <span>{u.name}</span>
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider dark:bg-white/5 dark:text-slate-400">You</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Mail size={14} className="text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-slate-400" />
                              <span>{formatDate(u.createdAt)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={getRoleBadgeClass(u.role)}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {u.id === currentUser?.id ? (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic">Self-management disabled</span>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <Shield size={14} className="text-slate-400 dark:text-slate-500" />
                                <SearchSelect
                                  placeholder="Select Role"
                                  options={roles.map((r) => ({
                                    value: r.name,
                                    label: r.name.charAt(0) + r.name.slice(1).toLowerCase(),
                                  }))}
                                  value={u.role}
                                  onChange={(v) => handleRoleChange(u.id, v)}
                                  accentColor="indigo"
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Users Pagination controls */}
                {usersTotalPages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      Showing page <span className="font-semibold text-slate-700 dark:text-slate-300">{usersPage}</span> of{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{usersTotalPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={usersPage === 1}
                        onClick={() => setUsersPage(usersPage - 1)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-white/5 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Previous
                      </button>
                      {Array.from({ length: usersTotalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setUsersPage(p)}
                          className={`px-3 py-1.5 border rounded-lg font-semibold transition-all cursor-pointer ${
                            usersPage === p
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        disabled={usersPage === usersTotalPages}
                        onClick={() => setUsersPage(usersPage + 1)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-white/5 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : activeTab === 'menus' ? (
            // MENUS TAB
            <div className="flex flex-col gap-12 animate-fade-in">
              {/* Section 1: Menu Configurations */}
              <div>
                <div className="border-b border-slate-200/60 dark:border-white/5 pb-3 mb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="text-xs bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-md dark:bg-indigo-500/20 dark:text-indigo-400 font-bold">01</span>
                    Menu Registration & Structure
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Register CRM navbar routes, Lucide icons, and sorting order.</p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Menu List */}
                  <div className="flex-1">
                    {menusLoading ? (
                      <div className="skeleton h-[280px] rounded-2xl" />
                    ) : (
                      <div className="glass-card p-0 overflow-hidden">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-white/1">
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Name & Icon</th>
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Path</th>
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-center">Order</th>
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                            {menus.map((m) => (
                              <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                  <Settings size={14} className="text-slate-400" />
                                  <span>{m.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400">({m.iconName})</span>
                                </td>
                                <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{m.path}</td>
                                <td className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">{m.order}</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleDeleteMenu(m.id)}
                                    className="p-2 rounded-lg border border-slate-200/60 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:border-white/5 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-white/5 transition-all cursor-pointer"
                                    title="Delete Menu"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Create Form */}
                  <div className="w-full lg:w-[380px]">
                    <div className="glass-card p-6">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-4 flex items-center gap-2">
                        <Plus size={18} className="text-indigo-500" />
                        Create Custom Menu
                      </h3>
                      <form onSubmit={handleCreateMenuSubmit} className="flex flex-col gap-4" autoComplete="off">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Menu Name</label>
                          <input
                            type="text"
                            value={newMenu.name}
                            onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                            placeholder="e.g. Sales Pipeline"
                            className="glass-input w-full px-4 py-2.5 text-sm"
                            autoComplete="off"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Route Path</label>
                          <input
                            type="text"
                            value={newMenu.path}
                            onChange={(e) => setNewMenu({ ...newMenu, path: e.target.value })}
                            placeholder="e.g. /deals"
                            className="glass-input w-full px-4 py-2.5 text-sm font-mono"
                            autoComplete="off"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <SearchSelect
                              label="Icon Name"
                              placeholder="Select Icon..."
                              options={[
                                { value: 'LayoutDashboard', label: 'Dashboard' },
                                { value: 'Users', label: 'Users' },
                                { value: 'CircleDollarSign', label: 'Dollar Sign' },
                                { value: 'Settings', label: 'Settings/Gear' },
                                { value: 'HelpCircle', label: 'Help Circle' },
                                { value: 'Shield', label: 'Shield' },
                                { value: 'Briefcase', label: 'Briefcase' },
                                { value: 'BookOpen', label: 'Book Open' },
                                { value: 'MapPin', label: 'Map Pin' },
                              ]}
                              value={newMenu.iconName}
                              onChange={(v) => setNewMenu({ ...newMenu, iconName: v })}
                              accentColor="indigo"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sort Order</label>
                            <input
                              type="number"
                              value={newMenu.order}
                              onChange={(e) => setNewMenu({ ...newMenu, order: e.target.value })}
                              placeholder="e.g. 5"
                              className="glass-input w-full px-4 py-2 text-sm"
                              autoComplete="off"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assign Access Roles</label>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-1">
                            {rolesList.map((r) => {
                              const isAssigned = newMenu.roles.includes(r);
                              return (
                                <label key={r} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none">
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={() => {
                                      let nextRoles = [...newMenu.roles];
                                      if (nextRoles.includes(r)) {
                                        nextRoles = nextRoles.filter((x) => x !== r);
                                      } else {
                                        nextRoles.push(r);
                                      }
                                      setNewMenu({ ...newMenu, roles: nextRoles });
                                    }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 dark:border-white/10 dark:bg-dark-deep"
                                  />
                                  <span>{r.slice(0, 5)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all cursor-pointer mt-2"
                        >
                          Save Menu Item
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Permissions Matrix & Transfer */}
              <div>
                <div className="border-b border-slate-200/60 dark:border-white/5 pb-3 mb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 font-bold">
                    <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-md dark:bg-purple-500/20 dark:text-purple-400">02</span>
                    Access Rights & Permission Matrix
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Attach/detach page routing access instantly or perform batch permission scheme transfers.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Permission Matrix Grid */}
                  <div className="flex-1">
                    {menusLoading ? (
                      <div className="skeleton h-[280px] rounded-2xl" />
                    ) : (
                      <div className="glass-card p-0 overflow-hidden">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-white/1">
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Menu Name</th>
                              <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Permitted Access Roles (Attach/Detach)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                            {menus.map((m) => (
                              <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{m.name}</td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    {rolesList.map((role) => {
                                      const isAttached = m.roles.includes(role);
                                      return (
                                        <label key={role} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none">
                                          <input
                                            type="checkbox"
                                            checked={isAttached}
                                            onChange={() => handleMenuRoleToggle(m, role)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 dark:border-white/10 dark:bg-dark-deep"
                                          />
                                          <span className={isAttached ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}>
                                            {role}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Transfer Tools */}
                  <div className="w-full lg:w-[380px]">
                    <div className="glass-card p-6">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-4 flex items-center gap-2">
                        <RefreshCw size={16} className="text-purple-500" />
                        Transfer Menu Permissions
                      </h3>
                      <form onSubmit={handleTransferSubmit} className="flex flex-col gap-4" autoComplete="off">
                        <div>
                          <SearchSelect
                            label="From Source Role"
                            placeholder="Select Source Role..."
                            options={rolesList.map((r) => ({ value: r, label: r }))}
                            value={transfer.fromRole}
                            onChange={(v) => setTransfer({ ...transfer, fromRole: v })}
                            accentColor="purple"
                          />
                        </div>
                        <div>
                          <SearchSelect
                            label="To Target Role"
                            placeholder="Select Target Role..."
                            options={rolesList.map((r) => ({ value: r, label: r }))}
                            value={transfer.toRole}
                            onChange={(v) => setTransfer({ ...transfer, toRole: v })}
                            accentColor="purple"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Transfer Action</label>
                          <div className="flex gap-4 mt-1.5">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                              <input
                                type="radio"
                                name="transferAction"
                                checked={transfer.action === 'copy'}
                                onChange={() => setTransfer({ ...transfer, action: 'copy' })}
                                className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 dark:bg-dark-deep"
                              />
                              Copy (Add access)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                              <input
                                type="radio"
                                name="transferAction"
                                checked={transfer.action === 'move'}
                                onChange={() => setTransfer({ ...transfer, action: 'move' })}
                                className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 dark:bg-dark-deep"
                              />
                              Move (Migrate completely)
                            </label>
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 hover:brightness-110 transition-all cursor-pointer mt-2"
                        >
                          Execute Transfer
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'permissions' ? (
            <div className="glass-card p-6 border-slate-200/60 dark:border-white/5 w-full animate-fade-in">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">
                Dynamic Permission Matrix (SUPERADMIN Control Panel)
              </h2>
              {permissionsLoading ? (
                <div className="text-center py-10 text-xs text-slate-400 font-semibold">
                  Loading permission grid...
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-white/5 text-slate-400 uppercase tracking-wider font-bold">
                        <th className="p-4 pl-0">Menu / Route Path</th>
                        {rolesList.map((r) => (
                          <th key={r} className="p-4 text-center">{r}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {menus.map((menu) => (
                        <tr key={menu.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                          <td className="p-4 pl-0">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700 dark:text-slate-200">{menu.name}</span>
                              <span className="text-[10px] text-slate-400">{menu.path}</span>
                            </div>
                          </td>
                          {rolesList.map((role) => {
                            const perm = permissions.find(p => p.menuId === menu.id && p.role === role);
                            if (!perm) {
                              return (
                                <td key={role} className="p-4 text-center text-slate-500 italic">
                                  No rules
                                </td>
                              );
                            }
                            return (
                              <td key={role} className="p-4 text-center">
                                <div className="inline-flex flex-col gap-1 items-start bg-slate-50 dark:bg-white/1 p-2.5 rounded-xl border border-slate-200/40 dark:border-white/5 shadow-inner">
                                  {permissionActions.map((action) => {
                                    const isChecked = perm.actions ? perm.actions.includes(action.name) : false;
                                    return (
                                      <label key={action.name} className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          disabled={role === 'SUPERADMIN'}
                                          onChange={() => handleTogglePerm(perm.id, action.name, !isChecked)}
                                          className="rounded border-slate-300 dark:border-white/10 dark:bg-dark-deep text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                        />
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-bold">
                                          {action.label}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'activity' ? (
            /* User Activity Logs Tab (Superadmin exclusive audit logs dashboard) */
            <div className="glass-card p-6 border-slate-200/60 dark:border-white/5 w-full animate-fade-in">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200/60 dark:border-white/5 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    System Audit & User Activity Logs
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Real-time log of every menu visit, record creation, modification, and deletion across all components.</p>
                </div>
                <button
                  onClick={fetchActivityLogs}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Refresh Logs
                </button>
              </div>

              {activityLoading ? (
                <div className="text-center py-10 text-xs text-slate-400 font-semibold">
                  Loading activity timeline...
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 font-semibold italic">
                  No activity logs registered yet.
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                  {activityLogs.map((log) => {
                    const badgeClass = ((action) => {
                      switch (action) {
                        case 'CREATE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
                        case 'UPDATE': return 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
                        case 'DELETE': return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
                        case 'VISIT':
                        default: return 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10';
                      }
                    })(log.action);

                    const hasDiff = log.oldValues || log.newValues;

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/20 dark:bg-white/1 flex flex-col gap-2 transition-all duration-200 hover:border-slate-300 dark:hover:border-white/10"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${badgeClass}`}>
                              {log.action}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                              {log.resource}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {log.details}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                            <span>
                              {new Date(log.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 border-t border-slate-100 dark:border-white/3 pt-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[8px]">
                              {log.userName ? log.userName[0].toUpperCase() : 'U'}
                            </div>
                            <span>
                              Logged by: <strong className="text-slate-600 dark:text-slate-300">{log.userName || 'Anonymous'}</strong> ({log.userEmail || 'unknown'})
                            </span>
                          </div>

                          {hasDiff && (
                            <button
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              {expandedLog === log.id ? 'Collapse Details' : 'Inspect Database Payload'}
                            </button>
                          )}
                        </div>

                        {/* Inspector Dropdown block */}
                        {expandedLog === log.id && hasDiff && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-slate-950 rounded-xl text-left border border-white/5 font-mono text-[10px] text-slate-300">
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 block mb-2 border-b border-rose-500/10 pb-1">Previous Values (Before)</span>
                              {log.oldValues ? (
                                <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[250px]">{JSON.stringify(log.oldValues, null, 2)}</pre>
                              ) : (
                                <span className="text-slate-500 italic">None</span>
                              )}
                            </div>
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block mb-2 border-b border-emerald-500/10 pb-1">Updated Values (After)</span>
                              {log.newValues ? (
                                <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[250px]">{JSON.stringify(log.newValues, null, 2)}</pre>
                              ) : (
                                <span className="text-slate-500 italic">None</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Activity logs pagination controls */}
                {activityTotalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      Showing page <span className="font-semibold text-slate-700 dark:text-slate-300">{activityPage}</span> of{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{activityTotalPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={activityPage === 1}
                        onClick={() => setActivityPage(activityPage - 1)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-white/5 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Previous
                      </button>
                      {Array.from({ length: activityTotalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setActivityPage(p)}
                          className={`px-3 py-1.5 border rounded-lg font-semibold transition-all cursor-pointer ${
                            activityPage === p
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        disabled={activityPage === activityTotalPages}
                        onClick={() => setActivityPage(activityPage + 1)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-white/5 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : activeTab === 'tasks' ? (
          <div className="flex flex-col gap-6 animate-fade-in w-full">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="text-xs bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-md dark:bg-indigo-500/20 dark:text-indigo-400 font-bold">
                    ADMIN OPS
                  </span>
                  Task Management & Operations
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Superadmin central task oversight for school visits, specimen distribution, and field reports across West Bengal.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/tasks')}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>Open Workspace (/tasks)</span>
                </button>
                <button
                  onClick={() => setShowAdminTaskModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Create Task</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard
                title="Total Tasks"
                value={adminTaskSummary?.totalTasks ?? adminTasks.length}
                icon={<CheckSquare size={18} />}
                accentColor="indigo"
                subtitle="All tasks"
              />
              <KpiCard
                title="To Do"
                value={adminTaskSummary?.todoCount ?? 0}
                icon={<Clock size={18} />}
                accentColor="blue"
                subtitle="Pending kickoff"
                onClick={() => setTaskStatusFilter(taskStatusFilter === 'TODO' ? 'ALL' : 'TODO')}
                isActive={taskStatusFilter === 'TODO'}
              />
              <KpiCard
                title="In Progress"
                value={adminTaskSummary?.inProgressCount ?? 0}
                icon={<RefreshCw size={18} />}
                accentColor="amber"
                subtitle="Active in field"
                onClick={() => setTaskStatusFilter(taskStatusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
                isActive={taskStatusFilter === 'IN_PROGRESS'}
              />
              <KpiCard
                title="Under Review"
                value={adminTaskSummary?.underReviewCount ?? 0}
                icon={<FileCheck size={18} />}
                accentColor="purple"
                subtitle="Submitted reports"
                onClick={() => setTaskStatusFilter(taskStatusFilter === 'UNDER_REVIEW' ? 'ALL' : 'UNDER_REVIEW')}
                isActive={taskStatusFilter === 'UNDER_REVIEW'}
              />
              <KpiCard
                title="Completed"
                value={adminTaskSummary?.completedCount ?? 0}
                icon={<CheckCircle2 size={18} />}
                accentColor="emerald"
                subtitle="Finished"
                onClick={() => setTaskStatusFilter(taskStatusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
                isActive={taskStatusFilter === 'COMPLETED'}
              />
              <KpiCard
                title="Overdue"
                value={adminTaskSummary?.overdueCount ?? 0}
                icon={<AlertCircle size={18} />}
                accentColor="rose"
                subtitle="Past deadline"
              />
            </div>

            {/* Filter & Search Toolbar */}
            <div className="glass-card p-4 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchAdminTasks();
                  }}
                  placeholder="Search tasks by title or notes..."
                  className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {taskSearch && (
                  <button
                    onClick={() => {
                      setTaskSearch('');
                      setTimeout(fetchAdminTasks, 0);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Filter size={14} className="text-slate-400 shrink-0" />
              </div>

              {/* Status Filter */}
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value)}
                className="bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              {/* Assignee Filter */}
              <select
                value={taskAssigneeFilter}
                onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[180px]"
              >
                <option value="ALL">All Assignees</option>
                {allUsersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.email}
                  </option>
                ))}
              </select>

              {/* District Filter */}
              <select
                value={taskDistrictFilter}
                onChange={(e) => setTaskDistrictFilter(e.target.value)}
                className="bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[160px]"
              >
                <option value="ALL">All Districts</option>
                {adminDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchAdminTasks}
                title="Reload Tasks"
                className="p-2 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <RefreshCw size={15} className={adminTasksLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Tasks List Table */}
            <div className="glass-card p-0 overflow-hidden">
              {adminTasksLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
                  <span className="text-xs text-slate-400 font-semibold">Loading system tasks...</span>
                </div>
              ) : adminTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <CheckSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No tasks found</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      No tasks match your active filters. Try resetting the filters or create a new task.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAdminTaskModal(true)}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Create First Task
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-white/1">
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">Task & Category</th>
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">Assigned To</th>
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">School / Location</th>
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">Priority & Due</th>
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">Status</th>
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                      {adminTasks.map((task) => {
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
                        const hasReport = task.comments?.some((c) => c.content?.includes('[SCHOOL SUBMISSION REPORT]'));

                        return (
                          <tr
                            key={task.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-white/1 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex flex-col gap-1 max-w-sm">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="font-bold text-slate-800 dark:text-slate-100 text-xs hover:text-indigo-600 cursor-pointer"
                                    onClick={() => setSelectedTaskDetail(task)}
                                  >
                                    {task.title}
                                  </span>
                                  {hasReport && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                      <FileCheck size={11} /> Report
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                    {TASK_CATEGORY_LABELS[task.category] || task.category || 'General'}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="p-4">
                              {task.assignedTo ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                    {task.assignedTo.name ? task.assignedTo.name[0] : (task.assignedTo.email ? task.assignedTo.email[0] : 'U')}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                      {task.assignedTo.name || task.assignedTo.email}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {task.assignedTo.role}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Unassigned</span>
                              )}
                            </td>

                            <td className="p-4">
                              {task.school ? (
                                <div className="flex flex-col gap-0.5 max-w-[220px]">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 truncate">
                                    <SchoolIcon size={13} className="text-indigo-500 shrink-0" />
                                    <span className="truncate">{task.school.name}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                                    <MapPin size={11} className="text-rose-500 shrink-0" />
                                    <span className="truncate">
                                      {task.school.zone?.name || 'Zone'}
                                      {task.school.zone?.district ? `, ${task.school.zone.district.name}` : ''}
                                    </span>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">General / Unlinked</span>
                              )}
                            </td>

                            <td className="p-4">
                              <div className="flex flex-col gap-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-max ${TASK_PRIORITY_BADGES[task.priority] || TASK_PRIORITY_BADGES.MEDIUM}`}>
                                  {task.priority || 'MEDIUM'}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  <Calendar size={12} className="text-slate-400" />
                                  <span>{task.dueDate ? formatDate(task.dueDate) : 'No deadline'}</span>
                                  {isOverdue && (
                                    <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1 rounded uppercase">
                                      Overdue
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <select
                                value={task.status}
                                onChange={(e) => handleAdminTaskStatusChange(task.id, e.target.value)}
                                className="bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="UNDER_REVIEW">Under Review</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                            </td>

                            <td className="p-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => setSelectedTaskDetail(task)}
                                  title="View Task Details & Submission Report"
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  onClick={() => handleAdminDeleteTask(task.id, task.title)}
                                  title="Delete Task"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* System Settings Tab (Superadmin exclusive config board) */
          <div className="w-full flex flex-col gap-6 animate-fade-in">
            <div className="glass-card p-6 border-slate-200/60 dark:border-white/5 w-full">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200/60 dark:border-white/5 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    System Settings (SUPERADMIN Control Panel)
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Configure integrations for S3-compatible cloud storage and Stripe payment gateway.
                  </p>
                </div>
                {settingsLoading && (
                  <div className="flex items-center gap-2 text-indigo-500 font-semibold text-xs animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                    Loading Settings...
                  </div>
                )}
              </div>

              {settingsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
                  <span className="text-xs text-slate-400 font-semibold">Retrieving secure configurations...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* S3 Storage settings */}
                  <div className="bg-slate-50/50 dark:bg-white/1 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b border-slate-200/60 dark:border-white/5 pb-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                        <Server size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">S3 Cloud Storage</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">Bucket and credential details for media assets</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Access Key ID</label>
                        <input
                          type="text"
                          value={settings.s3_credentials?.accessKeyId || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            s3_credentials: { ...settings.s3_credentials, accessKeyId: e.target.value }
                          })}
                          disabled={savingSettings}
                          placeholder="e.g. AKIAIOSFODNN7EXAMPLE"
                          className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Secret Access Key</label>
                        <div className="relative">
                          <input
                            type={showSecrets.secretAccessKey ? 'text' : 'password'}
                            value={settings.s3_credentials?.secretAccessKey || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              s3_credentials: { ...settings.s3_credentials, secretAccessKey: e.target.value }
                            })}
                            disabled={savingSettings}
                            placeholder="••••••••••••••••••••••••••••••••••••••••"
                            className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecrets({ ...showSecrets, secretAccessKey: !showSecrets.secretAccessKey })}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showSecrets.secretAccessKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Region</label>
                          <input
                            type="text"
                            value={settings.s3_credentials?.region || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              s3_credentials: { ...settings.s3_credentials, region: e.target.value }
                            })}
                            disabled={savingSettings}
                            placeholder="e.g. us-east-1"
                            className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bucket Name</label>
                          <input
                            type="text"
                            value={settings.s3_credentials?.bucket || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              s3_credentials: { ...settings.s3_credentials, bucket: e.target.value }
                            })}
                            disabled={savingSettings}
                            placeholder="e.g. my-company-uploads"
                            className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custom Endpoint (Optional)</label>
                        <input
                          type="text"
                          value={settings.s3_credentials?.endpoint || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            s3_credentials: { ...settings.s3_credentials, endpoint: e.target.value }
                          })}
                          disabled={savingSettings}
                          placeholder="e.g. https://s3.us-east-1.wasabisys.com"
                          className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={savingSettings}
                        onClick={() => handleUpdateSettings('s3_credentials', settings.s3_credentials)}
                        className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10"
                      >
                        {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        Save S3 Storage Settings
                      </button>
                    </div>
                  </div>

                  {/* Payment Gateways settings */}
                  <div className="bg-slate-50/50 dark:bg-white/1 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b border-slate-200/60 dark:border-white/5 pb-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">Stripe Payment Gateway</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">Stripe credentials for customer checkout payments</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stripe Publishable Key</label>
                        <input
                          type="text"
                          value={settings.payment_credentials?.stripePublishableKey || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            payment_credentials: { ...settings.payment_credentials, stripePublishableKey: e.target.value }
                          })}
                          disabled={savingSettings}
                          placeholder="e.g. pk_test_..."
                          className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stripe Secret Key</label>
                        <div className="relative">
                          <input
                            type={showSecrets.stripeSecretKey ? 'text' : 'password'}
                            value={settings.payment_credentials?.stripeSecretKey || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              payment_credentials: { ...settings.payment_credentials, stripeSecretKey: e.target.value }
                            })}
                            disabled={savingSettings}
                            placeholder="••••••••••••••••••••••••••••••••••••••••"
                            className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecrets({ ...showSecrets, stripeSecretKey: !showSecrets.stripeSecretKey })}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showSecrets.stripeSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stripe Webhook Secret</label>
                        <div className="relative">
                          <input
                            type={showSecrets.stripeWebhookSecret ? 'text' : 'password'}
                            value={settings.payment_credentials?.stripeWebhookSecret || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              payment_credentials: { ...settings.payment_credentials, stripeWebhookSecret: e.target.value }
                            })}
                            disabled={savingSettings}
                            placeholder="••••••••••••••••••••••••••••••••••••••••"
                            className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecrets({ ...showSecrets, stripeWebhookSecret: !showSecrets.stripeWebhookSecret })}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showSecrets.stripeWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={savingSettings}
                        onClick={() => handleUpdateSettings('payment_credentials', settings.payment_credentials)}
                        className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10"
                      >
                        {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Stripe Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Task Modal in Superadmin */}
        {showAdminTaskModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="glass-card w-full max-w-xl p-6 relative shadow-2xl max-h-[90vh] flex flex-col my-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/5 mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <CheckSquare size={18} />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                      Create System Task
                    </h3>
                    <p className="text-xs text-slate-400">
                      Assign school visits or field operations to team members
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminTaskModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdminCreateTask} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Task Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Conduct Specimen Showcase at Hindu School"
                    value={adminTaskFormData.title}
                    onChange={(e) => setAdminTaskFormData({ ...adminTaskFormData, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Description / Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide visit instructions, contact expectations, or specimen objectives..."
                    value={adminTaskFormData.description}
                    onChange={(e) => setAdminTaskFormData({ ...adminTaskFormData, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium resize-none"
                  />
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={adminTaskFormData.category}
                      onChange={(e) => setAdminTaskFormData({ ...adminTaskFormData, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="SCHOOL_VISIT">School Visit</option>
                      <option value="SPECIMEN_DISTRIBUTION">Specimen Distribution</option>
                      <option value="TEACHER_FOLLOWUP">Teacher Follow-up</option>
                      <option value="DEAL_CLOSING">Deal Closing</option>
                      <option value="MARKETING_CAMPAIGN">Marketing Campaign</option>
                      <option value="GENERAL">General Task</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Priority
                    </label>
                    <select
                      value={adminTaskFormData.priority}
                      onChange={(e) => setAdminTaskFormData({ ...adminTaskFormData, priority: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Assignee & Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Assignee <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={adminTaskFormData.assignedToId}
                      onChange={(e) => setAdminTaskFormData({ ...adminTaskFormData, assignedToId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">Select Team Member</option>
                      {allUsersList.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.email} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Due Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={adminTaskFormData.dueDate}
                      onChange={(e) => setAdminTaskFormData({ ...adminTaskFormData, dueDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* West Bengal Location & School Cascade */}
                <div className="p-4 bg-slate-50/70 dark:bg-white/2 border border-slate-200/60 dark:border-white/5 rounded-2xl flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={13} className="text-rose-500" />
                    Link West Bengal School (Optional)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Filter by District
                      </label>
                      <select
                        value={adminModalDistrictId}
                        onChange={(e) => {
                          setAdminModalDistrictId(e.target.value);
                          setAdminModalZoneId('');
                          setAdminTaskFormData({ ...adminTaskFormData, schoolId: '' });
                        }}
                        className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="">All Districts</option>
                        {adminDistricts.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Filter by Zone
                      </label>
                      <select
                        value={adminModalZoneId}
                        onChange={(e) => {
                          setAdminModalZoneId(e.target.value);
                          setAdminTaskFormData({ ...adminTaskFormData, schoolId: '' });
                        }}
                        disabled={!adminModalDistrictId && adminZones.length > 20}
                        className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">All Zones</option>
                        {adminZones
                          .filter((z) => !adminModalDistrictId || z.districtId === adminModalDistrictId)
                          .map((z) => (
                            <option key={z.id} value={z.id}>{z.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Select Target School
                    </label>
                    <select
                      value={adminTaskFormData.schoolId}
                      onChange={(e) => setAdminTaskFormData({ ...adminTaskFormData, schoolId: e.target.value })}
                      className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="">No specific school (General Task)</option>
                      {adminSchools
                        .filter((s) => {
                          if (adminModalZoneId) return s.zoneId === adminModalZoneId;
                          if (adminModalDistrictId) return s.zone?.districtId === adminModalDistrictId || s.zone?.district?.id === adminModalDistrictId;
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

                {/* Buttons */}
                <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAdminTaskModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminTaskSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {adminTaskSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Create Task</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Details & Submission Modal */}
        {selectedTaskDetail && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="glass-card w-full max-w-lg p-6 relative shadow-2xl space-y-4 overflow-y-auto max-h-[90vh] my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <CheckSquare size={18} />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                      {selectedTaskDetail.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TASK_PRIORITY_BADGES[selectedTaskDetail.priority] || TASK_PRIORITY_BADGES.MEDIUM}`}>
                        {selectedTaskDetail.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {TASK_CATEGORY_LABELS[selectedTaskDetail.category] || selectedTaskDetail.category}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTaskDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status & Due Date */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-200/60 dark:border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Current Status</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                    {selectedTaskDetail.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Due Date</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    {selectedTaskDetail.dueDate ? formatDate(selectedTaskDetail.dueDate) : 'None'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedTaskDetail.description && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                    Instructions / Notes
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-dark-deep p-3 rounded-xl border border-slate-200/60 dark:border-white/5 whitespace-pre-line leading-relaxed">
                    {selectedTaskDetail.description}
                  </p>
                </div>
              )}

              {/* Assignee Card */}
              {selectedTaskDetail.assignedTo && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {selectedTaskDetail.assignedTo.name ? selectedTaskDetail.assignedTo.name[0] : 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {selectedTaskDetail.assignedTo.name || 'Team Member'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {selectedTaskDetail.assignedTo.email}
                      </div>
                    </div>
                  </div>
                  <span className={getRoleBadgeClass(selectedTaskDetail.assignedTo.role)}>
                    {selectedTaskDetail.assignedTo.role}
                  </span>
                </div>
              )}

              {/* School Information */}
              {selectedTaskDetail.school && (
                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200/60 dark:border-indigo-500/20 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-indigo-900 dark:text-indigo-300">
                    <Building size={14} />
                    <span>{selectedTaskDetail.school.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin size={12} className="text-rose-500 shrink-0" />
                    <span>
                      {selectedTaskDetail.school.zone?.name || 'Zone'}
                      {selectedTaskDetail.school.zone?.district ? `, ${selectedTaskDetail.school.zone.district.name}` : ''}
                      {' · West Bengal'}
                    </span>
                  </div>
                  {selectedTaskDetail.school.contactPerson && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <User size={12} className="text-indigo-500 shrink-0" />
                      <span>Contact: {selectedTaskDetail.school.contactPerson}</span>
                    </div>
                  )}
                  {selectedTaskDetail.school.phone && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone size={12} className="text-emerald-500 shrink-0" />
                      <span>Phone: {selectedTaskDetail.school.phone}</span>
                    </div>
                  )}
                  {selectedTaskDetail.school.address && (
                    <p className="text-[10px] text-slate-400 italic">
                      {selectedTaskDetail.school.address}
                    </p>
                  )}
                </div>
              )}

              {/* School Submission Report */}
              {selectedTaskDetail.comments?.some((c) => c.content?.includes('[SCHOOL SUBMISSION REPORT]')) && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck size={14} />
                    Field Submission Report Recorded
                  </span>
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 whitespace-pre-line text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed max-h-56 overflow-y-auto">
                    {selectedTaskDetail.comments.find((c) => c.content?.includes('[SCHOOL SUBMISSION REPORT]'))?.content}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-white/5">
                <button
                  onClick={() => {
                    setSelectedTaskDetail(null);
                    navigate('/tasks');
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open in Task Board</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setSelectedTaskDetail(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Admin;
