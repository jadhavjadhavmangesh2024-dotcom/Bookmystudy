import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function OwnerAddAbhyasika() {
  const [form, setForm] = useState({
    name: '', description: '', tagline: '', address: '', pincode: '',
    city_id: '', locality_id: '', latitude: '', longitude: '',
    phone: '', email: '', website: '', opening_time: '06:00', closing_time: '22:00'
  });
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<number[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [localities, setLocalities] = useState<any[]>([]);
  const [photos, setPhotos] = useState<string[]>(['']);
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.cities.list().then((r: any) => setCities(r.data || []));
    api.facilities.list().then((r: any) => setFacilities(r.data || []));
  }, []);

  const handleCityChange = async (cityId: string) => {
    setForm(f => ({ ...f, city_id: cityId, locality_id: '' }));
    if (cityId) {
      const r: any = await api.cities.localities(cityId);
      setLocalities(r.data || []);
    }
  };

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.name || !form.address) return error('Name and address are required');
    setLoading(true);
    try {
      const r: any = await api.abhyasikas.create({
        ...form,
        city_id: form.city_id ? parseInt(form.city_id) : null,
        locality_id: form.locality_id ? parseInt(form.locality_id) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      setCreatedId(r.data.id);
      success('Study room created! Now add facilities and photos.');
      setStep(2);
    } catch (e: any) { error(e.message); }
    setLoading(false);
  };

  const handleFacilities = async () => {
    if (!createdId) return;
    setLoading(true);
    try {
      await api.abhyasikas.updateFacilities(createdId, { facility_ids: selectedFacilities });
      setStep(3);
    } catch (e: any) { error(e.message); }
    setLoading(false);
  };

  const handlePhotos = async () => {
    if (!createdId) return;
    const validPhotos = photos.filter(p => p.trim()).map((url, i) => ({ url, is_primary: i === 0 }));
    if (validPhotos.length) {
      try {
        await api.abhyasikas.addPhotos(createdId, { photos: validPhotos });
        success('Study room listing submitted for approval! Awaiting admin review.');
        navigate('/owner/listings');
      } catch (e: any) { error(e.message); }
    } else {
      success('Listing submitted successfully!');
      navigate('/owner/listings');
    }
  };

  const toggleFacility = (id: number) => {
    setSelectedFacilities(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const facilityGroups = facilities.reduce((acc: any, f: any) => {
    if (!acc[f.category_name]) acc[f.category_name] = [];
    acc[f.category_name].push(f);
    return acc;
  }, {});

  const STEPS = ['Basic Info', 'Facilities', 'Photos'];

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Add New Study Room" subtitle="List your study room on the platform">
      
      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i + 1 < step ? <i className="fas fa-check text-xs"></i> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i + 1 < step ? 'bg-green-400' : 'bg-gray-200'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="max-w-2xl">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Basic Information</h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Study Room Name *</label>
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required
                  placeholder="e.g. Vidya Study Hub, Saraswati Library"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City *</label>
                <select value={form.city_id} onChange={e => handleCityChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Locality</label>
                <select value={form.locality_id} onChange={e => update('locality_id', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                  <option value="">Select Locality</option>
                  {localities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Address *</label>
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)} required
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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Opening Time</label>
                <input type="time" value={form.opening_time} onChange={e => update('opening_time', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Closing Time</label>
                <input type="time" value={form.closing_time} onChange={e => update('closing_time', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Latitude (optional)</label>
                <input type="text" value={form.latitude} onChange={e => update('latitude', e.target.value)}
                  placeholder="18.5204"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Longitude (optional)</label>
                <input type="text" value={form.longitude} onChange={e => update('longitude', e.target.value)}
                  placeholder="73.8567"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <button onClick={handleCreate} disabled={loading} className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full loading-spinner"></div>Saving...</> : <><i className="fas fa-arrow-right"></i>Save & Continue</>}
            </button>
          </div>
        )}

        {/* Step 2: Facilities */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-5">Available Facilities</h3>
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
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">← Back</button>
              <button onClick={handleFacilities} disabled={loading} className="flex-1 gradient-primary text-white py-3 rounded-xl text-sm font-semibold">
                Save & Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Upload Photos</h3>
            <p className="text-sm text-gray-500 mb-5">Add photo URLs for your study room. First photo will be the main cover photo.</p>
            <div className="space-y-3">
              {photos.map((p, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-1 relative">
                    <i className="fas fa-image absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="url" value={p} onChange={e => { const n = [...photos]; n[i] = e.target.value; setPhotos(n); }}
                      placeholder={i === 0 ? "Main cover photo URL (required)" : `Photo ${i + 1} URL`}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  {i === 0 && <span className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 text-xs rounded-xl font-medium">Cover</span>}
                  {i > 0 && <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="p-3 bg-red-100 text-red-500 rounded-xl hover:bg-red-200">
                    <i className="fas fa-times"></i>
                  </button>}
                </div>
              ))}
              {photos.length < 10 && (
                <button onClick={() => setPhotos([...photos, ''])}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                  <i className="fas fa-plus mr-2"></i>Add More Photos
                </button>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4 text-sm text-blue-700">
              <i className="fas fa-info-circle mr-2"></i>
              After submission, your listing will be reviewed by our admin team and approved within 2-3 business days.
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">← Back</button>
              <button onClick={handlePhotos} disabled={loading} className="flex-1 gradient-primary text-white py-3 rounded-xl text-sm font-semibold">
                <i className="fas fa-paper-plane mr-2"></i>Submit for Approval
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
