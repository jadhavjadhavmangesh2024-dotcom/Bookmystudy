import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/owner' },
  { label: 'My Listings', icon: 'fa-building', path: '/owner/listings' },
  { label: 'Bookings', icon: 'fa-calendar-check', path: '/owner/bookings' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/owner/revenue' },
  { label: 'Profile', icon: 'fa-user', path: '/owner/profile' },
];

export default function OwnerSeats() {
  const { id } = useParams();
  const [seats, setSeats] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [seatForm, setSeatForm] = useState({ seat_number: '', seat_label: '', category_id: '', row_number: '', column_number: '' });
  const [bulkForm, setBulkForm] = useState({ rows: '5', cols: '6', prefix: 'S', category_id: '' });
  const [catForm, setCatForm] = useState({ name: '', daily_price: '', weekly_price: '', monthly_price: '', color_code: '#3B82F6', description: '' });
  const { success, error } = useToast();

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, c]: any = await Promise.all([api.seats.list(id), api.seats.categories(id)]);
      setSeats(s.data || []);
      setCategories(c.data || []);
    } catch (e: any) { error(e.message); }
    setLoading(false);
  };

  const handleAddSeat = async () => {
    try {
      await api.seats.create({ abhyasika_id: parseInt(id!), ...seatForm, category_id: parseInt(seatForm.category_id), row_number: parseInt(seatForm.row_number), column_number: parseInt(seatForm.column_number) });
      success('Seat added!');
      setShowAddSeat(false);
      setSeatForm({ seat_number: '', seat_label: '', category_id: '', row_number: '', column_number: '' });
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleBulkCreate = async () => {
    try {
      const r: any = await api.seats.bulkCreate({ abhyasika_id: parseInt(id!), rows: parseInt(bulkForm.rows), cols: parseInt(bulkForm.cols), prefix: bulkForm.prefix, category_id: parseInt(bulkForm.category_id) });
      success(`${r.data.count} seats created!`);
      setShowBulk(false);
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleAddCategory = async () => {
    try {
      await api.seats.createCategory({ abhyasika_id: parseInt(id!), ...catForm, daily_price: parseFloat(catForm.daily_price), weekly_price: parseFloat(catForm.weekly_price), monthly_price: parseFloat(catForm.monthly_price) });
      success('Category created!');
      setShowAddCategory(false);
      setCatForm({ name: '', daily_price: '', weekly_price: '', monthly_price: '', color_code: '#3B82F6', description: '' });
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const STATUS_COUNTS = {
    available: seats.filter(s => s.current_status === 'available').length,
    occupied: seats.filter(s => s.current_status === 'occupied').length,
    maintenance: seats.filter(s => s.current_status === 'maintenance').length,
  };

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Seat Management" subtitle={`Managing seats for Abhyasika #${id}`}
      actions={
        <div className="flex gap-2">
          <button onClick={() => setShowAddCategory(!showAddCategory)} className="px-3 py-2 bg-purple-100 text-purple-600 rounded-xl text-sm font-semibold hover:bg-purple-200">
            <i className="fas fa-tag mr-1.5"></i>Add Category
          </button>
          <button onClick={() => setShowBulk(!showBulk)} className="px-3 py-2 bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-200">
            <i className="fas fa-grid-2 mr-1.5"></i>Bulk Add
          </button>
          <button onClick={() => setShowAddSeat(!showAddSeat)} className="gradient-primary text-white px-3 py-2 rounded-xl text-sm font-semibold">
            <i className="fas fa-plus mr-1.5"></i>Add Seat
          </button>
        </div>
      }
    >
      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available', count: STATUS_COUNTS.available, color: 'bg-green-50 text-green-600 border-green-200', dotColor: 'bg-green-500' },
          { label: 'Occupied', count: STATUS_COUNTS.occupied, color: 'bg-red-50 text-red-600 border-red-200', dotColor: 'bg-red-500' },
          { label: 'Maintenance', count: STATUS_COUNTS.maintenance, color: 'bg-yellow-50 text-yellow-600 border-yellow-200', dotColor: 'bg-yellow-500' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} border rounded-2xl p-4 flex items-center gap-4`}>
            <div className={`w-10 h-10 ${s.dotColor} rounded-xl flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">{s.count}</span>
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
              <input type="text" value={catForm.name} onChange={e => setCatForm(f => ({...f, name: e.target.value}))} placeholder="e.g. AC Premium"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Daily Price (₹)</label>
              <input type="number" value={catForm.daily_price} onChange={e => setCatForm(f => ({...f, daily_price: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Weekly Price (₹)</label>
              <input type="number" value={catForm.weekly_price} onChange={e => setCatForm(f => ({...f, weekly_price: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Price (₹)</label>
              <input type="number" value={catForm.monthly_price} onChange={e => setCatForm(f => ({...f, monthly_price: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
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
          <p className="text-sm text-gray-500 mt-3">Will create {parseInt(bulkForm.rows) * parseInt(bulkForm.cols)} seats</p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleBulkCreate} className="px-5 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold">
              Create {parseInt(bulkForm.rows) * parseInt(bulkForm.cols)} Seats
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Seat Number</label>
              <input type="text" value={seatForm.seat_number} onChange={e => setSeatForm(f => ({...f, seat_number: e.target.value}))} placeholder="A01"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Seat Label</label>
              <input type="text" value={seatForm.seat_label} onChange={e => setSeatForm(f => ({...f, seat_label: e.target.value}))} placeholder="Seat A01"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
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
                <input type="number" value={seatForm.row_number} onChange={e => setSeatForm(f => ({...f, row_number: e.target.value}))} placeholder="Row"
                  className="w-1/2 border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none" />
                <input type="number" value={seatForm.column_number} onChange={e => setSeatForm(f => ({...f, column_number: e.target.value}))} placeholder="Col"
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

      {/* Categories Overview */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color_code }}></div>
                <h4 className="font-bold text-gray-800 text-sm">{cat.name}</h4>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Daily: <span className="font-semibold text-gray-700">₹{cat.daily_price}</span></div>
                <div>Weekly: <span className="font-semibold text-gray-700">₹{cat.weekly_price}</span></div>
                <div>Monthly: <span className="font-semibold text-gray-700">₹{cat.monthly_price}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seat Grid */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800">Seat Layout ({seats.length} seats)</h3>
          <div className="flex items-center gap-4 text-xs">
            {[
              { label: 'Available', class: 'seat available scale-100 hover:scale-100 cursor-default w-6 h-6 rounded text-xs' },
              { label: 'Occupied', class: 'seat occupied scale-100 hover:scale-100 cursor-default w-6 h-6 rounded text-xs' },
              { label: 'Reserved', class: 'seat reserved scale-100 hover:scale-100 cursor-default w-6 h-6 rounded text-xs' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 ${item.class} rounded`}></div>
                <span className="text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
            {[...Array(24)].map((_, i) => <div key={i} className="h-10 w-10 bg-gray-100 rounded-lg loading-pulse"></div>)}
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
              return (
                <div key={seat.id} className={`seat ${status}`} title={`${seat.seat_number} - ${seat.category_name || ''} - ${status}`}>
                  {seat.seat_number.slice(-2)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
