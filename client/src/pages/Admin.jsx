import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  getUsersAPI,
  updateUserRoleAPI,
  getAllMenusAPI,
  createMenuAPI,
  updateMenuAPI,
  deleteMenuAPI,
  transferMenuPermissionsAPI,
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
} from 'lucide-react';

const Admin = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'menus'

  // User states
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Menu states
  const [menus, setMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(false);

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

  const rolesList = ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'SALESMAN'];

  const fetchUsers = async () => {
    try {
      setError('');
      const res = await getUsersAPI();
      if (res.success) {
        setUsers(res.data);
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

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchMenus();
    }
  }, [activeTab]);

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
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
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
          {activeTab === 'users' ? (
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
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="glass-input py-1.5 pr-8 text-xs cursor-pointer min-w-[140px] bg-none"
                                >
                                  <option value="SUPERADMIN">Superadmin</option>
                                  <option value="ADMIN">Admin</option>
                                  <option value="EDITOR">Editor</option>
                                  <option value="ACCOUNT">Account</option>
                                  <option value="SALESMAN">Salesman</option>
                                </select>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
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
                      <form onSubmit={handleCreateMenuSubmit} className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Menu Name</label>
                          <input
                            type="text"
                            value={newMenu.name}
                            onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                            placeholder="e.g. Sales Pipeline"
                            className="glass-input w-full px-4 py-2.5 text-sm"
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
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Icon Name</label>
                            <select
                              value={newMenu.iconName}
                              onChange={(e) => setNewMenu({ ...newMenu, iconName: e.target.value })}
                              className="glass-input w-full px-3 py-2.5 text-xs bg-none"
                            >
                              <option value="LayoutDashboard">Dashboard</option>
                              <option value="Users">Users</option>
                              <option value="CircleDollarSign">Dollar Sign</option>
                              <option value="Settings">Settings/Gear</option>
                              <option value="HelpCircle">Help Circle</option>
                              <option value="Shield">Shield</option>
                              <option value="Briefcase">Briefcase</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sort Order</label>
                            <input
                              type="number"
                              value={newMenu.order}
                              onChange={(e) => setNewMenu({ ...newMenu, order: e.target.value })}
                              placeholder="e.g. 5"
                              className="glass-input w-full px-4 py-2 text-sm"
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
                      <form onSubmit={handleTransferSubmit} className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">From Source Role</label>
                          <select
                            value={transfer.fromRole}
                            onChange={(e) => setTransfer({ ...transfer, fromRole: e.target.value })}
                            className="glass-input w-full px-3 py-2 text-xs bg-none font-semibold"
                          >
                            {rolesList.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">To Target Role</label>
                          <select
                            value={transfer.toRole}
                            onChange={(e) => setTransfer({ ...transfer, toRole: e.target.value })}
                            className="glass-input w-full px-3 py-2 text-xs bg-none font-semibold"
                          >
                            {rolesList.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
