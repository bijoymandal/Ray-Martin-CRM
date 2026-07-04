import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getDealsAPI, createDealAPI, updateDealAPI, deleteDealAPI, getContactsAPI } from '../services/api';
import { Plus, Edit2, Trash2, X, AlertCircle, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Deals = () => {
  const { user } = useAuth();
  const canWrite = user && ['SUPERADMIN', 'ADMIN', 'SALESMAN'].includes(user.role);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDealId, setCurrentDealId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: 'QUALIFICATION',
    contactId: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDealId, setDeleteDealId] = useState(null);

  const fetchData = async () => {
    try {
      setError('');
      const [dealsRes, contactsRes] = await Promise.all([
        getDealsAPI(),
        getContactsAPI(),
      ]);

      if (dealsRes.success && contactsRes.success) {
        setDeals(dealsRes.data);
        setContacts(contactsRes.data);
      } else {
        setError('Failed to fetch pipeline information.');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to Server API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    if (contacts.length === 0) {
      setError('Please create at least one Contact before adding a Deal.');
      return;
    }
    setFormData({
      title: '',
      value: '',
      stage: 'QUALIFICATION',
      contactId: contacts[0]?.id || '',
    });
    setIsEditing(false);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (deal) => {
    setFormData({
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      contactId: deal.contactId,
    });
    setCurrentDealId(deal.id);
    setIsEditing(true);
    setShowAddEditModal(true);
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.value === '' || !formData.contactId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      let res;
      if (isEditing) {
        res = await updateDealAPI(currentDealId, formData);
      } else {
        res = await createDealAPI(formData);
      }

      if (res.success) {
        setShowAddEditModal(false);
        fetchData();
      } else {
        setError(res.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving deal info');
    }
  };

  const handleOpenDelete = (id) => {
    setDeleteDealId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteDeal = async () => {
    try {
      const res = await deleteDealAPI(deleteDealId);
      if (res.success) {
        setShowDeleteModal(false);
        fetchData();
      } else {
        setError(res.message || 'Failed to remove deal');
      }
    } catch (err) {
      setError('Error deleting deal');
    }
  };

  const getDealBadgeClass = (stage) => {
    switch (stage) {
      case 'CLOSED_WON':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'CLOSED_LOST':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      case 'NEGOTIATION':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'PROPOSAL':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      case 'QUALIFICATION':
      default:
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    }
  };

  const formatStage = (stage) => {
    return stage ? stage.replace('_', ' ') : '';
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-main text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <Navbar />

        <div className="flex-1 p-8 max-w-[1600px] w-full mx-auto animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-2">Deals Pipeline</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Track contract values, pipelines, and closing workflows.</p>
            </div>
            {canWrite && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-bold text-sm px-5 py-2.5 shadow-lg shadow-indigo-500/20 hover:brightness-110 hover:shadow-indigo-500/30 transition-all duration-200 cursor-pointer"
              >
                <Plus size={18} />
                <span>Add Deal</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200/60 rounded-xl p-4 mb-6 text-sm text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Pipeline Summary Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="glass-card p-6 flex flex-col gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider dark:text-slate-500">Active Pipeline Value</span>
              <h2 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(
                  deals
                    .filter((d) => d.stage !== 'CLOSED_WON' && d.stage !== 'CLOSED_LOST')
                    .reduce((sum, d) => sum + d.value, 0)
                )}
              </h2>
            </div>
            <div className="glass-card p-6 flex flex-col gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider dark:text-slate-500">Won Revenue</span>
              <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(
                  deals.filter((d) => d.stage === 'CLOSED_WON').reduce((sum, d) => sum + d.value, 0)
                )}
              </h2>
            </div>
          </div>

          {/* Deals Table */}
          {loading ? (
            <div className="skeleton h-[350px] rounded-2xl" />
          ) : (
            <div className="glass-card p-0 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-white/5">
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Deal Name</th>
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Linked Contact</th>
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Company</th>
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Value</th>
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Stage</th>
                      {canWrite && <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                    {deals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{deal.title}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">
                          {deal.contact
                            ? `${deal.contact.firstName} ${deal.contact.lastName}`
                            : '—'}
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{deal.contact?.company || '—'}</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(deal.value)}
                        </td>
                        <td className="p-4">
                          <span className={getDealBadgeClass(deal.stage)}>
                            {formatStage(deal.stage)}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="p-4">
                            <div className="flex justify-end gap-2.5">
                              <button
                                onClick={() => handleOpenEdit(deal)}
                                className="p-2 rounded-lg border border-slate-200/60 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:border-white/5 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-white/5 transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(deal.id)}
                                className="p-2 rounded-lg border border-slate-200/60 text-slate-500 hover:text-rose-600 hover:bg-slate-50 dark:border-white/5 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-white/5 transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {deals.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-slate-400 py-12 italic dark:text-slate-500">
                          No deals found in your pipeline.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add / Edit Deal Modal */}
          {showAddEditModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
              <div className="modal-content glass-card w-full max-w-[500px] p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {isEditing ? 'Edit Deal' : 'Create New Deal'}
                  </h3>
                  <button
                    onClick={() => setShowAddEditModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSaveDeal} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deal Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Enterprise License Contract"
                      className="glass-input"
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deal Value (USD) *</label>
                      <div className="relative flex items-center">
                        <DollarSign size={16} className="absolute left-3.5 text-slate-400 dark:text-slate-500" />
                        <input
                          type="number"
                          name="value"
                          value={formData.value}
                          onChange={handleInputChange}
                          placeholder="e.g. 50000"
                          className="glass-input pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stage</label>
                      <select
                        name="stage"
                        value={formData.stage}
                        onChange={handleInputChange}
                        className="glass-input py-2.5 cursor-pointer"
                      >
                        <option value="QUALIFICATION">Qualification</option>
                        <option value="PROPOSAL">Proposal</option>
                        <option value="NEGOTIATION">Negotiation</option>
                        <option value="CLOSED_WON">Closed Won</option>
                        <option value="CLOSED_LOST">Closed Lost</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Linked Contact *</label>
                    <select
                      name="contactId"
                      value={formData.contactId}
                      onChange={handleInputChange}
                      className="glass-input py-2.5 cursor-pointer"
                      required
                    >
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} ({c.company || 'No Company'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddEditModal(false)}
                      className="btn-secondary px-5 py-2.5 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary px-5 py-2.5 text-sm font-bold">
                      {isEditing ? 'Save Changes' : 'Create Deal'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
              <div className="modal-content glass-card w-full max-w-[400px] p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Delete Deal</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 mb-6">
                  Are you sure you want to remove this deal? This pipeline information will be permanently deleted. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="btn-secondary px-5 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDeal}
                    className="btn-danger px-5 py-2.5 text-sm font-bold"
                  >
                    Delete Permanently
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

export default Deals;
