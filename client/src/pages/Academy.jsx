import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import {
  getBoardsAPI, createBoardAPI, updateBoardAPI, deleteBoardAPI,
  getClassesAPI, createClassAPI, updateClassAPI, deleteClassAPI,
  getSubjectsAPI, createSubjectAPI, updateSubjectAPI, deleteSubjectAPI,
  getCategoriesAPI, createCategoryAPI, updateCategoryAPI, deleteCategoryAPI
} from '../services/api';
import {
  BookOpen, Plus, Edit2, Trash2, AlertCircle, CheckCircle,
  Tag, Award, GraduationCap, X, Check, Upload, Image, HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Academy = () => {
  const { user, permissions } = useAuth();
  const academyPermission = permissions.find(p => p.menu.path === '/academy');
  const canCreate = user?.role === 'SUPERADMIN' || (academyPermission?.actions?.includes('canCreate') ?? false);
  const canEdit = user?.role === 'SUPERADMIN' || (academyPermission?.actions?.includes('canEdit') ?? false);
  const canDelete = user?.role === 'SUPERADMIN' || (academyPermission?.actions?.includes('canDelete') ?? false);
  const [activeTab, setActiveTab] = useState('boards'); // 'boards', 'classes', 'subjects', 'categories'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown reference states
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Creation Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState(''); // Board only
  const [status, setStatus] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Dependent dropdown selections for creation form
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState(null); // holds the item object being edited
  const [editForm, setEditForm] = useState({
    name: '',
    shortName: '',
    status: true,
    boardId: '',
    classId: '',
    subjectId: '',
  });
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null
  });

  // Fetch dropdown lists
  const loadDropdownData = async () => {
    try {
      const boardsRes = await getBoardsAPI();
      if (boardsRes.success) setBoards(boardsRes.data);

      const classesRes = await getClassesAPI();
      if (classesRes.success) setClasses(classesRes.data);

      const subjectsRes = await getSubjectsAPI();
      if (subjectsRes.success) setSubjects(subjectsRes.data);
    } catch (err) {
      console.error('Error fetching taxonomy dropdown data:', err);
    }
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case 'classes': return 'Class';
      case 'subjects': return 'Subject';
      case 'categories': return 'Category';
      case 'boards':
      default: return 'Board';
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (activeTab === 'boards') res = await getBoardsAPI();
      else if (activeTab === 'classes') res = await getClassesAPI();
      else if (activeTab === 'subjects') res = await getSubjectsAPI();
      else res = await getCategoriesAPI();

      if (res.success) {
        setItems(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to load ${getTabLabel()} list.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    loadDropdownData();
    resetForm();
  }, [activeTab]);

  const resetForm = () => {
    setName('');
    setShortName('');
    setStatus(true);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    if (editLogoPreview) {
      URL.revokeObjectURL(editLogoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
    setSelectedBoardId('');
    setSelectedClassId('');
    setSelectedSubjectId('');
    setEditingItem(null);
    setEditLogoFile(null);
    setEditLogoPreview(null);
  };

  const validateFile = (file) => {
    if (!file) return false;

    // Size limit is 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return false;
    }

    // Supported formats
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, GIF, and WEBP image files are allowed.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    if (validateFile(file)) {
      setError('');
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      e.target.value = ''; // Reset file input
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (editLogoPreview) {
      URL.revokeObjectURL(editLogoPreview);
    }

    if (validateFile(file)) {
      setError('');
      setEditLogoFile(file);
      setEditLogoPreview(URL.createObjectURL(file));
    } else {
      e.target.value = ''; // Reset file input
      setEditLogoFile(null);
      setEditLogoPreview(null);
    }
  };

  // Multer handles files, so we build FormData objects
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!name.trim()) throw new Error('Name is required');
      if (logoFile && !validateFile(logoFile)) return;

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('status', String(status));

      if (activeTab === 'boards') {
        if (!shortName.trim()) throw new Error('Short Name is required');
        formData.append('shortName', shortName.trim());
      } else if (activeTab === 'classes') {
        if (!selectedBoardId) throw new Error('Board selection is required');
        formData.append('boardId', selectedBoardId);
        if (logoFile) formData.append('logo', logoFile);
      } else if (activeTab === 'subjects') {
        if (!selectedClassId) throw new Error('Class selection is required');
        formData.append('classId', selectedClassId);
        if (logoFile) formData.append('logo', logoFile);
      } else {
        if (!selectedSubjectId) throw new Error('Subject selection is required');
        formData.append('subjectId', selectedSubjectId);
        if (logoFile) formData.append('logo', logoFile);
      }

      let res;
      if (activeTab === 'boards') res = await createBoardAPI(formData);
      else if (activeTab === 'classes') res = await createClassAPI(formData);
      else if (activeTab === 'subjects') res = await createSubjectAPI(formData);
      else res = await createCategoryAPI(formData);

      if (res.success) {
        setSuccess(`${getTabLabel()} created successfully.`);
        resetForm();
        fetchItems();
        loadDropdownData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error creating item');
    }
  };

  // Toggle status immediately from list
  const handleToggleStatus = (item) => {
    const nextStatus = !item.status;
    const targetStatusText = nextStatus ? 'Active' : 'Inactive';

    setConfirmModal({
      isOpen: true,
      title: 'Change Status?',
      message: `Are you sure you want to change the status of the ${getTabLabel().toLowerCase()} '${item.name}' to ${targetStatusText}?`,
      confirmText: 'Change Status',
      onConfirm: async () => {
        try {
          const formData = new FormData();
          formData.append('status', String(nextStatus));

          let res;
          if (activeTab === 'boards') res = await updateBoardAPI(item.id, formData);
          else if (activeTab === 'classes') res = await updateClassAPI(item.id, formData);
          else if (activeTab === 'subjects') res = await updateSubjectAPI(item.id, formData);
          else res = await updateCategoryAPI(item.id, formData);

          if (res.success) {
            setSuccess(`Status of '${item.name}' is now ${targetStatusText}.`);
            fetchItems();
            setTimeout(() => setSuccess(''), 3000);
          }
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Error updating status');
        }
      },
    });
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      shortName: item.shortName || '',
      status: item.status,
      boardId: item.boardId || '',
      classId: item.classId || '',
      subjectId: item.subjectId || '',
    });
    setEditLogoFile(null);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!editForm.name.trim()) throw new Error('Name is required');
      if (editLogoFile && !validateFile(editLogoFile)) return;

      const formData = new FormData();
      formData.append('name', editForm.name.trim());
      formData.append('status', String(editForm.status));

      if (activeTab === 'boards') {
        if (!editForm.shortName.trim()) throw new Error('Short Name is required');
        formData.append('shortName', editForm.shortName.trim());
      } else if (activeTab === 'classes') {
        if (!editForm.boardId) throw new Error('Board selection is required');
        formData.append('boardId', editForm.boardId);
        if (editLogoFile) formData.append('logo', editLogoFile);
      } else if (activeTab === 'subjects') {
        if (!editForm.classId) throw new Error('Class selection is required');
        formData.append('classId', editForm.classId);
        if (editLogoFile) formData.append('logo', editLogoFile);
      } else {
        if (!editForm.subjectId) throw new Error('Subject selection is required');
        formData.append('subjectId', editForm.subjectId);
        if (editLogoFile) formData.append('logo', editLogoFile);
      }

      let res;
      if (activeTab === 'boards') res = await updateBoardAPI(editingItem.id, formData);
      else if (activeTab === 'classes') res = await updateClassAPI(editingItem.id, formData);
      else if (activeTab === 'subjects') res = await updateSubjectAPI(editingItem.id, formData);
      else res = await updateCategoryAPI(editingItem.id, formData);

      if (res.success) {
        setSuccess(`${getTabLabel()} updated successfully.`);
        resetForm();
        fetchItems();
        loadDropdownData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating item');
    }
  };

  const handleDeleteClick = (id, nameVal) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete ${getTabLabel()}?`,
      message: `Are you sure you want to delete the ${getTabLabel().toLowerCase()} '${nameVal}'? This action cannot be undone.`,
      confirmText: 'Delete Item',
      onConfirm: async () => {
        try {
          setError('');
          setSuccess('');
          let res;
          if (activeTab === 'boards') res = await deleteBoardAPI(id);
          else if (activeTab === 'classes') res = await deleteClassAPI(id);
          else if (activeTab === 'subjects') res = await deleteSubjectAPI(id);
          else res = await deleteCategoryAPI(id);

          if (res.success) {
            setSuccess(`${getTabLabel()} deleted successfully`);
            fetchItems();
            loadDropdownData();
            setTimeout(() => setSuccess(''), 3000);
          }
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Error deleting item');
        }
      },
    });
  };

  const renderLogo = (logoPath) => {
    if (!logoPath) {
      return (
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 dark:bg-white/5 dark:text-slate-500">
          <Image size={18} />
        </div>
      );
    }
    return (
      <img
        src={logoPath}
        alt="Logo"
        className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://placehold.co/40x40/png?text=Logo';
        }}
      />
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-main text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto md:pl-[260px] pt-[70px]">
        <Navbar />

        <div className="flex-1 p-8 max-w-[1600px] w-full mx-auto animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-2 font-bold">Academy Manager</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage hierarchical structures: Board → Class → Subject → Category with active statuses and media logs.</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 border-b border-slate-200 dark:border-white/5 mb-8">
            {[
              { id: 'boards', label: 'Boards', icon: <Award size={16} /> },
              { id: 'classes', label: 'Classes', icon: <GraduationCap size={16} /> },
              { id: 'subjects', label: 'Subjects', icon: <BookOpen size={16} /> },
              { id: 'categories', label: 'Categories', icon: <Tag size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
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

          {/* Main Layout grid */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Left: Table List */}
            <div className="flex-1 w-full">
              {loading ? (
                <div className="skeleton h-[350px] w-full rounded-2xl" />
              ) : (
                <div className="glass-card p-0 overflow-hidden">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-white/1">
                        {activeTab !== 'boards' && (
                          <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 w-16">Logo</th>
                        )}
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Name</th>
                        {activeTab === 'boards' && (
                          <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Short Name</th>
                        )}
                        {activeTab !== 'boards' && (
                          <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Hierarchy Path</th>
                        )}
                        <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 w-24 text-center">Status</th>
                        {(canEdit || canDelete) && (
                          <th className="p-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-right w-24">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                          {activeTab !== 'boards' && (
                            <td className="p-4">
                              {renderLogo(item.logo)}
                            </td>
                          )}
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </td>
                          {activeTab === 'boards' && (
                            <td className="p-4 font-mono text-xs text-slate-500">
                              {item.shortName}
                            </td>
                          )}
                          {activeTab !== 'boards' && (
                            <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                              {activeTab === 'classes' && (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                                  {item.board?.name || 'Unknown Board'}
                                </span>
                              )}
                              {activeTab === 'subjects' && (
                                <span className="flex flex-wrap items-center gap-1">
                                  <span>{item.class?.board?.name}</span>
                                  <ChevronRight size={10} className="text-slate-400" />
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{item.class?.name}</span>
                                </span>
                              )}
                              {activeTab === 'categories' && (
                                <span className="flex flex-wrap items-center gap-1">
                                  <span>{item.subject?.class?.board?.name}</span>
                                  <ChevronRight size={10} className="text-slate-400" />
                                  <span>{item.subject?.class?.name}</span>
                                  <ChevronRight size={10} className="text-slate-400" />
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{item.subject?.name}</span>
                                </span>
                              )}
                            </td>
                          )}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => canEdit && handleToggleStatus(item)}
                              disabled={!canEdit}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm select-none border ${
                                !canEdit
                                  ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-white/5'
                                  : item.status
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20 cursor-pointer'
                              }`}
                              title={canEdit ? `Click to change status to ${item.status ? 'Inactive' : 'Active'}` : 'Insufficient permissions to change status'}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                              <span>{item.status ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>
                          {(canEdit || canDelete) && (
                            <td className="p-4 text-right">
                              <div className="inline-flex gap-2">
                                {canEdit && (
                                  <button
                                    onClick={() => handleEditClick(item)}
                                    className="p-2 rounded-lg border border-slate-200/60 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:border-white/5 dark:text-slate-500 dark:hover:text-indigo-400 dark:hover:bg-white/5 transition-all cursor-pointer"
                                    title="Edit Item"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteClick(item.id, item.name)}
                                    className="p-2 rounded-lg border border-slate-200/60 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:border-white/5 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-white/5 transition-all cursor-pointer"
                                    title="Delete Item"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                            No {getTabLabel().toLowerCase()}s found. Add one on the right.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right: Creation Card OR Edit Modal replacement */}
            <div className="w-full lg:w-[380px] shrink-0">
              {editingItem ? (
                // EDIT CARD
                <div className="glass-card p-6 border-indigo-200 dark:border-indigo-500/25">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <Edit2 size={16} className="text-indigo-500" />
                      Edit {getTabLabel()}
                    </h3>
                    <button onClick={resetForm} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-400">
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4">
                    {/* Dependent Dropdowns in Edit mode */}
                    {activeTab === 'classes' && (
                      <div>
                        <SearchSelect
                          label="Board"
                          required
                          placeholder="Choose a board..."
                          searchPlaceholder="Search boards..."
                          options={boards.map(b => ({ value: b.id, label: b.name }))}
                          value={editForm.boardId}
                          onChange={(v) => setEditForm({ ...editForm, boardId: v })}
                          accentColor="indigo"
                        />
                      </div>
                    )}
                    {activeTab === 'subjects' && (
                      <div>
                        <SearchSelect
                          label="Class"
                          required
                          placeholder="Choose a class..."
                          searchPlaceholder="Search classes..."
                          options={classes.map(c => ({ value: c.id, label: `${c.board?.name} → ${c.name}` }))}
                          value={editForm.classId}
                          onChange={(v) => setEditForm({ ...editForm, classId: v })}
                          accentColor="purple"
                        />
                      </div>
                    )}
                    {activeTab === 'categories' && (
                      <div>
                        <SearchSelect
                          label="Subject"
                          required
                          placeholder="Choose a subject..."
                          searchPlaceholder="Search subjects..."
                          options={subjects.map(s => ({ value: s.id, label: `${s.class?.board?.shortName} → ${s.class?.name} → ${s.name}` }))}
                          value={editForm.subjectId}
                          onChange={(v) => setEditForm({ ...editForm, subjectId: v })}
                          accentColor="cyan"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Name"
                        className="glass-input w-full px-4 py-2.5 text-sm"
                        required
                      />
                    </div>

                    {activeTab === 'boards' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Short Name</label>
                        <input
                          type="text"
                          value={editForm.shortName}
                          onChange={(e) => setEditForm({ ...editForm, shortName: e.target.value })}
                          placeholder="e.g. CBSE"
                          className="glass-input w-full px-4 py-2.5 text-sm"
                          required
                        />
                      </div>
                    )}

                    {activeTab !== 'boards' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Update Logo (JPEG, PNG, GIF)</label>
                        <div className="flex flex-col gap-3">
                          {editLogoPreview ? (
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                              <img src={editLogoPreview} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setEditLogoFile(null);
                                  setEditLogoPreview(null);
                                }}
                                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black text-white transition-all cursor-pointer"
                                title="Remove Logo"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : editingItem?.logo ? (
                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                              <img src={editingItem.logo} alt="Current Logo" className="w-full h-full object-cover" />
                            </div>
                          ) : null}

                          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-semibold text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all cursor-pointer text-center">
                            <Upload size={14} />
                            <span>{editLogoFile ? editLogoFile.name : 'Upload new image'}</span>
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/gif"
                              onChange={handleEditFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="editStatus"
                        checked={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 dark:border-white/10 dark:bg-dark-deep cursor-pointer"
                      />
                      <label htmlFor="editStatus" className="text-xs font-semibold cursor-pointer select-none">
                        Active Status
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all cursor-pointer mt-2"
                    >
                      Update Item
                    </button>
                  </form>
                </div>
              ) : canCreate ? (
                // CREATE CARD
                <div className="glass-card p-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-4 flex items-center gap-2 font-bold">
                    <Plus size={18} className="text-indigo-500" />
                    Add New {getTabLabel()}
                  </h3>
                  <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                    {/* Dependent dropdown selection triggers */}
                    {activeTab === 'classes' && (
                      <div>
                        <SearchSelect
                          label="Board"
                          required
                          placeholder="Choose a board..."
                          searchPlaceholder="Search boards..."
                          options={boards.map(b => ({ value: b.id, label: b.name }))}
                          value={selectedBoardId}
                          onChange={(v) => setSelectedBoardId(v)}
                          accentColor="indigo"
                        />
                      </div>
                    )}

                    {activeTab === 'subjects' && (
                      <>
                        <div>
                          <SearchSelect
                            label="Board"
                            required
                            placeholder="Choose a board..."
                            searchPlaceholder="Search boards..."
                            options={boards.map(b => ({ value: b.id, label: b.name }))}
                            value={selectedBoardId}
                            onChange={(v) => {
                              setSelectedBoardId(v);
                              setSelectedClassId('');
                            }}
                            accentColor="indigo"
                          />
                        </div>
                        <div>
                          <SearchSelect
                            label="Class"
                            required
                            placeholder={selectedBoardId ? 'Choose a class...' : 'Select a board first'}
                            searchPlaceholder="Search classes..."
                            options={classes.filter(c => c.boardId === selectedBoardId).map(c => ({ value: c.id, label: c.name }))}
                            value={selectedClassId}
                            onChange={(v) => setSelectedClassId(v)}
                            disabled={!selectedBoardId}
                            accentColor="purple"
                          />
                        </div>
                      </>
                    )}

                    {activeTab === 'categories' && (
                      <>
                        <div>
                          <SearchSelect
                            label="Board"
                            required
                            placeholder="Choose a board..."
                            searchPlaceholder="Search boards..."
                            options={boards.map(b => ({ value: b.id, label: b.name }))}
                            value={selectedBoardId}
                            onChange={(v) => {
                              setSelectedBoardId(v);
                              setSelectedClassId('');
                              setSelectedSubjectId('');
                            }}
                            accentColor="indigo"
                          />
                        </div>
                        <div>
                          <SearchSelect
                            label="Class"
                            required
                            placeholder={selectedBoardId ? 'Choose a class...' : 'Select a board first'}
                            searchPlaceholder="Search classes..."
                            options={classes.filter(c => c.boardId === selectedBoardId).map(c => ({ value: c.id, label: c.name }))}
                            value={selectedClassId}
                            onChange={(v) => {
                              setSelectedClassId(v);
                              setSelectedSubjectId('');
                            }}
                            disabled={!selectedBoardId}
                            accentColor="purple"
                          />
                        </div>
                        <div>
                          <SearchSelect
                            label="Subject"
                            required
                            placeholder={selectedClassId ? 'Choose a subject...' : 'Select a class first'}
                            searchPlaceholder="Search subjects..."
                            options={subjects.filter(s => s.classId === selectedClassId).map(s => ({ value: s.id, label: s.name }))}
                            value={selectedSubjectId}
                            onChange={(v) => setSelectedSubjectId(v)}
                            disabled={!selectedClassId}
                            accentColor="cyan"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        {getTabLabel()} Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. CBSE 10th Science"
                        className="glass-input w-full px-4 py-2.5 text-sm"
                        required
                      />
                    </div>

                    {activeTab === 'boards' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Short Name
                        </label>
                        <input
                          type="text"
                          value={shortName}
                          onChange={(e) => setShortName(e.target.value)}
                          placeholder="e.g. CBSE"
                          className="glass-input w-full px-4 py-2.5 text-sm"
                          required
                        />
                      </div>
                    )}

                    {activeTab !== 'boards' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Upload Logo (JPEG, PNG, GIF)</label>
                        <div className="flex flex-col gap-3">
                          {logoPreview && (
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                              <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoFile(null);
                                  setLogoPreview(null);
                                }}
                                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black text-white transition-all cursor-pointer"
                                title="Remove Logo"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          )}

                          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-semibold text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all cursor-pointer text-center">
                            <Upload size={14} />
                            <span>{logoFile ? logoFile.name : 'Select file'}</span>
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/gif"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="status"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 dark:border-white/10 dark:bg-dark-deep cursor-pointer"
                      />
                      <label htmlFor="status" className="text-xs font-semibold cursor-pointer select-none">
                        Active Status
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all cursor-pointer mt-2"
                    >
                      Save {getTabLabel()}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center py-12 border-slate-200/60 dark:border-white/5 shadow-inner">
                  <AlertCircle size={32} className="text-slate-400 dark:text-slate-600 mb-3 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Access Restricted</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 max-w-[240px] leading-relaxed">
                    You do not have permission to register new {getTabLabel().toLowerCase()} taxonomy items.
                  </p>
                </div>
              )}
            </div>

          </div>

          {confirmModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
              <div className="glass-card max-w-md w-full p-6 border border-slate-200/60 dark:border-white/5 shadow-2xl animate-scale-up">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2 font-bold">
                  <HelpCircle className="text-indigo-500 shrink-0" size={20} />
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {confirmModal.message}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal({ ...confirmModal, isOpen: false });
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all cursor-pointer"
                  >
                    {confirmModal.confirmText}
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

export default Academy;
