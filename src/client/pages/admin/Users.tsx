import React, { useState, useEffect } from 'react';
import DashboardLayout, { DataTable, StatusBadge } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/admin' },
  { label: 'Study Rooms', icon: 'fa-building', path: '/admin/abhyasikas' },
  { label: 'Users', icon: 'fa-users', path: '/admin/users' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/admin/revenue' },
  { label: 'Payouts', icon: 'fa-money-bill-transfer', path: '/admin/payouts' },
  { label: 'Advertisements', icon: 'fa-rectangle-ad', path: '/admin/ads' },
  { label: 'Settings', icon: 'fa-gear', path: '/admin/settings' },
];

export default function AdminUsers() {
  const [data, setData] = useState<any[]>([]);
  const [pendingOwners, setPendingOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'pending_owners'>('pending_owners');
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { success, error } = useToast();

  useEffect(() => {
    loadPendingOwners();
    loadData();
  }, []);

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

  const loadPendingOwners = async () => {
    setPendingLoading(true);
    try {
      const r: any = await api.admin.pendingOwners();
      setPendingOwners(r.data || []);
    } catch (e: any) { /* ignore */ }
    setPendingLoading(false);
  };

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      await api.admin.updateUserStatus(id, { is_active: !isActive });
      success(`User ${isActive ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleApproveOwner = async (id: number, name: string) => {
    try {
      await api.admin.approveOwner(id);
      success(`✅ ${name} चे owner account approve केले!`);
      loadPendingOwners();
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleRejectOwner = async () => {
    if (!rejectModal) return;
    try {
      await api.admin.rejectOwner(rejectModal.id, { reason: rejectReason || 'Application did not meet requirements.' });
      success(`❌ ${rejectModal.name} चे registration reject केले.`);
      setRejectModal(null);
      setRejectReason('');
      loadPendingOwners();
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
          {pendingOwners.length > 0 && (
            <button onClick={() => setActiveTab('pending_owners')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-200">
              <i className="fas fa-clock"></i>
              {pendingOwners.length} Pending Approval
            </button>
          )}
        </div>
      }
    >
      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Registration Reject करा</h3>
            <p className="text-sm text-gray-500 mb-4">{rejectModal.name} चे registration reject करण्याचे कारण द्या:</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="e.g. Incomplete information, invalid address, etc."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 mb-4 resize-none" />
            <div className="flex gap-3">
              <button onClick={handleRejectOwner}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                <i className="fas fa-times-circle mr-2"></i>Reject करा
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('pending_owners')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'pending_owners' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <i className="fas fa-clock"></i>
          Owner Approvals
          {pendingOwners.length > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingOwners.length}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('all')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'all' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <i className="fas fa-users mr-2"></i>All Users
        </button>
      </div>

      {/* ---- PENDING OWNERS TAB ---- */}
      {activeTab === 'pending_owners' && (
        <div>
          {pendingLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : pendingOwners.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-green-500 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">सर्व Approvals झाल्या!</h3>
              <p className="text-gray-500 text-sm">कोणतीही pending owner registration नाही.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">{pendingOwners.length} owner registration approval साठी pending आहे.</p>
              {pendingOwners.map((owner: any) => (
                <div key={owner.id} className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-bold text-lg">{owner.first_name?.[0]}{owner.last_name?.[0]}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-base">{owner.first_name} {owner.last_name}</h4>
                        <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                          <p><i className="fas fa-envelope mr-2 text-gray-400 w-4"></i>{owner.email}</p>
                          {owner.phone && <p><i className="fas fa-phone mr-2 text-gray-400 w-4"></i>{owner.phone}</p>}
                          {owner.business_name && <p><i className="fas fa-building mr-2 text-gray-400 w-4"></i>{owner.business_name}</p>}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">
                            <i className="fas fa-clock mr-1"></i>
                            Registered: {new Date(owner.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => handleApproveOwner(owner.id, `${owner.first_name} ${owner.last_name}`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                        <i className="fas fa-check-circle"></i>Approve करा
                      </button>
                      <button onClick={() => setRejectModal({ id: owner.id, name: `${owner.first_name} ${owner.last_name}` })}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors">
                        <i className="fas fa-times-circle"></i>Reject करा
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- ALL USERS TAB ---- */}
      {activeTab === 'all' && (
        <div>
          {/* Search and Filter */}
          <div className="flex items-center gap-3 mb-5">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
              className="bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:outline-none w-48" />
            <select value={role} onChange={e => setRole(e.target.value)} className="bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:outline-none">
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="owner">Owners</option>
            </select>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Users', value: total, icon: 'fa-users', color: 'bg-purple-50 text-purple-600' },
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
                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-700 font-bold text-sm">{v?.[0]}{r.last_name?.[0]}</span>
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
                key: 'is_active', label: 'Status', render: (v, r) => (
                  <div>
                    <span className={`badge ${v ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      <i className={`fas fa-circle text-xs mr-1`}></i>
                      {v ? 'Active' : (r.role === 'owner' ? 'Pending Approval' : 'Inactive')}
                    </span>
                  </div>
                )
              },
              { key: 'created_at', label: 'Joined', render: v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
              {
                key: 'id', label: 'Actions', render: (v, r) => (
                  <div className="flex gap-2">
                    {r.role === 'owner' && !r.is_active && (
                      <button onClick={() => handleApproveOwner(v, `${r.first_name} ${r.last_name}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-600 hover:bg-green-200">
                        <i className="fas fa-check mr-1"></i>Approve
                      </button>
                    )}
                    <button onClick={() => toggleStatus(v, !!r.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${r.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                      {r.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )
              }
            ]}
            data={data}
            emptyText="No users found"
          />

          {total > 20 && (
            <div className="flex justify-center gap-3 mt-5">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-50">← Prev</button>
              <span className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm">Page {page} of {Math.ceil(total / 20)}</span>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-50">Next →</button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
