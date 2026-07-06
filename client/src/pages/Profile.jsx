import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfileAPI, deleteAccountAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import {
  User,
  Lock,
  Mail,
  AlertTriangle,
  Shield,
  Calendar,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Double-confirmation delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await updateProfileAPI(payload);
      if (res.success) {
        setSuccess('Profile updated successfully!');
        // Update user state inside AuthContext
        setUser(res.user);
        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          password: '',
          confirmPassword: '',
        }));
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await deleteAccountAPI();
      if (res.success) {
        alert('Your account has been deleted successfully.');
        logout(); // Automatically logs user out and redirects to login
      }
    } catch (err) {
      console.error(err);
      setDeleteError(err.response?.data?.message || 'Error deleting account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-main text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto md:pl-[260px] pt-[70px]">
        <Navbar />

        <div className="flex-1 p-8 max-w-[1200px] w-full mx-auto animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-2">My Profile</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your credentials, change passwords, and handle account privacy settings.</p>
          </div>

          {/* Feedback banners */}
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

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left side: Overview card */}
            <div className="w-full lg:w-[350px]">
              <div className="glass-card p-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl shadow-indigo-500/20 mb-4 border-4 border-white dark:border-slate-800">
                  {getInitials(user?.name)}
                </div>
                
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{user?.name}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mb-4">{user?.email}</p>

                <div className="flex items-center gap-2 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[10px] px-3.5 py-1.5 rounded-full mb-6">
                  <Shield size={12} />
                  <span>{user?.role} Role</span>
                </div>

                <div className="w-full border-t border-slate-100 dark:border-white/5 pt-4 flex flex-col gap-3 text-left">
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Member Since: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{memberSince}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Editor Form */}
            <div className="flex-1 w-full flex flex-col gap-8">
              {/* Profile Details Edit Card */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <User size={16} className="text-indigo-500" />
                  Account Credentials
                </h3>

                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5" autoComplete="off">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="glass-input w-full pl-10 pr-3 py-2.5 text-xs"
                          placeholder="Your full name"
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="glass-input w-full pl-10 pr-3 py-2.5 text-xs"
                          placeholder="name@company.com"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/5 my-2" />

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Lock size={14} className="text-purple-500" />
                      Update Password (Leave blank to keep current)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">New Password</label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="glass-input w-full pl-10 pr-3 py-2.5 text-xs"
                            placeholder="Min 6 characters"
                            autoComplete="new-password"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">Confirm New Password</label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="glass-input w-full pl-10 pr-3 py-2.5 text-xs"
                            placeholder="Repeat password"
                            autoComplete="new-password"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/25 hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Saving...' : 'Save Profile Details'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="glass-card p-6 border-rose-200/20 dark:border-rose-500/10">
                <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-500 animate-pulse" />
                  Danger Zone
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Delete Account</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Permanently remove your profile and all permissions from the system. This action is irreversible.</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center justify-center gap-2 border border-rose-500 text-rose-500 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => {
              if (!deleteLoading) setShowDeleteModal(false);
            }}
          />
          
          {/* Modal Container */}
          <div className="glass-card p-6 max-w-[480px] w-full relative z-10 animate-scale-up border border-rose-200/20 dark:border-rose-500/10">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-rose-500" />
              Delete Account Permanently?
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              This action will completely erase your profile from the CRM. If you are the last Superadmin, the system will block this deletion to prevent locking out the admin center.
            </p>

            {deleteError && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200/60 rounded-xl p-3 mb-4 text-xs text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                <AlertCircle size={15} className="shrink-0" />
                <span className="font-semibold">{deleteError}</span>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Type <strong className="text-rose-500 font-bold">DELETE</strong> to confirm
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="glass-input w-full px-3 py-2 text-xs uppercase text-center border-rose-500/30 text-rose-600 focus:border-rose-500"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeleteError('');
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
