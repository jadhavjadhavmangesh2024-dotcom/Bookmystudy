import React, { useState, useEffect } from 'react';
import DashboardLayout, { DataTable, StatusBadge } from '../../components/common/DashboardLayout';
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

export default function AdminUsers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { success, error } = useToast();

  useEffect(() => { loadData(); }, [search, role, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const r: any = await api.admin.users({ search, role, page, limit: 20 });
      setData(r.data || []);
      setTotal(r.meta?.total || 0);
    } catch (e: any) { error(e.message); }
    setLoading(false);
  };

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      await api.admin.updateUserStatus(id, { is_active: !isActive });
      success(`User ${isActive ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const ROLE_COLORS: Record<string, string> = {
    student: 'bg-green-100 text-green-700',
    owner: 'bg-blue-100 text-blue-700',
    super_admin: 'bg-purple-100 text-purple-700'
  };

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Super Admin" sidebarColor="purple"
      title="User Management" subtitle="Manage all platform users"
      actions={
        <div className="flex items-center gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:outline-none w-48" />
          <select value={role} onChange={e => setRole(e.target.value)} className="bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:outline-none">
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="owner">Owners</option>
          </select>
        </div>
      }
    >
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Users', value: total, icon: 'fa-users', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Students', value: data.filter(u => u.role === 'student').length, icon: 'fa-graduation-cap', color: 'bg-green-50 text-green-600' },
          { label: 'Owners', value: data.filter(u => u.role === 'owner').length, icon: 'fa-building', color: 'bg-blue-50 text-blue-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4 flex items-center gap-4`}>
            <i className={`fas ${s.icon} text-2xl`}></i>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        loading={loading}
        columns={[
          {
            key: 'first_name', label: 'User', render: (v, r) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-bold text-sm">{v?.[0]}{r.last_name?.[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{v} {r.last_name}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                </div>
              </div>
            )
          },
          { key: 'phone', label: 'Phone', render: v => v || '-' },
          {
            key: 'role', label: 'Role', render: v => (
              <span className={`badge ${ROLE_COLORS[v] || 'bg-gray-100'} capitalize`}>
                <i className={`fas ${v === 'student' ? 'fa-graduation-cap' : v === 'owner' ? 'fa-building' : 'fa-crown'} mr-1 text-xs`}></i>
                {v === 'super_admin' ? 'Admin' : v}
              </span>
            )
          },
          {
            key: 'is_verified', label: 'Verified', render: v => (
              <span className={`badge ${v ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                <i className={`fas fa-${v ? 'check-circle' : 'clock'} mr-1 text-xs`}></i>
                {v ? 'Yes' : 'No'}
              </span>
            )
          },
          {
            key: 'is_active', label: 'Status', render: v => (
              <span className={`badge ${v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <i className={`fas fa-circle text-xs mr-1`}></i>
                {v ? 'Active' : 'Inactive'}
              </span>
            )
          },
          { key: 'created_at', label: 'Joined', render: v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
          {
            key: 'id', label: 'Actions', render: (v, r) => (
              <button onClick={() => toggleStatus(v, !!r.is_active)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${r.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                {r.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )
          }
        ]}
        data={data}
        emptyText="No users found"
      />

      {total > 20 && (
        <div className="flex justify-center gap-3 mt-5">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-50">← Prev</button>
          <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-50">Next →</button>
        </div>
      )}
    </DashboardLayout>
  );
}
