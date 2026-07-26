import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import { useAuth } from '../context/AuthContext';
import {
  getMasterDataSummaryAPI,
  getStatesAPI, createStateAPI, updateStateAPI, deleteStateAPI,
  getDistrictsAPI, createDistrictAPI, updateDistrictAPI, deleteDistrictAPI,
  getZonesAPI, createZoneAPI, updateZoneAPI, deleteZoneAPI,
  getSchoolBoardsAPI, createSchoolBoardAPI, updateSchoolBoardAPI, deleteSchoolBoardAPI,
  getSchoolsAPI, createSchoolAPI, updateSchoolAPI, deleteSchoolAPI,
  getTeachersAPI, createTeacherAPI, updateTeacherAPI, deleteTeacherAPI,
} from '../services/api';
import {
  MapPin,
  Building,
  Navigation,
  BookOpen,
  School as SchoolIcon,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Phone,
  Mail,
  Shield,
  Layers,
  Award,
  Filter,
} from 'lucide-react';

const MasterData = () => {
  const { user, permissions } = useAuth();
  const menuPerm = permissions.find((p) => p.menu.path === '/master-data');

  const canCreate = user?.role === 'SUPERADMIN' || (menuPerm?.actions?.includes('canCreate') ?? false);
  const canEdit = user?.role === 'SUPERADMIN' || (menuPerm?.actions?.includes('canEdit') ?? false);
  const canDelete = user?.role === 'SUPERADMIN' || (menuPerm?.actions?.includes('canDelete') ?? false);

  // Active Tab: 'states' | 'districts' | 'zones' | 'boards' | 'schools' | 'teachers'
  const [activeTab, setActiveTab] = useState('states');

  // Summary counts
  const [summary, setSummary] = useState({
    statesCount: 0,
    districtsCount: 0,
    zonesCount: 0,
    boardsCount: 0,
    schoolsCount: 0,
    teachersCount: 0,
  });

  // Data lists
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [zones, setZones] = useState([]);
  const [boards, setBoards] = useState([]);
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Selected filters for cascading view
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const res = await getMasterDataSummaryAPI();
      if (res.success) setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch tab data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'states') {
        const res = await getStatesAPI();
        if (res.success) setStates(res.data || []);
      } else if (activeTab === 'districts') {
        const res = await getDistrictsAPI(selectedStateId);
        if (res.success) setDistricts(res.data || []);
      } else if (activeTab === 'zones') {
        const res = await getZonesAPI(selectedDistrictId);
        if (res.success) setZones(res.data || []);
      } else if (activeTab === 'boards') {
        const res = await getSchoolBoardsAPI();
        if (res.success) setBoards(res.data || []);
      } else if (activeTab === 'schools') {
        const res = await getSchoolsAPI({
          zoneId: selectedZoneId || undefined,
          boardId: selectedBoardId || undefined,
          type: schoolTypeFilter || undefined,
          search: search || undefined,
        });
        if (res.success) setSchools(res.data || []);
      } else if (activeTab === 'teachers') {
        const res = await getTeachersAPI({
          schoolId: selectedSchoolId || undefined,
          search: search || undefined,
        });
        if (res.success) setTeachers(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Pre-load all lists for dropdown references in forms
  const loadReferenceData = async () => {
    try {
      const [stRes, disRes, zoRes, boRes, schRes] = await Promise.all([
        getStatesAPI(),
        getDistrictsAPI(),
        getZonesAPI(),
        getSchoolBoardsAPI(),
        getSchoolsAPI(),
      ]);
      if (stRes.success) setStates(stRes.data);
      if (disRes.success) setDistricts(disRes.data);
      if (zoRes.success) setZones(zoRes.data);
      if (boRes.success) setBoards(boRes.data);
      if (schRes.success) setSchools(schRes.data);
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
    loadReferenceData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedStateId, selectedDistrictId, selectedZoneId, selectedBoardId, selectedSchoolId, schoolTypeFilter]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditItem(null);
    setFormData({});
    setModalMode('create');
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditItem(item);
    setFormData({ ...item });
    setModalMode('edit');
  };

  // Save Modal (Create / Edit)
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let res;
      if (activeTab === 'states') {
        res = editItem ? await updateStateAPI(editItem.id, formData) : await createStateAPI(formData);
      } else if (activeTab === 'districts') {
        res = editItem ? await updateDistrictAPI(editItem.id, formData) : await createDistrictAPI(formData);
      } else if (activeTab === 'zones') {
        res = editItem ? await updateZoneAPI(editItem.id, formData) : await createZoneAPI(formData);
      } else if (activeTab === 'boards') {
        res = editItem ? await updateSchoolBoardAPI(editItem.id, formData) : await createSchoolBoardAPI(formData);
      } else if (activeTab === 'schools') {
        res = editItem ? await updateSchoolAPI(editItem.id, formData) : await createSchoolAPI(formData);
      } else if (activeTab === 'teachers') {
        res = editItem ? await updateTeacherAPI(editItem.id, formData) : await createTeacherAPI(formData);
      }

      if (res.success) {
        setSuccess(`${activeTab.slice(0, -1)} saved successfully!`);
        setModalMode(null);
        fetchData();
        fetchSummary();
        loadReferenceData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      let res;
      if (activeTab === 'states') res = await deleteStateAPI(id);
      else if (activeTab === 'districts') res = await deleteDistrictAPI(id);
      else if (activeTab === 'zones') res = await deleteZoneAPI(id);
      else if (activeTab === 'boards') res = await deleteSchoolBoardAPI(id);
      else if (activeTab === 'schools') res = await deleteSchoolAPI(id);
      else if (activeTab === 'teachers') res = await deleteTeacherAPI(id);

      if (res.success) {
        setSuccess('Deleted successfully');
        fetchData();
        fetchSummary();
        loadReferenceData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete item');
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
                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                  <MapPin size={20} />
                </div>
                Master Data Center
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage complete hierarchy: State → District → Zone → School Board → Public/Private School → Teachers
              </p>
            </div>

            {canCreate && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} /> Add New {activeTab.slice(0, -1).toUpperCase()}
              </button>
            )}
          </div>

          {/* Toast Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
              <span>{error}</span>
              <button onClick={() => setError('')} className="p-1"><X size={14} /></button>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fade-in">
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="p-1"><X size={14} /></button>
            </div>
          )}

          {/* Overview Summary Widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              onClick={() => setActiveTab('states')}
              className={`glass-card p-4 cursor-pointer transition-all ${
                activeTab === 'states' ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5' : ''
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin size={12} className="text-indigo-500" /> States
              </div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{summary.statesCount}</div>
            </div>

            <div
              onClick={() => setActiveTab('districts')}
              className={`glass-card p-4 cursor-pointer transition-all ${
                activeTab === 'districts' ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-500/5' : ''
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building size={12} className="text-purple-500" /> Districts
              </div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{summary.districtsCount}</div>
            </div>

            <div
              onClick={() => setActiveTab('zones')}
              className={`glass-card p-4 cursor-pointer transition-all ${
                activeTab === 'zones' ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-500/5' : ''
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Navigation size={12} className="text-cyan-500" /> Zones
              </div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{summary.zonesCount}</div>
            </div>

            <div
              onClick={() => setActiveTab('boards')}
              className={`glass-card p-4 cursor-pointer transition-all ${
                activeTab === 'boards' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5' : ''
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <BookOpen size={12} className="text-amber-500" /> School Boards
              </div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{summary.boardsCount}</div>
            </div>

            <div
              onClick={() => setActiveTab('schools')}
              className={`glass-card p-4 cursor-pointer transition-all ${
                activeTab === 'schools' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5' : ''
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <SchoolIcon size={12} className="text-emerald-500" /> Schools
              </div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{summary.schoolsCount}</div>
            </div>

            <div
              onClick={() => setActiveTab('teachers')}
              className={`glass-card p-4 cursor-pointer transition-all ${
                activeTab === 'teachers' ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5' : ''
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Users size={12} className="text-rose-500" /> Teachers
              </div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{summary.teachersCount}</div>
            </div>
          </div>

          {/* Hierarchical Breadcrumb Bar */}
          <div className="glass-card p-3 flex items-center gap-2 text-xs font-bold overflow-x-auto text-slate-600 dark:text-slate-300">
            <button onClick={() => setActiveTab('states')} className={`hover:text-indigo-500 ${activeTab === 'states' ? 'text-indigo-600 font-black' : ''}`}>States</button>
            <ChevronRight size={12} className="text-slate-400" />
            <button onClick={() => setActiveTab('districts')} className={`hover:text-purple-500 ${activeTab === 'districts' ? 'text-purple-600 font-black' : ''}`}>Districts</button>
            <ChevronRight size={12} className="text-slate-400" />
            <button onClick={() => setActiveTab('zones')} className={`hover:text-cyan-500 ${activeTab === 'zones' ? 'text-cyan-600 font-black' : ''}`}>Zones</button>
            <ChevronRight size={12} className="text-slate-400" />
            <button onClick={() => setActiveTab('boards')} className={`hover:text-amber-500 ${activeTab === 'boards' ? 'text-amber-600 font-black' : ''}`}>School Boards (CBSE/State)</button>
            <ChevronRight size={12} className="text-slate-400" />
            <button onClick={() => setActiveTab('schools')} className={`hover:text-emerald-500 ${activeTab === 'schools' ? 'text-emerald-600 font-black' : ''}`}>Schools (Public/Private)</button>
            <ChevronRight size={12} className="text-slate-400" />
            <button onClick={() => setActiveTab('teachers')} className={`hover:text-rose-500 ${activeTab === 'teachers' ? 'text-rose-600 font-black' : ''}`}>Teachers & Phones</button>
          </div>

          {/* Main Content Table Section */}
          <div className="glass-card p-6 space-y-4">
            {/* Cascading Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {activeTab === 'districts' && (
                  <SearchSelect
                    placeholder="All States"
                    searchPlaceholder="Search states..."
                    options={[{ value: '', label: 'All States' }, ...states.map(s => ({ value: s.id, label: s.name }))]}
                    value={selectedStateId}
                    onChange={setSelectedStateId}
                    accentColor="indigo"
                  />
                )}

                {activeTab === 'zones' && (
                  <SearchSelect
                    placeholder="All Districts"
                    searchPlaceholder="Search districts..."
                    options={[{ value: '', label: 'All Districts' }, ...districts.map(d => ({ value: d.id, label: `${d.name} (${d.state?.name || ''})` }))]}
                    value={selectedDistrictId}
                    onChange={setSelectedDistrictId}
                    accentColor="purple"
                  />
                )}

                {activeTab === 'schools' && (
                  <>
                    <SearchSelect
                      placeholder="All Zones"
                      searchPlaceholder="Search zones..."
                      options={[{ value: '', label: 'All Zones' }, ...zones.map(z => ({ value: z.id, label: z.name }))]}
                      value={selectedZoneId}
                      onChange={setSelectedZoneId}
                      accentColor="cyan"
                    />

                    <SearchSelect
                      placeholder="All Boards (CBSE/State)"
                      searchPlaceholder="Search boards..."
                      options={[{ value: '', label: 'All Boards (CBSE/State)' }, ...boards.map(b => ({ value: b.id, label: b.name }))]}
                      value={selectedBoardId}
                      onChange={setSelectedBoardId}
                      accentColor="amber"
                    />

                    <SearchSelect
                      placeholder="All Types (Public & Private)"
                      searchPlaceholder="Filter type..."
                      options={[
                        { value: '', label: 'All Types (Public & Private)' },
                        { value: 'PUBLIC', label: 'PUBLIC SCHOOL' },
                        { value: 'PRIVATE', label: 'PRIVATE SCHOOL' },
                      ]}
                      value={schoolTypeFilter}
                      onChange={setSchoolTypeFilter}
                      accentColor="emerald"
                    />
                  </>
                )}

                {activeTab === 'teachers' && (
                  <SearchSelect
                    placeholder="All Schools"
                    searchPlaceholder="Search schools..."
                    options={[{ value: '', label: 'All Schools' }, ...schools.map(s => ({ value: s.id, label: `${s.name} (${s.type})` }))]}
                    value={selectedSchoolId}
                    onChange={setSelectedSchoolId}
                    accentColor="rose"
                  />
                )}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-indigo-500" /> Loading {activeTab}...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/50 dark:bg-white/5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <tr>
                      {activeTab === 'states' && (<><th>State Name</th><th>Code</th><th>Districts</th><th className="text-right">Actions</th></>)}
                      {activeTab === 'districts' && (<><th>District Name</th><th>State</th><th>Zones</th><th className="text-right">Actions</th></>)}
                      {activeTab === 'zones' && (<><th>Zone Name</th><th>District</th><th>State</th><th>Schools</th><th className="text-right">Actions</th></>)}
                      {activeTab === 'boards' && (<><th>Board Name</th><th>Code</th><th>Schools Count</th><th className="text-right">Actions</th></>)}
                      {activeTab === 'schools' && (<><th>School Name</th><th>Type</th><th>Board</th><th>Zone</th><th>Teachers</th><th className="text-right">Actions</th></>)}
                      {activeTab === 'teachers' && (<><th>Teacher Name</th><th>Phone Number</th><th>School</th><th>Subject</th><th className="text-right">Actions</th></>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                    {activeTab === 'states' && states.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><MapPin size={14} className="text-indigo-500" />{item.name}</td>
                        <td><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-extrabold text-[10px]">{item.code || '—'}</span></td>
                        <td>{item.districts?.length || 0} districts</td>
                        <td className="text-right space-x-1">
                          {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-indigo-500"><Edit2 size={13} /></button>}
                          {canDelete && <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-rose-500"><Trash2 size={13} /></button>}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'districts' && districts.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Building size={14} className="text-purple-500" />{item.name}</td>
                        <td><span className="font-semibold text-purple-600">{item.state?.name}</span></td>
                        <td>{item.zones?.length || 0} zones</td>
                        <td className="text-right space-x-1">
                          {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-indigo-500"><Edit2 size={13} /></button>}
                          {canDelete && <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-rose-500"><Trash2 size={13} /></button>}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'zones' && zones.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Navigation size={14} className="text-cyan-500" />{item.name}</td>
                        <td>{item.district?.name}</td>
                        <td>{item.district?.state?.name}</td>
                        <td>{item.schools?.length || 0} schools</td>
                        <td className="text-right space-x-1">
                          {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-indigo-500"><Edit2 size={13} /></button>}
                          {canDelete && <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-rose-500"><Trash2 size={13} /></button>}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'boards' && boards.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><BookOpen size={14} className="text-amber-500" />{item.name}</td>
                        <td><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-extrabold text-[10px]">{item.shortName || item.code || '—'}</span></td>
                        <td>{item.schools?.length || 0} schools ({item.classes?.length || 0} classes)</td>
                        <td className="text-right space-x-1">
                          {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-indigo-500"><Edit2 size={13} /></button>}
                          {canDelete && <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-rose-500"><Trash2 size={13} /></button>}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'schools' && schools.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><SchoolIcon size={14} className="text-emerald-500" />{item.name}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${item.type === 'PUBLIC' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td><span className="font-semibold text-amber-600">{item.board?.name}</span></td>
                        <td>{item.zone?.name} ({item.zone?.district?.name})</td>
                        <td>{item.teachers?.length || 0} teachers</td>
                        <td className="text-right space-x-1">
                          {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-indigo-500"><Edit2 size={13} /></button>}
                          {canDelete && <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-rose-500"><Trash2 size={13} /></button>}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'schools' && schools.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          <SchoolIcon size={32} className="mx-auto opacity-30 mb-2" />
                          <p className="font-bold text-slate-600 dark:text-slate-300">No schools found matching selected filters.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your filters or create a new school.</p>
                          {canCreate && (
                            <button
                              onClick={openCreateModal}
                              className="mt-3 px-3 py-1.5 bg-emerald-500 text-white font-bold rounded-lg text-xs hover:bg-emerald-600 inline-flex items-center gap-1"
                            >
                              <Plus size={14} /> Add New School
                            </button>
                          )}
                        </td>
                      </tr>
                    )}

                    {activeTab === 'teachers' && teachers.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Users size={14} className="text-rose-500" />{item.name}</td>
                        <td className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><Phone size={12} className="text-slate-400" />{item.phone}</td>
                        <td>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{item.school?.name}</div>
                          <div className="text-[10px] text-slate-400">{item.school?.board?.name} · {item.school?.type}</div>
                        </td>
                        <td><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-extrabold text-[10px]">{item.subject || 'General'}</span></td>
                        <td className="text-right space-x-1">
                          {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-indigo-500"><Edit2 size={13} /></button>}
                          {canDelete && <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-rose-500"><Trash2 size={13} /></button>}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'teachers' && teachers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                          <Users size={32} className="mx-auto opacity-30 mb-2" />
                          <p className="font-bold text-slate-600 dark:text-slate-300">No teachers found matching selected filters.</p>
                          {canCreate && (
                            <button
                              onClick={openCreateModal}
                              className="mt-3 px-3 py-1.5 bg-rose-500 text-white font-bold rounded-lg text-xs hover:bg-rose-600 inline-flex items-center gap-1"
                            >
                              <Plus size={14} /> Add New Teacher
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Add' : 'Edit'} {activeTab.slice(0, -1).toUpperCase()}
              </h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              {/* Form Fields according to activeTab */}
              {activeTab === 'states' && (
                <>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">State Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. West Bengal"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">State Code</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. WB"
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none uppercase font-bold"
                    />
                  </div>
                </>
              )}

              {activeTab === 'districts' && (
                <>
                  <SearchSelect
                    label="Select State"
                    required
                    placeholder="Choose State..."
                    searchPlaceholder="Search states..."
                    options={states.map(s => ({ value: s.id, label: s.name }))}
                    value={formData.stateId || ''}
                    onChange={v => setFormData({ ...formData, stateId: v })}
                    accentColor="indigo"
                  />
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">District Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Kolkata"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'zones' && (
                <>
                  <SearchSelect
                    label="Select District"
                    required
                    placeholder="Choose District..."
                    searchPlaceholder="Search districts..."
                    options={districts.map(d => ({ value: d.id, label: `${d.name} (${d.state?.name || ''})` }))}
                    value={formData.districtId || ''}
                    onChange={v => setFormData({ ...formData, districtId: v })}
                    accentColor="purple"
                  />
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Zone Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. North Zone"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'boards' && (
                <>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Board Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. CBSE / ICSE / State Board"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Short Name / Code</label>
                    <input
                      type="text"
                      value={formData.shortName || formData.code || ''}
                      onChange={e => setFormData({ ...formData, shortName: e.target.value, code: e.target.value })}
                      placeholder="e.g. CBSE"
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none uppercase font-bold"
                    />
                  </div>
                </>
              )}

              {activeTab === 'schools' && (
                <>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">School Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. St. Xavier's High School"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>
                  <SearchSelect
                    label="School Type"
                    required
                    placeholder="Select Type..."
                    options={[
                      { value: 'PRIVATE', label: 'PRIVATE SCHOOL' },
                      { value: 'PUBLIC', label: 'PUBLIC SCHOOL' },
                    ]}
                    value={formData.type || 'PRIVATE'}
                    onChange={v => setFormData({ ...formData, type: v })}
                    accentColor="emerald"
                  />
                  <SearchSelect
                    label="Select Zone"
                    required
                    placeholder="Choose Zone..."
                    searchPlaceholder="Search zones..."
                    options={zones.map(z => ({ value: z.id, label: `${z.name} (${z.district?.name || ''})` }))}
                    value={formData.zoneId || ''}
                    onChange={v => setFormData({ ...formData, zoneId: v })}
                    accentColor="cyan"
                  />
                  <SearchSelect
                    label="Select Board (CBSE/State)"
                    required
                    placeholder="Choose Board..."
                    searchPlaceholder="Search boards..."
                    options={boards.map(b => ({ value: b.id, label: b.name }))}
                    value={formData.boardId || ''}
                    onChange={v => setFormData({ ...formData, boardId: v })}
                    accentColor="amber"
                  />
                </>
              )}

              {activeTab === 'teachers' && (
                <>
                  <SearchSelect
                    label="Select School"
                    required
                    placeholder="Choose School..."
                    searchPlaceholder="Search schools..."
                    options={schools.map(s => ({ value: s.id, label: `${s.name} (${s.type})` }))}
                    value={formData.schoolId || ''}
                    onChange={v => setFormData({ ...formData, schoolId: v })}
                    accentColor="rose"
                  />
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Teacher Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Prof. Ananya Sen"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Teacher Phone *</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9876543210"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Subject Taught</label>
                    <input
                      type="text"
                      value={formData.subject || ''}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Mathematics"
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
