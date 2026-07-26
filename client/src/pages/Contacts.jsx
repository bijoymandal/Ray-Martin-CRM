import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import { getContactsAPI, createContactAPI, updateContactAPI, deleteContactAPI } from '../services/api';
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Contacts = () => {
  const { user, permissions } = useAuth();
  const contactsPermission = permissions.find(p => p.menu.path === '/contacts');
  const canCreate = user?.role === 'SUPERADMIN' || (contactsPermission?.actions?.includes('canCreate') ?? false);
  const canEdit = user?.role === 'SUPERADMIN' || (contactsPermission?.actions?.includes('canEdit') ?? false);
  const canDelete = user?.role === 'SUPERADMIN' || (contactsPermission?.actions?.includes('canDelete') ?? false);

  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContactId, setCurrentContactId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: 'LEAD',
    notes: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const fetchContacts = async (page = 1) => {
    try {
      setError('');
      const res = await getContactsAPI(page, limit);
      if (res.success) {
        setContacts(res.data);
        setFilteredContacts(res.data);
        setCurrentPage(res.currentPage || page);
        setTotalPages(res.totalPages || 1);
      } else {
        setError('Failed to load contacts');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(currentPage);
  }, [currentPage]);

  // Handle Search and Filter
  useEffect(() => {
    let result = contacts;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.company && c.company.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((c) => c.status === statusFilter);
    }

    setFilteredContacts(result);
  }, [searchQuery, statusFilter, contacts]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      status: 'LEAD',
      notes: '',
    });
    setIsEditing(false);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (contact) => {
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      status: contact.status,
      notes: contact.notes || '',
    });
    setCurrentContactId(contact.id);
    setIsEditing(true);
    setShowAddEditModal(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in required fields');
      return;
    }

    try {
      let res;
      if (isEditing) {
        res = await updateContactAPI(currentContactId, formData);
      } else {
        res = await createContactAPI(formData);
      }

      if (res.success) {
        setShowAddEditModal(false);
        fetchContacts();
      } else {
        setError(res.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving contact');
    }
  };

  const handleOpenDelete = (id) => {
    setDeleteContactId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteContact = async () => {
    try {
      const res = await deleteContactAPI(deleteContactId);
      if (res.success) {
        setShowDeleteModal(false);
        fetchContacts();
      } else {
        setError(res.message || 'Failed to delete contact');
      }
    } catch (err) {
      setError('Error deleting contact');
    }
  };

  const getContactBadgeClass = (status) => {
    switch (status) {
      case 'CUSTOMER':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'PROSPECT':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'INACTIVE':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/5';
      case 'LEAD':
      default:
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-main text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto md:pl-[260px] pt-[70px]">
        <Navbar />

        <div className="flex-1 p-8 max-w-[1600px] w-full mx-auto animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-2">Contacts</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your clients, leads, and customer accounts.</p>
            </div>
            {canCreate && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-bold text-sm px-5 py-2.5 shadow-lg shadow-indigo-500/20 hover:brightness-110 hover:shadow-indigo-500/30 transition-all duration-200 cursor-pointer"
              >
                <Plus size={18} />
                <span>Add Contact</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200/60 rounded-xl p-4 mb-6 text-sm text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Filters Bar */}
          <div className="glass-card p-4 flex flex-wrap gap-4 justify-between items-center mb-6">
            <div className="relative flex items-center flex-1 min-w-[260px]">
              <Search size={18} className="absolute left-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-11"
                autoComplete="off"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 font-medium dark:text-slate-400">Status:</span>
              <SearchSelect
                placeholder="All Statuses"
                searchPlaceholder="Filter status..."
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'LEAD', label: 'Leads' },
                  { value: 'PROSPECT', label: 'Prospects' },
                  { value: 'CUSTOMER', label: 'Customers' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                accentColor="indigo"
              />
            </div>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="skeleton h-[350px] rounded-2xl" />
          ) : (
            <div className="glass-card p-0 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-white/5">
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Name</th>
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Email</th>
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Phone</th>
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Company</th>
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Status</th>
                      <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Deals</th>
                      {(canEdit || canDelete) && (
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                          {contact.firstName} {contact.lastName}
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{contact.email}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{contact.phone || '—'}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{contact.company || '—'}</td>
                        <td className="p-4">
                          <span className={getContactBadgeClass(contact.status)}>
                            {contact.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{contact._count?.deals || 0}</td>
                        {(canEdit || canDelete) && (
                          <td className="p-4">
                            <div className="flex justify-end gap-2.5">
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenEdit(contact)}
                                  className="p-2 rounded-lg border border-slate-200/60 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:border-white/5 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-white/5 transition-all cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleOpenDelete(contact.id)}
                                  className="p-2 rounded-lg border border-slate-200/60 text-slate-500 hover:text-rose-600 hover:bg-slate-50 dark:border-white/5 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-white/5 transition-all cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredContacts.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center text-slate-400 py-12 italic dark:text-slate-500">
                          No contacts match your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    Showing page <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPage}</span> of{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-white/5 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 border rounded-lg font-semibold transition-all cursor-pointer ${
                          currentPage === p
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-white/5 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add / Edit Modal */}
          {showAddEditModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
              <div className="modal-content glass-card w-full max-w-[500px] p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {isEditing ? 'Edit Contact' : 'Create New Contact'}
                  </h3>
                  <button
                    onClick={() => setShowAddEditModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSaveContact} className="flex flex-col gap-4" autoComplete="off">
                  <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="glass-input"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="glass-input"
                        autoComplete="off"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="glass-input"
                      autoComplete="off"
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="glass-input"
                        autoComplete="off"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Company</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="glass-input"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                    <SearchSelect
                      label="Status"
                      placeholder="Select status..."
                      options={[
                        { value: 'LEAD', label: 'Lead' },
                        { value: 'PROSPECT', label: 'Prospect' },
                        { value: 'CUSTOMER', label: 'Customer' },
                        { value: 'INACTIVE', label: 'Inactive' },
                      ]}
                      value={formData.status}
                      onChange={(v) => setFormData({ ...formData, status: v })}
                      accentColor="indigo"
                    />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="glass-input min-h-[80px] max-h-[150px]"
                    />
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
                      {isEditing ? 'Save Changes' : 'Create Contact'}
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
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Delete Contact</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 mb-6">
                  Are you sure you want to remove this contact? All associated deals will also be permanently deleted. This action cannot be undone.
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
                    onClick={handleDeleteContact}
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

export default Contacts;
