import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import KpiCard from '../components/KpiCard';
import { useAuth } from '../context/AuthContext';
import {
  getStatesAPI,
  getDistrictsAPI,
  createDistrictAPI,
  updateDistrictAPI,
  deleteDistrictAPI,
  getZonesAPI,
  createZoneAPI,
  updateZoneAPI,
  deleteZoneAPI,
  getSchoolsAPI,
  initWestBengalMasterDataAPI,
  getUserDistrictAccessAPI,
  updateUserDistrictAccessAPI,
  getPermissionsAPI,
} from '../services/api';
import {
  MapPin,
  Layers,
  Shield,
  ShieldCheck,
  Check,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Users,
  School,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  CheckCircle2,
  UserCheck,
  Building,
  ArrowRight,
  CheckSquare,
  Lock,
} from 'lucide-react';

const Districts = () => {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();

  const isSuperadmin = user?.role === 'SUPERADMIN';

  // Tabs: 'districts' | 'userAccess' | 'permissions'
  const [activeTab, setActiveTab] = useState('districts');

  // Core Data
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [zones, setZones] = useState([]);
  const [schools, setSchools] = useState([]);
  const [userAccessList, setUserAccessList] = useState([]);
  const [systemPermissions, setSystemPermissions] = useState([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [expandedDistrictId, setExpandedDistrictId] = useState(null);
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [syncingWb, setSyncingWb] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // District Modal State
  const [districtModal, setDistrictModal] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    item: null,
    formData: { name: '', stateId: '' },
  });

  // Zone Modal State
  const [zoneModal, setZoneModal] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    item: null,
    formData: { name: '', districtId: '' },
  });

  // User Access Assignment Modal State
  const [userAccessModal, setUserAccessModal] = useState({
    open: false,
    user: null,
    assignedDistrictIds: [],
    saving: false,
  });

  // Load all master location data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statesRes, districtsRes, zonesRes, schoolsRes] = await Promise.all([
        getStatesAPI().catch(() => ({ success: false, data: [] })),
        getDistrictsAPI().catch(() => ({ success: false, data: [] })),
        getZonesAPI().catch(() => ({ success: false, data: [] })),
        getSchoolsAPI().catch(() => ({ success: false, data: [] })),
      ]);

      if (statesRes.success && Array.isArray(statesRes.data)) {
        setStates(statesRes.data);
        const wb = statesRes.data.find(
          (s) =>
            s?.name?.toLowerCase().includes('west bengal') || s?.code === 'WB'
        );
        if (wb && !selectedStateId) {
          setSelectedStateId(wb.id);
        }
      }
      if (districtsRes.success && Array.isArray(districtsRes.data)) {
        setDistricts(districtsRes.data);
      }
      if (zonesRes.success && Array.isArray(zonesRes.data)) {
        setZones(zonesRes.data);
      }
      if (schoolsRes.success && Array.isArray(schoolsRes.data)) {
        setSchools(schoolsRes.data);
      }

      // Load user access data in background
      try {
        const uRes = await getUserDistrictAccessAPI();
        if (uRes.success && Array.isArray(uRes.data)) setUserAccessList(uRes.data);
      } catch (uErr) {
        console.warn('User district access not available yet:', uErr.message);
      }

      // Load permission schemes
      try {
        const pRes = await getPermissionsAPI();
        if (pRes.success && Array.isArray(pRes.data)) setSystemPermissions(pRes.data);
      } catch (pErr) {
        console.warn('System permissions not accessible:', pErr.message);
      }
    } catch (err) {
      console.error('Failed to load district data:', err);
      setError(err.response?.data?.message || 'Error loading districts and zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync West Bengal Master Copy
  const handleSyncWB = async () => {
    setSyncingWb(true);
    setError('');
    setSuccess('');
    try {
      const res = await initWestBengalMasterDataAPI();
      if (res.success) {
        setSuccess(
          `Successfully synchronized West Bengal master locations: ${res.data?.districtsCreated || 15} districts & ${res.data?.zonesCreated || 514} zones loaded.`
        );
        await loadData();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Failed to sync WB master locations:', err);
      setError(err.response?.data?.message || 'Failed to sync West Bengal master copy');
    } finally {
      setSyncingWb(false);
    }
  };

  // Filtered districts list
  const filteredDistricts = useMemo(() => {
    if (!Array.isArray(districts)) return [];
    return districts.filter((d) => {
      if (!d) return false;
      const matchesState = selectedStateId ? d.stateId === selectedStateId : true;
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (Array.isArray(d.zones) &&
          d.zones.some((z) => z?.name && z.name.toLowerCase().includes(q)));
      return matchesState && matchesSearch;
    });
  }, [districts, selectedStateId, searchQuery]);

  // Active district zones mapping
  const districtZonesMap = useMemo(() => {
    const map = {};
    if (Array.isArray(zones)) {
      for (const z of zones) {
        if (z?.districtId) {
          if (!map[z.districtId]) map[z.districtId] = [];
          map[z.districtId].push(z);
        }
      }
    }
    return map;
  }, [zones]);

  // District schools count mapping
  const districtSchoolsMap = useMemo(() => {
    const map = {};
    if (Array.isArray(schools)) {
      for (const s of schools) {
        const distId = s?.zone?.districtId || s?.zone?.district?.id;
        if (distId) {
          map[distId] = (map[distId] || 0) + 1;
        }
      }
    }
    return map;
  }, [schools]);

  // District CRUD Handlers
  const handleOpenCreateDistrict = () => {
    const defaultStateId = selectedStateId || (states.length > 0 ? states[0].id : '');
    setDistrictModal({
      open: true,
      mode: 'create',
      item: null,
      formData: { name: '', stateId: defaultStateId },
    });
  };

  const handleOpenEditDistrict = (district) => {
    setDistrictModal({
      open: true,
      mode: 'edit',
      item: district,
      formData: { name: district.name, stateId: district.stateId },
    });
  };

  const handleSaveDistrict = async (e) => {
    e.preventDefault();
    try {
      if (districtModal.mode === 'create') {
        await createDistrictAPI(districtModal.formData);
        setSuccess('District created successfully!');
      } else {
        await updateDistrictAPI(districtModal.item.id, districtModal.formData);
        setSuccess('District updated successfully!');
      }
      setDistrictModal({ open: false, mode: 'create', item: null, formData: { name: '', stateId: '' } });
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save district');
    }
  };

  const handleDeleteDistrict = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete District "${name}" and its associated zones?`)) return;
    try {
      await deleteDistrictAPI(id);
      setSuccess(`District "${name}" deleted.`);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete district');
    }
  };

  // Zone CRUD Handlers
  const handleOpenCreateZone = (districtId = '') => {
    const distId = districtId || (districts.length > 0 ? districts[0].id : '');
    setZoneModal({
      open: true,
      mode: 'create',
      item: null,
      formData: { name: '', districtId: distId },
    });
  };

  const handleOpenEditZone = (zone) => {
    setZoneModal({
      open: true,
      mode: 'edit',
      item: zone,
      formData: { name: zone.name, districtId: zone.districtId },
    });
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    try {
      if (zoneModal.mode === 'create') {
        await createZoneAPI(zoneModal.formData);
        setSuccess('Zone created successfully!');
      } else {
        await updateZoneAPI(zoneModal.item.id, zoneModal.formData);
        setSuccess('Zone updated successfully!');
      }
      setZoneModal({ open: false, mode: 'create', item: null, formData: { name: '', districtId: '' } });
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save zone');
    }
  };

  const handleDeleteZone = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Zone "${name}"?`)) return;
    try {
      await deleteZoneAPI(id);
      setSuccess(`Zone "${name}" deleted.`);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete zone');
    }
  };

  // User District Assignment Handlers
  const handleOpenUserAccessModal = (targetUser) => {
    setUserAccessModal({
      open: true,
      user: targetUser,
      assignedDistrictIds: [...(targetUser.districtIds || [])],
      saving: false,
    });
  };

  const handleSaveUserAccess = async () => {
    if (!userAccessModal.user) return;
    setUserAccessModal((prev) => ({ ...prev, saving: true }));
    try {
      await updateUserDistrictAccessAPI(
        userAccessModal.user.id,
        userAccessModal.assignedDistrictIds
      );
      setSuccess(`District access updated for ${userAccessModal.user.name}`);
      // Refresh list
      const uRes = await getUserDistrictAccessAPI();
      if (uRes.success) setUserAccessList(uRes.data);
      setUserAccessModal({ open: false, user: null, assignedDistrictIds: [], saving: false });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user district access');
      setUserAccessModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const toggleDistrictForUser = (distId) => {
    setUserAccessModal((prev) => {
      const exists = prev.assignedDistrictIds.includes(distId);
      return {
        ...prev,
        assignedDistrictIds: exists
          ? prev.assignedDistrictIds.filter((id) => id !== distId)
          : [...prev.assignedDistrictIds, distId],
      };
    });
  };

  const selectAllDistrictsForUser = () => {
    setUserAccessModal((prev) => ({
      ...prev,
      assignedDistrictIds: districts.map((d) => d.id),
    }));
  };

  const clearAllDistrictsForUser = () => {
    setUserAccessModal((prev) => ({
      ...prev,
      assignedDistrictIds: [],
    }));
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-deep">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pt-[70px]">
        <Navbar />

        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {/* Top Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                  <MapPin size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                    Districts & Territory Access
                    {isSuperadmin && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck size={12} />
                        Superadmin Access
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Territory Master & Access Control: West Bengal Districts, 514 Operational Zones, and User Permissions
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSyncWB}
                disabled={syncingWb}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-indigo-200/80 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Synchronize all 15 West Bengal districts and 514 zones from canonical master copy"
              >
                <RefreshCw size={14} className={syncingWb ? 'animate-spin' : ''} />
                <span>{syncingWb ? 'Syncing WB Master...' : 'Sync WB Master Copy (514 Zones)'}</span>
              </button>

              <button
                onClick={handleOpenCreateDistrict}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Add District</span>
              </button>

              <button
                onClick={() => handleOpenCreateZone()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/10 bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                <span>Add Zone</span>
              </button>

              <button
                onClick={() => navigate('/master-data')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer"
                title="Open Master Data Directory"
              >
                <span>Full Directory</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium dark:bg-rose-900/20 dark:border-rose-800/40 dark:text-rose-400 flex items-center justify-between animate-fade-in">
              <span>{error}</span>
              <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded">✕</button>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-400 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
              <button onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-100 rounded">✕</button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="West Bengal Districts"
              value={districts.length}
              subtitle="15 Canonical Territories"
              icon={<MapPin size={16} />}
              accentColor="indigo"
            />
            <KpiCard
              title="Operational Zones"
              value={zones.length}
              subtitle="From access_location Master"
              icon={<Layers size={16} />}
              accentColor="purple"
            />
            <KpiCard
              title="Affiliated Schools"
              value={schools.length}
              subtitle="Mapped across zones"
              icon={<School size={16} />}
              accentColor="emerald"
            />
            <KpiCard
              title="Sales Rep District Access"
              value={userAccessList.length}
              subtitle={isSuperadmin ? 'Superadmin Full Access' : 'Configured Reps'}
              icon={<Users size={16} />}
              accentColor="amber"
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-white/10 gap-2">
            <button
              onClick={() => setActiveTab('districts')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'districts'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <MapPin size={15} />
              <span>West Bengal Districts & Zones ({districts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('userAccess')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'userAccess'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck size={15} />
              <span>User District Access Control</span>
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'permissions'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Shield size={15} />
              <span>Role Permissions Matrix</span>
            </button>
          </div>

          {/* TAB 1: DISTRICTS & ZONES DIRECTORY */}
          {activeTab === 'districts' && (
            <div className="space-y-6 animate-fade-in">
              {/* Filter Bar */}
              <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search district or zone name..."
                    className="glass-input pl-10 pr-4 py-2 text-xs w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="w-full md:w-56">
                    <SearchSelect
                      label=""
                      placeholder="Filter by State"
                      options={[
                        { value: '', label: 'All States' },
                        ...states.map((s) => ({ value: s.id, label: s.name })),
                      ]}
                      value={selectedStateId}
                      onChange={(v) => setSelectedStateId(v)}
                      accentColor="indigo"
                    />
                  </div>

                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    Showing <strong>{filteredDistricts.length}</strong> of {districts.length} districts
                  </span>
                </div>
              </div>

              {/* Districts Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="skeleton h-44 rounded-2xl" />
                  ))}
                </div>
              ) : filteredDistricts.length === 0 ? (
                <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-3">
                  <MapPin size={40} className="text-slate-300 dark:text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Districts Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    No districts matched your search criteria. Click "Sync WB Master Copy" to load all 15 canonical West Bengal districts and 514 zones.
                  </p>
                  <button
                    onClick={handleSyncWB}
                    className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Sync WB Master Copy Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDistricts.map((dist) => {
                    const distZones = districtZonesMap[dist.id] || [];
                    const distSchoolsCount = districtSchoolsMap[dist.id] || 0;
                    const isExpanded = expandedDistrictId === dist.id;

                    const filteredZones = distZones.filter((z) =>
                      !zoneSearchQuery || z.name.toLowerCase().includes(zoneSearchQuery.toLowerCase())
                    );

                    return (
                      <div
                        key={dist.id}
                        className={`glass-card p-5 flex flex-col justify-between transition-all duration-200 border ${
                          isExpanded
                            ? 'ring-2 ring-indigo-500/30 border-indigo-300 dark:border-indigo-500/40 shadow-lg'
                            : 'hover:border-slate-300 dark:hover:border-white/10'
                        }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-black text-xs">
                                <MapPin size={16} />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                  {dist.name}
                                </h3>
                                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                  <span>{dist.state?.name || 'West Bengal'}</span>
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons for Superadmin */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditDistrict(dist)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                                title="Edit District"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteDistrict(dist.id, dist.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                                title="Delete District"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Stats Badges */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-deep border border-slate-200/60 dark:border-white/5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Zones
                              </span>
                              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                                {distZones.length}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-deep border border-slate-200/60 dark:border-white/5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Schools
                              </span>
                              <span className="text-base font-extrabold text-slate-700 dark:text-slate-200">
                                {distSchoolsCount}
                              </span>
                            </div>
                          </div>

                          {/* Zone Pills Preview */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                Operational Zones ({distZones.length})
                              </span>
                              <button
                                onClick={() => {
                                  setExpandedDistrictId(isExpanded ? null : dist.id);
                                  setZoneSearchQuery('');
                                }}
                                className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5"
                              >
                                <span>{isExpanded ? 'Hide' : 'View All'}</span>
                                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </button>
                            </div>

                            {/* Collapsed small tags preview */}
                            {!isExpanded && (
                              <div className="flex flex-wrap gap-1">
                                {distZones.slice(0, 4).map((z) => (
                                  <span
                                    key={z.id}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                                  >
                                    {z.name}
                                  </span>
                                ))}
                                {distZones.length > 4 && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    +{distZones.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Expanded zone view with inner search */}
                            {isExpanded && (
                              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-deep border border-slate-200/70 dark:border-white/5 space-y-2 mt-2">
                                <div className="relative">
                                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input
                                    type="text"
                                    value={zoneSearchQuery}
                                    onChange={(e) => setZoneSearchQuery(e.target.value)}
                                    placeholder="Filter zones in this district..."
                                    className="glass-input pl-7 pr-2 py-1 text-[11px] w-full"
                                  />
                                </div>
                                <div className="max-h-44 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                  {filteredZones.map((z) => (
                                    <div
                                      key={z.id}
                                      className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-dark-card border border-slate-200/50 dark:border-white/5 text-xs"
                                    >
                                      <span className="font-medium text-slate-700 dark:text-slate-300">{z.name}</span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleOpenEditZone(z)}
                                          className="p-1 text-slate-400 hover:text-indigo-600"
                                          title="Edit Zone"
                                        >
                                          <Edit2 size={11} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteZone(z.id, z.name)}
                                          className="p-1 text-slate-400 hover:text-rose-600"
                                          title="Delete Zone"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {filteredZones.length === 0 && (
                                    <p className="text-[11px] text-slate-400 text-center py-2">No matching zones</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleOpenCreateZone(dist.id)}
                                  className="w-full py-1.5 rounded-lg border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-indigo-500/10 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Plus size={12} />
                                  <span>Add Zone to {dist.name}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenCreateZone(dist.id)}
                            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>Add Zone</span>
                          </button>

                          <button
                            onClick={() => navigate(`/tasks?districtId=${dist.id}`)}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Create Task</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER DISTRICT ACCESS CONTROL */}
          {activeTab === 'userAccess' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/60 dark:border-white/5">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <UserCheck size={18} className="text-indigo-600" />
                      Territorial District Access for Sales Team
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Superadmin assigns which West Bengal districts are accessible to individual sales representatives and team members.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Superadmin: Unrestricted Global Access
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/1">
                        <th className="p-3.5 uppercase font-bold text-slate-400">User</th>
                        <th className="p-3.5 uppercase font-bold text-slate-400">System Role</th>
                        <th className="p-3.5 uppercase font-bold text-slate-400">Assigned Districts</th>
                        <th className="p-3.5 uppercase font-bold text-slate-400 text-center">Coverage</th>
                        <th className="p-3.5 uppercase font-bold text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/3">
                      {(userAccessList || []).map((u) => {
                        const isUserSuper = u.role === 'SUPERADMIN';
                        const assignedCount = isUserSuper ? districts.length : (u.districtIds?.length || 0);

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                            <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-[10px]">
                                  {u.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <span className="block font-bold">{u.name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  u.role === 'SUPERADMIN'
                                    ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                                    : u.role === 'ADMIN'
                                    ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                                    : 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {isUserSuper ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <ShieldCheck size={13} />
                                  All Districts (Superadmin Bypass)
                                </span>
                              ) : u.districtIds?.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-md">
                                  {(u.districtIds || []).map((did) => {
                                    const dObj = districts.find((d) => d.id === did);
                                    return (
                                      <span
                                        key={did}
                                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20"
                                      >
                                        {dObj?.name || 'District'}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  No specific district assigned (All permitted)
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                                {assignedCount} / {districts.length}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              {isUserSuper ? (
                                <span className="text-[11px] text-slate-400 italic">Full Bypass</span>
                              ) : (
                                <button
                                  onClick={() => handleOpenUserAccessModal(u)}
                                  className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                  Configure Access
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROLE PERMISSIONS MATRIX */}
          {activeTab === 'permissions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60 dark:border-white/5">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Shield size={18} className="text-indigo-600" />
                      Districts Menu Permissions by Role
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      View access rights for the Districts menu. Superadmin retains 100% bypass authority across all actions.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <span>Edit in Admin Panel</span>
                    <ExternalLink size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-purple-500/5 to-transparent border border-rose-200/60 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">SUPERADMIN</span>
                      <ShieldCheck size={18} className="text-rose-600" />
                    </div>
                    <p className="text-[11px] text-slate-500">Unrestricted full control over Districts, Zones, and territory assignment.</p>
                    <div className="pt-2 flex flex-wrap gap-1">
                      {['canView', 'canCreate', 'canEdit', 'canDelete'].map((act) => (
                        <span key={act} className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-card border border-slate-200/60 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">ADMIN</span>
                      <Shield size={18} className="text-purple-600" />
                    </div>
                    <p className="text-[11px] text-slate-500">Full administrative access to manage territories and school affiliations.</p>
                    <div className="pt-2 flex flex-wrap gap-1">
                      {['canView', 'canCreate', 'canEdit', 'canDelete'].map((act) => (
                        <span key={act} className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-card border border-slate-200/60 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">EDITOR</span>
                      <CheckSquare size={18} className="text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-slate-500">Read-only view access to reference territory lists and school assignments.</p>
                    <div className="pt-2 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        canView
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-card border border-slate-200/60 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">SALESMAN</span>
                      <Users size={18} className="text-slate-500" />
                    </div>
                    <p className="text-[11px] text-slate-500">Territory operational access assigned per individual user by Superadmin.</p>
                    <div className="pt-2 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                        Assigned WB Districts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE / EDIT DISTRICT */}
      {districtModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-600" />
              <span>{districtModal.mode === 'create' ? 'Add New District' : 'Edit District'}</span>
            </h3>

            <form onSubmit={handleSaveDistrict} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  State
                </label>
                <select
                  value={districtModal.formData.stateId}
                  onChange={(e) =>
                    setDistrictModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, stateId: e.target.value },
                    }))
                  }
                  required
                  className="glass-input w-full px-3 py-2 text-xs"
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  District Name
                </label>
                <input
                  type="text"
                  value={districtModal.formData.name}
                  onChange={(e) =>
                    setDistrictModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, name: e.target.value },
                    }))
                  }
                  placeholder="e.g. Hooghly, Kolkata, Nadia"
                  required
                  className="glass-input w-full px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={() =>
                    setDistrictModal({ open: false, mode: 'create', item: null, formData: { name: '', stateId: '' } })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {districtModal.mode === 'create' ? 'Create District' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT ZONE */}
      {zoneModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              <span>{zoneModal.mode === 'create' ? 'Add Operational Zone' : 'Edit Zone'}</span>
            </h3>

            <form onSubmit={handleSaveZone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  District
                </label>
                <select
                  value={zoneModal.formData.districtId}
                  onChange={(e) =>
                    setZoneModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, districtId: e.target.value },
                    }))
                  }
                  required
                  className="glass-input w-full px-3 py-2 text-xs"
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.state?.name || 'West Bengal'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Zone Name
                </label>
                <input
                  type="text"
                  value={zoneModal.formData.name}
                  onChange={(e) =>
                    setZoneModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, name: e.target.value },
                    }))
                  }
                  placeholder="e.g. Arambagh, Chandannagar, Chinsurah"
                  required
                  className="glass-input w-full px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={() =>
                    setZoneModal({ open: false, mode: 'create', item: null, formData: { name: '', districtId: '' } })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {zoneModal.mode === 'create' ? 'Create Zone' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE USER DISTRICT ACCESS */}
      {userAccessModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-card w-full max-w-lg p-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-200/60 dark:border-white/5">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck size={18} className="text-indigo-600" />
                  <span>Assign District Access for {userAccessModal.user?.name}</span>
                </h3>
                <span className="text-xs text-slate-400">{userAccessModal.user?.email} • {userAccessModal.user?.role}</span>
              </div>
              <button
                onClick={() => setUserAccessModal({ open: false, user: null, assignedDistrictIds: [], saving: false })}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-500">
                Selected: {userAccessModal.assignedDistrictIds.length} of {districts.length} Districts
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllDistrictsForUser}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAllDistrictsForUser}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Scrollable districts checklist */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar my-2">
              {(districts || []).map((dist) => {
                const isChecked = Boolean(userAccessModal?.assignedDistrictIds?.includes(dist.id));
                const zoneCount = dist.zones?.length || districtZonesMap[dist.id]?.length || 0;

                return (
                  <label
                    key={dist.id}
                    onClick={() => toggleDistrictForUser(dist.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-indigo-50/80 border-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-500/30'
                        : 'bg-white dark:bg-dark-card border-slate-200/70 dark:border-white/5 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-white/20'
                        }`}
                      >
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                          {dist.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {dist.state?.name || 'West Bengal'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500">
                      {zoneCount} Zones
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/60 dark:border-white/5 mt-2">
              <button
                type="button"
                onClick={() => setUserAccessModal({ open: false, user: null, assignedDistrictIds: [], saving: false })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserAccess}
                disabled={userAccessModal.saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {userAccessModal.saving ? 'Saving...' : 'Save District Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Districts;
