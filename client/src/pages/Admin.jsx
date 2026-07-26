import React, { useState, useEffect } from 'react';
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
} from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  Link,
  ChevronRight,
  RefreshCw,
  Server,
  CreditCard,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';

const Admin = () => {
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
    }
  }, [activeTab, usersPage, activityPage]);

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
          </div>
      </div>
    </div>
  );
};

export default Admin;
