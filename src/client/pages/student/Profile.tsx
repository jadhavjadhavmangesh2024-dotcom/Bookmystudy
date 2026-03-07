import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/ToastProvider';

const SIDEBAR = [
  { label: 'Dashboard', icon: 'fa-grid-2', path: '/student' },
  { label: 'My Bookings', icon: 'fa-calendar-check', path: '/student/bookings' },
  { label: 'Saved Rooms', icon: 'fa-heart', path: '/student/wishlist' },
  { label: 'Profile', icon: 'fa-user', path: '/student/profile' },
];

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', gender: '', exam_preparing: '', qualification: '' });
  const { success, error } = useToast();

  useEffect(() => {
    api.users.profile().then((r: any) => {
      setProfile(r.data);
      setForm({ first_name: r.data.first_name || '', last_name: r.data.last_name || '', phone: r.data.phone || '', gender: r.data.profile?.gender || '', exam_preparing: r.data.profile?.exam_preparing || '', qualification: r.data.profile?.qualification || '' });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.users.updateProfile(form);
      success('Profile updated!');
      setEditing(false);
    } catch (e: any) { error(e.message); }
  };

  return (
    <DashboardLayout sidebarItems={SIDEBAR} sidebarTitle="Student Portal" sidebarColor="indigo"
      title="My Profile" subtitle="Manage your personal information">
      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="gradient-primary p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-3xl">{profile?.first_name?.[0]}{profile?.last_name?.[0]}</span>
            </div>
            <h2 className="text-xl font-bold">{profile?.first_name} {profile?.last_name}</h2>
            <p className="text-white/70 mt-1">{profile?.email}</p>
            <span className="inline-block mt-2 bg-white/20 text-white text-xs px-3 py-1 rounded-full capitalize">
              <i className="fas fa-graduation-cap mr-1"></i>Student
            </span>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl loading-pulse"></div>)}</div>
            ) : editing ? (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 mb-4">Edit Profile</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                    <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                    <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                    <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Preparing For</label>
                    <input type="text" value={form.exam_preparing} onChange={e => setForm(f => ({ ...f, exam_preparing: e.target.value }))}
                      placeholder="e.g. UPSC, MPSC, CA"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Qualification</label>
                    <input type="text" value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                      placeholder="e.g. B.Sc, B.Com, BA"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSave} className="flex-1 gradient-primary text-white py-3 rounded-xl font-semibold text-sm">
                    <i className="fas fa-save mr-2"></i>Save Changes
                  </button>
                  <button onClick={() => setEditing(false)} className="flex-1 border border-gray-200 py-3 rounded-xl text-sm font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Full Name', value: `${profile?.first_name} ${profile?.last_name}`, icon: 'fa-user' },
                  { label: 'Email', value: profile?.email, icon: 'fa-envelope' },
                  { label: 'Phone', value: profile?.phone || 'Not set', icon: 'fa-phone' },
                  { label: 'Gender', value: profile?.profile?.gender || 'Not set', icon: 'fa-venus-mars' },
                  { label: 'Exam Preparing', value: profile?.profile?.exam_preparing || 'Not set', icon: 'fa-book-open' },
                  { label: 'Qualification', value: profile?.profile?.qualification || 'Not set', icon: 'fa-graduation-cap' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className={`fas ${icon} text-indigo-600 text-sm`}></i>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-gray-700 capitalize">{value}</p>
                    </div>
                  </div>
                ))}
                <button onClick={() => setEditing(true)} className="w-full gradient-primary text-white py-3 rounded-xl font-semibold text-sm mt-4">
                  <i className="fas fa-edit mr-2"></i>Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
