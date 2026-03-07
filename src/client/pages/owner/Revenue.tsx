import React, { useState, useEffect } from 'react';
import DashboardLayout, { StatCard } from '../../components/common/DashboardLayout';
import { StatusBadge } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/owner' },
  { label: 'My Listings', icon: 'fa-building', path: '/owner/listings' },
  { label: 'Bookings', icon: 'fa-calendar-check', path: '/owner/bookings' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/owner/revenue' },
  { label: 'Profile', icon: 'fa-user', path: '/owner/profile' },
];

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function OwnerRevenue() {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    api.abhyasikas.myListings()
      .then((r: any) => {
        const lst = r.data || [];
        setListings(lst);
        if (lst.length > 0) {
          setSelectedId(lst[0].id);
        }
      })
      .catch(() => error('Failed to load listings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingAnalytics(true);
    api.abhyasikas.getAnalytics(selectedId)
      .then((r: any) => setAnalytics(r.data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoadingAnalytics(false));
  }, [selectedId]);

  const stats = analytics?.stats;
  const monthlyRevenue: any[] = analytics?.monthly_revenue || [];
  const recentBookings: any[] = analytics?.recent_bookings || [];

  // Bar chart max
  const maxRevenue = Math.max(...monthlyRevenue.map((m: any) => m.revenue || 0), 1);

  if (loading) return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Revenue" subtitle="Track your earnings">
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Revenue & Analytics" subtitle="Track your earnings and performance">

      {/* Listing Selector */}
      {listings.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Abhyasika</label>
          <div className="flex flex-wrap gap-2">
            {listings.map(l => (
              <button key={l.id} onClick={() => setSelectedId(l.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedId === l.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <i className="fas fa-building mr-2"></i>{l.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <i className="fas fa-chart-line text-5xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-600 mb-2">No Listings Yet</h3>
          <p className="text-gray-500">Add your first Abhyasika to start tracking revenue.</p>
        </div>
      ) : loadingAnalytics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl loading-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard title="Total Revenue" value={formatINR(stats?.total_revenue)} icon="fa-indian-rupee-sign" color="green" />
            <StatCard title="Total Bookings" value={stats?.total_bookings || 0} icon="fa-calendar-check" color="blue" />
            <StatCard title="Active Bookings" value={stats?.active_bookings || 0} icon="fa-clock" color="indigo" />
            <StatCard title="Cancelled" value={stats?.cancelled_bookings || 0} icon="fa-ban" color="red" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Monthly Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-5">
                <i className="fas fa-chart-bar mr-2 text-blue-500"></i>Monthly Revenue
              </h3>
              {monthlyRevenue.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400">
                  <div className="text-center">
                    <i className="fas fa-chart-bar text-4xl mb-3"></i>
                    <p className="text-sm">No revenue data yet</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-2 h-40 overflow-x-auto pb-2">
                  {[...monthlyRevenue].reverse().map((m: any, i: number) => {
                    const pct = maxRevenue > 0 ? ((m.revenue || 0) / maxRevenue) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 48 }}>
                        <span className="text-xs text-gray-500 font-medium">{formatINR(m.revenue)}</span>
                        <div className="w-10 bg-blue-500 rounded-t-lg transition-all" style={{ height: `${Math.max(pct, 4)}%` }}
                          title={`${m.month}: ${formatINR(m.revenue)}`}>
                        </div>
                        <span className="text-xs text-gray-400">{m.month?.slice(5)}</span>
                        <span className="text-xs text-gray-400">{m.bookings}b</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-5">
                <i className="fas fa-info-circle mr-2 text-indigo-500"></i>Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Gross Revenue</span>
                  <span className="font-bold text-gray-800">{formatINR(stats?.total_revenue)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Platform Fee (10%)</span>
                  <span className="font-bold text-red-500">- {formatINR((stats?.total_revenue || 0) * 0.1)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Your Earnings</span>
                  <span className="font-bold text-green-600">{formatINR((stats?.total_revenue || 0) * 0.9)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Avg Booking Value</span>
                  <span className="font-bold text-gray-800">{formatINR(stats?.avg_booking_value)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-600">Cancellation Rate</span>
                  <span className="font-bold text-orange-500">
                    {stats?.total_bookings > 0
                      ? `${Math.round((stats.cancelled_bookings / stats.total_bookings) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-base">
                <i className="fas fa-list mr-2 text-blue-500"></i>Recent Bookings
              </h3>
              <span className="text-xs text-gray-400">Last 10 transactions</span>
            </div>
            {recentBookings.length === 0 ? (
              <div className="p-12 text-center">
                <i className="fas fa-calendar-xmark text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500 text-sm">No bookings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Student', 'Seat', 'Type', 'Dates', 'Amount', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentBookings.map((b: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-gray-800">{b.first_name} {b.last_name}</p>
                          <p className="text-xs text-gray-400">{b.booking_number}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{b.seat_number}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="capitalize text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">{b.booking_type}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500">
                          {b.start_date} → {b.end_date}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-gray-800 text-sm">{formatINR(b.total_amount)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
