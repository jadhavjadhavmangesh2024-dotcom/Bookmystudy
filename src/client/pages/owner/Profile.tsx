import React, { useState, useEffect } from 'react';
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

export default function OwnerProfile() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'bank'>('personal');

  const [personalForm, setPersonalForm] = useState({
    first_name: '', last_name: '', phone: '', avatar_url: ''
  });
  const [businessForm, setBusinessForm] = useState({
    business_name: '', gst_number: '', pan_number: ''
  });
  const [bankForm, setBankForm] = useState({
    bank_account_number: '', bank_ifsc: '', upi_id: '', bank_name: ''
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [profileRes, listingsRes]: any[] = await Promise.all([
          api.users.profile(),
          api.abhyasikas.myListings()
        ]);

        const p = profileRes.data;
        const prof = p.profile || {};

        setPersonalForm({
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          phone: p.phone || '',
          avatar_url: p.avatar_url || ''
        });
        setBusinessForm({
          business_name: prof.business_name || '',
          gst_number: prof.gst_number || '',
          pan_number: prof.pan_number || '',
        });
        setBankForm({
          bank_name: prof.bank_name || '',
          bank_account_number: prof.bank_account_number || '',
          bank_ifsc: prof.bank_ifsc || '',
          upi_id: prof.upi_id || ''
        });

        const listings = listingsRes.data || [];
        const totalBookings = listings.reduce((s: number, l: any) => s + (l.active_bookings || 0), 0);
        const totalSeats = listings.reduce((s: number, l: any) => s + (l.total_seats || 0), 0);
        setStats({
          total_abhyasikas: listings.length,
          active_bookings: totalBookings,
          total_seats: totalSeats,
          approved: listings.filter((l: any) => l.status === 'approved').length,
          kyc_status: prof.kyc_status || 'pending',
          commission_rate: prof.commission_rate || 10
        });
      } catch (e: any) {
        error('Failed to load profile');
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      await api.users.updateProfile(personalForm);
      success('Personal info saved!');
    } catch (e: any) { error(e.message); }
    setSaving(false);
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      await api.users.updateProfile({ ...personalForm, ...businessForm });
      success('Business info saved!');
    } catch (e: any) { error(e.message); }
    setSaving(false);
  };

  const handleSaveBank = async () => {
    setSaving(true);
    try {
      await api.users.updateProfile({ ...personalForm, ...bankForm });
      success('Bank details saved!');
    } catch (e: any) { error(e.message); }
    setSaving(false);
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  if (loading) return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="My Profile" subtitle="Manage your account">
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="My Profile" subtitle="Manage your account and business details">

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold shadow-lg flex-shrink-0">
            {personalForm.avatar_url ? (
              <img src={personalForm.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{personalForm.first_name} {personalForm.last_name}</h2>
            <p className="text-white/80 text-sm mt-1">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
                <i className="fas fa-building mr-1"></i>Study Room Owner
              </span>
              {stats && (
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${stats.kyc_status === 'verified' ? 'bg-green-500/30 text-green-200' : 'bg-yellow-500/30 text-yellow-200'}`}>
                  <i className={`fas ${stats.kyc_status === 'verified' ? 'fa-shield-check' : 'fa-clock'} mr-1`}></i>
                  KYC {stats.kyc_status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/20">
            {[
              { label: 'Study Rooms', value: stats.total_abhyasikas, icon: 'fa-building' },
              { label: 'Approved', value: stats.approved, icon: 'fa-check-circle' },
              { label: 'Total Seats', value: stats.total_seats, icon: 'fa-chair' },
              { label: 'Commission', value: `${stats.commission_rate}%`, icon: 'fa-percent' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                <i className={`fas ${s.icon} text-white/70 mb-1`}></i>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-white/70 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        {(['personal', 'business', 'bank'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <i className={`fas ${tab === 'personal' ? 'fa-user' : tab === 'business' ? 'fa-briefcase' : 'fa-university'} mr-2`}></i>
            {tab === 'personal' ? 'Personal' : tab === 'business' ? 'Business' : 'Bank Details'}
          </button>
        ))}
      </div>

      <div className="max-w-xl">
        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                <input type="text" value={personalForm.first_name}
                  onChange={e => setPersonalForm(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                <input type="text" value={personalForm.last_name}
                  onChange={e => setPersonalForm(f => ({ ...f, last_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={user?.email || ''} disabled
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1"><i className="fas fa-lock mr-1"></i>Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <input type="tel" value={personalForm.phone}
                onChange={e => setPersonalForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 9876543210"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Profile Photo URL</label>
              <input type="url" value={personalForm.avatar_url}
                onChange={e => setPersonalForm(f => ({ ...f, avatar_url: e.target.value }))}
                placeholder="https://your-photo-url.com/photo.jpg"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              {personalForm.avatar_url && (
                <img src={personalForm.avatar_url} alt="" className="mt-2 w-16 h-16 rounded-xl object-cover border-2 border-gray-200"
                  onError={e => { (e.target as any).style.display = 'none'; }} />
              )}
            </div>

            <button onClick={handleSavePersonal} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
              {saving ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</> : <><i className="fas fa-save"></i>Save Personal Info</>}
            </button>
          </div>
        )}

        {/* Business Tab */}
        {activeTab === 'business' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Business Information</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
              <i className="fas fa-info-circle mr-2"></i>
              This information is used for KYC verification and tax purposes.
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business / Library Name</label>
              <input type="text" value={businessForm.business_name}
                onChange={e => setBusinessForm(f => ({ ...f, business_name: e.target.value }))}
                placeholder="e.g. Vidya Study Hub Pvt Ltd"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">GST Number</label>
                <input type="text" value={businessForm.gst_number}
                  onChange={e => setBusinessForm(f => ({ ...f, gst_number: e.target.value.toUpperCase() }))}
                  placeholder="27XXXXX1234X1ZX"
                  maxLength={15}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">PAN Number</label>
                <input type="text" value={businessForm.pan_number}
                  onChange={e => setBusinessForm(f => ({ ...f, pan_number: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
              </div>
            </div>

            <button onClick={handleSaveBusiness} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
              {saving ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</> : <><i className="fas fa-save"></i>Save Business Info</>}
            </button>
          </div>
        )}

        {/* Bank Tab */}
        {activeTab === 'bank' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Bank Details</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
              <i className="fas fa-shield-halved mr-2"></i>
              Bank details are used for payout transfers. Keep them accurate.
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank Name</label>
              <input type="text" value={bankForm.bank_name}
                onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))}
                placeholder="State Bank of India"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Number</label>
              <input type="text" value={bankForm.bank_account_number}
                onChange={e => setBankForm(f => ({ ...f, bank_account_number: e.target.value }))}
                placeholder="XXXXXXXXXXXXXXXX"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">IFSC Code</label>
              <input type="text" value={bankForm.bank_ifsc}
                onChange={e => setBankForm(f => ({ ...f, bank_ifsc: e.target.value.toUpperCase() }))}
                placeholder="SBIN0001234"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">UPI ID (optional)</label>
              <input type="text" value={bankForm.upi_id}
                onChange={e => setBankForm(f => ({ ...f, upi_id: e.target.value }))}
                placeholder="yourname@upi"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <button onClick={handleSaveBank} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
              {saving ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</> : <><i className="fas fa-save"></i>Save Bank Details</>}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
