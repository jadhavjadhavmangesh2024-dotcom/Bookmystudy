import React, { useState, useEffect } from 'react';
import DashboardLayout, { StatCard } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/admin' },
  { label: 'Abhyasikas', icon: 'fa-building', path: '/admin/abhyasikas' },
  { label: 'Users', icon: 'fa-users', path: '/admin/users' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/admin/revenue' },
  { label: 'Payouts', icon: 'fa-money-bill-transfer', path: '/admin/payouts' },
  { label: 'Advertisements', icon: 'fa-rectangle-ad', path: '/admin/ads' },
  { label: 'Settings', icon: 'fa-gear', path: '/admin/settings' },
];

export default function AdminRevenue() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const { error } = useToast();

  useEffect(() => {
    setLoading(true);
    api.admin.revenueAnalytics({ period }).then((r: any) => { setData(r.data); setLoading(false); }).catch((e: any) => { error(e.message); setLoading(false); });
  }, [period]);

  const totalRevenue = data?.revenue?.reduce((s: number, r: any) => s + (r.gross_revenue || 0), 0) || 0;
  const platformRevenue = data?.revenue?.reduce((s: number, r: any) => s + (r.platform_revenue || 0), 0) || 0;
  const totalBookings = data?.revenue?.reduce((s: number, r: any) => s + (r.total_bookings || 0), 0) || 0;

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Super Admin" sidebarColor="purple"
      title="Revenue Analytics" subtitle="Detailed platform revenue reports"
      actions={
        <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:outline-none">
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Gross Revenue" value={`₹${(totalRevenue/1000).toFixed(0)}K`} icon="fa-indian-rupee-sign" color="indigo" />
        <StatCard title="Platform Commission" value={`₹${(platformRevenue/1000).toFixed(0)}K`} icon="fa-percent" color="green" />
        <StatCard title="Owner Revenue" value={`₹${((totalRevenue - platformRevenue)/1000).toFixed(0)}K`} icon="fa-building" color="blue" />
        <StatCard title="Total Bookings" value={totalBookings.toLocaleString()} icon="fa-calendar-check" color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-5">Revenue Over Time</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-xl loading-pulse"></div>)}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data?.revenue?.slice(0, 12).map((r: any, i: number) => {
                const max = Math.max(...(data.revenue?.map((x: any) => x.gross_revenue) || [1]));
                const pct = max > 0 ? (r.gross_revenue / max) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-24 text-xs text-gray-500 font-medium flex-shrink-0">{r.period}</div>
                    <div className="flex-1">
                      <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="h-full gradient-primary rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                          style={{ width: `${Math.max(pct, 2)}%` }}>
                          {pct > 20 && <span className="text-white text-xs font-bold">₹{(r.gross_revenue/1000).toFixed(0)}K</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right w-24">
                      <div className="text-sm font-semibold text-gray-700">₹{(r.gross_revenue/1000).toFixed(1)}K</div>
                      <div className="text-xs text-gray-400">{r.total_bookings} bookings</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Abhyasikas */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-5">Top Performing Rooms</h3>
          {loading ? (
            <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl loading-pulse"></div>)}</div>
          ) : (
            <div className="space-y-4">
              {data?.top_abhyasikas?.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-indigo-200 text-indigo-700'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.bookings} bookings</p>
                  </div>
                  <div className="text-sm font-bold text-green-600">₹{(a.revenue/1000).toFixed(0)}K</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commission Settings */}
      <CommissionCard />
    </DashboardLayout>
  );
}

function CommissionCard() {
  const [commission, setCommission] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ commission_type: 'percentage', commission_value: '10', effective_from: '' });
  const { success, error } = useToast();

  useEffect(() => {
    api.admin.commission().then((r: any) => {
      const current = r.data?.find((c: any) => c.is_active);
      if (current) {
        setCommission(current);
        setForm({ commission_type: current.commission_type, commission_value: String(current.commission_value), effective_from: '' });
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await api.admin.setCommission({ ...form, commission_value: parseFloat(form.commission_value), effective_from: form.effective_from || new Date().toISOString().split('T')[0] });
      success('Commission updated!');
      setEditMode(false);
      api.admin.commission().then((r: any) => {
        const current = r.data?.find((c: any) => c.is_active);
        if (current) setCommission(current);
      });
    } catch (e: any) { error(e.message); }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-800 text-lg">Platform Commission Settings</h3>
        {!editMode && (
          <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-200">
            <i className="fas fa-edit mr-2"></i>Update
          </button>
        )}
      </div>

      {!editMode ? (
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">{commission?.commission_value || 10}%</span>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Current commission rate on all bookings</p>
            <p className="text-sm text-gray-400">Type: {commission?.commission_type} | Active since: {commission?.effective_from || 'Jan 2024'}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Commission Type</label>
            <select value={form.commission_type} onChange={e => setForm(f => ({ ...f, commission_type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Value</label>
            <input type="number" value={form.commission_value} onChange={e => setForm(f => ({ ...f, commission_value: e.target.value }))} min="0" max="100"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Effective From</label>
            <input type="date" value={form.effective_from} onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="sm:col-span-3 flex gap-3">
            <button onClick={handleSave} className="flex-1 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold">Save Changes</button>
            <button onClick={() => setEditMode(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
