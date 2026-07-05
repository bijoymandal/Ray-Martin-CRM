import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBoardsAPI, getClassesAPI, getSubjectsAPI, getCategoriesAPI, getProductsAPI, createProductAPI, updateProductAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Upload, X, ArrowLeft, Image, Percent, Tag, DollarSign, Check } from 'lucide-react';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown lists
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);

  // Cascading selections for Product form
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [status, setStatus] = useState(true);
  const [offer, setOffer] = useState(false);
  const [coupon, setCoupon] = useState('');

  // Logo & Gallery Upload Files & Previews
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // Calculate discounted price auto-rounded
  const getCalculatedPrice = () => {
    const rawPrice = parseFloat(price);
    const rawDiscount = parseFloat(discount);
    if (isNaN(rawPrice)) return 0;
    if (isNaN(rawDiscount) || rawDiscount <= 0) return Math.round(rawPrice);
    return Math.round(rawPrice - (rawPrice * rawDiscount / 100));
  };

  const loadMetadataAndProduct = async () => {
    setLoading(true);
    try {
      // 1. Fetch dropdown metadata first
      const boardsRes = await getBoardsAPI();
      if (boardsRes.success) setBoards(boardsRes.data);

      const classesRes = await getClassesAPI();
      if (classesRes.success) setClasses(classesRes.data);

      const subjectsRes = await getSubjectsAPI();
      if (subjectsRes.success) setSubjects(subjectsRes.data);

      const categoriesRes = await getCategoriesAPI();
      if (categoriesRes.success) setCategories(categoriesRes.data);

      // 2. If editing, fetch products list and find target id
      if (id) {
        const prodRes = await getProductsAPI();
        if (prodRes.success) {
          const prod = prodRes.data.find(p => p.id === id);
          if (prod) {
            setName(prod.name);
            setDescription(prod.description || '');
            setPrice(String(prod.price));
            setDiscount(String(prod.discount));
            setStatus(prod.status);
            setOffer(prod.offer);
            setCoupon(prod.coupon || '');
            setSelectedCategoryId(prod.categoryId);

            // Pre-populate dropdown cascades
            const catObj = categoriesRes.data.find((c) => c.id === prod.categoryId);
            if (catObj && catObj.subject) {
              setSelectedSubjectId(catObj.subject.id);
              if (catObj.subject.class) {
                setSelectedClassId(catObj.subject.class.id);
                if (catObj.subject.class.board) {
                  setSelectedBoardId(catObj.subject.class.board.id);
                }
              }
            }

            setLogoFile(null);
            setLogoPreview(prod.image || null);

            if (prod.gallery) {
              const serverPreviews = prod.gallery.map(url => ({
                url,
                isExisting: true
              }));
              setGalleryPreviews(serverPreviews);
              setGalleryFiles([]);
            }
          } else {
            setError('Product details not found.');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error loading editor workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetadataAndProduct();
  }, [id]);

  // Cascading lists logic
  const filteredClasses = classes.filter((c) => c.boardId === selectedBoardId);
  const filteredSubjects = subjects.filter((s) => s.classId === selectedClassId);
  const filteredCategories = categories.filter((cat) => cat.subjectId === selectedSubjectId);

  // Reset dropdown cascades when parent selections change
  const handleBoardChange = (boardIdVal) => {
    setSelectedBoardId(boardIdVal);
    setSelectedClassId('');
    setSelectedSubjectId('');
    setSelectedCategoryId('');
  };

  const handleClassChange = (classIdVal) => {
    setSelectedClassId(classIdVal);
    setSelectedSubjectId('');
    setSelectedCategoryId('');
  };

  const handleSubjectChange = (subjectIdVal) => {
    setSelectedSubjectId(subjectIdVal);
    setSelectedCategoryId('');
  };

  // Main Image selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Main product image exceeds 2MB limit.');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and GIF formats are allowed.');
      return;
    }

    setError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // Gallery Images selection
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newFiles = [];
    const newPreviews = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        setError(`File '${file.name}' exceeds the 2MB size limit.`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setError(`File '${file.name}' uses an unsupported image format.`);
        return;
      }
      newFiles.push(file);
      newPreviews.push({
        file,
        url: URL.createObjectURL(file),
        isExisting: false
      });
    }

    setError('');
    setGalleryFiles((prev) => [...prev, ...newFiles]);
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleRemoveGalleryItem = (indexToRemove) => {
    const item = galleryPreviews[indexToRemove];
    if (item.isExisting) {
      setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    } else {
      const fileToRemove = item.file;
      setGalleryFiles((prev) => prev.filter((f) => f !== fileToRemove));
      setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!price || isNaN(parseFloat(price))) {
      setError('Valid Price is required.');
      return;
    }
    if (!selectedCategoryId) {
      setError('Please select a Category.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('price', price);
    formData.append('discount', discount || '0');
    formData.append('status', String(status));
    formData.append('offer', String(offer));
    formData.append('coupon', coupon.trim());
    formData.append('categoryId', selectedCategoryId);

    if (logoFile) {
      formData.append('image', logoFile);
    }

    galleryFiles.forEach((file) => {
      formData.append('gallery', file);
    });

    if (id) {
      const existingPaths = galleryPreviews
        .filter(item => item.isExisting)
        .map(item => item.url);
      
      existingPaths.forEach(path => {
        formData.append('existingGallery', path);
      });
    }

    try {
      let res;
      if (id) {
        res = await updateProductAPI(id, formData);
      } else {
        res = await createProductAPI(formData);
      }

      if (res.success) {
        setSuccess(id ? 'Product updated successfully!' : 'Product created successfully!');
        setTimeout(() => {
          navigate('/products');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error processing product details');
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-4xl w-full mx-auto">
          {/* Header Action Back Link */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/products')}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              title="Back to products list"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {id ? 'Edit Product Workspace' : 'Create New Product'}
              </h1>
              <p className="text-[11px] text-slate-400">
                {id ? 'Modify details, price and image gallery references' : 'Register a new catalog item'}
              </p>
            </div>
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

          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400 font-semibold">
              Loading workspace configurations...
            </div>
          ) : (
            <div className="glass-card p-8 border-slate-200/60 dark:border-white/5">
              <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                
                {/* Category path selector dropdowns */}
                <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-white/2 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Category Hierarchy Path Selector</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Board</label>
                      <select
                        value={selectedBoardId}
                        onChange={(e) => handleBoardChange(e.target.value)}
                        className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Choose Board --</option>
                        {boards.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Class</label>
                      <select
                        value={selectedClassId}
                        disabled={!selectedBoardId}
                        onChange={(e) => handleClassChange(e.target.value)}
                        className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">-- Choose Class --</option>
                        {filteredClasses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Subject</label>
                      <select
                        value={selectedSubjectId}
                        disabled={!selectedClassId}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">-- Choose Subject --</option>
                        {filteredSubjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Category *</label>
                      <select
                        value={selectedCategoryId}
                        disabled={!selectedSubjectId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 font-bold text-indigo-600 dark:text-indigo-400"
                      >
                        <option value="">-- Choose Category --</option>
                        {filteredCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. CBSE Practical Physics Manual"
                      className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Short descriptions of parameters..."
                      className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 h-20 resize-none focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Price & calculation details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-white/2 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-0.5">
                      <DollarSign size={10} /> Base Price ($) *
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="180"
                      className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-0.5">
                      <Percent size={10} /> Discount (%)
                    </label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="10"
                      className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-3 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated Discount Price (Auto-Rounded):</span>
                    <span className="text-sm font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                      ${getCalculatedPrice()}
                    </span>
                  </div>
                </div>

                {/* Coupons & Flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-0.5">
                      <Tag size={10} /> Coupon Code
                    </label>
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="e.g. CBSE10"
                      className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="offer"
                      checked={offer}
                      onChange={(e) => setOffer(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 dark:border-white/10 dark:bg-dark-deep cursor-pointer"
                    />
                    <label htmlFor="offer" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer select-none">
                      Active Offer
                    </label>
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product Logo (Main Image)</label>
                  <div className="flex flex-col gap-2.5">
                    {logoPreview && (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                        <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full hover:bg-black text-white transition-all cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}

                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-semibold text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all cursor-pointer text-center">
                      <Upload size={14} />
                      <span>{logoFile ? logoFile.name : 'Select File'}</span>
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/gif"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Gallery uploads */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Multiple Image Gallery (Max 10)</label>
                  <div className="space-y-3">
                    {galleryPreviews.length > 0 && (
                      <div className="grid grid-cols-5 gap-3 border border-slate-200/60 dark:border-white/5 p-3 rounded-xl bg-slate-50/50 dark:bg-white/2">
                        {galleryPreviews.map((item, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200/60 dark:border-white/10 bg-white dark:bg-dark-deep flex items-center justify-center">
                            <img src={item.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryItem(idx)}
                              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black text-white transition-all cursor-pointer"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-semibold text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all cursor-pointer text-center">
                      <Upload size={14} />
                      <span>Add Gallery Images</span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg, image/png, image/gif"
                        onChange={handleGalleryChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Status flag */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="status"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 dark:border-white/10 dark:bg-dark-deep cursor-pointer"
                  />
                  <label htmlFor="status" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer select-none">
                    Active Status
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-4 pt-4 border-t border-slate-200/60 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => navigate('/products')}
                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/5 transition-all cursor-pointer text-center"
                  >
                    Cancel Workspace
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all cursor-pointer text-center"
                  >
                    {id ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
