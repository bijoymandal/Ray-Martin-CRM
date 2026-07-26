import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBoardsAPI, getClassesAPI, getSubjectsAPI, getCategoriesAPI, getProductsAPI, createProductAPI, updateProductAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchSelect from '../components/SearchSelect';
import { Upload, X, ArrowLeft, Percent, Tag, IndianRupee, Check, Eye, BookOpen, GraduationCap, FlaskConical, Layers } from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [activeLightBox, setActiveLightBox] = useState(null);

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

  const { permissions } = useAuth();
  const productPermission = permissions.find(p => p.menu.path === '/products');

  useEffect(() => {
    if (user && user.role !== 'SUPERADMIN') {
      const hasPerm = id 
        ? (productPermission?.actions?.includes('canEdit') ?? false)
        : (productPermission?.actions?.includes('canCreate') ?? false);
      
      if (!hasPerm) {
        navigate('/products');
        return;
      }
    }
    loadMetadataAndProduct();
  }, [id, user, productPermission]);

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
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pt-[70px]">
        <Navbar />

        <div className="flex-1 p-6 md:p-8 space-y-2 overflow-y-auto max-w-9xl w-full mx-auto">
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
              <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {id ? 'Edit Product Workspace' : 'Create New Product'}
                {!id && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 animate-pulse">
                    New Product
                  </span>
                )}
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
            <div className="glass-card p-6 md:p-8 border-slate-200/60 dark:border-white/5">
              <form onSubmit={handleSubmit} className="space-y-6 text-xs" autoComplete="off">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column - Product Image & Gallery with visual view triggers */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* 1. Product Logo (Main Image) with View */}
                    <div className="glass-card p-5 border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-white/1">
                      <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3">Product Logo</h3>
                      <div className="space-y-4">
                        {logoPreview ? (
                          <div className="relative group w-full aspect-square rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-dark-deep flex items-center justify-center shadow-inner">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            {/* Magnify/View overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
                              <button
                                type="button"
                                onClick={() => setActiveLightBox(logoPreview)}
                                className="p-2.5 bg-white/20 hover:bg-white/35 backdrop-blur-md rounded-full text-white transition-all transform scale-90 group-hover:scale-100 cursor-pointer"
                                title="View Image"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="p-2.5 bg-rose-500/80 hover:bg-rose-500 rounded-full text-white transition-all transform scale-90 group-hover:scale-100 cursor-pointer"
                                title="Remove Image"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl aspect-square text-xs font-semibold text-slate-400 hover:text-indigo-500 hover:border-indigo-500/40 transition-all cursor-pointer bg-slate-50/40 dark:bg-white/1">
                            <Upload size={24} className="text-slate-400" />
                            <span>Upload Main Logo</span>
                            <span className="text-[9px] text-slate-500">Max 2MB (JPG, PNG, GIF)</span>
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/gif"
                              onChange={handleLogoChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Divider line */}
                    <div className="border-t border-slate-200 dark:border-white/5 my-6" />

                    {/* 2. Product Gallery with View */}
                    <div className="glass-card p-5 border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-white/1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Image Gallery</h3>
                        <span className="text-[9px] text-slate-500 font-bold">{galleryPreviews.length} / 10</span>
                      </div>
                      
                      <div className="space-y-4">
                        {galleryPreviews.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 p-2 border border-slate-200/60 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-dark-deep shadow-inner">
                            {galleryPreviews.map((item, idx) => (
                              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/2 flex items-center justify-center">
                                <img src={item.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity duration-150">
                                  <button
                                    type="button"
                                    onClick={() => setActiveLightBox(item.url)}
                                    className="p-1 bg-white/20 hover:bg-white/40 rounded-full text-white cursor-pointer"
                                    title="View Image"
                                  >
                                    <Eye size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGalleryItem(idx)}
                                    className="p-1 bg-rose-500/80 hover:bg-rose-500 rounded-full text-white cursor-pointer"
                                    title="Remove"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl py-3 text-xs font-semibold text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all cursor-pointer text-center bg-slate-50/40 dark:bg-white/1">
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
                  </div>

                  {/* Right Column - Product details, dropdowns, available features */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* 1. Product Name */}
                    <div className="glass-card p-5 border-slate-200/60 dark:border-white/5 space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Name *</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. CBSE Practical Physics Manual"
                          className="w-full bg-white dark:bg-dark-input border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                          autoComplete="off"
                        />
                      </div>

                      {/* 2. Product Description with CKEditor */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product Description (Rich Editor)</label>
                        <div className="ckeditor-wrapper">
                          <CKEditor
                            editor={ClassicEditor}
                            data={description}
                            onChange={(event, editor) => {
                              const data = editor.getData();
                              setDescription(data);
                            }}
                            config={{
                              placeholder: 'Write key specifications, description parameters, or package features here...',
                              toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'undo', 'redo']
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Dropdown lists — SearchSelect with live search */}
                    <div className="glass-card p-5 border-slate-200/60 dark:border-white/5 space-y-4 bg-slate-50/30 dark:bg-white/1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/10">
                          <GraduationCap size={13} className="text-indigo-500" />
                        </div>
                        <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Educational Taxonomy Path</h3>
                      </div>

                      {/* Cascade breadcrumb trail */}
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider flex-wrap">
                        <span className={selectedBoardId ? 'text-indigo-500' : ''}>
                          {boards.find(b => b.id === selectedBoardId)?.name || 'Board'}
                        </span>
                        <span>›</span>
                        <span className={selectedClassId ? 'text-purple-500' : ''}>
                          {filteredClasses.find(c => c.id === selectedClassId)?.name || 'Class'}
                        </span>
                        <span>›</span>
                        <span className={selectedSubjectId ? 'text-cyan-500' : ''}>
                          {filteredSubjects.find(s => s.id === selectedSubjectId)?.name || 'Subject'}
                        </span>
                        <span>›</span>
                        <span className={selectedCategoryId ? 'text-emerald-500' : ''}>
                          {filteredCategories.find(c => c.id === selectedCategoryId)?.name || 'Category'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Board */}
                        <SearchSelect
                          label="Board"
                          placeholder="Choose a board..."
                          searchPlaceholder="Search boards..."
                          options={boards.map(b => ({ value: b.id, label: b.name }))}
                          value={selectedBoardId}
                          onChange={handleBoardChange}
                          accentColor="indigo"
                          icon={<BookOpen size={13} />}
                          emptyText="No boards available"
                        />

                        {/* Class */}
                        <SearchSelect
                          label="Class"
                          placeholder={selectedBoardId ? 'Choose a class...' : 'Select a board first'}
                          searchPlaceholder="Search classes..."
                          options={filteredClasses.map(c => ({ value: c.id, label: c.name }))}
                          value={selectedClassId}
                          onChange={handleClassChange}
                          disabled={!selectedBoardId}
                          accentColor="purple"
                          icon={<GraduationCap size={13} />}
                          emptyText="No classes for this board"
                        />

                        {/* Subject */}
                        <SearchSelect
                          label="Subject"
                          placeholder={selectedClassId ? 'Choose a subject...' : 'Select a class first'}
                          searchPlaceholder="Search subjects..."
                          options={filteredSubjects.map(s => ({ value: s.id, label: s.name }))}
                          value={selectedSubjectId}
                          onChange={handleSubjectChange}
                          disabled={!selectedClassId}
                          accentColor="cyan"
                          icon={<FlaskConical size={13} />}
                          emptyText="No subjects for this class"
                        />

                        {/* Category */}
                        <SearchSelect
                          label="Category"
                          required
                          placeholder={selectedSubjectId ? 'Choose a category...' : 'Select a subject first'}
                          searchPlaceholder="Search categories..."
                          options={filteredCategories.map(c => ({ value: c.id, label: c.name }))}
                          value={selectedCategoryId}
                          onChange={setSelectedCategoryId}
                          disabled={!selectedSubjectId}
                          accentColor="emerald"
                          icon={<Layers size={13} />}
                          emptyText="No categories for this subject"
                        />
                      </div>
                    </div>

                    {/* 4. Available options & pricing grid */}
                    <div className="glass-card p-5 border-slate-200/60 dark:border-white/5 space-y-4 bg-slate-50/20 dark:bg-white/1">
                      <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Pricing & Coupon Offer Configuration</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-0.5">
                            <IndianRupee size={10} /> Base Price (RS.) *
                          </label>
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="180"
                            className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                            autoComplete="off"
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
                            className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                            autoComplete="off"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-0.5">
                            Calculated Price
                          </label>
                          <div className="w-full bg-slate-100 dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 font-bold text-emerald-500 flex items-center justify-center">
                            RS. {parseFloat(getCalculatedPrice() || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-white/5 pt-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-0.5">
                            <Tag size={10} /> Coupon Code
                          </label>
                          <input
                            type="text"
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value)}
                            placeholder="e.g. CBSE10"
                            className="w-full bg-white dark:bg-dark-deep border border-slate-200 dark:border-white/5 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none uppercase font-bold text-indigo-500"
                            autoComplete="off"
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

                        <div className="flex items-center gap-2 pt-5">
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
                      </div>
                    </div>

                    {/* Footer Actions buttons inside Right Column */}
                    <div className="flex gap-4 pt-4 border-t border-slate-200/60 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="flex-1 py-3.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/5 transition-all cursor-pointer text-center"
                      >
                        Cancel Workspace
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3.5 font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all cursor-pointer text-center"
                      >
                        {id ? 'Save Changes' : 'Create Product'}
                      </button>
                    </div>

                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox full-screen image viewer modal */}
      {activeLightBox && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-6"
          onClick={() => setActiveLightBox(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer transition-all"
            onClick={() => setActiveLightBox(null)}
          >
            <X size={20} />
          </button>
          <div 
            className="max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl flex items-center justify-center animate-slide-up"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
          >
            <img src={activeLightBox} alt="Preview Zoomed" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;
