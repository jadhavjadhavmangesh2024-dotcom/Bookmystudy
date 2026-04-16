import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function OwnerEditAbhyasika() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [localities, setLocalities] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<number[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'facilities' | 'photos' | 'policy' | 'seats'>('basic');

  // ---- SEATS STATE ----
  const [seats, setSeats] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [deletingSeats, setDeletingSeats] = useState<Set<number>>(new Set());
  const [confirmDeleteSeat, setConfirmDeleteSeat] = useState<any | null>(null);
  const [seatForm, setSeatForm] = useState({ seat_number: '', seat_label: '', category_id: '', row_number: '', column_number: '' });
  const [bulkForm, setBulkForm] = useState({ rows: '5', cols: '6', prefix: 'S', category_id: '' });
  const [catForm, setCatForm] = useState({ name: '', daily_price: '', weekly_price: '', monthly_price: '', color_code: '#3B82F6', description: '' });
  const [editCatForm, setEditCatForm] = useState({ name: '', daily_price: '', weekly_price: '', monthly_price: '', color_code: '#3B82F6', description: '' });

  const [form, setForm] = useState({
    name: '', description: '', tagline: '', address: '', pincode: '',
    city_id: '', locality_id: '', latitude: '', longitude: '',
    phone: '', email: '', website: '', opening_time: '06:00', closing_time: '22:00',
    days_open: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'
  });

  const [policy, setPolicy] = useState({
    cancellation_policy: 'flexible',
    cancellation_hours: '24',
    refund_percentage: '100',
    late_cancel_refund: '50',
    no_show_policy: 'no_refund',
    custom_policy_text: ''
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const myListings: any = await api.abhyasikas.myListings();
        const owned = (myListings.data || []).find((a: any) => String(a.id) === String(id));
        if (!owned) {
          setNotAuthorized(true);
          setLoading(false);
          return;
        }

        const [abhyasikaRes, citiesRes, facilitiesRes]: any[] = await Promise.all([
          api.abhyasikas.get(id!),
          api.cities.list(),
          api.facilities.list(),
        ]);

        const a = abhyasikaRes.data;
        setForm({
          name: a.name || '',
          description: a.description || '',
          tagline: a.tagline || '',
          address: a.address || '',
          pincode: a.pincode || '',
          city_id: a.city_id ? String(a.city_id) : '',
          locality_id: a.locality_id ? String(a.locality_id) : '',
          latitude: a.latitude ? String(a.latitude) : '',
          longitude: a.longitude ? String(a.longitude) : '',
          phone: a.phone || '',
          email: a.email || '',
          website: a.website || '',
          opening_time: a.opening_time || '06:00',
          closing_time: a.closing_time || '22:00',
          days_open: a.days_open || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        });

        if (a.cancellation_policy) {
          setPolicy({
            cancellation_policy: a.cancellation_policy || 'flexible',
            cancellation_hours: String(a.cancellation_hours || '24'),
            refund_percentage: String(a.refund_percentage || '100'),
            late_cancel_refund: String(a.late_cancel_refund || '50'),
            no_show_policy: a.no_show_policy || 'no_refund',
            custom_policy_text: a.custom_policy_text || ''
          });
        }

        setCities(citiesRes.data || []);
        setFacilities(facilitiesRes.data || []);
        setPhotos(a.photos || []);

        if (a.facilities && a.facilities.length > 0) {
          setSelectedFacilities(a.facilities.map((f: any) => f.id));
        }

        if (a.city_id) {
          const locRes: any = await api.cities.localities(a.city_id);
          setLocalities(locRes.data || []);
        }
      } catch (e: any) {
        error('Failed to load study room data');
      }
      setLoading(false);
    };
    init();
  }, [id]);

  // Load seats when seats tab is active
  useEffect(() => {
    if (activeTab === 'seats' && id) {
      loadSeats();
    }
  }, [activeTab, id]);

  const loadSeats = async () => {
    setSeatsLoading(true);
    try {
      const [s, c]: any = await Promise.all([api.seats.list(id), api.seats.categories(id)]);
      setSeats(s.data || []);
      setCategories(c.data || []);
    } catch (e: any) { error(e.message); }
    setSeatsLoading(false);
  };

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCityChange = async (cityId: string) => {
    setForm(f => ({ ...f, city_id: cityId, locality_id: '' }));
    if (cityId) {
      const r: any = await api.cities.localities(cityId);
      setLocalities(r.data || []);
    } else {
      setLocalities([]);
    }
  };

  const handleSaveBasic = async () => {
    if (!form.name || !form.address) return error('Name and address are required');
    setSaving(true);
    try {
      await api.abhyasikas.update(id!, {
        ...form,
        city_id: form.city_id ? parseInt(form.city_id) : null,
        locality_id: form.locality_id ? parseInt(form.locality_id) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      success('Basic info saved successfully!');
    } catch (e: any) { error(e.message); }
    setSaving(false);
  };

  const handleSaveFacilities = async () => {
    setSaving(true);
    try {
      await api.abhyasikas.updateFacilities(id!, { facility_ids: selectedFacilities });
      success('Facilities updated!');
    } catch (e: any) { error(e.message); }
    setSaving(false);
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      await api.abhyasikas.update(id!, {
        cancellation_policy: policy.cancellation_policy,
        cancellation_hours: parseInt(policy.cancellation_hours),
        refund_percentage: parseInt(policy.refund_percentage),
        late_cancel_refund: parseInt(policy.late_cancel_refund),
        no_show_policy: policy.no_show_policy,
        custom_policy_text: policy.custom_policy_text
      });
      success('Cancellation policy saved!');
    } catch (e: any) { error(e.message); }
    setSavingPolicy(false);
  };

  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) return;
    setSaving(true);
    try {
      await api.abhyasikas.addPhotos(id!, { photos: [{ url: newPhotoUrl, is_primary: photos.length === 0 }] });
      setPhotos(prev => [...prev, { url: newPhotoUrl, is_primary: photos.length === 0, id: Date.now() }]);
      setNewPhotoUrl('');
      success('Photo added!');
    } catch (e: any) { error(e.message); }
    setSaving(false);
  };

  const handleDeletePhoto = async (photoId: number) => {
    setSaving(true);
    try {
      await api.abhyasikas.deletePhoto(id!, photoId);
      setPhotos(prev => prev.filter((p: any) => p.id !== photoId));
      success('Photo removed!');
    } catch (e: any) { error(e.message); }
    setSaving(false);
  };

  // ---- SEAT HANDLERS ----
  const handleAddSeat = async () => {
    if (!seatForm.seat_number) return error('Seat number required');
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
      loadSeats();
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
      loadSeats();
    } catch (e: any) { error(e.message); }
  };

  const handleAddCategory = async () => {
    if (!catForm.name || !catForm.daily_price) return error('Name and daily price required');
    try {
      await api.seats.createCategory({
        abhyasika_id: parseInt(id!),
        ...catForm,
        daily_price: parseFloat(catForm.daily_price),
        weekly_price: parseFloat(catForm.weekly_price || '0'),
        monthly_price: parseFloat(catForm.monthly_price || '0')
      });
      success('Category created!');
      setShowAddCategory(false);
      setCatForm({ name: '', daily_price: '', weekly_price: '', monthly_price: '', color_code: '#3B82F6', description: '' });
      loadSeats();
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
      loadSeats();
    } catch (e: any) { error(e.message); }
  };

  const handleDeleteSeat = async (seat: any) => {
    setDeletingSeats(prev => new Set(prev).add(seat.id));
    try {
      await api.seats.delete(seat.id);
      success(`Seat ${seat.seat_number} deleted!`);
      setConfirmDeleteSeat(null);
      loadSeats();
    } catch (e: any) { error(e.message); }
    setDeletingSeats(prev => { const s = new Set(prev); s.delete(seat.id); return s; });
  };

  const toggleFacility = (fId: number) => {
    setSelectedFacilities(prev => prev.includes(fId) ? prev.filter(f => f !== fId) : [...prev, fId]);
  };

  const facilityGroups = facilities.reduce((acc: any, f: any) => {
    const cat = f.category_name || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const toggleDay = (day: string) => {
    const days = form.days_open.split(',').filter(Boolean);
    const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    update('days_open', updated.join(','));
  };

  const STATUS_COUNTS = {
    available: seats.filter(s => s.current_status === 'available' || (!s.current_status && s.status === 'available')).length,
    occupied: seats.filter(s => s.current_status === 'occupied').length,
    maintenance: seats.filter(s => s.current_status === 'maintenance' || s.status === 'maintenance').length,
  };

  const TABS = [
    { key: 'basic', label: 'Basic Info', icon: 'fa-info-circle' },
    { key: 'seats', label: 'Seats', icon: 'fa-chair' },
    { key: 'facilities', label: 'Facilities', icon: 'fa-list-check' },
    { key: 'photos', label: 'Photos', icon: 'fa-images' },
    { key: 'policy', label: 'Cancellation', icon: 'fa-file-contract' },
  ];

  if (notAuthorized) return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Access Denied" subtitle="">
      <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-lock text-red-500 text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Access Denied</h2>
        <p className="text-gray-500 mb-6">तुम्ही फक्त तुमच्या स्वतःच्या study room edit करू शकता.</p>
        <button onClick={() => navigate('/owner/listings')}
          className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
          <i className="fas fa-arrow-left mr-2"></i>Back to Listings
        </button>
      </div>
    </DashboardLayout>
  );

  if (loading) return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Edit Study Room" subtitle="Update your study room details">
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Edit Study Room" subtitle="Update your study room details"
      actions={
        <button onClick={() => navigate('/owner/listings')}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
          <i className="fas fa-arrow-left"></i>
          <span className="hidden sm:inline">Back to Listings</span>
        </button>
      }>

      {/* ============ GLOBAL MODALS ============ */}

      {/* Confirm Delete Seat */}
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
                {deletingSeats.has(confirmDeleteSeat.id)
                  ? <><i className="fas fa-spinner fa-spin mr-2"></i>Deleting...</>
                  : <><i className="fas fa-trash mr-2"></i>Delete करा</>}
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
              <h3 className="text-lg font-bold text-gray-800">Edit: {editingCategory.name}</h3>
              <button onClick={() => setEditingCategory(null)} className="ml-auto p-1 text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name</label>
                <input type="text" value={editCatForm.name}
                  onChange={e => setEditCatForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={editCatForm.color_code}
                    onChange={e => setEditCatForm(f => ({ ...f, color_code: e.target.value }))}
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" />
                  <span className="text-sm text-gray-500">{editCatForm.color_code}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: 'daily_price', label: 'Daily (₹)' },
                  { k: 'weekly_price', label: 'Weekly (₹)' },
                  { k: 'monthly_price', label: 'Monthly (₹)' },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                    <input type="number" value={(editCatForm as any)[k]}
                      onChange={e => setEditCatForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSaveCategory}
                className="flex-1 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold">
                <i className="fas fa-save mr-2"></i>Save Rates
              </button>
              <button onClick={() => setEditingCategory(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB NAVIGATION ============ */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-max min-w-full sm:w-fit">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============ BASIC INFO TAB ============ */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-gray-800">Basic Information</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Study Room Name *</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                placeholder="e.g. Vidya Study Hub"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tagline</label>
              <input type="text" value={form.tagline} onChange={e => update('tagline', e.target.value)}
                placeholder="e.g. Where Toppers Study"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
                placeholder="Describe your study room..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
              <select value={form.city_id} onChange={e => handleCityChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Select City</option>
                {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Locality</label>
              <select value={form.locality_id} onChange={e => update('locality_id', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Select Locality</option>
                {localities.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Address *</label>
              <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                placeholder="Shop No, Street, Area, City"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">PIN Code</label>
              <input type="text" value={form.pincode} onChange={e => update('pincode', e.target.value)}
                placeholder="411038"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                placeholder="+91 9876543210"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="study@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
              <input type="url" value={form.website} onChange={e => update('website', e.target.value)}
                placeholder="https://your-site.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Opening Time</label>
              <input type="time" value={form.opening_time} onChange={e => update('opening_time', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Closing Time</label>
              <input type="time" value={form.closing_time} onChange={e => update('closing_time', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Days Open</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => {
                  const active = form.days_open.split(',').includes(day);
                  return (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Latitude</label>
              <input type="text" value={form.latitude} onChange={e => update('latitude', e.target.value)}
                placeholder="18.5204"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Longitude</label>
              <input type="text" value={form.longitude} onChange={e => update('longitude', e.target.value)}
                placeholder="73.8567"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <button onClick={handleSaveBasic} disabled={saving}
            className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
            {saving ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</> : <><i className="fas fa-save"></i>Save Changes</>}
          </button>
        </div>
      )}

      {/* ============ SEATS TAB ============ */}
      {activeTab === 'seats' && (
        <div>
          {/* Top Actions Bar */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button onClick={() => { setShowAddCategory(!showAddCategory); setShowAddSeat(false); setShowBulk(false); }}
              className="px-3 py-2 bg-purple-100 text-purple-600 rounded-xl text-sm font-semibold hover:bg-purple-200">
              <i className="fas fa-tag mr-1.5"></i>Add Category
            </button>
            <button onClick={() => { setShowBulk(!showBulk); setShowAddSeat(false); setShowAddCategory(false); }}
              className="px-3 py-2 bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-200">
              <i className="fas fa-th mr-1.5"></i>Bulk Add
            </button>
            <button onClick={() => { setShowAddSeat(!showAddSeat); setShowBulk(false); setShowAddCategory(false); }}
              className="px-3 py-2 gradient-primary text-white rounded-xl text-sm font-semibold">
              <i className="fas fa-plus mr-1.5"></i>Add Seat
            </button>
            <button onClick={loadSeats} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200">
              <i className="fas fa-refresh"></i>
            </button>
          </div>

          {/* Add Category Form */}
          {showAddCategory && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                <i className="fas fa-tag"></i>New Seat Category
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name *</label>
                  <input type="text" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. AC Section, Window Seat"
                    className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Daily Rate (₹) *</label>
                  <input type="number" value={catForm.daily_price} onChange={e => setCatForm(f => ({ ...f, daily_price: e.target.value }))}
                    placeholder="50"
                    className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Weekly Rate (₹)</label>
                  <input type="number" value={catForm.weekly_price} onChange={e => setCatForm(f => ({ ...f, weekly_price: e.target.value }))}
                    placeholder="300"
                    className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Rate (₹)</label>
                  <input type="number" value={catForm.monthly_price} onChange={e => setCatForm(f => ({ ...f, monthly_price: e.target.value }))}
                    placeholder="1000"
                    className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Color</label>
                  <input type="color" value={catForm.color_code}
                    onChange={e => setCatForm(f => ({ ...f, color_code: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-purple-200 cursor-pointer bg-white" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleAddCategory}
                  className="px-5 py-2 gradient-primary text-white rounded-xl text-sm font-semibold">
                  <i className="fas fa-plus mr-1.5"></i>Create Category
                </button>
                <button onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-white">Cancel</button>
              </div>
            </div>
          )}

          {/* Bulk Add Form */}
          {showBulk && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <i className="fas fa-th"></i>Bulk Seats बनवा
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rows</label>
                  <input type="number" value={bulkForm.rows} min="1" max="20"
                    onChange={e => setBulkForm(f => ({ ...f, rows: e.target.value }))}
                    className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Columns</label>
                  <input type="number" value={bulkForm.cols} min="1" max="20"
                    onChange={e => setBulkForm(f => ({ ...f, cols: e.target.value }))}
                    className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prefix</label>
                  <input type="text" value={bulkForm.prefix} maxLength={3}
                    onChange={e => setBulkForm(f => ({ ...f, prefix: e.target.value }))}
                    className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select value={bulkForm.category_id}
                    onChange={e => setBulkForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    <option value="">No Category</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                <i className="fas fa-info-circle mr-1"></i>
                {parseInt(bulkForm.rows) * parseInt(bulkForm.cols)} seats बनतील ({bulkForm.prefix}1-1 ते {bulkForm.prefix}{bulkForm.rows}-{bulkForm.cols})
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={handleBulkCreate}
                  className="px-5 py-2 gradient-primary text-white rounded-xl text-sm font-semibold">
                  <i className="fas fa-plus mr-1.5"></i>Create {parseInt(bulkForm.rows) * parseInt(bulkForm.cols)} Seats
                </button>
                <button onClick={() => setShowBulk(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-white">Cancel</button>
              </div>
            </div>
          )}

          {/* Add Single Seat Form */}
          {showAddSeat && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
              <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                <i className="fas fa-chair"></i>Single Seat Add करा
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Seat Number *</label>
                  <input type="text" value={seatForm.seat_number}
                    onChange={e => setSeatForm(f => ({ ...f, seat_number: e.target.value }))}
                    placeholder="A1"
                    className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
                  <input type="text" value={seatForm.seat_label}
                    onChange={e => setSeatForm(f => ({ ...f, seat_label: e.target.value }))}
                    placeholder="Window Seat"
                    className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select value={seatForm.category_id}
                    onChange={e => setSeatForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    <option value="">No Category</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleAddSeat}
                  className="px-5 py-2 gradient-primary text-white rounded-xl text-sm font-semibold">
                  <i className="fas fa-plus mr-1.5"></i>Add Seat
                </button>
                <button onClick={() => setShowAddSeat(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-white">Cancel</button>
              </div>
            </div>
          )}

          {/* Stats */}
          {seats.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total', value: seats.length, color: 'bg-gray-100 text-gray-700', icon: 'fa-chair' },
                { label: 'Available', value: STATUS_COUNTS.available, color: 'bg-green-100 text-green-700', icon: 'fa-circle-check' },
                { label: 'Occupied', value: STATUS_COUNTS.occupied, color: 'bg-red-100 text-red-700', icon: 'fa-user' },
              ].map((s, i) => (
                <div key={i} className={`${s.color} rounded-xl p-3 flex items-center gap-2`}>
                  <i className={`fas ${s.icon} text-lg`}></i>
                  <div>
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs font-medium">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Categories with Edit */}
          {categories.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-700 mb-2"><i className="fas fa-tag mr-2 text-purple-500"></i>Categories & Rates</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color_code || '#3B82F6' }}></div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{cat.name}</p>
                        <p className="text-xs text-gray-500">
                          ₹{cat.daily_price}/day
                          {cat.monthly_price > 0 && ` · ₹${cat.monthly_price}/mo`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleEditCategory(cat)}
                      className="flex-shrink-0 px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-200">
                      <i className="fas fa-edit mr-1"></i>Edit Rates
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seats Grid */}
          {seatsLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : seats.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
              <i className="fas fa-chair text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500 font-medium mb-1">अजून कोणतेही seats नाहीत</p>
              <p className="text-gray-400 text-sm">वरील बटणे वापरून seats add करा</p>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3">
                <i className="fas fa-chair mr-2 text-blue-500"></i>All Seats ({seats.length})
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {seats.map((seat: any) => {
                  const cat = categories.find(c => c.id === seat.category_id);
                  const status = seat.current_status || seat.status || 'available';
                  const statusColor = status === 'available'
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : status === 'occupied'
                      ? 'bg-red-100 border-red-300 text-red-800'
                      : 'bg-gray-100 border-gray-300 text-gray-500';

                  return (
                    <div key={seat.id} className="group relative">
                      <div className={`${statusColor} border-2 rounded-xl p-2 text-center cursor-pointer transition-all hover:shadow-md`}
                        style={{ borderColor: cat?.color_code || undefined }}>
                        <i className="fas fa-chair text-base mb-0.5 block"></i>
                        <p className="text-xs font-bold leading-tight">{seat.seat_number}</p>
                        {cat && <p className="text-xs opacity-70 truncate">{cat.name}</p>}
                      </div>
                      {/* Delete button on hover */}
                      {status !== 'occupied' && (
                        <button
                          onClick={() => setConfirmDeleteSeat(seat)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex hover:bg-red-600 z-10">
                          <i className="fas fa-times" style={{ fontSize: '9px' }}></i>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                <i className="fas fa-info-circle mr-1"></i>Seat वर hover करा → ✕ बटण दाबा → delete
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============ FACILITIES TAB ============ */}
      {activeTab === 'facilities' && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Available Facilities</h3>
          <p className="text-sm text-gray-500 mb-5">Select all facilities available at your study room</p>
          <div className="space-y-5">
            {Object.entries(facilityGroups).map(([cat, facs]: any) => (
              <div key={cat}>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{cat}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {facs.map((f: any) => (
                    <button key={f.id} type="button" onClick={() => toggleFacility(f.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all text-sm ${selectedFacilities.includes(f.id) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${selectedFacilities.includes(f.id) ? 'bg-indigo-500' : 'bg-gray-100'}`}>
                        {selectedFacilities.includes(f.id) && <i className="fas fa-check text-white text-xs"></i>}
                      </div>
                      <span className="font-medium">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSaveFacilities} disabled={saving}
            className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold text-sm mt-6 disabled:opacity-70 flex items-center justify-center gap-2">
            {saving ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</> : <><i className="fas fa-save"></i>Save Facilities</>}
          </button>
        </div>
      )}

      {/* ============ PHOTOS TAB ============ */}
      {activeTab === 'photos' && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Photos</h3>
          <p className="text-sm text-gray-500 mb-5">Manage photos for your study room</p>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {photos.map((photo: any, i: number) => (
                <div key={photo.id || i} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                  <img src={photo.url} alt="" className="w-full h-full object-cover"
                    onError={e => { (e.target as any).src = 'https://placehold.co/200x120?text=Photo'; }} />
                  {photo.is_primary === 1 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">Cover</div>
                  )}
                  <button onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              <i className="fas fa-plus-circle mr-2 text-indigo-500"></i>Add New Photo
            </p>
            <div className="flex gap-2">
              <input type="url" value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)}
                placeholder="Paste photo URL here..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 min-w-0" />
              <button onClick={handleAddPhoto} disabled={saving || !newPhotoUrl.trim()}
                className="px-4 py-3 gradient-primary text-white rounded-xl text-sm font-semibold disabled:opacity-70 flex-shrink-0">
                {saving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-plus mr-1"></i>Add</>}
              </button>
            </div>
            {newPhotoUrl && (
              <div className="mt-3 w-full h-32 bg-gray-100 rounded-xl overflow-hidden">
                <img src={newPhotoUrl} alt="Preview" className="w-full h-full object-cover"
                  onError={e => { (e.target as any).style.display = 'none'; }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ CANCELLATION POLICY TAB ============ */}
      {activeTab === 'policy' && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Cancellation Policy</h3>
            <p className="text-sm text-gray-500">Students booking केल्यावर cancel करण्याचे rules सेट करा.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Policy Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'flexible', label: 'Flexible', desc: 'Full refund up to 24h before', icon: 'fa-leaf', color: 'green' },
                { value: 'moderate', label: 'Moderate', desc: 'Full refund up to 5 days before', icon: 'fa-balance-scale', color: 'blue' },
                { value: 'strict', label: 'Strict', desc: '50% refund only', icon: 'fa-shield', color: 'orange' },
                { value: 'no_refund', label: 'No Refund', desc: 'No cancellations', icon: 'fa-ban', color: 'red' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setPolicy(p => ({ ...p, cancellation_policy: opt.value }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${policy.cancellation_policy === opt.value
                    ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <i className={`fas ${opt.icon} text-sm`}></i>
                    <span className={`font-bold text-sm ${policy.cancellation_policy === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {policy.cancellation_policy !== 'no_refund' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <i className="fas fa-clock mr-2 text-blue-400"></i>Cancel Deadline (hours)
                </label>
                <input type="number" value={policy.cancellation_hours}
                  onChange={e => setPolicy(p => ({ ...p, cancellation_hours: e.target.value }))}
                  min="1" max="720" placeholder="24"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <i className="fas fa-percent mr-2 text-green-400"></i>On-time Refund %
                </label>
                <input type="number" value={policy.refund_percentage}
                  onChange={e => setPolicy(p => ({ ...p, refund_percentage: e.target.value }))}
                  min="0" max="100" placeholder="100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <i className="fas fa-percent mr-2 text-orange-400"></i>Late Cancel Refund %
                </label>
                <input type="number" value={policy.late_cancel_refund}
                  onChange={e => setPolicy(p => ({ ...p, late_cancel_refund: e.target.value }))}
                  min="0" max="100" placeholder="50"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <i className="fas fa-user-slash mr-2 text-red-400"></i>No-Show Policy
                </label>
                <select value={policy.no_show_policy}
                  onChange={e => setPolicy(p => ({ ...p, no_show_policy: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500">
                  <option value="no_refund">No Refund</option>
                  <option value="partial">Partial Refund (50%)</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <i className="fas fa-pen mr-2 text-purple-400"></i>Custom Policy Note (Optional)
            </label>
            <textarea value={policy.custom_policy_text}
              onChange={e => setPolicy(p => ({ ...p, custom_policy_text: e.target.value }))}
              rows={3} placeholder="e.g. Medical emergencies मध्ये full refund दिला जातो..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 resize-none"></textarea>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <h4 className="font-bold text-teal-800 text-sm mb-2">
              <i className="fas fa-eye mr-2"></i>Preview (Students ला असे दिसेल)
            </h4>
            <div className="text-sm text-teal-700 space-y-1">
              {policy.cancellation_policy === 'no_refund' ? (
                <p><i className="fas fa-ban mr-2"></i>No Refund - एकदा booking confirmed झाल्यावर cancel करता येणार नाही.</p>
              ) : (
                <>
                  <p><i className="fas fa-check-circle mr-2 text-green-600"></i><strong>{policy.cancellation_hours} तास</strong> आधी cancel → <strong>{policy.refund_percentage}%</strong> refund.</p>
                  <p><i className="fas fa-exclamation-circle mr-2 text-orange-500"></i>उशिरा cancel → <strong>{policy.late_cancel_refund}%</strong> refund.</p>
                  <p><i className="fas fa-user-slash mr-2 text-red-500"></i>No-show: {policy.no_show_policy === 'no_refund' ? 'No refund' : '50% refund'}.</p>
                </>
              )}
              {policy.custom_policy_text && (
                <p className="mt-2 italic text-teal-600">"{policy.custom_policy_text}"</p>
              )}
            </div>
          </div>

          <button onClick={handleSavePolicy} disabled={savingPolicy}
            className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
            {savingPolicy
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</>
              : <><i className="fas fa-save"></i>Save Policy</>}
          </button>
        </div>
      )}

    </DashboardLayout>
  );
}
