import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/owner' },
  { label: 'My Listings', icon: 'fa-building', path: '/owner/listings' },
  { label: 'Bookings', icon: 'fa-calendar-check', path: '/owner/bookings' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/owner/revenue' },
  { label: 'Profile', icon: 'fa-user', path: '/owner/profile' },
];

export default function OwnerSeats() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seats, setSeats] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [abhyasikaName, setAbhyasikaName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [deletingSeats, setDeletingSeats] = useState<Set<number>>(new Set());
  const [confirmDeleteSeat, setConfirmDeleteSeat] = useState<any | null>(null);

  const [seatForm, setSeatForm] = useState({
    seat_number: '', seat_label: '', category_id: '', row_number: '', column_number: ''
  });
  const [bulkForm, setBulkForm] = useState({
    rows: '5', cols: '6', prefix: 'S', category_id: ''
  });
  const [catForm, setCatForm] = useState({
    name: '', daily_price: '', weekly_price: '', monthly_price: '', color_code: '#3B82F6', description: ''
  });
  const [editCatForm, setEditCatForm] = useState({
    name: '', daily_price: '', weekly_price: '', monthly_price: '', color_code: '#3B82F6', description: ''
  });

  const { success, error } = useToast();

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Verify this abhyasika belongs to the current owner
      const myListings: any = await api.abhyasikas.myListings();
      const owned = (myListings.data || []).find((a: any) => String(a.id) === String(id));
      if (!owned) {
        setNotAuthorized(true);
        setLoading(false);
        return;
      }
      setAbhyasikaName(owned.name);

      const [s, c]: any = await Promise.all([api.seats.list(id), api.seats.categories(id)]);
      setSeats(s.data || []);
      setCategories(c.data || []);
    } catch (e: any) { error(e.message); }
    setLoading(false);
  };

  // Unauthorized access screen
  if (notAuthorized) {
    return (
      <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="teal"
        title="Access Denied" subtitle="">
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <i className="fas fa-lock text-red-500 text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Access Denied</h2>
          <p className="text-gray-500 mb-6">तुम्ही फक्त तुमच्या स्वतःच्या अभ्यासिकेचे seats manage करू शकता.</p>
          <button onClick={() => navigate('/owner/listings')}
            className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
            <i className="fas fa-arrow-left mr-2"></i>माझ्या Listings वर जा
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const handleAddSeat = async () => {
    try {
      await api.seats.create({
        abhyasika_id: parseInt(id!),
        ...seatForm,
        category_id: seatForm.category_id ? parseInt(seatForm.category_id) : null,
        row_number: seatForm.row_number ? parseInt(seatForm.row_number) : null,
        column_number: seatForm.column_number ? parseInt(seatForm.column_number) : null
      });
      success('Seat added!');
      setShowAddSeat(false);
      setSeatForm({ seat_number: '', seat_label: '', category_id: '', row_number: '', column_number: '' });
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleBulkCreate = async () => {
    try {
      const r: any = await api.seats.bulkCreate({
        abhyasika_id: parseInt(id!),
        rows: parseInt(bulkForm.rows),
        cols: parseInt(bulkForm.cols),
        prefix: bulkForm.prefix,
        category_id: bulkForm.category_id ? parseInt(bulkForm.category_id) : null
      });
      success(`${r.data.count} seats created!`);
      setShowBulk(false);
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleAddCategory = async () => {
    try {
      await api.seats.createCategory({
        abhyasika_id: parseInt(id!),
        ...catForm,
        daily_price: parseFloat(catForm.daily_price),
        weekly_price: parseFloat(catForm.weekly_price),
        monthly_price: parseFloat(catForm.monthly_price)
      });
      success('Category created!');
      setShowAddCategory(false);
      setCatForm({ name: '', daily_price: '', weekly_price: '', monthly_price: '', color_code: '#3B82F6', description: '' });
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setEditCatForm({
      name: cat.name,
      daily_price: String(cat.daily_price),
      weekly_price: String(cat.weekly_price),
      monthly_price: String(cat.monthly_price),
      color_code: cat.color_code || '#3B82F6',
      description: cat.description || ''
    });
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    try {
      await api.seats.updateCategory(editingCategory.id, {
        ...editCatForm,
        daily_price: parseFloat(editCatForm.daily_price),
        weekly_price: parseFloat(editCatForm.weekly_price),
        monthly_price: parseFloat(editCatForm.monthly_price)
      });
      success('Category rates updated!');
      setEditingCategory(null);
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleDeleteSeat = async (seat: any) => {
    setDeletingSeats(prev => new Set(prev).add(seat.id));
    try {
      await api.seats.delete(seat.id);
      success(`Seat ${seat.seat_number} deleted!`);
      setConfirmDeleteSeat(null);
      loadData();
    } catch (e: any) { error(e.message); }
    setDeletingSeats(prev => { const s = new Set(prev); s.delete(seat.id); return s; });
  };

  const STATUS_COUNTS = {
    available: seats.filter(s => s.current_status === 'available' || (!s.current_status && s.status === 'available')).length,
    occupied: seats.filter(s => s.current_status === 'occupied').length,
    maintenance: seats.filter(s => s.current_status === 'maintenance' || s.status === 'maintenance').length,
  };

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="teal"
      title="Seat Management" subtitle={abhyasikaName ? `${abhyasikaName} - Seats` : `Study Room #${id}`}
      actions={
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddCategory(!showAddCategory)}
            className="px-3 py-2 bg-purple-100 text-purple-600 rounded-xl text-sm font-semibold hover:bg-purple-200">
            <i className="fas fa-tag mr-1.5"></i>Add Category
          </button>
          <button onClick={() => setShowBulk(!showBulk)}
            className="px-3 py-2 bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-200">
            <i className="fas fa-th mr-1.5"></i>Bulk Add
          </button>
          <button onClick={() => setShowAddSeat(!showAddSeat)}
            className="gradient-primary text-white px-3 py-2 rounded-xl text-sm font-semibold">
            <i className="fas fa-plus mr-1.5"></i>Add Seat
          </button>
        </div>
      }
    >
      {/* Confirm Delete Seat Modal */}
      {confirmDeleteSeat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-trash text-red-500 text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Seat Delete करा?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Seat <strong>{confirmDeleteSeat.seat_number}</strong> delete केल्यावर ते permanent हटेल.
              {confirmDeleteSeat.current_status === 'occupied' && (
                <span className="block mt-2 text-amber-600 font-medium">
                  <i className="fas fa-exclamation-triangle mr-1"></i>हे seat सध्या occupied आहे!
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteSeat(confirmDeleteSeat)}
                disabled={deletingSeats.has(confirmDeleteSeat.id)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-70">
                {deletingSeats.has(confirmDeleteSeat.id) ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>Deleting...</>
                ) : (
                  <><i className="fas fa-trash mr-2"></i>Delete करा</>
                )}
              </button>
              <button onClick={() => setConfirmDeleteSeat(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Rates Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: editCatForm.color_code }}></div>
              <h3 className="text-lg font-bold text-gray-800">Edit Category: {editingCategory.name}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name</label>
                <input type="text" value={editCatForm.name} onChange={e => setEditCatForm(f => ({...f, name: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Daily (₹)</label>
                  <input type="number" value={editCatForm.daily_price} onChange={e => setEditCatForm(f => ({...f, daily_price: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Weekly (₹)</label>
                  <input type="number" value={editCatForm.weekly_price} onChange={e => setEditCatForm(f => ({...f, weekly_price: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly (₹)</label>
                  <input type="number" value={editCatForm.monthly_price} onChange={e => setEditCatForm(f => ({...f, monthly_price: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Color</label>
                <div className="flex gap-2">
                  <input type="color" value={editCatForm.color_code} onChange={e => setEditCatForm(f => ({...f, color_code: e.target.value}))}
                    className="w-10 h-10 border border-gray-200 rounded-xl cursor-pointer" />
                  <input type="text" value={editCatForm.color_code} onChange={e => setEditCatForm(f => ({...f, color_code: e.target.value}))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSaveCategory}
                className="flex-1 py-3 gradient-primary text-white rounded-xl text-sm font-semibold">
                <i className="fas fa-save mr-2"></i>Save Changes
              </button>
              <button onClick={() => setEditingCategory(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available', count: STATUS_COUNTS.available, color: 'bg-green-50 text-green-600 border-green-200', dotColor: 'bg-green-500', icon: 'fa-check-circle' },
          { label: 'Occupied', count: STATUS_COUNTS.occupied, color: 'bg-red-50 text-red-600 border-red-200', dotColor: 'bg-red-500', icon: 'fa-user' },
          { label: 'Maintenance', count: STATUS_COUNTS.maintenance, color: 'bg-yellow-50 text-yellow-600 border-yellow-200', dotColor: 'bg-yellow-500', icon: 'fa-tools' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} border rounded-2xl p-4 flex items-center gap-4`}>
            <div className={`w-10 h-10 ${s.dotColor} rounded-xl flex items-center justify-center`}>
              <i className={`fas ${s.icon} text-white`}></i>
            </div>
            <div>
              <div className="font-bold text-xl">{s.count}</div>
              <div className="text-sm">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Form */}
      {showAddCategory && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
          <h3 className="font-bold text-gray-800 mb-4">Add Seat Category</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name</label>
              <input type="text" value={catForm.name} onChange={e => setCatForm(f => ({...f, name: e.target.value}))}
                placeholder="e.g. AC Premium"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Daily Price (₹)</label>
              <input type="number" value={catForm.daily_price} onChange={e => setCatForm(f => ({...f, daily_price: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Weekly Price (₹)</label>
              <input type="number" value={catForm.weekly_price} onChange={e => setCatForm(f => ({...f, weekly_price: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Price (₹)</label>
              <input type="number" value={catForm.monthly_price} onChange={e => setCatForm(f => ({...f, monthly_price: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Color</label>
              <div className="flex gap-2">
                <input type="color" value={catForm.color_code} onChange={e => setCatForm(f => ({...f, color_code: e.target.value}))}
                  className="w-10 h-10 border border-gray-200 rounded-xl cursor-pointer" />
                <input type="text" value={catForm.color_code} onChange={e => setCatForm(f => ({...f, color_code: e.target.value}))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAddCategory} className="px-5 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold">Create Category</button>
            <button onClick={() => setShowAddCategory(false)} className="px-5 py-2.5 border rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Bulk Add Form */}
      {showBulk && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
          <h3 className="font-bold text-gray-800 mb-4">Bulk Add Seats</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select value={bulkForm.category_id} onChange={e => setBulkForm(f => ({...f, category_id: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option value="">Select</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rows</label>
              <input type="number" value={bulkForm.rows} onChange={e => setBulkForm(f => ({...f, rows: e.target.value}))} min="1" max="20"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Columns</label>
              <input type="number" value={bulkForm.cols} onChange={e => setBulkForm(f => ({...f, cols: e.target.value}))} min="1" max="20"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Seat Prefix</label>
              <input type="text" value={bulkForm.prefix} onChange={e => setBulkForm(f => ({...f, prefix: e.target.value}))} maxLength={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            <i className="fas fa-info-circle mr-1 text-blue-400"></i>
            Will create {parseInt(bulkForm.rows || '0') * parseInt(bulkForm.cols || '0')} seats
          </p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleBulkCreate} className="px-5 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold">
              Create {parseInt(bulkForm.rows || '0') * parseInt(bulkForm.cols || '0')} Seats
            </button>
            <button onClick={() => setShowBulk(false)} className="px-5 py-2.5 border rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Add Single Seat */}
      {showAddSeat && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
          <h3 className="font-bold text-gray-800 mb-4">Add Single Seat</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Seat Number *</label>
              <input type="text" value={seatForm.seat_number} onChange={e => setSeatForm(f => ({...f, seat_number: e.target.value}))}
                placeholder="A01"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Seat Label</label>
              <input type="text" value={seatForm.seat_label} onChange={e => setSeatForm(f => ({...f, seat_label: e.target.value}))}
                placeholder="Seat A01"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select value={seatForm.category_id} onChange={e => setSeatForm(f => ({...f, category_id: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option value="">Select</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Row, Col</label>
              <div className="flex gap-2">
                <input type="number" value={seatForm.row_number} onChange={e => setSeatForm(f => ({...f, row_number: e.target.value}))}
                  placeholder="Row"
                  className="w-1/2 border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none" />
                <input type="number" value={seatForm.column_number} onChange={e => setSeatForm(f => ({...f, column_number: e.target.value}))}
                  placeholder="Col"
                  className="w-1/2 border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAddSeat} className="px-5 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold">Add Seat</button>
            <button onClick={() => setShowAddSeat(false)} className="px-5 py-2.5 border rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Categories Overview - Now with Edit button */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">
            <i className="fas fa-tags mr-2 text-purple-500"></i>Seat Categories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-teal-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color_code }}></div>
                    <h4 className="font-bold text-gray-800 text-sm">{cat.name}</h4>
                  </div>
                  <button onClick={() => handleEditCategory(cat)}
                    className="w-7 h-7 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center hover:bg-teal-100 transition-colors"
                    title="Edit rates">
                    <i className="fas fa-pencil text-xs"></i>
                  </button>
                </div>
                <div className="text-xs text-gray-500 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Daily:</span>
                    <span className="font-bold text-gray-700">₹{cat.daily_price}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly:</span>
                    <span className="font-bold text-gray-700">₹{cat.weekly_price}/week</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly:</span>
                    <span className="font-bold text-gray-700">₹{cat.monthly_price}/mo</span>
                  </div>
                </div>
                {cat.total_seats !== undefined && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{cat.total_seats} seats</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seat Grid - with delete buttons */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800">Seat Layout <span className="text-gray-400 font-normal text-sm">({seats.length} seats)</span></h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-green-100 border border-green-300 rounded text-center text-green-700 text-xs leading-5">S</div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-red-100 border border-red-300 rounded text-center text-red-700 text-xs leading-5">S</div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-yellow-100 border border-yellow-300 rounded text-center text-yellow-700 text-xs leading-5">S</div>
              <span>Maintenance</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : seats.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-chair text-5xl text-gray-200 mb-4"></i>
            <p className="text-gray-500">No seats added yet.</p>
            <p className="text-sm text-gray-400 mt-1">Use "Bulk Add" to quickly create a seat layout</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {seats.map(seat => {
              const status = seat.current_status || seat.status || 'available';
              const catColor = categories.find(c => c.id === seat.category_id)?.color_code;

              let bgClass = 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100';
              if (status === 'occupied') bgClass = 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100';
              if (status === 'maintenance') bgClass = 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100';

              return (
                <div key={seat.id} className="relative group">
                  <div
                    className={`seat ${status} w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xs font-bold cursor-default transition-all ${bgClass}`}
                    title={`${seat.seat_number}${seat.category_name ? ` (${seat.category_name})` : ''} - ${status}`}
                    style={catColor && status === 'available' ? { borderColor: catColor, backgroundColor: catColor + '20', color: catColor } : {}}
                  >
                    {seat.seat_number.slice(-3)}
                  </div>
                  {/* Delete button on hover */}
                  <button
                    onClick={() => setConfirmDeleteSeat(seat)}
                    disabled={deletingSeats.has(seat.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hidden group-hover:flex"
                    title={`Delete ${seat.seat_number}`}
                  >
                    <i className="fas fa-times" style={{ fontSize: '8px' }}></i>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {seats.length > 0 && (
          <p className="text-xs text-gray-400 mt-4">
            <i className="fas fa-info-circle mr-1"></i>
            Seat वर hover केल्यावर delete button दिसेल. Delete करण्यापूर्वी confirm करावे लागेल.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
