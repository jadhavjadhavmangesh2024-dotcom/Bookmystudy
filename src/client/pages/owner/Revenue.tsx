import React, { useState, useEffect } from 'react';
import DashboardLayout, { StatCard, StatusBadge } from '../../components/common/DashboardLayout';
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

function BarChart({ data, labelKey, valueKey, color = '#3B82F6', height = 140 }: any) {
  const max = Math.max(...data.map((d: any) => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-1.5 overflow-x-auto pb-2" style={{ height: height + 40 }}>
      {data.map((item: any, i: number) => {
        const pct = max > 0 ? ((item[valueKey] || 0) / max) * 100 : 0;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 44 }}>
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
              {item[valueKey] > 0 ? formatINR(item[valueKey]).replace('₹','₹') : ''}
            </span>
            <div className="w-9 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
              style={{ height: `${Math.max(pct, 3)}%`, maxHeight: height, backgroundColor: color }}
              title={`${item[labelKey]}: ${formatINR(item[valueKey])}`}>
            </div>
            <span className="text-xs text-gray-500 text-center leading-tight">{String(item[labelKey]).slice(-5)}</span>
            {item.bookings !== undefined && (
              <span className="text-xs text-gray-400">{item.bookings}b</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OwnerRevenue() {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [chartView, setChartView] = useState<'monthly' | 'weekly'>('monthly');
  const [activeSection, setActiveSection] = useState<'overview' | 'bookings' | 'seats'>('overview');

  useEffect(() => {
    api.abhyasikas.myListings()
      .then((r: any) => {
        const lst = r.data || [];
        setListings(lst);
        if (lst.length > 0) setSelectedId(lst[0].id);
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

  const stats = analytics?.stats || {};
  const chartData = chartView === 'monthly' ? (analytics?.monthly_revenue || []) : (analytics?.weekly_revenue || []);
  const chartLabel = chartView === 'monthly' ? 'month' : 'week';
  const recentBookings: any[] = analytics?.recent_bookings || [];
  const seatRevenue: any[] = analytics?.seat_revenue || [];
  const bookingTypes: any[] = analytics?.booking_types || [];

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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Study Room Select करा</label>
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
          <p className="text-gray-500">Add your first study room to start tracking revenue.</p>
        </div>
      ) : loadingAnalytics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <>
          {/* Section Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
              { key: 'bookings', label: 'Bookings', icon: 'fa-list' },
              { key: 'seats', label: 'Seat-wise', icon: 'fa-chair' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveSection(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeSection === tab.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <i className={`fas ${tab.icon}`}></i>{tab.label}
              </button>
            ))}
          </div>

          {/* ====== OVERVIEW SECTION ====== */}
          {activeSection === 'overview' && (
            <>
              {/* Today's quick stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                  <p className="text-blue-100 text-xs font-medium mb-1"><i className="fas fa-sun mr-1"></i>Today's Revenue</p>
                  <p className="text-2xl font-bold">{formatINR(stats.today_revenue)}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{stats.today_bookings || 0} bookings today</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white">
                  <p className="text-green-100 text-xs font-medium mb-1"><i className="fas fa-calendar mr-1"></i>This Month</p>
                  <p className="text-2xl font-bold">{formatINR(stats.this_month_revenue)}</p>
                  <p className="text-green-200 text-xs mt-0.5">{stats.this_month_bookings || 0} bookings this month</p>
                </div>
              </div>

              {/* Main Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Revenue" value={formatINR(stats.confirmed_revenue)} icon="fa-indian-rupee-sign" color="green" />
                <StatCard title="Your Earnings (90%)" value={formatINR(stats.owner_earnings)} icon="fa-wallet" color="blue" />
                <StatCard title="Total Bookings" value={stats.total_bookings || 0} icon="fa-calendar-check" color="indigo" />
                <StatCard title="Active Now" value={stats.active_bookings || 0} icon="fa-clock" color="purple" />
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800">
                    <i className="fas fa-chart-bar mr-2 text-blue-500"></i>Revenue Chart
                  </h3>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setChartView('weekly')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${chartView === 'weekly' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
                      Weekly
                    </button>
                    <button onClick={() => setChartView('monthly')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${chartView === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
                      Monthly
                    </button>
                  </div>
                </div>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-36 text-gray-400">
                    <div className="text-center">
                      <i className="fas fa-chart-bar text-3xl mb-2"></i>
                      <p className="text-sm">No revenue data yet</p>
                    </div>
                  </div>
                ) : (
                  <BarChart data={[...chartData].reverse()} labelKey={chartLabel} valueKey="revenue" color="#3B82F6" />
                )}
              </div>

              {/* Earnings Breakdown + Booking Types */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Payout Summary */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4">
                    <i className="fas fa-rupee-sign mr-2 text-green-500"></i>Earnings Breakdown
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Gross Revenue', value: formatINR(stats.confirmed_revenue), color: 'text-gray-800', icon: 'fa-arrow-up text-blue-500' },
                      { label: 'Platform Fee (10%)', value: `- ${formatINR(stats.platform_fee)}`, color: 'text-red-500', icon: 'fa-arrow-down text-red-400' },
                      { label: 'Your Net Earnings', value: formatINR(stats.owner_earnings), color: 'text-green-600 text-lg font-bold', icon: 'fa-wallet text-green-500', bold: true },
                      { label: 'Avg Booking Value', value: formatINR(stats.avg_booking_value), color: 'text-gray-600', icon: 'fa-calculator text-indigo-400' },
                      { label: 'This Month Revenue', value: formatINR(stats.this_month_revenue), color: 'text-blue-600', icon: 'fa-calendar text-blue-400' },
                    ].map((item, i) => (
                      <div key={i} className={`flex justify-between items-center py-2.5 ${i < 4 ? 'border-b border-gray-100' : ''} ${item.bold ? 'bg-green-50 -mx-2 px-3 rounded-xl' : ''}`}>
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <i className={`fas ${item.icon} text-xs w-4`}></i>{item.label}
                        </span>
                        <span className={`font-semibold ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking Types */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4">
                    <i className="fas fa-pie-chart mr-2 text-indigo-500"></i>Booking Types
                  </h3>
                  {bookingTypes.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <p className="text-sm">No bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookingTypes.map((bt: any, i: number) => {
                        const total = bookingTypes.reduce((s: number, x: any) => s + (x.count || 0), 0);
                        const pct = total > 0 ? Math.round((bt.count / total) * 100) : 0;
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-indigo-500', 'bg-amber-500'];
                        return (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700 capitalize">{bt.booking_type} booking</span>
                              <span className="text-sm text-gray-500">{bt.count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`${colors[i % colors.length]} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{formatINR(bt.revenue)} revenue</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Cancellation stats */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{stats.completed_bookings || 0}</div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{stats.active_bookings || 0}</div>
                        <div className="text-xs text-gray-500">Active</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-500">{stats.cancelled_bookings || 0}</div>
                        <div className="text-xs text-gray-500">Cancelled</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ====== BOOKINGS SECTION ====== */}
          {activeSection === 'bookings' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-800">
                  <i className="fas fa-list mr-2 text-blue-500"></i>Recent Bookings
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">Last 20</span>
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
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentBookings.map((b: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-gray-800">{b.first_name} {b.last_name}</p>
                            <p className="text-xs text-gray-400">{b.booking_number}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">{b.seat_number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">{b.booking_type}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            <p>{b.start_date}</p>
                            <p className="text-gray-400">→ {b.end_date}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-800">{formatINR(b.total_amount)}</span>
                            <p className="text-xs text-green-600">You: {formatINR(b.total_amount * 0.9)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={b.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ====== SEAT-WISE REVENUE ====== */}
          {activeSection === 'seats' && (
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
                <div className="p-5 border-b">
                  <h3 className="font-bold text-gray-800">
                    <i className="fas fa-chair mr-2 text-teal-500"></i>Seat-wise Revenue
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Top 10 seats by revenue</p>
                </div>
                {seatRevenue.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="fas fa-chair text-4xl text-gray-300 mb-3"></i>
                    <p className="text-gray-500 text-sm">No seat revenue data yet</p>
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="space-y-3">
                      {seatRevenue.map((seat: any, i: number) => {
                        const maxRev = Math.max(...seatRevenue.map((s: any) => s.revenue || 0), 1);
                        const pct = (seat.revenue / maxRev) * 100;
                        return (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-teal-700 font-bold text-xs">#{i+1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono text-sm font-semibold text-gray-700">{seat.seat_number}</span>
                                  {seat.category_name && (
                                    <span className="text-xs text-gray-400 truncate">({seat.category_name})</span>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <span className="text-sm font-bold text-gray-800">{formatINR(seat.revenue)}</span>
                                  <span className="text-xs text-gray-400 ml-2">{seat.total_bookings} bookings</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Seat revenue chart */}
              {seatRevenue.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4">
                    <i className="fas fa-chart-bar mr-2 text-teal-500"></i>Seat Revenue Chart
                  </h3>
                  <BarChart data={seatRevenue} labelKey="seat_number" valueKey="revenue" color="#14b8a6" height={120} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
