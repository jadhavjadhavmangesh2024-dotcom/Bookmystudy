import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
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

export default function AdminSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [broadcast, setBroadcast] = useState({ title: '', message: '', target_roles: 'all' });
  const { success, error } = useToast();

  useEffect(() => {
    api.admin.settings().then((r: any) => { setSettings(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const updates = Object.entries(edited).map(([key, value]) => ({ key, value }));
    if (!updates.length) return;
    try {
      await api.admin.updateSettings(updates);
      success('Settings updated!');
      setEdited({});
    } catch (e: any) { error(e.message); }
  };

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) return error('Title and message required');
    try {
      const r: any = await api.admin.broadcast(broadcast);
      success(`Notification sent to ${r.data.sent_to} users`);
      setBroadcast({ title: '', message: '', target_roles: 'all' });
    } catch (e: any) { error(e.message); }
  };

  const groupedSettings = settings.reduce((acc: any, s: any) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Super Admin" sidebarColor="purple"
      title="Platform Settings" subtitle="Configure platform parameters"
      actions={
        Object.keys(edited).length > 0 && (
          <button onClick={handleSave} className="gradient-primary text-white px-5 py-2 rounded-xl text-sm font-semibold">
            <i className="fas fa-save mr-2"></i>Save Changes ({Object.keys(edited).length})
          </button>
        )
      }
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-2 space-y-5">
          {loading ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100"><div className="h-64 bg-gray-100 rounded-xl loading-pulse"></div></div>
          ) : Object.entries(groupedSettings).map(([cat, items]: any) => (
            <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b">
                <h3 className="font-bold text-gray-800 capitalize">{cat} Settings</h3>
              </div>
              <div className="p-5 space-y-4">
                {items.map((s: any) => (
                  <div key={s.key} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-semibold text-gray-700">{s.key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</label>
                      {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                    </div>
                    <input
                      type={s.value_type === 'number' ? 'number' : 'text'}
                      defaultValue={s.value}
                      onChange={e => setEdited(p => ({ ...p, [s.key]: e.target.value }))}
                      className={`w-48 border rounded-xl px-3 py-2 text-sm focus:outline-none ${edited[s.key] !== undefined ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200 focus:border-indigo-400'}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Broadcast Notification */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b">
              <h3 className="font-bold text-gray-800">📢 Broadcast Notification</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Audience</label>
                <select value={broadcast.target_roles} onChange={e => setBroadcast(b => ({ ...b, target_roles: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="all">All Users</option>
                  <option value="student">Students Only</option>
                  <option value="owner">Owners Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                <input type="text" value={broadcast.title} onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))}
                  placeholder="Notification title..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                <textarea value={broadcast.message} onChange={e => setBroadcast(b => ({ ...b, message: e.target.value }))}
                  placeholder="Notification message..." rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"></textarea>
              </div>
              <button onClick={handleBroadcast} className="w-full gradient-primary text-white py-3 rounded-xl text-sm font-semibold">
                <i className="fas fa-paper-plane mr-2"></i>Send Notification
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b">
              <h3 className="font-bold text-gray-800">Quick Actions</h3>
            </div>
            <div className="p-3 space-y-2">
              {[
                { label: 'View Pending Approvals', icon: 'fa-clock', color: 'text-yellow-600 bg-yellow-50', path: '/admin/abhyasikas?status=pending' },
                { label: 'Manage Users', icon: 'fa-users', color: 'text-indigo-600 bg-indigo-50', path: '/admin/users' },
                { label: 'Revenue Reports', icon: 'fa-chart-line', color: 'text-green-600 bg-green-50', path: '/admin/revenue' },
                { label: 'Manage Ads', icon: 'fa-rectangle-ad', color: 'text-purple-600 bg-purple-50', path: '/admin/ads' },
              ].map((item, i) => (
                <a key={i} href={item.path} className={`flex items-center gap-3 p-3 ${item.color} rounded-xl hover:opacity-80 transition-opacity`}>
                  <i className={`fas ${item.icon}`}></i>
                  <span className="text-sm font-medium">{item.label}</span>
                  <i className="fas fa-chevron-right text-xs ml-auto"></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
