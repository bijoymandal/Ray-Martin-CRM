import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import KpiCard from '../components/KpiCard';
import { FlipkartStatCardSkeleton, FlipkartTableSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import {
  getMasterDataSummaryAPI,
  getStatesAPI, createStateAPI, updateStateAPI, deleteStateAPI,
  getDistrictsAPI, createDistrictAPI, updateDistrictAPI, deleteDistrictAPI,
  getZonesAPI, createZoneAPI, updateZoneAPI, deleteZoneAPI,
  getSchoolBoardsAPI, createSchoolBoardAPI, updateSchoolBoardAPI, deleteSchoolBoardAPI,
  getSchoolsAPI, createSchoolAPI, updateSchoolAPI, deleteSchoolAPI,
  getTeachersAPI, createTeacherAPI, updateTeacherAPI, deleteTeacherAPI, getTeacherFiltersAPI,
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
  X,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Phone,
  Mail,
  Filter,
  RotateCcw,
  GraduationCap,
  Briefcase,
  Check,
} from 'lucide-react';

const MasterData = () => {
  const { user, permissions } = useAuth();
  const queryClient = useQueryClient();
  const menuPerm = permissions.find((p) => p.menu.path === '/master-data');

  const canCreate = user?.role === 'SUPERADMIN' || (menuPerm?.actions?.includes('canCreate') ?? false);
  const canEdit = user?.role === 'SUPERADMIN' || (menuPerm?.actions?.includes('canEdit') ?? false);
  const canDelete = user?.role === 'SUPERADMIN' || (menuPerm?.actions?.includes('canDelete') ?? false);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Tab derived from URL query param: 'states' | 'districts' | 'zones' | 'boards' | 'schools' | 'teachers'
  const activeTab = searchParams.get('tab') || 'states';

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Search input with live debouncing
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Cascading filters
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('');

  // Teacher specific filters (Category type, Class, School Type)
  const [teacherCategoryType, setTeacherCategoryType] = useState('ALL'); // 'ALL' | 'School' | 'Private Tutor'
  const [teacherClassFilter, setTeacherClassFilter] = useState('ALL'); // 'ALL' | '5' .. '12'
  const [teacherSchoolTypeFilter, setTeacherSchoolTypeFilter] = useState('ALL');

  const handleTabChange = (newTab) => {
    setPage(1);
    setSearchInput('');
    setDebouncedSearch('');
    setSearchParams({ tab: newTab });
  };

  const handleStateFilterChange = (v) => {
    setSelectedStateId(v);
    setSelectedDistrictId('');
    setSelectedZoneId('');
    setSelectedSchoolId('');
    setPage(1);
  };

  const handleDistrictFilterChange = (v) => {
    setSelectedDistrictId(v);
    setSelectedZoneId('');
    setSelectedSchoolId('');
    setPage(1);
  };

  const handleZoneFilterChange = (v) => {
    setSelectedZoneId(v);
    setSelectedSchoolId('');
    setPage(1);
  };

  const handleBoardFilterChange = (v) => {
    setSelectedBoardId(v);
    setPage(1);
  };

  const handleSchoolFilterChange = (v) => {
    setSelectedSchoolId(v);
    setPage(1);
  };

  const handleTypeFilterChange = (v) => {
    setSchoolTypeFilter(v);
    setPage(1);
  };

  const handleTeacherCategoryChange = (cat) => {
    setTeacherCategoryType(cat);
    setPage(1);
  };

  const handleTeacherClassChange = (cls) => {
    setTeacherClassFilter(cls);
    setPage(1);
  };

  const handleTeacherSchoolTypeChange = (st) => {
    setTeacherSchoolTypeFilter(st);
    setPage(1);
  };


  // Toast / error state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  // ─── TANSTACK QUERIES ────────────────────────────────────────────────────────

  // 1. KPI Summary Counts
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['masterdata-summary'],
    queryFn: async () => {
      const res = await getMasterDataSummaryAPI();
      return res?.data || {};
    },
    staleTime: 60 * 1000,
  });

  const summary = summaryData || {
    statesCount: 0,
    districtsCount: 0,
    zonesCount: 0,
    boardsCount: 0,
    schoolsCount: 0,
    teachersCount: 0,
  };

  // 2. Reference lookups for cascading dropdown filters & modal forms
  const { data: refStates = [] } = useQuery({
    queryKey: ['reference-states'],
    queryFn: async () => {
      const res = await getStatesAPI();
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: refDistricts = [] } = useQuery({
    queryKey: ['reference-districts', selectedStateId],
    queryFn: async () => {
      const res = await getDistrictsAPI({ stateId: selectedStateId || undefined });
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allDistricts = [] } = useQuery({
    queryKey: ['reference-all-districts'],
    queryFn: async () => {
      const res = await getDistrictsAPI();
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: refZones = [] } = useQuery({
    queryKey: ['reference-zones', selectedDistrictId, selectedStateId],
    queryFn: async () => {
      const res = await getZonesAPI({
        districtId: selectedDistrictId || undefined,
        stateId: (!selectedDistrictId && selectedStateId) ? selectedStateId : undefined,
      });
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allZones = [] } = useQuery({
    queryKey: ['reference-all-zones'],
    queryFn: async () => {
      const res = await getZonesAPI();
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: refBoards = [] } = useQuery({
    queryKey: ['reference-boards'],
    queryFn: async () => {
      const res = await getSchoolBoardsAPI();
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: refSchools = [] } = useQuery({
    queryKey: ['reference-schools', selectedZoneId, selectedDistrictId, selectedBoardId],
    queryFn: async () => {
      const res = await getSchoolsAPI({
        zoneId: selectedZoneId || undefined,
        districtId: selectedDistrictId || undefined,
        boardId: selectedBoardId || undefined,
      });
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allSchools = [] } = useQuery({
    queryKey: ['reference-all-schools'],
    queryFn: async () => {
      const res = await getSchoolsAPI();
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: teacherFiltersData } = useQuery({
    queryKey: ['teacher-filters'],
    queryFn: async () => {
      const res = await getTeacherFiltersAPI();
      return res?.data || null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'teachers',
  });

  // 3. Main Active Tab Paginated Query
  const activeTabParams = useMemo(() => {
    const p = {
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
    };
    if (activeTab === 'districts') {
      if (selectedStateId) p.stateId = selectedStateId;
    } else if (activeTab === 'zones') {
      if (selectedDistrictId) p.districtId = selectedDistrictId;
      else if (selectedStateId) p.stateId = selectedStateId;
    } else if (activeTab === 'schools') {
      if (selectedZoneId) p.zoneId = selectedZoneId;
      else if (selectedDistrictId) p.districtId = selectedDistrictId;
      else if (selectedStateId) p.stateId = selectedStateId;
      if (selectedBoardId) p.boardId = selectedBoardId;
      if (schoolTypeFilter) p.type = schoolTypeFilter;
    } else if (activeTab === 'teachers') {
      if (teacherCategoryType && teacherCategoryType !== 'ALL') p.categoryType = teacherCategoryType;
      if (teacherClassFilter && teacherClassFilter !== 'ALL') p.class = teacherClassFilter;
      if (teacherSchoolTypeFilter && teacherSchoolTypeFilter !== 'ALL') p.schoolType = teacherSchoolTypeFilter;
      if (selectedSchoolId) p.schoolId = selectedSchoolId;
      else {
        if (selectedZoneId) {
          p.zoneId = selectedZoneId;
          const zMatch = allZones.find(z => z.id === selectedZoneId) || refZones.find(z => z.id === selectedZoneId);
          if (zMatch?.name) p.zone = zMatch.name;
        }
        if (selectedDistrictId) {
          p.districtId = selectedDistrictId;
          const dMatch = allDistricts.find(d => d.id === selectedDistrictId);
          if (dMatch?.name) p.district = dMatch.name;
        }
        if (selectedBoardId) p.boardId = selectedBoardId;
      }
    }
    return p;
  }, [activeTab, page, limit, debouncedSearch, selectedStateId, selectedDistrictId, selectedZoneId, selectedBoardId, selectedSchoolId, schoolTypeFilter, teacherCategoryType, teacherClassFilter, teacherSchoolTypeFilter, allZones, refZones, allDistricts]);

  const {
    data: tabResult,
    isLoading: isTabLoading,
    isFetching: isTabFetching,
  } = useQuery({
    queryKey: ['masterdata-table', activeTab, activeTabParams],
    queryFn: async () => {
      if (activeTab === 'states') return await getStatesAPI(activeTabParams);
      if (activeTab === 'districts') return await getDistrictsAPI(activeTabParams);
      if (activeTab === 'zones') return await getZonesAPI(activeTabParams);
      if (activeTab === 'boards') return await getSchoolBoardsAPI(activeTabParams);
      if (activeTab === 'schools') return await getSchoolsAPI(activeTabParams);
      if (activeTab === 'teachers') return await getTeachersAPI(activeTabParams);
      return { data: [], total: 0 };
    },
    placeholderData: (previousData) => previousData,
  });

  const items = tabResult?.data || [];
  const total = tabResult?.total !== undefined ? tabResult.total : items.length;
  const totalPages = tabResult?.totalPages || Math.max(1, Math.ceil(total / limit));
  const currentPage = tabResult?.currentPage || page;

  // ─── MUTATIONS ───────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async ({ mode, currentTab, editObj, formValues }) => {
      if (currentTab === 'states') {
        return mode === 'edit' ? await updateStateAPI(editObj.id, formValues) : await createStateAPI(formValues);
      }
      if (currentTab === 'districts') {
        return mode === 'edit' ? await updateDistrictAPI(editObj.id, formValues) : await createDistrictAPI(formValues);
      }
      if (currentTab === 'zones') {
        return mode === 'edit' ? await updateZoneAPI(editObj.id, formValues) : await createZoneAPI(formValues);
      }
      if (currentTab === 'boards') {
        return mode === 'edit' ? await updateSchoolBoardAPI(editObj.id, formValues) : await createSchoolBoardAPI(formValues);
      }
      if (currentTab === 'schools') {
        return mode === 'edit' ? await updateSchoolAPI(editObj.id, formValues) : await createSchoolAPI(formValues);
      }
      if (currentTab === 'teachers') {
        return mode === 'edit' ? await updateTeacherAPI(editObj.id, formValues) : await createTeacherAPI(formValues);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterdata-table'] });
      queryClient.invalidateQueries({ queryKey: ['masterdata-summary'] });
      queryClient.invalidateQueries({ queryKey: ['reference-states'] });
      queryClient.invalidateQueries({ queryKey: ['reference-districts'] });
      queryClient.invalidateQueries({ queryKey: ['reference-all-districts'] });
      queryClient.invalidateQueries({ queryKey: ['reference-zones'] });
      queryClient.invalidateQueries({ queryKey: ['reference-all-zones'] });
      queryClient.invalidateQueries({ queryKey: ['reference-boards'] });
      queryClient.invalidateQueries({ queryKey: ['reference-schools'] });
      queryClient.invalidateQueries({ queryKey: ['reference-all-schools'] });
      setSuccess(`${activeTab.slice(0, -1)} saved successfully!`);
      setModalMode(null);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err?.message || 'Operation failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ currentTab, id }) => {
      if (currentTab === 'states') return await deleteStateAPI(id);
      if (currentTab === 'districts') return await deleteDistrictAPI(id);
      if (currentTab === 'zones') return await deleteZoneAPI(id);
      if (currentTab === 'boards') return await deleteSchoolBoardAPI(id);
      if (currentTab === 'schools') return await deleteSchoolAPI(id);
      if (currentTab === 'teachers') return await deleteTeacherAPI(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterdata-table'] });
      queryClient.invalidateQueries({ queryKey: ['masterdata-summary'] });
      queryClient.invalidateQueries({ queryKey: ['reference-states'] });
      queryClient.invalidateQueries({ queryKey: ['reference-districts'] });
      queryClient.invalidateQueries({ queryKey: ['reference-all-districts'] });
      queryClient.invalidateQueries({ queryKey: ['reference-zones'] });
      queryClient.invalidateQueries({ queryKey: ['reference-all-zones'] });
      queryClient.invalidateQueries({ queryKey: ['reference-boards'] });
      queryClient.invalidateQueries({ queryKey: ['reference-schools'] });
      queryClient.invalidateQueries({ queryKey: ['reference-all-schools'] });
      setSuccess('Record deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete record');
    },
  });

  // Modal Handlers
  const openCreateModal = () => {
    setEditItem(null);
    if (activeTab === 'teachers') {
      setFormData({
        categoryType: teacherCategoryType !== 'ALL' ? teacherCategoryType : 'School',
        classes: teacherClassFilter !== 'ALL' ? [teacherClassFilter] : ['10'],
        schoolType: teacherSchoolTypeFilter !== 'ALL' ? teacherSchoolTypeFilter : 'HS School',
      });
    } else {
      setFormData({});
    }
    setModalMode('create');
  };

  const openEditModal = (item) => {
    setEditItem(item);
    if (activeTab === 'teachers') {
      setFormData({
        ...item,
        classes: Array.isArray(item.classes) ? item.classes : [],
        subjects: Array.isArray(item.subjects) ? item.subjects : (item.subject ? [item.subject] : []),
        categoryType: item.categoryType || 'School',
        schoolName: item.schoolName || item.school?.name || '',
        schoolType: item.schoolType || 'HS School',
        district: item.district || item.school?.zone?.district?.name || '',
        zone: item.zone || item.school?.zone?.name || '',
      });
    } else {
      setFormData({ ...item });
    }
    setModalMode('edit');
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError('');

    let payload = { ...formData };
    if (activeTab === 'teachers') {
      if (typeof payload.subject === 'string' && (!payload.subjects || payload.subjects.length === 0)) {
        payload.subjects = payload.subject.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    saveMutation.mutate({
      mode: modalMode,
      currentTab: activeTab,
      editObj: editItem,
      formValues: payload,
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    setError('');
    deleteMutation.mutate({
      currentTab: activeTab,
      id,
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedStateId('');
    setSelectedDistrictId('');
    setSelectedZoneId('');
    setSelectedBoardId('');
    setSelectedSchoolId('');
    setSchoolTypeFilter('');
    setTeacherCategoryType('ALL');
    setTeacherClassFilter('ALL');
    setTeacherSchoolTypeFilter('ALL');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  const isFiltered = Boolean(
    selectedStateId ||
    selectedDistrictId ||
    selectedZoneId ||
    selectedBoardId ||
    selectedSchoolId ||
    schoolTypeFilter ||
    (teacherCategoryType && teacherCategoryType !== 'ALL') ||
    (teacherClassFilter && teacherClassFilter !== 'ALL') ||
    (teacherSchoolTypeFilter && teacherSchoolTypeFilter !== 'ALL') ||
    searchInput.trim()
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0b0f19]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pt-[70px]">
        <Navbar />

        <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
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
                Manage complete hierarchy with TanStack Query caching: State → District → Zone → School Board → Public/Private School → Teachers
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => navigate('/districts')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-indigo-200/80 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MapPin size={14} />
                <span>Districts & Territory View</span>
              </button>

              {canCreate && (
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add New {activeTab.slice(0, -1).toUpperCase()}
                </button>
              )}
            </div>
          </div>

          {/* Toast Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
              <span>{error}</span>
              <button onClick={() => setError('')} className="p-1 cursor-pointer"><X size={14} /></button>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fade-in">
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="p-1 cursor-pointer"><X size={14} /></button>
            </div>
          )}

          {/* Overview Summary KPI Widgets */}
          {isSummaryLoading ? (
            <FlipkartStatCardSkeleton count={6} colsClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              title="States"
              value={summary?.statesCount ?? 0}
              icon={<MapPin size={14} />}
              accentColor="indigo"
              onClick={() => handleTabChange('states')}
              isActive={activeTab === 'states'}
            />

            <KpiCard
              title="Districts"
              value={summary?.districtsCount ?? 0}
              icon={<Building size={14} />}
              accentColor="purple"
              onClick={() => handleTabChange('districts')}
              isActive={activeTab === 'districts'}
            />

            <KpiCard
              title="Zones"
              value={summary?.zonesCount ?? 0}
              icon={<Navigation size={14} />}
              accentColor="cyan"
              onClick={() => handleTabChange('zones')}
              isActive={activeTab === 'zones'}
            />

            <KpiCard
              title="School Boards"
              value={summary?.boardsCount ?? 0}
              icon={<BookOpen size={14} />}
              accentColor="amber"
              onClick={() => handleTabChange('boards')}
              isActive={activeTab === 'boards'}
            />

            <KpiCard
              title="Schools"
              value={summary?.schoolsCount ?? 0}
              icon={<SchoolIcon size={14} />}
              accentColor="emerald"
              onClick={() => handleTabChange('schools')}
              isActive={activeTab === 'schools'}
            />

            <KpiCard
              title="Teachers"
              value={summary?.teachersCount ?? 0}
              icon={<Users size={14} />}
              accentColor="rose"
              onClick={() => handleTabChange('teachers')}
              isActive={activeTab === 'teachers'}
            />
          </div>
          )}

          {/* Hierarchical Breadcrumb Navigation */}
          <div className="glass-card p-3 flex items-center gap-2 text-xs font-bold overflow-x-auto text-slate-600 dark:text-slate-300">
            <button
              onClick={() => handleTabChange('states')}
              className={`hover:text-indigo-500 cursor-pointer transition-colors ${activeTab === 'states' ? 'text-indigo-600 dark:text-indigo-400 font-black' : ''}`}
            >
              States
            </button>
            <ChevronRight size={12} className="text-slate-400 shrink-0" />
            <button
              onClick={() => handleTabChange('districts')}
              className={`hover:text-purple-500 cursor-pointer transition-colors ${activeTab === 'districts' ? 'text-purple-600 dark:text-purple-400 font-black' : ''}`}
            >
              Districts
            </button>
            <ChevronRight size={12} className="text-slate-400 shrink-0" />
            <button
              onClick={() => handleTabChange('zones')}
              className={`hover:text-cyan-500 cursor-pointer transition-colors ${activeTab === 'zones' ? 'text-cyan-600 dark:text-cyan-400 font-black' : ''}`}
            >
              Zones
            </button>
            <ChevronRight size={12} className="text-slate-400 shrink-0" />
            <button
              onClick={() => handleTabChange('boards')}
              className={`hover:text-amber-500 cursor-pointer transition-colors ${activeTab === 'boards' ? 'text-amber-600 dark:text-amber-400 font-black' : ''}`}
            >
              School Boards
            </button>
            <ChevronRight size={12} className="text-slate-400 shrink-0" />
            <button
              onClick={() => handleTabChange('schools')}
              className={`hover:text-emerald-500 cursor-pointer transition-colors ${activeTab === 'schools' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}`}
            >
              Schools
            </button>
            <ChevronRight size={12} className="text-slate-400 shrink-0" />
            <button
              onClick={() => handleTabChange('teachers')}
              className={`hover:text-rose-500 cursor-pointer transition-colors ${activeTab === 'teachers' ? 'text-rose-600 dark:text-rose-400 font-black' : ''}`}
            >
              Teachers & Staff
            </button>
          </div>

          {/* Main Table Card */}
          <div className="glass-card p-4 md:p-6 space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-white/5">
              {/* Cascading Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {activeTab === 'districts' && (
                  <SearchSelect
                    placeholder="All States"
                    searchPlaceholder="Search states..."
                    options={[{ value: '', label: 'All States' }, ...refStates.map(s => ({ value: s.id, label: s.name }))]}
                    value={selectedStateId}
                    onChange={handleStateFilterChange}
                    accentColor="indigo"
                  />
                )}

                {activeTab === 'zones' && (
                  <>
                    <SearchSelect
                      placeholder="Filter State..."
                      searchPlaceholder="Search states..."
                      options={[{ value: '', label: 'All States' }, ...refStates.map(s => ({ value: s.id, label: s.name }))]}
                      value={selectedStateId}
                      onChange={handleStateFilterChange}
                      accentColor="indigo"
                    />
                    <SearchSelect
                      placeholder="All Districts"
                      searchPlaceholder="Search districts..."
                      options={[{ value: '', label: 'All Districts' }, ...refDistricts.map(d => ({ value: d.id, label: `${d.name} (${d.state?.name || ''})` }))]}
                      value={selectedDistrictId}
                      onChange={handleDistrictFilterChange}
                      accentColor="purple"
                    />
                  </>
                )}

                {activeTab === 'schools' && (
                  <>
                    <SearchSelect
                      placeholder="Filter State..."
                      searchPlaceholder="Search states..."
                      options={[{ value: '', label: 'All States' }, ...refStates.map(s => ({ value: s.id, label: s.name }))]}
                      value={selectedStateId}
                      onChange={handleStateFilterChange}
                      accentColor="indigo"
                    />

                    <SearchSelect
                      placeholder="All Districts"
                      searchPlaceholder="Search districts..."
                      options={[{ value: '', label: 'All Districts' }, ...refDistricts.map(d => ({ value: d.id, label: `${d.name} (${d.state?.name || ''})` }))]}
                      value={selectedDistrictId}
                      onChange={handleDistrictFilterChange}
                      accentColor="purple"
                    />

                    <SearchSelect
                      placeholder="All Zones"
                      searchPlaceholder="Search zones..."
                      options={[{ value: '', label: 'All Zones' }, ...refZones.map(z => ({ value: z.id, label: z.name }))]}
                      value={selectedZoneId}
                      onChange={handleZoneFilterChange}
                      accentColor="cyan"
                    />

                    <SearchSelect
                      placeholder="All Boards"
                      searchPlaceholder="Search boards..."
                      options={[{ value: '', label: 'All Boards (CBSE/State)' }, ...refBoards.map(b => ({ value: b.id, label: b.name }))]}
                      value={selectedBoardId}
                      onChange={handleBoardFilterChange}
                      accentColor="amber"
                    />

                    <SearchSelect
                      placeholder="All Types"
                      searchPlaceholder="Filter type..."
                      options={[
                        { value: '', label: 'All Types (Public/Private)' },
                        { value: 'PUBLIC', label: 'PUBLIC SCHOOL' },
                        { value: 'PRIVATE', label: 'PRIVATE SCHOOL' },
                      ]}
                      value={schoolTypeFilter}
                      onChange={handleTypeFilterChange}
                      accentColor="emerald"
                    />
                  </>
                )}

                {activeTab === 'teachers' && (
                  <>
                    <SearchSelect
                      placeholder="Category Type..."
                      searchPlaceholder="Search type..."
                      options={[
                        { value: 'ALL', label: 'All Categories' },
                        { value: 'School', label: '🏫 School Teachers' },
                        { value: 'Private Tutor', label: '👨‍🏫 Private Tutors / Teachers' },
                      ]}
                      value={teacherCategoryType}
                      onChange={handleTeacherCategoryChange}
                      accentColor="rose"
                    />

                    <SearchSelect
                      placeholder="Class..."
                      searchPlaceholder="Select class..."
                      options={[
                        { value: 'ALL', label: 'All Classes' },
                        { value: '12', label: 'Class 12' },
                        { value: '11', label: 'Class 11' },
                        { value: '10', label: 'Class 10' },
                        { value: '9', label: 'Class 9' },
                        { value: '8', label: 'Class 8' },
                        { value: '7', label: 'Class 7' },
                        { value: '6', label: 'Class 6' },
                        { value: '5', label: 'Class 5' },
                      ]}
                      value={teacherClassFilter}
                      onChange={handleTeacherClassChange}
                      accentColor="indigo"
                    />

                    <SearchSelect
                      placeholder="School Type..."
                      searchPlaceholder="Select school type..."
                      options={[
                        { value: 'ALL', label: 'All School Types' },
                        { value: 'HS School', label: 'HS School' },
                        { value: 'Primary School', label: 'Primary School' },
                        { value: 'Kg/Nursery School', label: 'Kg/Nursery School' },
                        { value: 'CBSE SCHOOL', label: 'CBSE SCHOOL' },
                        { value: 'Private Coaching', label: 'Private Coaching' },
                      ]}
                      value={teacherSchoolTypeFilter}
                      onChange={handleTeacherSchoolTypeChange}
                      accentColor="emerald"
                    />

                    <SearchSelect
                      placeholder="Filter District..."
                      searchPlaceholder="Search districts..."
                      options={[{ value: '', label: 'All Districts' }, ...allDistricts.map(d => ({ value: d.id, label: `${d.name} (${d.state?.name || ''})` }))]}
                      value={selectedDistrictId}
                      onChange={handleDistrictFilterChange}
                      accentColor="purple"
                    />

                    <SearchSelect
                      placeholder="Filter Zone..."
                      searchPlaceholder="Search zones..."
                      options={[{ value: '', label: 'All Zones' }, ...refZones.map(z => ({ value: z.id, label: z.name }))]}
                      value={selectedZoneId}
                      onChange={handleZoneFilterChange}
                      accentColor="cyan"
                    />

                    <SearchSelect
                      placeholder="All Schools"
                      searchPlaceholder="Search schools..."
                      options={[{ value: '', label: 'All Schools' }, ...refSchools.map(s => ({ value: s.id, label: `${s.name} (${s.type})` }))]}
                      value={selectedSchoolId}
                      onChange={handleSchoolFilterChange}
                      accentColor="rose"
                    />
                  </>
                )}

                {isFiltered && (
                  <button
                    onClick={handleResetFilters}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Reset all filters"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Debounced Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-dark-deep border border-slate-200/80 dark:border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
                {searchInput ? (
                  <button
                    onClick={() => { setSearchInput(''); setDebouncedSearch(''); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  >
                    <X size={13} />
                  </button>
                ) : isTabFetching ? (
                  <RefreshCw size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />
                ) : null}
              </div>
            </div>

            {/* Quick Category & Class Filter Bar for Teachers */}
            {activeTab === 'teachers' && (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-slate-100/70 dark:bg-white/3 rounded-2xl border border-slate-200/60 dark:border-white/5">
                {/* Category Type Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleTeacherCategoryChange('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      teacherCategoryType === 'ALL'
                        ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-md shadow-rose-500/20'
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <Users size={13} />
                    <span>All Teachers</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-black">
                      {tabResult?.summary?.totalMatching !== undefined ? tabResult.summary.totalMatching : (teacherFiltersData?.totalCount ?? total)}
                    </span>
                  </button>

                  <button
                    onClick={() => handleTeacherCategoryChange('School')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      teacherCategoryType === 'School'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <SchoolIcon size={13} />
                    <span>School Teachers</span>
                    {(tabResult?.summary?.schoolTeachersCount !== undefined || teacherFiltersData?.schoolCount !== undefined) && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-100 font-black">
                        {tabResult?.summary?.schoolTeachersCount !== undefined ? tabResult.summary.schoolTeachersCount : teacherFiltersData?.schoolCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleTeacherCategoryChange('Private Tutor')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      teacherCategoryType === 'Private Tutor'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <GraduationCap size={13} />
                    <span>Private Tutors / Teachers</span>
                    {(tabResult?.summary?.privateTeachersCount !== undefined || teacherFiltersData?.privateCount !== undefined) && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-100 font-black">
                        {tabResult?.summary?.privateTeachersCount !== undefined ? tabResult.summary.privateTeachersCount : teacherFiltersData?.privateCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Class Quick Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1 shrink-0">Class:</span>
                  {['ALL', '5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => handleTeacherClassChange(cls)}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        teacherClassFilter === cls
                          ? 'bg-rose-500 text-white font-black shadow-sm'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-white/10'
                      }`}
                    >
                      {cls === 'ALL' ? 'All' : `Cls ${cls}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List Table */}
            {isTabLoading && items.length === 0 ? (
              <FlipkartTableSkeleton rows={8} cols={5} hasThumbnail={false} />
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Filter size={20} />
                </div>
                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">No {activeTab} found</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  {isFiltered ? 'No records match your active search or filters. Try clearing filters.' : `No ${activeTab} records have been added yet.`}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {isFiltered && (
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  {canCreate && (
                    <button
                      onClick={openCreateModal}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg text-xs hover:brightness-110 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
                    >
                      <Plus size={14} /> Add {activeTab.slice(0, -1)}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/60 dark:bg-white/5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/5">
                    <tr>
                      {activeTab === 'states' && (
                        <>
                          <th className="py-3 px-3">State Name</th>
                          <th className="py-3 px-3">Code</th>
                          <th className="py-3 px-3">Districts</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'districts' && (
                        <>
                          <th className="py-3 px-3">District Name</th>
                          <th className="py-3 px-3">State</th>
                          <th className="py-3 px-3">Zones Count</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'zones' && (
                        <>
                          <th className="py-3 px-3">Zone Name</th>
                          <th className="py-3 px-3">District</th>
                          <th className="py-3 px-3">State</th>
                          <th className="py-3 px-3">Schools Count</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'boards' && (
                        <>
                          <th className="py-3 px-3">Board Name</th>
                          <th className="py-3 px-3">Code</th>
                          <th className="py-3 px-3">Schools Count</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'schools' && (
                        <>
                          <th className="py-3 px-3">School Name</th>
                          <th className="py-3 px-3">Type</th>
                          <th className="py-3 px-3">Board</th>
                          <th className="py-3 px-3">Zone & District</th>
                          <th className="py-3 px-3">Teachers</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'teachers' && (
                        <>
                          <th className="py-3 px-3">Teacher & Type</th>
                          <th className="py-3 px-3">Classes</th>
                          <th className="py-3 px-3">Subjects</th>
                          <th className="py-3 px-3">School / Coaching</th>
                          <th className="py-3 px-3">District & Zone</th>
                          <th className="py-3 px-3">Contact</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                    {activeTab === 'states' && items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/2 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <MapPin size={14} className="text-indigo-500 shrink-0" />
                          <span>{item.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px]">
                            {item.code || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                          {item._count?.districts !== undefined ? item._count.districts : (item.districts?.length || 0)} districts
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                              title="Edit State"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete State"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'districts' && items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/2 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Building size={14} className="text-purple-500 shrink-0" />
                          <span>{item.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">{item.state?.name || '—'}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                          {item._count?.zones !== undefined ? item._count.zones : (item.zones?.length || 0)} zones
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
                              title="Edit District"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete District"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'zones' && items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/2 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Navigation size={14} className="text-cyan-500 shrink-0" />
                          <span>{item.name}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-purple-600 dark:text-purple-400">
                          {item.district?.name || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                          {item.district?.state?.name || '—'}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                          {item._count?.schools !== undefined ? item._count.schools : (item.schools?.length || 0)} schools
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors cursor-pointer"
                              title="Edit Zone"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Zone"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'boards' && items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/2 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <BookOpen size={14} className="text-amber-500 shrink-0" />
                          <span>{item.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-[10px]">
                            {item.shortName || item.code || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                          {item._count?.schools !== undefined ? item._count.schools : (item.schools?.length || 0)} schools
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="Edit Board"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Board"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'schools' && items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/2 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <SchoolIcon size={14} className="text-emerald-500 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          {item.address && (
                            <div className="text-[10px] text-slate-400 font-normal pl-5 truncate max-w-xs">{item.address}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${item.type === 'PUBLIC' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">{item.board?.name || '—'}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          <div className="font-medium">{item.zone?.name || '—'}</div>
                          <div className="text-[10px] text-slate-400">{item.zone?.district?.name} ({item.zone?.district?.state?.name})</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                          {item._count?.teachers !== undefined ? item._count.teachers : (item.teachers?.length || 0)} teachers
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="Edit School"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete School"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'teachers' && items.map((item) => {
                      const isPrivateTutor = item.categoryType === 'Private Tutor' || item.categoryType === 'PRIVATE_TEACHER';
                      const teacherClasses = Array.isArray(item.classes) ? item.classes : [];
                      const teacherSubjects = Array.isArray(item.subjects) && item.subjects.length > 0 
                        ? item.subjects 
                        : (item.subject ? [item.subject] : []);
                      const schoolDisplay = item.schoolName || item.school?.name || (isPrivateTutor ? 'Private Tuition / Independent' : '—');
                      const districtDisplay = item.district || item.school?.zone?.district?.name || '—';
                      const zoneDisplay = item.zone || item.school?.zone?.name;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/2 transition-colors">
                          {/* Teacher Name & Category */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              {isPrivateTutor ? (
                                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                  <GraduationCap size={15} />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                  <Users size={15} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="block font-bold text-slate-900 dark:text-white truncate max-w-xs">{item.name}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {isPrivateTutor ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                                      Private Tutor
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                                      School Teacher
                                    </span>
                                  )}
                                  {item.designation && item.designation !== 'Subject Teacher' && item.designation !== 'Private Tutor' && (
                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                                      • {item.designation}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Classes */}
                          <td className="py-3 px-3">
                            {teacherClasses.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[140px]">
                                {teacherClasses.slice(0, 4).map((c) => (
                                  <span
                                    key={c}
                                    className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[10px]"
                                  >
                                    Cls {c}
                                  </span>
                                ))}
                                {teacherClasses.length > 4 && (
                                  <span
                                    className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold text-[10px]"
                                    title={teacherClasses.join(', ')}
                                  >
                                    +{teacherClasses.length - 4}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Subjects */}
                          <td className="py-3 px-3">
                            {teacherSubjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[160px]">
                                {teacherSubjects.slice(0, 2).map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold text-[10px] truncate max-w-[150px]"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {teacherSubjects.length > 2 && (
                                  <span
                                    className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold text-[10px]"
                                    title={teacherSubjects.join(', ')}
                                  >
                                    +{teacherSubjects.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* School / Coaching & Type */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-xs" title={schoolDisplay}>
                              {schoolDisplay}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.schoolType && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                                  {item.schoolType}
                                </span>
                              )}
                              {item.board && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                  {item.board}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* District & Zone */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                              <MapPin size={11} className="text-purple-500 shrink-0" />
                              <span className="truncate max-w-[130px]">{districtDisplay}</span>
                            </div>
                            {zoneDisplay && (
                              <div className="text-[10px] text-slate-400 pl-4 truncate max-w-[130px]">
                                {zoneDisplay}
                              </div>
                            )}
                          </td>

                          {/* Contact Info */}
                          <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone size={12} className="text-emerald-500 shrink-0" />
                              <span className="font-mono tracking-tight">{item.phone}</span>
                            </div>
                            {item.email && (
                              <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5 truncate max-w-[140px]">
                                <Mail size={10} className="shrink-0" />
                                <span className="truncate">{item.email}</span>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right space-x-1">
                            {canEdit && (
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Edit Teacher"
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete Teacher"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls Bar */}
            {items.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                {/* Entry Range and Total */}
                <div className="flex items-center gap-3">
                  <span>
                    Showing <strong className="text-slate-700 dark:text-slate-200">{((page - 1) * limit) + 1}</strong> to{' '}
                    <strong className="text-slate-700 dark:text-slate-200">{Math.min(page * limit, total)}</strong> of{' '}
                    <strong className="text-slate-700 dark:text-slate-200">{total}</strong> records
                  </span>

                  {/* Limit per page selector */}
                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-white/10">
                    <span>Per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 font-bold text-slate-700 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1 self-center sm:self-auto">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="First Page"
                  >
                    <ChevronsLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div className="px-3 py-1 font-semibold text-xs text-slate-700 dark:text-slate-200">
                    Page <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{currentPage}</span> of{' '}
                    <span className="font-extrabold">{totalPages}</span>
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Last Page"
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-3 shrink-0 mb-2">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Add' : 'Edit'} {activeTab.slice(0, -1).toUpperCase()}
              </h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 flex flex-col justify-between space-y-3 text-xs">
              {/* Form Fields according to activeTab */}
              {activeTab === 'states' && (
                <>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">State Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. West Bengal"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">State Code</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. WB"
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none uppercase font-bold"
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
                    options={refStates.map((s) => ({ value: s.id, label: s.name }))}
                    value={formData.stateId || ''}
                    onChange={(v) => setFormData({ ...formData, stateId: v })}
                    accentColor="indigo"
                  />
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">District Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Kolkata"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
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
                    options={allDistricts.map((d) => ({ value: d.id, label: `${d.name} (${d.state?.name || ''})` }))}
                    value={formData.districtId || ''}
                    onChange={(v) => setFormData({ ...formData, districtId: v })}
                    accentColor="purple"
                  />
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Zone Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. North 24 Parganas Urban Zone"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
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
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Central Board of Secondary Education"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Short Name / Code</label>
                    <input
                      type="text"
                      value={formData.shortName || formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value, code: e.target.value })}
                      placeholder="e.g. CBSE"
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none uppercase font-bold"
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
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. St. Xavier's Collegiate School"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
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
                    onChange={(v) => setFormData({ ...formData, type: v })}
                    accentColor="emerald"
                  />
                  <SearchSelect
                    label="Select Zone"
                    required
                    placeholder="Choose Zone..."
                    searchPlaceholder="Search zones..."
                    options={allZones.map((z) => ({ value: z.id, label: `${z.name} (${z.district?.name || ''})` }))}
                    value={formData.zoneId || ''}
                    onChange={(v) => setFormData({ ...formData, zoneId: v })}
                    accentColor="cyan"
                  />
                  <SearchSelect
                    label="Select Board (CBSE/State)"
                    required
                    placeholder="Choose Board..."
                    searchPlaceholder="Search boards..."
                    options={refBoards.map((b) => ({ value: b.id, label: b.name }))}
                    value={formData.boardId || ''}
                    onChange={(v) => setFormData({ ...formData, boardId: v })}
                    accentColor="amber"
                  />
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. 30 Park Street, Kolkata - 700016"
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'teachers' && (
                <>
                  {/* Category Type Selection */}
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Teacher Category Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, categoryType: 'School' })}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          (formData.categoryType || 'School') === 'School'
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <SchoolIcon size={14} />
                        <span>School Teacher</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, categoryType: 'Private Tutor' })}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          formData.categoryType === 'Private Tutor'
                            ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <GraduationCap size={14} />
                        <span>Private Tutor / Teacher</span>
                      </button>
                    </div>
                  </div>

                  {/* Teacher Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Teacher Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Subir Mukherjee"
                        required
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Phone Number *</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 9830123456"
                        required
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none font-bold font-mono"
                      />
                    </div>
                  </div>

                  {/* Classes Multi-select Chips */}
                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Classes Taught (Class-wise)</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl">
                      {['5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => {
                        const isSelected = (formData.classes || []).includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => {
                              const cur = formData.classes || [];
                              const updated = isSelected
                                ? cur.filter((c) => c !== cls)
                                : [...cur, cls].sort((a, b) => Number(a) - Number(b));
                              setFormData({ ...formData, classes: updated });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <span>Class {cls}</span>
                            {isSelected && <Check size={11} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Subject(s)</label>
                      <input
                        type="text"
                        value={formData.subject || (Array.isArray(formData.subjects) ? formData.subjects.join(', ') : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          const subs = val.split(',').map((s) => s.trim()).filter(Boolean);
                          setFormData({ ...formData, subject: val, subjects: subs });
                        }}
                        placeholder="e.g. Mathematics, Bengali"
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email (Optional)</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="teacher@example.com"
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* School / Coaching Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        {(formData.categoryType || 'School') === 'Private Tutor' ? 'Coaching / Tuition Name' : 'School Name'}
                      </label>
                      <input
                        type="text"
                        value={formData.schoolName || ''}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        placeholder={(formData.categoryType || 'School') === 'Private Tutor' ? 'e.g. Apex Tutorials / Home Tuition' : 'e.g. Behala High School'}
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Institution Type</label>
                      <select
                        value={formData.schoolType || 'HS School'}
                        onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none font-bold text-slate-700 dark:text-slate-200 text-xs cursor-pointer"
                      >
                        <option value="HS School">HS School (Higher Secondary)</option>
                        <option value="Primary School">Primary School</option>
                        <option value="Kg/Nursery School">Kg/Nursery School</option>
                        <option value="CBSE SCHOOL">CBSE SCHOOL</option>
                        <option value="Private Coaching">Private Coaching</option>
                      </select>
                    </div>
                  </div>

                  {/* District & Zone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">District</label>
                      <input
                        type="text"
                        value={formData.district || ''}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        placeholder="e.g. KOLKATA, NORTH 24 PARGANAS"
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Zone / Area</label>
                      <input
                        type="text"
                        value={formData.zone || ''}
                        onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                        placeholder="e.g. SOUTH KOLKATA, BEHALA"
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {saveMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>{saveMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
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
