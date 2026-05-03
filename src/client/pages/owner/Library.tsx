import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/owner' },
  { label: 'My Listings', icon: 'fa-building', path: '/owner/listings' },
  { label: 'Bookings', icon: 'fa-calendar-check', path: '/owner/bookings' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/owner/revenue' },
  { label: 'Library', icon: 'fa-book-open', path: '/owner/library' },
  { label: 'Profile', icon: 'fa-user', path: '/owner/profile' },
];

// ─── Types ───────────────────────────────────────────────────
interface Library {
  id: number;
  abhyasika_id: number;
  abhyasika_name: string;
  name: string;
  description?: string;
  is_active: number;
  total_books: number;
  available_books: number;
  total_categories: number;
}

interface BookCategory {
  id: number;
  library_id: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: number;
  book_count?: number;
}

interface Book {
  id: number;
  library_id: number;
  category_id?: number;
  category_name?: string;
  category_color?: string;
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publish_year?: number;
  edition?: string;
  language: string;
  description?: string;
  cover_url?: string;
  total_copies: number;
  available_copies: number;
  is_available: number;
  rack_number?: string;
  notes?: string;
}

interface Abhyasika {
  id: number;
  name: string;
}

// ─── Small reusable components ───────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  );
}

function InputField({ label, name, type = 'text', value, onChange, required, placeholder, rows }: any) {
  const cls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {rows ? (
        <textarea name={name} rows={rows} value={value} onChange={onChange} placeholder={placeholder} className={cls} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} className={cls} />
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function OwnerLibrary() {
  const { user } = useAuth();
  const { success, error } = useToast();

  // Tab: 'libraries' | 'categories' | 'books' | 'stats'
  const [activeTab, setActiveTab] = useState<'libraries' | 'categories' | 'books' | 'stats'>('libraries');

  // Libraries
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [libLoading, setLibLoading] = useState(true);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);

  // Categories
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);

  // Books
  const [books, setBooks] = useState<Book[]>([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [bookCatFilter, setBookCatFilter] = useState('');
  const [bookPage, setBookPage] = useState(1);
  const [bookTotal, setBookTotal] = useState(0);

  // Abhyasikas (for creating library)
  const [abhyasikas, setAbhyasikas] = useState<Abhyasika[]>([]);

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Modals
  const [showCreateLib, setShowCreateLib] = useState(false);
  const [showEditLib, setShowEditLib] = useState(false);
  const [showCreateCat, setShowCreateCat] = useState(false);
  const [showEditCat, setShowEditCat] = useState<BookCategory | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showEditBook, setShowEditBook] = useState<Book | null>(null);
  const [showBookDetail, setShowBookDetail] = useState<Book | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null);

  // Forms
  const [libForm, setLibForm] = useState({ abhyasika_id: '', name: 'Library', description: '' });
  const [catForm, setCatForm] = useState({ name: '', description: '', color_code: '#6B7280' });
  const [bookForm, setBookForm] = useState({
    title: '', author: '', isbn: '', publisher: '', publish_year: '',
    edition: '', language: 'English', description: '', cover_url: '',
    total_copies: '1', available_copies: '1', category_id: '', rack_number: '', notes: ''
  });
  const [saving, setSaving] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchLibraries = useCallback(async () => {
    setLibLoading(true);
    try {
      const res = await api.library.list();
      setLibraries(res.data || []);
      if (!selectedLibrary && (res.data || []).length > 0) {
        setSelectedLibrary(res.data[0]);
      }
    } catch { error('Failed to load libraries'); }
    finally { setLibLoading(false); }
  }, []);

  const fetchAbhyasikas = useCallback(async () => {
    try {
      const res = await api.abhyasikas.myListings();
      setAbhyasikas((res.data || []).map((a: any) => ({ id: a.id, name: a.name })));
    } catch {}
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!selectedLibrary) return;
    setCatLoading(true);
    try {
      const res = await api.library.categories(selectedLibrary.id);
      setCategories(res.data || []);
    } catch { error('Failed to load categories'); }
    finally { setCatLoading(false); }
  }, [selectedLibrary]);

  const fetchBooks = useCallback(async () => {
    if (!selectedLibrary) return;
    setBookLoading(true);
    try {
      const res = await api.library.books(selectedLibrary.id, { search: bookSearch, category_id: bookCatFilter, page: bookPage });
      setBooks(res.data || []);
      setBookTotal(res.pagination?.total || 0);
    } catch { error('Failed to load books'); }
    finally { setBookLoading(false); }
  }, [selectedLibrary, bookSearch, bookCatFilter, bookPage]);

  const fetchStats = useCallback(async () => {
    if (!selectedLibrary) return;
    try {
      const res = await api.library.stats(selectedLibrary.id);
      setStats(res.data || null);
    } catch {}
  }, [selectedLibrary]);

  useEffect(() => { fetchLibraries(); fetchAbhyasikas(); }, []);
  useEffect(() => {
    if (selectedLibrary) {
      fetchCategories();
      fetchBooks();
      fetchStats();
    }
  }, [selectedLibrary]);
  useEffect(() => { if (activeTab === 'books') fetchBooks(); }, [bookSearch, bookCatFilter, bookPage]);

  // ── Handlers ─────────────────────────────────────────────────

  // Create Library
  const handleCreateLib = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.library.create({ abhyasika_id: parseInt(libForm.abhyasika_id), name: libForm.name, description: libForm.description || undefined });
      success('Library created!');
      setShowCreateLib(false);
      setLibForm({ abhyasika_id: '', name: 'Library', description: '' });
      await fetchLibraries();
      setSelectedLibrary(res.data);
    } catch (e: any) { error(e?.message || 'Failed to create library'); }
    finally { setSaving(false); }
  };

  // Update Library
  const handleUpdateLib = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibrary) return;
    setSaving(true);
    try {
      await api.library.update(selectedLibrary.id, { name: libForm.name, description: libForm.description || undefined });
      success('Library updated!');
      setShowEditLib(false);
      await fetchLibraries();
    } catch { error('Failed to update library'); }
    finally { setSaving(false); }
  };

  // Create Category
  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibrary) return;
    setSaving(true);
    try {
      await api.library.createCategory(selectedLibrary.id, catForm);
      success('Category created!');
      setShowCreateCat(false);
      setCatForm({ name: '', description: '', color_code: '#6B7280' });
      fetchCategories();
    } catch { error('Failed to create category'); }
    finally { setSaving(false); }
  };

  // Update Category
  const handleUpdateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditCat || !selectedLibrary) return;
    setSaving(true);
    try {
      await api.library.updateCategory(selectedLibrary.id, showEditCat.id, catForm);
      success('Category updated!');
      setShowEditCat(null);
      fetchCategories();
    } catch { error('Failed to update category'); }
    finally { setSaving(false); }
  };

  // Delete Category
  const handleDeleteCat = async (cat: BookCategory) => {
    setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name });
  };

  // Add Book
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibrary) return;
    setSaving(true);
    try {
      await api.library.addBook(selectedLibrary.id, {
        ...bookForm,
        total_copies: parseInt(bookForm.total_copies) || 1,
        available_copies: parseInt(bookForm.available_copies) || 1,
        publish_year: bookForm.publish_year ? parseInt(bookForm.publish_year) : undefined,
        category_id: bookForm.category_id ? parseInt(bookForm.category_id) : undefined,
      });
      success('Book added!');
      setShowAddBook(false);
      resetBookForm();
      fetchBooks();
      fetchStats();
    } catch { error('Failed to add book'); }
    finally { setSaving(false); }
  };

  // Edit Book
  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditBook || !selectedLibrary) return;
    setSaving(true);
    try {
      await api.library.updateBook(selectedLibrary.id, showEditBook.id, {
        ...bookForm,
        total_copies: parseInt(bookForm.total_copies) || 1,
        available_copies: parseInt(bookForm.available_copies) || 1,
        publish_year: bookForm.publish_year ? parseInt(bookForm.publish_year) : undefined,
        category_id: bookForm.category_id ? parseInt(bookForm.category_id) : undefined,
      });
      success('Book updated!');
      setShowEditBook(null);
      resetBookForm();
      fetchBooks();
      fetchStats();
    } catch { error('Failed to update book'); }
    finally { setSaving(false); }
  };

  const handleDeleteBook = (book: Book) => {
    setDeleteConfirm({ type: 'book', id: book.id, name: book.title });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !selectedLibrary) return;
    try {
      if (deleteConfirm.type === 'category') {
        await api.library.deleteCategory(selectedLibrary.id, deleteConfirm.id);
        success('Category deleted');
        fetchCategories();
      } else if (deleteConfirm.type === 'book') {
        await api.library.deleteBook(selectedLibrary.id, deleteConfirm.id);
        success('Book removed');
        fetchBooks();
        fetchStats();
      }
    } catch (e: any) { error(e?.message || 'Delete failed'); }
    setDeleteConfirm(null);
  };

  const resetBookForm = () => setBookForm({
    title: '', author: '', isbn: '', publisher: '', publish_year: '',
    edition: '', language: 'English', description: '', cover_url: '',
    total_copies: '1', available_copies: '1', category_id: '', rack_number: '', notes: ''
  });

  const openEditBook = (book: Book) => {
    setBookForm({
      title: book.title || '', author: book.author || '', isbn: book.isbn || '',
      publisher: book.publisher || '', publish_year: book.publish_year?.toString() || '',
      edition: book.edition || '', language: book.language || 'English',
      description: book.description || '', cover_url: book.cover_url || '',
      total_copies: book.total_copies?.toString() || '1',
      available_copies: book.available_copies?.toString() || '1',
      category_id: book.category_id?.toString() || '',
      rack_number: book.rack_number || '', notes: book.notes || ''
    });
    setShowEditBook(book);
  };

  const openEditCat = (cat: BookCategory) => {
    setCatForm({ name: cat.name, description: cat.description || '', color_code: cat.color_code });
    setShowEditCat(cat);
  };

  const openEditLib = () => {
    if (!selectedLibrary) return;
    setLibForm({ abhyasika_id: selectedLibrary.abhyasika_id.toString(), name: selectedLibrary.name, description: selectedLibrary.description || '' });
    setShowEditLib(true);
  };

  // ── Render ───────────────────────────────────────────────────
  const TABS = [
    { key: 'libraries', label: 'Libraries', icon: 'fa-building-columns' },
    { key: 'categories', label: 'Categories', icon: 'fa-tags' },
    { key: 'books', label: 'Books', icon: 'fa-book' },
    { key: 'stats', label: 'Statistics', icon: 'fa-chart-pie' },
  ];

  return (
    <DashboardLayout
      sidebarItems={SIDEBAR}
      sidebarTitle="Owner Portal"
      sidebarColor="blue"
      title="Library Management"
      subtitle="Manage your Abhyasika Library, Books & Categories"
      actions={
        <button onClick={() => setShowCreateLib(true)} className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <i className="fas fa-plus mr-2"></i>New Library
        </button>
      }
    >
      {/* ── Library Selector ── */}
      {libraries.length > 1 && (
        <div className="mb-5 flex gap-3 flex-wrap">
          {libraries.map(lib => (
            <button
              key={lib.id}
              onClick={() => setSelectedLibrary(lib)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${selectedLibrary?.id === lib.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'}`}
            >
              <i className="fas fa-building-columns mr-2"></i>{lib.name}
              <span className="ml-2 text-xs opacity-75">({lib.abhyasika_name})</span>
            </button>
          ))}
        </div>
      )}

      {libLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl loading-pulse"></div>)}
        </div>
      ) : libraries.length === 0 ? (
        /* ── Empty State ── */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <i className="fas fa-book-open text-3xl text-blue-500"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Library Yet</h3>
          <p className="text-gray-500 mb-6">Add a library to your abhyasika so students can browse and borrow books.</p>
          <button onClick={() => setShowCreateLib(true)} className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
            <i className="fas fa-plus mr-2"></i>Create Library
          </button>
        </div>
      ) : (
        <>
          {/* ── Selected Library Card ── */}
          {selectedLibrary && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-5 mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-building-columns text-blue-200"></i>
                  <span className="text-blue-200 text-sm">{selectedLibrary.abhyasika_name}</span>
                </div>
                <h2 className="text-xl font-bold">{selectedLibrary.name}</h2>
                {selectedLibrary.description && <p className="text-blue-100 text-sm mt-1">{selectedLibrary.description}</p>}
                <div className="flex gap-4 mt-3 text-sm">
                  <span><i className="fas fa-book mr-1 text-blue-200"></i>{selectedLibrary.total_books} Books</span>
                  <span><i className="fas fa-check-circle mr-1 text-blue-200"></i>{selectedLibrary.available_books} Available</span>
                  <span><i className="fas fa-tags mr-1 text-blue-200"></i>{selectedLibrary.total_categories} Categories</span>
                </div>
              </div>
              <button onClick={openEditLib} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <i className="fas fa-edit mr-2"></i>Edit
              </button>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 tabs-scroll">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <i className={`fas ${t.icon}`}></i>{t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: Libraries ── */}
          {activeTab === 'libraries' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {libraries.map(lib => (
                <div key={lib.id} className={`bg-white rounded-2xl border p-5 shadow-sm card-hover cursor-pointer transition-all ${selectedLibrary?.id === lib.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'}`}
                  onClick={() => setSelectedLibrary(lib)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-building-columns text-blue-600"></i>
                    </div>
                    <span className={`badge ${lib.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {lib.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-1">{lib.name}</h4>
                  <p className="text-xs text-gray-500 mb-3">{lib.abhyasika_name}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-600">{lib.total_books}</div>
                      <div className="text-xs text-gray-500">Books</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600">{lib.available_books}</div>
                      <div className="text-xs text-gray-500">Available</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-purple-600">{lib.total_categories}</div>
                      <div className="text-xs text-gray-500">Categories</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: Categories ── */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">Book Categories</h3>
                <button onClick={() => { setCatForm({ name: '', description: '', color_code: '#6B7280' }); setShowCreateCat(true); }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                  <i className="fas fa-plus mr-2"></i>Add Category
                </button>
              </div>
              {catLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl loading-pulse"></div>)}</div>
              ) : categories.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <i className="fas fa-tags text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500">No categories yet. Add categories to organize your books.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.color_code + '22' }}>
                        <i className="fas fa-tag" style={{ color: cat.color_code }}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 truncate">{cat.name}</h4>
                        <p className="text-xs text-gray-400">{cat.book_count || 0} books</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditCat(cat)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 text-xs hover:bg-blue-100 flex items-center justify-center">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => handleDeleteCat(cat)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 text-xs hover:bg-red-100 flex items-center justify-center">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Books ── */}
          {activeTab === 'books' && (
            <div>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex-1 relative">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input type="text" placeholder="Search books by title, author, ISBN…" value={bookSearch}
                    onChange={e => { setBookSearch(e.target.value); setBookPage(1); }}
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={bookCatFilter} onChange={e => { setBookCatFilter(e.target.value); setBookPage(1); }}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Categories</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <button onClick={() => { resetBookForm(); setShowAddBook(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap">
                  <i className="fas fa-plus mr-2"></i>Add Book
                </button>
              </div>

              {bookLoading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl loading-pulse"></div>)}</div>
              ) : books.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <i className="fas fa-books text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500">No books found. Start adding books to your library!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {books.map(book => (
                      <div key={book.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="p-4">
                          <div className="flex gap-3">
                            {/* Book cover or placeholder */}
                            <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              {book.cover_url ? (
                                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display='none'; }} />
                              ) : (
                                <i className="fas fa-book text-white text-lg"></i>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-1">{book.title}</h4>
                              {book.author && <p className="text-xs text-gray-500 mb-1"><i className="fas fa-user mr-1"></i>{book.author}</p>}
                              {book.category_name && (
                                <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (book.category_color || '#6B7280') + '22', color: book.category_color || '#6B7280' }}>
                                  {book.category_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex gap-2 text-xs">
                              <span className={`px-2 py-1 rounded-lg font-medium ${book.available_copies > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {book.available_copies}/{book.total_copies} Available
                              </span>
                              {book.rack_number && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">Rack {book.rack_number}</span>}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setShowBookDetail(book)} className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 text-xs hover:bg-gray-100 flex items-center justify-center">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button onClick={() => openEditBook(book)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 text-xs hover:bg-blue-100 flex items-center justify-center">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button onClick={() => handleDeleteBook(book)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 text-xs hover:bg-red-100 flex items-center justify-center">
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination */}
                  {bookTotal > 20 && (
                    <div className="flex justify-center gap-2 mt-5">
                      <button disabled={bookPage === 1} onClick={() => setBookPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                      <span className="px-3 py-1.5 text-sm text-gray-500">Page {bookPage} · {bookTotal} books</span>
                      <button disabled={bookPage * 20 >= bookTotal} onClick={() => setBookPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB: Stats ── */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-5">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Books', value: stats.overview?.total_books || 0, icon: 'fa-book', color: 'blue' },
                  { label: 'Total Copies', value: stats.overview?.total_copies || 0, icon: 'fa-copy', color: 'indigo' },
                  { label: 'Available', value: stats.overview?.total_available || 0, icon: 'fa-check-circle', color: 'green' },
                  { label: 'Fully Issued', value: stats.overview?.fully_issued || 0, icon: 'fa-times-circle', color: 'red' },
                  { label: 'Categories', value: stats.overview?.categories_used || 0, icon: 'fa-tags', color: 'purple' },
                  { label: 'Languages', value: stats.overview?.languages_count || 0, icon: 'fa-language', color: 'yellow' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                    <div className={`w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center bg-${s.color}-100`}>
                      <i className={`fas ${s.icon} text-${s.color}-600 text-sm`}></i>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* By Category */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h4 className="font-bold text-gray-700 mb-4"><i className="fas fa-tags mr-2 text-purple-500"></i>Books by Category</h4>
                  {(stats.by_category || []).length === 0 ? <p className="text-gray-400 text-sm">No data</p> : (
                    <div className="space-y-2">
                      {(stats.by_category || []).map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color_code || '#6B7280' }}></div>
                          <span className="text-sm text-gray-700 flex-1 truncate">{c.name}</span>
                          <span className="text-sm font-bold text-gray-800">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* By Language */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h4 className="font-bold text-gray-700 mb-4"><i className="fas fa-language mr-2 text-blue-500"></i>Books by Language</h4>
                  {(stats.by_language || []).length === 0 ? <p className="text-gray-400 text-sm">No data</p> : (
                    <div className="space-y-2">
                      {(stats.by_language || []).map((l: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <i className="fas fa-globe text-blue-400 text-xs"></i>
                          <span className="text-sm text-gray-700 flex-1">{l.language}</span>
                          <span className="text-sm font-bold text-gray-800">{l.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Books */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h4 className="font-bold text-gray-700 mb-4"><i className="fas fa-clock mr-2 text-green-500"></i>Recently Added Books</h4>
                {(stats.recent_books || []).length === 0 ? <p className="text-gray-400 text-sm">No books yet</p> : (
                  <div className="space-y-3">
                    {(stats.recent_books || []).map((b: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-book text-blue-600 text-xs"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{b.title}</p>
                          <p className="text-xs text-gray-400">{b.author} · {b.category_name}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(b.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ MODALS ═══════════ */}

      {/* Create Library Modal */}
      {showCreateLib && (
        <Modal title="Create Library" onClose={() => setShowCreateLib(false)}>
          <form onSubmit={handleCreateLib} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abhyasika <span className="text-red-500">*</span></label>
              <select required value={libForm.abhyasika_id} onChange={e => setLibForm(f => ({ ...f, abhyasika_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Abhyasika</option>
                {abhyasikas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <InputField label="Library Name" name="name" value={libForm.name} onChange={(e: any) => setLibForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g., Main Library" />
            <InputField label="Description" name="description" rows={3} value={libForm.description} onChange={(e: any) => setLibForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the library" />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateLib(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Library'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Library Modal */}
      {showEditLib && (
        <Modal title="Edit Library" onClose={() => setShowEditLib(false)}>
          <form onSubmit={handleUpdateLib} className="space-y-4">
            <InputField label="Library Name" name="name" value={libForm.name} onChange={(e: any) => setLibForm(f => ({ ...f, name: e.target.value }))} required />
            <InputField label="Description" name="description" rows={3} value={libForm.description} onChange={(e: any) => setLibForm(f => ({ ...f, description: e.target.value }))} />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEditLib(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Category Modal */}
      {showCreateCat && (
        <Modal title="Add Book Category" onClose={() => setShowCreateCat(false)}>
          <form onSubmit={handleCreateCat} className="space-y-4">
            <InputField label="Category Name" name="name" value={catForm.name} onChange={(e: any) => setCatForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g., Science, Fiction, History" />
            <InputField label="Description" name="description" rows={2} value={catForm.description} onChange={(e: any) => setCatForm(f => ({ ...f, description: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={catForm.color_code} onChange={e => setCatForm(f => ({ ...f, color_code: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                <span className="text-sm text-gray-500">{catForm.color_code}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateCat(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Adding…' : 'Add Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Category Modal */}
      {showEditCat && (
        <Modal title="Edit Category" onClose={() => setShowEditCat(null)}>
          <form onSubmit={handleUpdateCat} className="space-y-4">
            <InputField label="Category Name" name="name" value={catForm.name} onChange={(e: any) => setCatForm(f => ({ ...f, name: e.target.value }))} required />
            <InputField label="Description" name="description" rows={2} value={catForm.description} onChange={(e: any) => setCatForm(f => ({ ...f, description: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={catForm.color_code} onChange={e => setCatForm(f => ({ ...f, color_code: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                <span className="text-sm text-gray-500">{catForm.color_code}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEditCat(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Book Modal */}
      {(showAddBook || showEditBook) && (
        <Modal title={showEditBook ? `Edit: ${showEditBook.title}` : 'Add New Book'} onClose={() => { setShowAddBook(false); setShowEditBook(null); resetBookForm(); }}>
          <form onSubmit={showEditBook ? handleEditBook : handleAddBook} className="space-y-3">
            <InputField label="Title" name="title" value={bookForm.title} onChange={(e: any) => setBookForm(f => ({ ...f, title: e.target.value }))} required placeholder="Book title" />
            <InputField label="Author" name="author" value={bookForm.author} onChange={(e: any) => setBookForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="ISBN" name="isbn" value={bookForm.isbn} onChange={(e: any) => setBookForm(f => ({ ...f, isbn: e.target.value }))} placeholder="ISBN number" />
              <InputField label="Publisher" name="publisher" value={bookForm.publisher} onChange={(e: any) => setBookForm(f => ({ ...f, publisher: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Year" name="publish_year" type="number" value={bookForm.publish_year} onChange={(e: any) => setBookForm(f => ({ ...f, publish_year: e.target.value }))} placeholder="2024" />
              <InputField label="Edition" name="edition" value={bookForm.edition} onChange={(e: any) => setBookForm(f => ({ ...f, edition: e.target.value }))} placeholder="1st, 2nd…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select value={bookForm.language} onChange={e => setBookForm(f => ({ ...f, language: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['English','Marathi','Hindi','Gujarati','Tamil','Telugu','Kannada','Malayalam','Bengali','Urdu','Other'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={bookForm.category_id} onChange={e => setBookForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Total Copies" name="total_copies" type="number" value={bookForm.total_copies} onChange={(e: any) => setBookForm(f => ({ ...f, total_copies: e.target.value }))} />
              <InputField label="Available Copies" name="available_copies" type="number" value={bookForm.available_copies} onChange={(e: any) => setBookForm(f => ({ ...f, available_copies: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Rack Number" name="rack_number" value={bookForm.rack_number} onChange={(e: any) => setBookForm(f => ({ ...f, rack_number: e.target.value }))} placeholder="e.g., A-12" />
              <InputField label="Cover Image URL" name="cover_url" value={bookForm.cover_url} onChange={(e: any) => setBookForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="https://…" />
            </div>
            <InputField label="Description" name="description" rows={2} value={bookForm.description} onChange={(e: any) => setBookForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief book description" />
            <InputField label="Notes" name="notes" rows={2} value={bookForm.notes} onChange={(e: any) => setBookForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes" />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowAddBook(false); setShowEditBook(null); resetBookForm(); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : (showEditBook ? 'Update Book' : 'Add Book')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Book Detail Modal */}
      {showBookDetail && (
        <Modal title="Book Details" onClose={() => setShowBookDetail(null)}>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-20 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                {showBookDetail.cover_url ? (
                  <img src={showBookDetail.cover_url} alt={showBookDetail.title} className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-book text-white text-2xl"></i>
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg leading-tight">{showBookDetail.title}</h4>
                {showBookDetail.author && <p className="text-gray-600 text-sm mt-1"><i className="fas fa-user mr-1 text-gray-400"></i>{showBookDetail.author}</p>}
                {showBookDetail.publisher && <p className="text-gray-500 text-xs mt-0.5">{showBookDetail.publisher}{showBookDetail.publish_year ? `, ${showBookDetail.publish_year}` : ''}</p>}
                {showBookDetail.category_name && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (showBookDetail.category_color || '#6B7280') + '22', color: showBookDetail.category_color || '#6B7280' }}>
                    {showBookDetail.category_name}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Language', value: showBookDetail.language },
                { label: 'Edition', value: showBookDetail.edition || '—' },
                { label: 'ISBN', value: showBookDetail.isbn || '—' },
                { label: 'Rack', value: showBookDetail.rack_number || '—' },
                { label: 'Total Copies', value: showBookDetail.total_copies },
                { label: 'Available', value: showBookDetail.available_copies },
              ].map((f, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500">{f.label}</div>
                  <div className="text-sm font-semibold text-gray-800">{f.value}</div>
                </div>
              ))}
            </div>
            {showBookDetail.description && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Description</div>
                <p className="text-sm text-gray-700">{showBookDetail.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-trash text-red-500 text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Confirm Delete</h3>
            <p className="text-gray-500 text-sm mb-5">Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
