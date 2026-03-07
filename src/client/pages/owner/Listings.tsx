import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout, { DataTable, StatusBadge } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/owner' },
  { label: 'My Listings', icon: 'fa-building', path: '/owner/listings' },
  { label: 'Bookings', icon: 'fa-calendar-check', path: '/owner/bookings' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/owner/revenue' },
  { label: 'Profile', icon: 'fa-user', path: '/owner/profile' },
];
export default function OwnerListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.abhyasikas.myListings().then((r: any) => { setListings(r.data || []); setLoading(false); }); }, []);
  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Owner Portal" sidebarColor="blue"
      title="My Listings" subtitle="Manage your study rooms"
      actions={<Link to="/owner/listings/new" className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold"><i className="fas fa-plus mr-2"></i>Add New Room</Link>}>
      <DataTable loading={loading} data={listings} emptyText="No listings yet. Add your first study room!"
        columns={[
          { key: 'primary_photo', label: '', render: (v) => <div className="w-12 h-10 rounded-lg overflow-hidden bg-indigo-100">{v ? <img src={v} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="fas fa-building text-indigo-300 text-sm"></i></div>}</div> },
          { key: 'name', label: 'Abhyasika', render: (v,r) => <div><p className="font-semibold">{v}</p><p className="text-xs text-gray-400">{r.city_name}</p></div> },
          { key: 'total_seats', label: 'Seats', render: (v,r) => <div className="text-center"><p className="font-bold">{v}</p><p className="text-xs text-green-600">{r.available_seats} free</p></div> },
          { key: 'active_bookings', label: 'Bookings', render: v => <span className="badge bg-blue-100 text-blue-700">{v||0} active</span> },
          { key: 'rating_avg', label: 'Rating', render: (v,r) => v>0 ? <span className="flex items-center gap-1"><i className="fas fa-star text-yellow-500 text-xs"></i>{Number(v).toFixed(1)} ({r.rating_count})</span> : '-' },
          { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
          { key: 'id', label: 'Actions', render: (v,r) => <div className="flex gap-2">
            <Link to={`/owner/listings/${v}/edit`} className="px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200"><i className="fas fa-edit"></i></Link>
            <Link to={`/owner/listings/${v}/seats`} className="px-2.5 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-xs hover:bg-indigo-200">Seats</Link>
          </div> }
        ]} />
    </DashboardLayout>
  );
}
