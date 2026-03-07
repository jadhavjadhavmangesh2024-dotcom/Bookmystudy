import React, { useState, useEffect } from 'react';
import DashboardLayout, { DataTable, StatusBadge } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/owner' },
  { label: 'My Listings', icon: 'fa-building', path: '/owner/listings' },
  { label: 'Bookings', icon: 'fa-calendar-check', path: '/owner/bookings' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/owner/revenue' },
  { label: 'Profile', icon: 'fa-user', path: '/owner/profile' },
];

export default function OwnerBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { success, error } = useToast();

  useEffect(() => { loadBookings(); }, [status, page]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const r: any = await api.bookings.ownerAll({ status, page, limit: 20 });
      setBookings(r.data || []);
      setTotal(r.meta?.total || 0);
    } catch (e: any) { error(e.message); }
    setLoading(false);
  };

  const handleCheckIn = async (id: number) => {
    try { await api.bookings.checkIn(id); success('Check-in recorded!'); loadBookings(); } catch (e: any) { error(e.message); }
  };

  const handleCheckOut = async (id: number) => {
    try { await api.bookings.checkOut(id); success('Check-out recorded!'); loadBookings(); } catch (e: any) { error(e.message); }
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings.filter(b => ['confirmed','completed'].includes(b.status)).reduce((s,b) => s + (b.total_amount || 0), 0),
  };

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="Bookings" subtitle="Manage all seat bookings"
      actions={
        <select value={status} onChange={e => setStatus(e.target.value)} className="bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:outline-none">
          <option value="">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { l: 'Total', v: stats.total, c: 'bg-gray-50 text-gray-600', i: 'fa-list' },
          { l: 'Confirmed', v: stats.confirmed, c: 'bg-green-50 text-green-600', i: 'fa-circle-check' },
          { l: 'Completed', v: stats.completed, c: 'bg-blue-50 text-blue-600', i: 'fa-flag-checkered' },
          { l: 'Revenue', v: `₹${stats.revenue.toLocaleString('en-IN')}`, c: 'bg-indigo-50 text-indigo-600', i: 'fa-indian-rupee-sign' },
        ].map((s, i) => (
          <div key={i} className={`${s.c} rounded-2xl p-4 flex items-center gap-3`}>
            <i className={`fas ${s.i} text-xl`}></i>
            <div><div className="text-xl font-bold">{s.v}</div><div className="text-sm">{s.l}</div></div>
          </div>
        ))}
      </div>

      <DataTable
        loading={loading}
        data={bookings}
        emptyText="No bookings found"
        columns={[
          { key: 'booking_number', label: 'Booking #', render: v => <span className="font-mono text-sm text-indigo-600 font-semibold">{v}</span> },
          { key: 'first_name', label: 'Student', render: (v,r) => (
            <div>
              <p className="font-medium text-gray-800">{v} {r.last_name}</p>
              <p className="text-xs text-gray-400">{r.student_phone || 'N/A'}</p>
            </div>
          )},
          { key: 'seat_number', label: 'Seat', render: v => <span className="badge bg-indigo-100 text-indigo-700 font-mono">{v}</span> },
          { key: 'booking_type', label: 'Type', render: v => <span className="capitalize text-sm text-gray-600">{v}</span> },
          { key: 'start_date', label: 'Dates', render: (v,r) => <span className="text-xs text-gray-500">{v} → {r.end_date}</span> },
          { key: 'total_amount', label: 'Amount', render: v => <span className="font-semibold text-green-600">₹{Number(v).toLocaleString('en-IN')}</span> },
          { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
          { key: 'id', label: 'Actions', render: (v,r) => (
            <div className="flex gap-1">
              {r.status === 'confirmed' && !r.check_in_at && (
                <button onClick={() => handleCheckIn(v)} className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-medium hover:bg-green-200">Check In</button>
              )}
              {r.status === 'confirmed' && r.check_in_at && !r.check_out_at && (
                <button onClick={() => handleCheckOut(v)} className="px-2 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-200">Check Out</button>
              )}
            </div>
          )}
        ]}
      />

      {total > 20 && (
        <div className="flex justify-center gap-3 mt-5">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-50">← Prev</button>
          <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-50">Next →</button>
        </div>
      )}
    </DashboardLayout>
  );
}
