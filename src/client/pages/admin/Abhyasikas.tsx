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

export default function AdminAbhyasikas() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showModal, setShowModal] = useState<'approve' | 'reject' | 'view' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { success, error } = useToast();

  useEffect(() => { loadData(); }, [search, status, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const r: any = await api.admin.abhyasikas({ search, status, page, limit: 20 });
      setData(r.data || []);
      setTotal(r.meta?.total || 0);
    } catch (e: any) { error(e.message); }
    setLoading(false);
  };

  const handleApprove = async (id: number) => {
    try {
      await api.admin.approve(id, {});
      success('Study Room approved and listed!');
      loadData();
      setShowModal(null);
    } catch (e: any) { error(e.message); }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) return error('Please provide a rejection reason');
    try {
      await api.admin.reject(id, { reason: rejectReason });
      success('Study Room rejected');
      loadData();
      setShowModal(null);
      setRejectReason('');
    } catch (e: any) { error(e.message); }
  };

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Super Admin" sidebarColor="purple"
      title="Study Room Management" subtitle="Review and manage all study room listings"
      actions={
        <div className="flex items-center gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-48" />
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:outline-none">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      }
    >
      <DataTable
        loading={loading}
        columns={[
          {
            key: 'primary_photo', label: '', render: (v, r) => (
              <div className="w-12 h-10 rounded-lg overflow-hidden bg-indigo-100 flex-shrink-0">
                {v ? <img src={v} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="fas fa-building text-indigo-300"></i></div>}
              </div>
            )
          },
          {
            key: 'name', label: 'Study Room', render: (v, r) => (
              <div>
                <p className="font-semibold text-gray-800">{v}</p>
                <p className="text-xs text-gray-400">{r.city_name}</p>
              </div>
            )
          },
          {
            key: 'owner_first', label: 'Owner', render: (v, r) => (
              <div>
                <p className="text-sm font-medium">{v} {r.owner_last}</p>
                <p className="text-xs text-gray-400">{r.owner_email}</p>
              </div>
            )
          },
          {
            key: 'total_seats', label: 'Seats', render: (v, r) => (
              <div className="text-center">
                <p className="font-bold text-gray-800">{v}</p>
                <p className="text-xs text-gray-400">{r.booking_count} bookings</p>
              </div>
            )
          },
          { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
          {
            key: 'created_at', label: 'Submitted', render: v => (
              <span className="text-xs text-gray-500">{new Date(v).toLocaleDateString('en-IN')}</span>
            )
          },
          {
            key: 'id', label: 'Actions', render: (v, r) => (
              <div className="flex items-center gap-2">
                <button onClick={() => { setSelectedItem(r); setShowModal('view'); }}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <i className="fas fa-eye text-sm"></i>
                </button>
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => { setSelectedId(v); setShowModal('approve'); }}
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => { setSelectedId(v); setShowModal('reject'); }}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors">
                      Reject
                    </button>
                  </>
                )}
              </div>
            )
          }
        ]}
        data={data}
        emptyText="No study rooms found"
      />

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-3 mt-5">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-50 hover:bg-indigo-50">← Prev</button>
          <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-50 hover:bg-indigo-50">Next →</button>
        </div>
      )}

      {/* Approve Modal */}
      {showModal === 'approve' && (
        <Modal title="Approve Study Room" onClose={() => setShowModal(null)}>
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-circle-check text-green-500 text-3xl"></i>
            </div>
            <p className="text-gray-700 mb-2 font-medium">Are you sure you want to approve this Study Room?</p>
            <p className="text-sm text-gray-500">It will be listed publicly and owners will be notified.</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowModal(null)} className="flex-1 py-3 border rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={() => selectedId && handleApprove(selectedId)} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600">
              <i className="fas fa-check mr-2"></i>Approve
            </button>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showModal === 'reject' && (
        <Modal title="Reject Study Room" onClose={() => setShowModal(null)}>
          <div className="py-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}
              placeholder="Please explain why this listing is being rejected..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none"></textarea>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowModal(null)} className="flex-1 py-3 border rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={() => selectedId && handleReject(selectedId)} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
              <i className="fas fa-times mr-2"></i>Reject
            </button>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {showModal === 'view' && selectedItem && (
        <Modal title="Study Room Details" onClose={() => setShowModal(null)} wide>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Name', selectedItem.name],
              ['Owner', `${selectedItem.owner_first} ${selectedItem.owner_last}`],
              ['Email', selectedItem.owner_email],
              ['City', selectedItem.city_name],
              ['Address', selectedItem.address],
              ['Total Seats', selectedItem.total_seats],
              ['Status', selectedItem.status],
              ['Submitted', new Date(selectedItem.created_at).toLocaleDateString('en-IN')],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</p>
                <p className="font-medium text-gray-800 capitalize">{value}</p>
              </div>
            ))}
          </div>
          {selectedItem.status === 'pending' && (
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setSelectedId(selectedItem.id); setShowModal('approve'); }} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600">
                Approve
              </button>
              <button onClick={() => { setSelectedId(selectedItem.id); setShowModal('reject'); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                Reject
              </button>
            </div>
          )}
        </Modal>
      )}
    </DashboardLayout>
  );
}

function Modal({ title, children, onClose, wide }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl p-6 ${wide ? 'max-w-xl' : 'max-w-md'} w-full`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
            <i className="fas fa-times text-gray-600 text-sm"></i>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
