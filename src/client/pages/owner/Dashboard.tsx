import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout, { StatCard, DataTable, StatusBadge } from '../../components/common/DashboardLayout';
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

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    api.abhyasikas.myListings().then((r: any) => { setListings(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalBookings = listings.reduce((s, l) => s + (l.active_bookings || 0), 0);
  const totalSeats = listings.reduce((s, l) => s + (l.total_seats || 0), 0);
  const approvedListings = listings.filter(l => l.status === 'approved').length;

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title={`Welcome, ${user?.first_name}! 👋`} subtitle="Manage your study rooms"
      actions={<Link to="/owner/listings/new" className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold"><i className="fas fa-plus mr-2"></i>Add Room</Link>}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="My Listings" value={listings.length} icon="fa-building" color="blue" />
        <StatCard title="Active Bookings" value={totalBookings} icon="fa-calendar-check" color="green" />
        <StatCard title="Total Seats" value={totalSeats} icon="fa-chair" color="purple" />
        <StatCard title="Approved Rooms" value={approvedListings} icon="fa-check-circle" color="indigo" />
      </div>

      {/* Listings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">My Abhyasikas</h3>
          <Link to="/owner/listings" className="text-sm text-indigo-600 font-medium">View All →</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl loading-pulse"></div>)}
          </div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center">
            <i className="fas fa-building text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-bold text-gray-600 mb-2">No Abhyasikas Yet</h3>
            <p className="text-gray-500 mb-5">Add your first study room to start accepting bookings</p>
            <Link to="/owner/listings/new" className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
              <i className="fas fa-plus mr-2"></i>Add Your First Room
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {listings.map(l => (
              <div key={l.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-12 rounded-xl overflow-hidden bg-indigo-100">
                    {l.primary_photo ? <img src={l.primary_photo} alt="" className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center"><i className="fas fa-building text-indigo-300"></i></div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{l.name}</p>
                    <p className="text-sm text-gray-500">{l.city_name} · {l.total_seats} seats · {l.active_bookings} active bookings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={l.status} />
                  <Link to={`/owner/listings/${l.id}/seats`} className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-200">
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
