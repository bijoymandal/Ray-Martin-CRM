import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import KpiCard from '../components/KpiCard';
import { useAuth } from '../context/AuthContext';
import {
  getStockSummaryAPI,
  getProductsStockAPI,
  adjustStockAPI,
  getStockMovementsAPI,
  getStockAlertsAPI,
} from '../services/api';
import {
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Search,
  Plus,
  RefreshCw,
  TrendingUp,
  History,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  BookOpen,
  X,
} from 'lucide-react';

const StockManagement = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('inventory'); // inventory | alerts | movements
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL');

  // Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'INWARD',
    quantity: 10,
    reason: '',
    referenceNo: '',
    minStockThreshold: 10,
  });
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

  // Permissions
  const canEdit = ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'BOOKSELLER'].includes(user?.role);

  const fetchSummary = async () => {
    try {
      const res = await getStockSummaryAPI();
      if (res.success) setSummary(res.data);
    } catch (err) {
      console.error('Error fetching stock summary:', err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await getProductsStockAPI({
        status: statusFilter,
        search: search || undefined,
      });
      if (res.success) setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await getStockMovementsAPI({
        type: movementTypeFilter !== 'ALL' ? movementTypeFilter : undefined,
        search: search || undefined,
      });
      if (res.success) setMovements(res.data || []);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await getStockAlertsAPI();
      if (res.success) setAlerts(res.data || []);
    } catch (err) {
      console.error('Error fetching stock alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') fetchInventory();
    else if (activeTab === 'movements') fetchMovements();
    else if (activeTab === 'alerts') fetchAlerts();
  }, [activeTab, statusFilter, movementTypeFilter, search]);

  const openAdjustModal = (product = null, defaultType = 'INWARD') => {
    setModalError(null);
    setModalSuccess(null);
    setSelectedProduct(product);
    setFormData({
      productId: product ? product.id : '',
      type: defaultType,
      quantity: 10,
      reason: defaultType === 'INWARD' ? 'Shipment restock received from printer' : 'Inventory audit adjustment',
      referenceNo: `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      minStockThreshold: product ? product.minStockThreshold || 10 : 10,
    });
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!formData.productId) {
      setModalError('Please select a product');
      return;
    }

    setActionLoading(true);
    try {
      const res = await adjustStockAPI(formData);
      if (res.success) {
        setModalSuccess(res.message);
        setTimeout(() => {
          setShowAdjustModal(false);
          fetchSummary();
          if (activeTab === 'inventory') fetchInventory();
          else if (activeTab === 'movements') fetchMovements();
          else if (activeTab === 'alerts') fetchAlerts();
        }, 1200);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to update stock');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-100 flex flex-col">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pt-[70px]">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-l-4 border-l-emerald-500">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Package size={22} />
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Stock & Inventory Management</h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time product stock tracking, warehouse inward restocks, low stock alerts, and specimen copy audit logs.
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => openAdjustModal(null, 'INWARD')}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <Plus size={16} /> Inward Restock Stock
              </button>
            )}
          </div>

          {/* KPI Overview Widgets */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Total Warehouse Stock"
                value={`${summary.totalQuantity.toLocaleString()} units`}
                subtitle={`Across ${summary.totalProducts} published book titles`}
                icon={<Package size={16} />}
                accentColor="indigo"
              />

              <KpiCard
                title="Inventory Asset Valuation"
                value={formatCurrency(summary.totalAssetValue)}
                subtitle="Net physical inventory valuation"
                icon={<DollarSign size={16} />}
                accentColor="emerald"
              />

              <KpiCard
                title="Stock Reorder Alerts"
                value={`${summary.lowStockCount} Low`}
                subtitle="Titles below minimum threshold"
                badgeText={`${summary.outOfStockCount} Out of Stock`}
                icon={<AlertTriangle size={16} />}
                accentColor="amber"
              />

              <KpiCard
                title="Monthly Inward vs Outward"
                value={`+${summary.inwardMonth} / -${summary.outwardMonth + summary.specimenMonth}`}
                subtitle={`${summary.specimenMonth} copies issued as teacher specimens`}
                icon={<TrendingUp size={16} />}
                accentColor="cyan"
              />
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-white/5 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'inventory'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <Package size={14} /> Inventory Overview ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'alerts'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <ShieldAlert size={14} /> Reorder Alerts ({alerts.length})
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'movements'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <History size={14} /> Audit Movement Ledger
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product name, SKU, or reference number..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {activeTab === 'inventory' && (
              <SearchSelect
                placeholder="All Stock Status"
                searchPlaceholder="Filter status..."
                options={[
                  { value: 'ALL', label: 'All Stock Status' },
                  { value: 'IN_STOCK', label: 'IN STOCK' },
                  { value: 'LOW_STOCK', label: 'LOW STOCK' },
                  { value: 'OUT_OF_STOCK', label: 'OUT OF STOCK' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                accentColor="emerald"
              />
            )}

            {activeTab === 'movements' && (
              <SearchSelect
                placeholder="All Movement Types"
                searchPlaceholder="Filter type..."
                options={[
                  { value: 'ALL', label: 'All Movement Types' },
                  { value: 'INWARD', label: 'INWARD (Restock)' },
                  { value: 'OUTWARD', label: 'OUTWARD (Sales)' },
                  { value: 'SPECIMEN_ISSUE', label: 'SPECIMEN ISSUE' },
                  { value: 'ADJUSTMENT', label: 'ADJUSTMENT' },
                ]}
                value={movementTypeFilter}
                onChange={setMovementTypeFilter}
                accentColor="cyan"
              />
            )}
          </div>

          {/* Tab 1: Inventory Table */}
          {activeTab === 'inventory' && (
            <div className="glass-card p-6">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-emerald-500" /> Loading stock inventory...
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Package size={36} className="mx-auto opacity-30 mb-2" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">No products found matching stock criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/50 dark:bg-white/5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 px-3">SKU & Product Name</th>
                        <th className="px-3">Board / Class / Category</th>
                        <th className="px-3">Stock Level</th>
                        <th className="px-3">Status</th>
                        <th className="px-3">Min Threshold</th>
                        <th className="px-3">Unit Price</th>
                        <th className="px-3">Asset Value</th>
                        <th className="px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                      {products.map((p) => {
                        const maxBar = Math.max(100, p.stockQuantity);
                        const percent = Math.min(100, Math.round((p.stockQuantity / maxBar) * 100));
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <BookOpen size={14} className="text-emerald-500 shrink-0" />
                                <span>{p.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku || 'SKU-NONE'}</div>
                            </td>

                            <td className="px-3">
                              <div className="font-semibold text-slate-700 dark:text-slate-200">
                                {p.category?.name || 'Uncategorized'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {p.category?.subject?.class?.board?.shortName || ''} · {p.category?.subject?.class?.name || ''}
                              </div>
                            </td>

                            <td className="px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-slate-800 dark:text-slate-100">{p.stockQuantity}</span>
                                <span className="text-[10px] text-slate-400">copies</span>
                              </div>
                              <div className="w-24 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full ${
                                    p.stockStatus === 'IN_STOCK'
                                      ? 'bg-emerald-500'
                                      : p.stockStatus === 'LOW_STOCK'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </td>

                            <td className="px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide uppercase ${
                                  p.stockStatus === 'IN_STOCK'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : p.stockStatus === 'LOW_STOCK'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {p.stockStatus.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="px-3 text-slate-500 font-semibold">{p.minStockThreshold} copies</td>

                            <td className="px-3 font-bold text-slate-700 dark:text-slate-200">
                              ₹{p.discountedPrice > 0 ? p.discountedPrice : p.price}
                            </td>

                            <td className="px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(p.assetValue)}
                            </td>

                            <td className="px-3 text-right">
                              {canEdit && (
                                <button
                                  onClick={() => openAdjustModal(p, 'INWARD')}
                                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 font-extrabold rounded-lg text-[11px] transition-all inline-flex items-center gap-1"
                                >
                                  <Sliders size={12} /> Adjust Stock
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
            </div>
          )}

          {/* Tab 2: Reorder Alerts */}
          {activeTab === 'alerts' && (
            <div className="glass-card p-6">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-amber-500" /> Loading stock alerts...
                </div>
              ) : alerts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-500 opacity-60 mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-200">All Stock Levels Healthy!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No products are currently below minimum threshold levels.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alerts.map((al) => (
                    <div
                      key={al.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                        al.computedStatus === 'OUT_OF_STOCK'
                          ? 'bg-rose-500/5 border-rose-500/30'
                          : 'bg-amber-500/5 border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                al.computedStatus === 'OUT_OF_STOCK'
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {al.computedStatus.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{al.sku}</span>
                          </div>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">{al.name}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {al.category?.subject?.class?.board?.shortName} · {al.category?.name}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{al.stockQuantity}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">Min: {al.minStockThreshold} copies</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-white/5">
                        <div className="text-xs font-semibold text-slate-500">
                          Unit Price: ₹{al.discountedPrice || al.price}
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => openAdjustModal(al, 'INWARD')}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1"
                          >
                            <Plus size={13} /> Restock Title Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Movement Audit Ledger */}
          {activeTab === 'movements' && (
            <div className="glass-card p-6">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-cyan-500" /> Loading movement audit ledger...
                </div>
              ) : movements.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <History size={36} className="mx-auto opacity-30 mb-2" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">No stock movements recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/50 dark:bg-white/5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="px-3">Product Title & SKU</th>
                        <th className="px-3">Type</th>
                        <th className="px-3">Quantity</th>
                        <th className="px-3">Stock Change</th>
                        <th className="px-3">Reason / Ref #</th>
                        <th className="px-3 text-right">Logged By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                      {movements.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                          <td className="py-3 px-3 font-medium text-slate-500 whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>

                          <td className="px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{m.product?.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{m.product?.sku || 'SKU-NONE'}</div>
                          </td>

                          <td className="px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                m.type === 'INWARD'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : m.type === 'OUTWARD'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : m.type === 'SPECIMEN_ISSUE'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                              }`}
                            >
                              {m.type.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-3 font-extrabold text-slate-800 dark:text-slate-100">
                            {m.type === 'INWARD' ? '+' : m.type === 'OUTWARD' || m.type === 'SPECIMEN_ISSUE' ? '-' : ''}
                            {m.quantity} copies
                          </td>

                          <td className="px-3">
                            <span className="font-mono text-slate-400">{m.previousStock}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{m.newStock}</span>
                          </td>

                          <td className="px-3">
                            <div className="font-semibold text-slate-700 dark:text-slate-200">{m.reason || 'N/A'}</div>
                            {m.referenceNo && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-[9px] font-mono text-slate-500">
                                Ref: {m.referenceNo}
                              </span>
                            )}
                          </td>

                          <td className="px-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                            {m.createdBy || 'System'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STOCK ADJUSTMENT / RESTOCK MODAL */}
          {showAdjustModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="glass-card w-full max-w-lg p-6 space-y-4 relative shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-emerald-500" />
                    <h2 className="text-base font-extrabold">Stock Adjustment & Restock</h2>
                  </div>
                  <button onClick={() => setShowAdjustModal(false)} className="p-1 hover:text-rose-500">
                    <X size={16} />
                  </button>
                </div>

                {modalError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <XCircle size={16} /> {modalError}
                  </div>
                )}

                {modalSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} /> {modalSuccess}
                  </div>
                )}

                <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
                  <SearchSelect
                    label="Select Product Title"
                    required
                    placeholder="Choose Product..."
                    searchPlaceholder="Search product or SKU..."
                    options={products.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${p.sku || 'No SKU'}) — Current Stock: ${p.stockQuantity}`,
                    }))}
                    value={formData.productId}
                    onChange={(v) => setFormData({ ...formData, productId: v })}
                    accentColor="emerald"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <SearchSelect
                      label="Movement Type"
                      required
                      placeholder="Select Movement..."
                      options={[
                        { value: 'INWARD', label: 'INWARD (Warehouse Restock)' },
                        { value: 'OUTWARD', label: 'OUTWARD (Sales Dispatch)' },
                        { value: 'ADJUSTMENT', label: 'ADJUSTMENT (Audit Correction)' },
                      ]}
                      value={formData.type}
                      onChange={(v) => setFormData({ ...formData, type: v })}
                      accentColor="emerald"
                    />

                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Min Stock Threshold
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.minStockThreshold}
                        onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                        Ref No. (PO / GRN / Invoice)
                      </label>
                      <input
                        type="text"
                        value={formData.referenceNo}
                        onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                        placeholder="GRN-2026-1001"
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase tracking-wider mb-1 block">Transaction Reason</label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="e.g. Shipment received from printer / Damaged copies written off"
                      required
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-deep border rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/60 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowAdjustModal(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-md inline-flex items-center gap-1"
                    >
                      {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save Stock Adjustment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StockManagement;
