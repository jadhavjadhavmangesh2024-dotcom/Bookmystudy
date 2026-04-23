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

const ROLE_COLORS: Record<string, string> = {
  student: 'bg-green-100 text-green-700',
  owner: 'bg-blue-100 text-blue-700',
  super_admin: 'bg-purple-100 text-purple-700'
};

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

  // Modals
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [resetPwModal, setResetPwModal] = useState<{ id: number; name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string; email: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { success, error } = useToast();

  useEffect(() => { loadPendingOwners(); loadData(); }, []);
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
    } catch { /* ignore */ }
    setPendingLoading(false);
  };

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      await api.admin.updateUserStatus(id, { is_active: !isActive });
      success(`User ${isActive ? 'deactivated (temporarily disabled)' : 'activated'}`);
      loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleApproveOwner = async (id: number, name: string) => {
    try {
      await api.admin.approveOwner(id);
      success(`✅ ${name} चे owner account approve केले!`);
      loadPendingOwners(); loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleRejectOwner = async () => {
    if (!rejectModal) return;
    try {
      await api.admin.rejectOwner(rejectModal.id, { reason: rejectReason || 'Application did not meet requirements.' });
      success(`❌ ${rejectModal.name} चे registration reject केले.`);
      setRejectModal(null); setRejectReason('');
      loadPendingOwners(); loadData();
    } catch (e: any) { error(e.message); }
  };

  const handleResetPassword = async () => {
    if (!resetPwModal) return;
    if (!newPassword || newPassword.length < 6) return error('Password must be at least 6 characters');
    try {
      await api.admin.resetUserPassword(resetPwModal.id, { new_password: newPassword });
      success(`🔑 ${resetPwModal.name} चा password reset केला!`);
      setResetPwModal(null); setNewPassword('');
    } catch (e: any) { error(e.message); }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    if (deleteConfirm !== deleteModal.email) return error('Please type the email correctly to confirm');
    try {
      await api.admin.deleteUser(deleteModal.id);
      success(`🗑️ ${deleteModal.name} चे account permanently delete केले.`);
      setDeleteModal(null); setDeleteConfirm('');
      loadData(); loadPendingOwners();
    } catch (e: any) { error(e.message); }
  };

  const openDetails = async (user: any) => {
    setDetailModal({ loading: true });
    setDetailLoading(true);
    try {
      const r: any = await api.admin.getUserDetails(user.id);
      setDetailModal(r.data);
    } catch {
      setDetailModal(user);
    }
    setDetailLoading(false);
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
              {pendingOwners.length} Pending
            </button>
          )}
        </div>
      }
    >

      {/* ===== REJECT OWNER MODAL ===== */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Registration Reject करा</h3>
            <p className="text-sm text-gray-500 mb-4">{rejectModal.name} चे registration reject करण्याचे कारण द्या:</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="e.g. Incomplete information, invalid address..." autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 mb-4 resize-none" />
            <div className="flex gap-3">
              <button onClick={handleRejectOwner}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                <i className="fas fa-times-circle mr-2"></i>Reject करा
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RESET PASSWORD MODAL ===== */}
      {resetPwModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-key text-amber-600"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Password Reset करा</h3>
                <p className="text-xs text-gray-500">{resetPwModal.email}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                हे action user ला त्यांच्या account मधून logout करेल आणि नवीन password set होईल.
              </p>
            </div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
            <div className="relative mb-4">
              <input type={showNewPw ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)} autoFocus
                placeholder="Enter new password (min 6 chars)"
                className="w-full pr-12 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <i className={`fas ${showNewPw ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-xs text-red-500 mb-3">At least 6 characters required</p>
            )}
            <div className="flex gap-3">
              <button onClick={handleResetPassword} disabled={newPassword.length < 6}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-60">
                <i className="fas fa-key mr-2"></i>Password Reset करा
              </button>
              <button onClick={() => { setResetPwModal(null); setNewPassword(''); setShowNewPw(false); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE USER MODAL ===== */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-trash-alt text-red-600"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Account Delete करा</h3>
                <p className="text-xs text-red-500">⚠️ हे action permanent आहे, undo होणार नाही!</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>{deleteModal.name}</strong> चे account आणि सर्व associated data permanently delete होईल:
              </p>
              <ul className="text-xs text-red-600 mt-2 space-y-0.5 list-disc list-inside">
                <li>सर्व sessions आणि login history</li>
                <li>सर्व bookings आणि payment records</li>
                <li>Profile आणि preferences</li>
                {deleteModal && (data.find(u => u.id === deleteModal.id)?.role === 'owner') && (
                  <li>सर्व study room listings (inactive होतील)</li>
                )}
              </ul>
            </div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Confirm करण्यासाठी email type करा: <span className="text-red-500 font-mono">{deleteModal.email}</span>
            </label>
            <input type="email" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={deleteModal.email} autoFocus
              className="w-full px-4 py-3 border border-red-200 rounded-xl text-sm focus:outline-none focus:border-red-400 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleDeleteUser} disabled={deleteConfirm !== deleteModal.email}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                <i className="fas fa-trash-alt mr-2"></i>Permanently Delete
              </button>
              <button onClick={() => { setDeleteModal(null); setDeleteConfirm(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== USER DETAIL MODAL ===== */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">User Details</h3>
              <button onClick={() => setDetailModal(null)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <span className="text-purple-700 font-bold text-xl">
                      {detailModal.user?.first_name?.[0] || detailModal.first_name?.[0]}
                      {detailModal.user?.last_name?.[0] || detailModal.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">
                      {detailModal.user?.first_name || detailModal.first_name} {detailModal.user?.last_name || detailModal.last_name}
                    </h4>
                    <p className="text-sm text-gray-500">{detailModal.user?.email || detailModal.email}</p>
                    <span className={`badge ${ROLE_COLORS[detailModal.user?.role || detailModal.role] || 'bg-gray-100'} capitalize mt-1 inline-block`}>
                      {(detailModal.user?.role || detailModal.role) === 'super_admin' ? 'Admin' : (detailModal.user?.role || detailModal.role)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Phone', value: detailModal.user?.phone || detailModal.phone || 'Not set', icon: 'fa-phone' },
                    { label: 'Joined', value: new Date(detailModal.user?.created_at || detailModal.created_at).toLocaleDateString('en-IN'), icon: 'fa-calendar' },
                    { label: 'Last Login', value: detailModal.user?.last_login_at ? new Date(detailModal.user.last_login_at).toLocaleDateString('en-IN') : 'Never', icon: 'fa-clock' },
                    { label: 'Status', value: (detailModal.user?.is_active || detailModal.is_active) ? 'Active' : 'Inactive', icon: 'fa-circle' },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-0.5"><i className={`fas ${item.icon} mr-1`}></i>{item.label}</p>
                      <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                    </div>
                  ))}
                </div>

                {detailModal.stats && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-blue-700">{detailModal.stats.total_bookings}</div>
                      <div className="text-xs text-blue-600">Bookings</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-green-700">₹{(detailModal.stats.total_spent || 0).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-green-600">Total Spent</div>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-indigo-700">{detailModal.stats.total_listings}</div>
                      <div className="text-xs text-indigo-600">Listings</div>
                    </div>
                  </div>
                )}

                {(detailModal.user?.business_name || detailModal.business_name) && (
                  <div className="bg-blue-50 rounded-xl p-3 mb-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Business Info</p>
                    <p className="text-sm text-blue-800">{detailModal.user?.business_name || detailModal.business_name}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => {
                    const u = detailModal.user || detailModal;
                    setDetailModal(null);
                    setResetPwModal({ id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email });
                  }}
                    className="flex-1 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold hover:bg-amber-200 min-w-0">
                    <i className="fas fa-key mr-1"></i>Reset Password
                  </button>
                  <button onClick={() => {
                    const u = detailModal.user || detailModal;
                    toggleStatus(u.id, !!(u.is_active));
                    setDetailModal(null);
                  }}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold min-w-0 ${(detailModal.user?.is_active ?? detailModal.is_active) ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    <i className={`fas fa-${(detailModal.user?.is_active ?? detailModal.is_active) ? 'ban' : 'check'} mr-1`}></i>
                    {(detailModal.user?.is_active ?? detailModal.is_active) ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => {
                    const u = detailModal.user || detailModal;
                    setDetailModal(null);
                    setDeleteModal({ id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email });
                  }}
                    className="flex-1 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-200 min-w-0">
                    <i className="fas fa-trash-alt mr-1"></i>Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('pending_owners')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'pending_owners' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <i className="fas fa-clock"></i>Owner Approvals
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
              <p className="text-sm text-gray-500">{pendingOwners.length} owner registration approval साठी pending आहे.</p>
              {pendingOwners.map((owner: any) => (
                <div key={owner.id} className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-bold text-lg">{owner.first_name?.[0]}{owner.last_name?.[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-800">{owner.first_name} {owner.last_name}</h4>
                        <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                          <p><i className="fas fa-envelope mr-2 text-gray-400 w-4"></i>{owner.email}</p>
                          {owner.phone && <p><i className="fas fa-phone mr-2 text-gray-400 w-4"></i>{owner.phone}</p>}
                          {owner.business_name && <p><i className="fas fa-building mr-2 text-gray-400 w-4"></i>{owner.business_name}</p>}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          <i className="fas fa-clock mr-1"></i>
                          {new Date(owner.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                      <button onClick={() => handleApproveOwner(owner.id, `${owner.first_name} ${owner.last_name}`)}
                        className="flex items-center justify-center gap-2 flex-1 sm:flex-none sm:w-36 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                        <i className="fas fa-check-circle"></i>Approve
                      </button>
                      <button onClick={() => setRejectModal({ id: owner.id, name: `${owner.first_name} ${owner.last_name}` })}
                        className="flex items-center justify-center gap-2 flex-1 sm:flex-none sm:w-36 px-4 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors">
                        <i className="fas fa-times-circle"></i>Reject
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
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or email..."
                className="w-full bg-gray-100 border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
              className="bg-gray-100 border-0 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="owner">Owners</option>
            </select>
          </div>

          {/* Stats */}
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
                  <button onClick={() => openDetails(r)} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-700 font-bold text-sm">{v?.[0]}{r.last_name?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 hover:text-purple-700">{v} {r.last_name}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </div>
                  </button>
                )
              },
              { key: 'phone', label: 'Phone', render: v => v ? <span className="text-sm text-gray-600 font-mono">{v}</span> : <span className="text-gray-400 text-sm">-</span> },
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
                  <span className={`badge ${v ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    <i className="fas fa-circle text-xs mr-1"></i>
                    {v ? 'Active' : (r.role === 'owner' ? 'Pending/Disabled' : 'Disabled')}
                  </span>
                )
              },
              { key: 'created_at', label: 'Joined', render: v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
              {
                key: 'id', label: 'Actions', render: (v, r) => (
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => openDetails(r)} title="View Details"
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-purple-100 text-purple-700 hover:bg-purple-200">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button onClick={() => setResetPwModal({ id: v, name: `${r.first_name} ${r.last_name}`, email: r.email })}
                      title="Reset Password"
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-amber-100 text-amber-700 hover:bg-amber-200">
                      <i className="fas fa-key"></i>
                    </button>
                    <button onClick={() => toggleStatus(v, !!r.is_active)}
                      title={r.is_active ? 'Temporarily Disable' : 'Enable'}
                      className={`px-2.5 py-1.5 rounded-lg text-xs ${r.is_active ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                      <i className={`fas fa-${r.is_active ? 'ban' : 'check'}`}></i>
                    </button>
                    {r.role === 'owner' && !r.is_active && (
                      <button onClick={() => handleApproveOwner(v, `${r.first_name} ${r.last_name}`)}
                        title="Approve Owner"
                        className="px-2.5 py-1.5 rounded-lg text-xs bg-green-100 text-green-600 hover:bg-green-200">
                        <i className="fas fa-check-circle"></i>
                      </button>
                    )}
                    <button onClick={() => setDeleteModal({ id: v, name: `${r.first_name} ${r.last_name}`, email: r.email })}
                      title="Delete User"
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-red-100 text-red-600 hover:bg-red-200">
                      <i className="fas fa-trash-alt"></i>
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
