import React, { useState, useEffect } from 'react';
import DashboardLayout, { DataTable, StatusBadge } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/student' },
  { label: 'My Bookings', icon: 'fa-calendar-check', path: '/student/bookings' },
  { label: 'Saved Rooms', icon: 'fa-heart', path: '/student/wishlist' },
  { label: 'Profile', icon: 'fa-user', path: '/student/profile' },
];

export default function StudentBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const { success, error } = useToast();

  useEffect(() => { loadBookings(); }, [status]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const r: any = await api.bookings.list({ status, limit: 50 });
      setBookings(r.data || []);
    } catch (e: any) { error(e.message); }
    setLoading(false);
  };

  const handleCancel = async (id: number) => {
    try {
      await api.bookings.cancel(id, { reason: 'User requested cancellation' });
      success('Booking cancelled successfully!');
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch (e: any) { error(e.message); }
  };

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Student Portal" sidebarColor="indigo"
      title="My Bookings" subtitle="Your seat booking history"
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
      <DataTable
        loading={loading}
        data={bookings}
        emptyText="No bookings found. Book your first study seat!"
        columns={[
          { key: 'booking_number', label: 'Booking #', render: v => <span className="font-mono text-sm text-indigo-600 font-semibold">{v}</span> },
          { key: 'abhyasika_name', label: 'Study Room', render: (v, r) => (
            <div>
              <p className="font-semibold text-gray-800">{v}</p>
              <p className="text-xs text-gray-400">Seat: {r.seat_number} | {r.city_name}</p>
            </div>
          )},
          { key: 'booking_type', label: 'Plan', render: v => <span className="capitalize badge bg-gray-100 text-gray-700">{v}</span> },
          { key: 'start_date', label: 'Duration', render: (v, r) => (
            <div className="text-xs">
              <p className="font-medium text-gray-700">{v}</p>
              <p className="text-gray-400">to {r.end_date}</p>
            </div>
          )},
          { key: 'total_amount', label: 'Amount', render: v => <span className="font-bold text-green-600">₹{Number(v).toLocaleString('en-IN')}</span> },
          { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
          { key: 'id', label: 'Actions', render: (v, r) => (
            <div className="flex gap-2">
              {(r.status === 'pending' || r.status === 'confirmed') && (
                <button onClick={() => handleCancel(v)} className="px-2.5 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors">
                  Cancel
                </button>
              )}
              {r.status === 'completed' && (
                <button className="px-2.5 py-1.5 bg-yellow-100 text-yellow-600 rounded-lg text-xs font-medium hover:bg-yellow-200">
                  Review
                </button>
              )}
            </div>
          )}
        ]}
      />
    </DashboardLayout>
  );
}
