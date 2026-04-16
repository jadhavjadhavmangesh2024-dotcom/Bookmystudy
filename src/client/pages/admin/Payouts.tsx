import React, { useState, useEffect } from 'react';
import DashboardLayout, { DataTable, StatusBadge } from '../../components/common/DashboardLayout';
import api from '../../utils/api';
const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/admin' },
  { label: 'Study Rooms', icon: 'fa-building', path: '/admin/abhyasikas' },
  { label: 'Users', icon: 'fa-users', path: '/admin/users' },
  { label: 'Revenue', icon: 'fa-chart-line', path: '/admin/revenue' },
  { label: 'Payouts', icon: 'fa-money-bill-transfer', path: '/admin/payouts' },
  { label: 'Advertisements', icon: 'fa-rectangle-ad', path: '/admin/ads' },
  { label: 'Settings', icon: 'fa-gear', path: '/admin/settings' },
];
export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.admin.payouts().then((r: any) => { setPayouts(r.data || []); setLoading(false); }); }, []);
  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Super Admin" sidebarColor="purple" title="Owner Payouts" subtitle="Manage owner payment disbursements">
      <div className="grid grid-cols-3 gap-5 mb-6">
        {[{l:'Total Payouts',v:`₹${payouts.reduce((s:any,p:any)=>s+(p.net_amount||0),0).toLocaleString()}`,i:'fa-indian-rupee-sign',c:'bg-green-50 text-green-600'},
          {l:'Paid',v:payouts.filter(p=>p.status==='paid').length,i:'fa-check-circle',c:'bg-blue-50 text-blue-600'},
          {l:'Pending',v:payouts.filter(p=>p.status==='pending').length,i:'fa-clock',c:'bg-yellow-50 text-yellow-600'},
        ].map((s,i)=>(
          <div key={i} className={`${s.c} rounded-2xl p-4 flex items-center gap-4`}>
            <i className={`fas ${s.i} text-2xl`}></i>
            <div><div className="text-2xl font-bold">{s.v}</div><div className="text-sm">{s.l}</div></div>
          </div>
        ))}
      </div>
      <DataTable loading={loading} data={payouts} emptyText="No payouts yet"
        columns={[
          { key: 'payout_number', label: 'Payout #', render: v => <span className="font-mono text-sm text-indigo-600 font-semibold">{v}</span> },
          { key: 'first_name', label: 'Owner', render: (v,r) => `${v} ${r.last_name}` },
          { key: 'gross_amount', label: 'Gross', render: v => `₹${Number(v).toLocaleString('en-IN')}` },
          { key: 'commission_amount', label: 'Commission', render: v => <span className="text-red-600">-₹{Number(v).toLocaleString('en-IN')}</span> },
          { key: 'net_amount', label: 'Net Payout', render: v => <span className="font-bold text-green-600">₹{Number(v).toLocaleString('en-IN')}</span> },
          { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
          { key: 'created_at', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
        ]} />
    </DashboardLayout>
  );
}
