import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProductsAPI, updateProductAPI, deleteProductAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { ShoppingBag, Trash2, Edit2, HelpCircle, Check, Image, Percent, Plus } from 'lucide-react';

const Products = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Find products menu permission configuration dynamically from DB rules
  const { permissions } = useAuth();
  const productPermission = permissions.find(p => p.menu.path === '/products');

  const canCreate = user?.role === 'SUPERADMIN' || (productPermission?.actions?.includes('canCreate') ?? false);
  const canEdit = user?.role === 'SUPERADMIN' || (productPermission?.actions?.includes('canEdit') ?? false);
  const canDelete = user?.role === 'SUPERADMIN' || (productPermission?.actions?.includes('canDelete') ?? false);
  const canToggleStatus = user?.role === 'SUPERADMIN' || (productPermission?.actions?.includes('canEdit') ?? false);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null,
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getProductsAPI(null, page, limit);
      if (res.success) {
        setProducts(res.data);
        setCurrentPage(res.currentPage || page);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setError('Error loading products list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  const handleToggleStatus = (prod) => {
    if (!canToggleStatus) return;

    const nextStatus = !prod.status;
    const targetStatusText = nextStatus ? 'Active' : 'Inactive';

    setConfirmModal({
      isOpen: true,
      title: 'Change Product Status?',
      message: `Are you sure you want to change the status of the product '${prod.name}' to ${targetStatusText}?`,
      confirmText: 'Change Status',
      onConfirm: async () => {
        try {
          const formData = new FormData();
          formData.append('status', String(nextStatus));

          const res = await updateProductAPI(prod.id, formData);
          if (res.success) {
            setSuccess(`Status of '${prod.name}' is now ${targetStatusText}.`);
            fetchProducts();
            setTimeout(() => setSuccess(''), 3000);
          }
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Error updating status');
        }
      }
    });
  };

  const handleDeleteProduct = (prod) => {
    if (!canDelete) return;

    setConfirmModal({
      isOpen: true,
      title: 'Delete Product?',
      message: `Are you sure you want to delete the product '${prod.name}'? This action cannot be undone.`,
      confirmText: 'Delete Product',
      onConfirm: async () => {
        try {
          const res = await deleteProductAPI(prod.id);
          if (res.success) {
            setSuccess('Product deleted successfully.');
            fetchProducts();
            setTimeout(() => setSuccess(''), 3000);
          }
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Error deleting product');
        }
      }
    });
  };

  const isNewProduct = (createdAtString) => {
    if (!createdAtString) return false;
    const createdAt = new Date(createdAtString);
    const now = new Date();
    const diffInHours = (now - createdAt) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };

  const renderProductLogo = (logoPath) => {
    if (!logoPath) {
      return (
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
          <Image size={18} />
        </div>
      );
    }
    return (
      <img src={logoPath} alt="Product" className="w-10 h-10 rounded-lg object-cover border border-slate-200/60 dark:border-white/5" />
    );
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pt-[70px]">
        <Navbar />
        
        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {/* Header Actions Panel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShoppingBag className="text-indigo-500" />
                Products Manager
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage category wise products, discounts, prices, coupons and gallery folders.
              </p>
            </div>
            
            {canCreate && (
              <button
                onClick={() => navigate('/products/form')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Create Product</span>
              </button>
            )}
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold animate-fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold animate-fade-in flex items-center gap-2">
              <Check size={14} className="animate-bounce" />
              {success}
            </div>
          )}

          {/* Expanded Table Listing Card */}
          <div className="glass-card p-6 border-slate-200/60 dark:border-white/5 w-full animate-fade-in">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">
              Registered Products
            </h2>

            {loading ? (
              <div className="text-center py-10 text-xs font-semibold text-slate-400">
                Loading Products...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                <ShoppingBag className="mx-auto text-slate-300 dark:text-slate-600 mb-2 animate-bounce" size={32} />
                <p className="text-xs font-semibold text-slate-400">No products registered yet. Click "Create Product" to start.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-white/5 text-slate-400 uppercase tracking-wider font-bold">
                      <th className="p-4 pl-0">Info</th>
                      <th className="p-4">Category Path</th>
                      <th className="p-4 text-center">Price</th>
                      <th className="p-4 text-center">Discount</th>
                      <th className="p-4 text-center">Final Price</th>
                      <th className="p-4 text-center">Status</th>
                      {(canEdit || canDelete) && <th className="p-4 text-right pr-0">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                        <td className="p-4 pl-0">
                          <div className="flex items-center gap-3">
                            {renderProductLogo(prod.image)}
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{prod.name}</span>
                                {isNewProduct(prod.createdAt) && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                    New
                                  </span>
                                )}
                              </div>
                              {prod.coupon && (
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-1.5 py-0.5 rounded mt-0.5 w-max font-bold">
                                  Coupon: {prod.coupon}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {prod.category ? (
                            <span className="text-slate-400">
                              {prod.category.subject?.class?.board?.shortName || ''} &gt;{' '}
                              {prod.category.subject?.class?.name || ''} &gt;{' '}
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {prod.category.name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-500">Unlinked</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          RS. {parseFloat(prod.price || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          {prod.discount > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-pink-500 font-bold">
                              <Percent size={10} />
                              {prod.discount}%
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-emerald-500">
                          RS. {parseFloat(prod.discountedPrice || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          {canToggleStatus ? (
                            <button
                              onClick={() => handleToggleStatus(prod)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                                prod.status
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${prod.status ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                              <span>{prod.status ? 'Active' : 'Inactive'}</span>
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                prod.status
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/10'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${prod.status ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                              <span>{prod.status ? 'Active' : 'Inactive'}</span>
                            </span>
                          )}
                        </td>
                        {(canEdit || canDelete) && (
                          <td className="p-4 text-right pr-0">
                            <div className="inline-flex gap-2">
                              {canEdit && (
                                <button
                                  onClick={() => navigate(`/products/form/${prod.id}`)}
                                  className="p-2 rounded-lg border border-slate-200/60 dark:border-white/5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-500 dark:hover:text-indigo-400 dark:hover:bg-white/5 transition-all cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteProduct(prod)}
                                  className="p-2 rounded-lg border border-slate-200/60 dark:border-white/5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-white/5 transition-all cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
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
            </>
          )}
        </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 border border-slate-200/60 dark:border-white/5 shadow-2xl animate-scale-up text-left">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2 font-bold">
              <HelpCircle className="text-indigo-500 shrink-0" size={20} />
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 text-xs">
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
  );
};

export default Products;
