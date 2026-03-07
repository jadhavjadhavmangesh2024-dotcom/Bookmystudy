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
  const [cities, setCities] = useState<any[]>([]);
  const [localities, setLocalities] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<number[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'facilities' | 'photos'>('basic');

  const [form, setForm] = useState({
    name: '', description: '', tagline: '', address: '', pincode: '',
    city_id: '', locality_id: '', latitude: '', longitude: '',
    phone: '', email: '', website: '', opening_time: '06:00', closing_time: '22:00',
    days_open: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'
  });

  useEffect(() => {
    const init = async () => {
      try {
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

        setCities(citiesRes.data || []);
        setFacilities(facilitiesRes.data || []);
        setPhotos(a.photos || []);

        // Set selected facilities
        if (a.facilities && a.facilities.length > 0) {
          setSelectedFacilities(a.facilities.map((f: any) => f.id));
        }

        // Load localities if city is set
        if (a.city_id) {
          const locRes: any = await api.cities.localities(a.city_id);
          setLocalities(locRes.data || []);
        }
      } catch (e: any) {
        error('Failed to load Abhyasika data');
      }
      setLoading(false);
    };
    init();
  }, [id]);

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

  if (loading) return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Edit Abhyasika" subtitle="Update your study room details">
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Edit Abhyasika" subtitle="Update your study room details"
      actions={
        <button onClick={() => navigate('/owner/listings')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
          <i className="fas fa-arrow-left"></i> Back to Listings
        </button>
      }>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        {(['basic', 'facilities', 'photos'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <i className={`fas ${tab === 'basic' ? 'fa-info-circle' : tab === 'facilities' ? 'fa-list-check' : 'fa-images'} mr-2`}></i>
            {tab === 'basic' ? 'Basic Info' : tab === 'facilities' ? 'Facilities' : 'Photos'}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {/* ---- BASIC INFO TAB ---- */}
        {activeTab === 'basic' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
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
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
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

        {/* ---- FACILITIES TAB ---- */}
        {activeTab === 'facilities' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Available Facilities</h3>
            <p className="text-sm text-gray-500 mb-5">Select all facilities available at your Abhyasika</p>
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

        {/* ---- PHOTOS TAB ---- */}
        {activeTab === 'photos' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Photos</h3>
            <p className="text-sm text-gray-500 mb-5">Manage photos for your Abhyasika</p>

            {/* Existing Photos */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {photos.map((photo: any, i: number) => (
                  <div key={photo.id || i} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as any).src = 'https://placehold.co/200x120?text=Photo'; }} />
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

            {/* Add New Photo */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3"><i className="fas fa-plus-circle mr-2 text-indigo-500"></i>Add New Photo</p>
              <div className="flex gap-3">
                <input type="url" value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)}
                  placeholder="Paste photo URL here..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                <button onClick={handleAddPhoto} disabled={saving || !newPhotoUrl.trim()}
                  className="px-5 py-3 gradient-primary text-white rounded-xl text-sm font-semibold disabled:opacity-70">
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
      </div>
    </DashboardLayout>
  );
}
