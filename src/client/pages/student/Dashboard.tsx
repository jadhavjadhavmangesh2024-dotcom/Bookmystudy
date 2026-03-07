import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout, { StatCard, StatusBadge } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/student' },
  { label: 'My Bookings', icon: 'fa-calendar-check', path: '/student/bookings' },
  { label: 'Saved Rooms', icon: 'fa-heart', path: '/student/wishlist' },
  { label: 'Profile', icon: 'fa-user', path: '/student/profile' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.bookings.list({ limit: 5 }).then((r: any) => { setBookings(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const totalSpent = bookings.filter(b => ['confirmed','completed'].includes(b.status)).reduce((s,b) => s + (b.total_amount||0), 0);

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Student Portal" sidebarColor="indigo"
      title={`Hello, ${user?.first_name}! 📚`} subtitle="Find your next study session"
      actions={
        <button onClick={() => navigate('/search')} className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <i className="fas fa-search mr-2"></i>Find Rooms
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="Active Bookings" value={activeBookings} icon="fa-calendar-check" color="green" />
        <StatCard title="Completed Sessions" value={completedBookings} icon="fa-flag-checkered" color="blue" />
        <StatCard title="Total Spent" value={`₹${totalSpent.toLocaleString('en-IN')}`} icon="fa-indian-rupee-sign" color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Find Rooms', icon: 'fa-magnifying-glass', path: '/search', color: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' },
          { label: 'My Bookings', icon: 'fa-calendar', path: '/student/bookings', color: 'bg-green-100 text-green-600 hover:bg-green-200' },
          { label: 'Saved Rooms', icon: 'fa-heart', path: '/student/wishlist', color: 'bg-pink-100 text-pink-600 hover:bg-pink-200' },
          { label: 'My Profile', icon: 'fa-user', path: '/student/profile', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200' },
        ].map((action, i) => (
          <Link key={i} to={action.path}
            className={`${action.color} rounded-2xl p-5 flex flex-col items-center gap-3 text-center transition-colors card-hover`}>
            <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center">
              <i className={`fas ${action.icon} text-xl`}></i>
            </div>
            <span className="text-sm font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">Recent Bookings</h3>
          <Link to="/student/bookings" className="text-sm text-indigo-600 font-medium">View All →</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl loading-pulse"></div>)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <i className="fas fa-calendar text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-bold text-gray-600 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 mb-5">Find and book your perfect study room</p>
            <Link to="/search" className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
              <i className="fas fa-search mr-2"></i>Find Study Rooms
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {bookings.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-10 rounded-xl overflow-hidden bg-indigo-100 flex-shrink-0">
                    {b.abhyasika_photo ? <img src={b.abhyasika_photo} alt="" className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center"><i className="fas fa-building text-indigo-300 text-sm"></i></div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{b.abhyasika_name}</p>
                    <p className="text-xs text-gray-500">Seat: {b.seat_number} · {b.start_date} to {b.end_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-gray-800">₹{Number(b.total_amount).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">{b.booking_type}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
