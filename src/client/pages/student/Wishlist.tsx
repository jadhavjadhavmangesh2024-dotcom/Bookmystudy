import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/student' },
  { label: 'My Bookings', icon: 'fa-calendar-check', path: '/student/bookings' },
  { label: 'Saved Rooms', icon: 'fa-heart', path: '/student/wishlist' },
  { label: 'Profile', icon: 'fa-user', path: '/student/profile' },
];

export default function StudentWishlist() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    api.wishlists.list().then((r: any) => { setItems(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleRemove = async (abhyasikaId: number) => {
    try {
      await api.wishlists.toggle({ abhyasika_id: abhyasikaId });
      setItems(prev => prev.filter(i => i.abhyasika_id !== abhyasikaId));
      success('Removed from wishlist');
    } catch (e: any) { error(e.message); }
  };

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Student Portal" sidebarColor="indigo"
      title="Saved Rooms" subtitle="Your favourite study spaces">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-56 bg-gray-200 rounded-2xl loading-pulse"></div>)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <i className="fas fa-heart text-5xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Saved Rooms Yet</h3>
          <p className="text-gray-500 mb-6">Start exploring and save your favourite study rooms</p>
          <Link to="/search" className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
            <i className="fas fa-search mr-2"></i>Browse Study Rooms
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm card-hover">
              <Link to={`/abhyasika/${item.abhyasika_id}`}>
                <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  {item.photo ? <img src={item.photo} alt="" className="w-full h-full object-cover" /> : <i className="fas fa-building text-5xl text-indigo-200"></i>}
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/abhyasika/${item.abhyasika_id}`}>
                  <h3 className="font-bold text-gray-800 mb-1 hover:text-indigo-600 transition-colors">{item.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <i className="fas fa-location-dot text-indigo-400 text-xs"></i>
                    {item.address}
                  </p>
                  {item.rating_avg > 0 && (
                    <div className="flex items-center gap-1 text-sm mb-2">
                      <i className="fas fa-star text-yellow-500 text-xs"></i>
                      <span className="font-semibold text-gray-700">{Number(item.rating_avg).toFixed(1)}</span>
                    </div>
                  )}
                  <p className="text-indigo-600 font-bold">₹{item.min_price || 50}/day</p>
                </Link>
                <div className="flex gap-2 mt-3">
                  <Link to={`/booking/${item.abhyasika_id}`} className="flex-1 gradient-primary text-white py-2 rounded-xl text-xs font-semibold text-center">
                    Book Now
                  </Link>
                  <button onClick={() => handleRemove(item.abhyasika_id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                    <i className="fas fa-heart text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
