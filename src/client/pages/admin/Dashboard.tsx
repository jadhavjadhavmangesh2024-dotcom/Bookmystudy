import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout, { StatCard, DataTable, StatusBadge } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/admin' },
  { label: 'Study Rooms', icon: 'fa-building', path: '/admin/abhyasikas' },
  { label: 'Users', icon: 'fa-users', path: '/admin/users' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/admin/revenue' },
  { label: 'Payouts', icon: 'fa-money-bill-transfer', path: '/admin/payouts' },
  { label: 'Advertisements', icon: 'fa-rectangle-ad', path: '/admin/ads' },
  { label: 'Settings', icon: 'fa-gear', path: '/admin/settings' },
];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    api.admin.dashboard().then((r: any) => { setData(r.data); setLoading(false); }).catch((e: any) => { error(e.message); setLoading(false); });
  }, []);

  const formatCurrency = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  const QUICK_STATS = data ? [
    { title: 'Total Students', value: data.users?.students?.toLocaleString() || '0', icon: 'fa-graduation-cap', color: 'indigo', change: 12, subtitle: `${data.users?.new_this_month || 0} new this month` },
    { title: 'Total Owners', value: data.users?.owners?.toLocaleString() || '0', icon: 'fa-building', color: 'blue', change: 8 },
    { title: 'Approved Rooms', value: data.abhyasikas?.approved?.toLocaleString() || '0', icon: 'fa-map-location-dot', color: 'green', subtitle: `${data.pending_approvals} pending approval` },
    { title: 'Total Revenue', value: formatCurrency(data.revenue?.total_revenue), icon: 'fa-indian-rupee-sign', color: 'orange', change: 22, subtitle: `Platform: ${formatCurrency(data.revenue?.platform_revenue)}` },
    { title: 'Total Bookings', value: data.bookings?.total?.toLocaleString() || '0', icon: 'fa-calendar-check', color: 'purple', subtitle: `${data.bookings?.confirmed || 0} active` },
    { title: 'Monthly Revenue', value: formatCurrency(data.revenue?.monthly_revenue), icon: 'fa-chart-column', color: 'yellow', change: 15 },
  ] : [];

  return (
    <DashboardLayout
      sidebarItems={SIDEBAR_ITEMS}
      sidebarTitle="Super Admin"
      sidebarColor="purple"
      title="Admin Dashboard"
      subtitle="Platform overview and analytics"
    >
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border loading-pulse"></div>)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {QUICK_STATS.map((s, i) => <StatCard key={i} {...s} />)}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-800 text-lg">Revenue Trend</h3>
                <Link to="/admin/revenue" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View Details →</Link>
              </div>
              <div className="space-y-3">
                {data?.weekly_revenue?.slice(0, 6).map((w: any, i: number) => {
                  const max = Math.max(...(data.weekly_revenue?.map((x: any) => x.revenue) || [1]));
                  const pct = max > 0 ? (w.revenue / max) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-16 text-xs text-gray-500 flex-shrink-0">{w.week || w.period}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div className="h-full gradient-primary rounded-full transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${pct}%` }}>
                          <span className="text-white text-xs font-bold">{pct > 15 ? `₹${(w.revenue/1000).toFixed(0)}K` : ''}</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700 w-20 text-right">₹{(w.revenue/1000).toFixed(1)}K</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* City Stats */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 text-lg mb-5">Top Cities</h3>
              <div className="space-y-4">
                {data?.city_stats?.slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-700">{c.name}</span>
                        <span className="text-xs text-gray-500">{c.bookings} bookings</span>
                      </div>
                      <div className="text-xs text-gray-400">{c.abhyasikas} rooms</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Approvals Alert */}
          {data?.pending_approvals > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-clock-rotate-left text-yellow-600 text-xl"></i>
                </div>
                <div>
                  <p className="font-bold text-yellow-800">{data.pending_approvals} Study Room{data.pending_approvals > 1 ? 's' : ''} Awaiting Approval</p>
                  <p className="text-sm text-yellow-600">Review and approve new study room listings</p>
                </div>
              </div>
              <Link to="/admin/abhyasikas?status=pending" className="bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-yellow-600 transition-colors whitespace-nowrap">
                Review Now
              </Link>
            </div>
          )}

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Recent Bookings</h3>
            </div>
            <DataTable
              columns={[
                { key: 'booking_number', label: 'Booking #', render: v => <span className="font-mono text-sm text-indigo-600 font-semibold">{v}</span> },
                { key: 'first_name', label: 'Student', render: (_, r) => `${r.first_name} ${r.last_name}` },
                { key: 'abhyasika_name', label: 'Study Room' },
                { key: 'total_amount', label: 'Amount', render: v => <span className="font-semibold text-green-600">₹{Number(v).toLocaleString('en-IN')}</span> },
                { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
                { key: 'created_at', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
              ]}
              data={data?.recent_bookings || []}
              loading={loading}
            />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
