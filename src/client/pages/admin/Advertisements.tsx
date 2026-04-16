import React, { useState, useEffect } from 'react';
import DashboardLayout, { DataTable, StatusBadge } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';
const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/admin' },
  { label: 'Study Rooms', icon: 'fa-building', path: '/admin/abhyasikas' },
  { label: 'Users', icon: 'fa-users', path: '/admin/users' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/admin/revenue' },
  { label: 'Payouts', icon: 'fa-money-bill-transfer', path: '/admin/payouts' },
  { label: 'Advertisements', icon: 'fa-rectangle-ad', path: '/admin/ads' },
  { label: 'Settings', icon: 'fa-gear', path: '/admin/settings' },
];
export default function AdminAds() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', image_url: '', link_url: '', placement: 'homepage_banner', target_audience: 'all', start_date: '', end_date: '', budget: '' });
  const { success, error } = useToast();
  useEffect(() => { api.admin.ads().then((r: any) => { setAds(r.data || []); setLoading(false); }); }, []);
  const handleCreate = async () => {
    try {
      await api.admin.createAd({ ...form, budget: parseFloat(form.budget) || 0 });
      success('Advertisement created!');
      setShowForm(false);
      api.admin.ads().then((r: any) => setAds(r.data || []));
    } catch (e: any) { error(e.message); }
  };
  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Super Admin" sidebarColor="purple" title="Advertisements" subtitle="Manage platform ads"
      actions={<button onClick={() => setShowForm(!showForm)} className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold"><i className="fas fa-plus mr-2"></i>Create Ad</button>}>
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h3 className="font-bold text-gray-800 mb-4">New Advertisement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['title','Title','text'],['description','Description','text'],['image_url','Image URL','text'],['link_url','Link URL','text'],['start_date','Start Date','date'],['end_date','End Date','date'],['budget','Budget (₹)','number']].map(([k,l,t]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{l}</label>
                <input type={t} value={(form as any)[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Placement</label>
              <select value={form.placement} onChange={e => setForm(f => ({...f, placement: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                {['homepage_banner','search_results','sidebar','popup','mobile_banner'].map(v => <option key={v} value={v}>{v.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} className="flex-1 gradient-primary text-white py-2.5 rounded-xl text-sm font-semibold">Create Ad</button>
            <button onClick={() => setShowForm(false)} className="flex-1 border py-2.5 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}
      <DataTable loading={loading} data={ads} emptyText="No advertisements yet"
        columns={[
          { key: 'title', label: 'Title', render: (v,r) => <div><p className="font-semibold">{v}</p><p className="text-xs text-gray-400">{r.placement}</p></div> },
          { key: 'target_audience', label: 'Audience', render: v => <span className="badge bg-blue-100 text-blue-700 capitalize">{v}</span> },
          { key: 'impressions', label: 'Impressions', render: v => (v||0).toLocaleString() },
          { key: 'clicks', label: 'Clicks', render: v => (v||0).toLocaleString() },
          { key: 'budget', label: 'Budget', render: v => v ? `₹${v}` : '-' },
          { key: 'is_active', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'suspended'} /> },
          { key: 'start_date', label: 'Dates', render: (v,r) => <span className="text-xs">{v || 'N/A'} → {r.end_date || 'N/A'}</span> },
        ]} />
    </DashboardLayout>
  );
}
