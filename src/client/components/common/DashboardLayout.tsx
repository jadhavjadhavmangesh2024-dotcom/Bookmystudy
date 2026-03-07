import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarItem {
  label: string;
  icon: string;
  path: string;
  badge?: string | number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  sidebarItems: SidebarItem[];
  sidebarTitle?: string;
  sidebarColor?: string;
}

export default function DashboardLayout({
  children, title, subtitle, actions, sidebarItems, sidebarTitle, sidebarColor = 'indigo'
}: DashboardLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const colors: Record<string, string> = {
    indigo: 'bg-indigo-600 text-indigo-50',
    purple: 'bg-purple-700 text-purple-50',
    emerald: 'bg-emerald-700 text-emerald-50',
    blue: 'bg-blue-700 text-blue-50'
  };
  const activeColors: Record<string, string> = {
    indigo: 'bg-indigo-500/30 text-white',
    purple: 'bg-purple-600/30 text-white',
    emerald: 'bg-emerald-600/30 text-white',
    blue: 'bg-blue-600/30 text-white'
  };

  const sidebarBg = {
    indigo: 'bg-gradient-to-b from-indigo-700 to-indigo-900',
    purple: 'bg-gradient-to-b from-purple-700 to-purple-900',
    emerald: 'bg-gradient-to-b from-emerald-700 to-emerald-900',
    blue: 'bg-gradient-to-b from-blue-700 to-blue-900'
  }[sidebarColor] || 'bg-gradient-to-b from-indigo-700 to-indigo-900';

  const SidebarContent = () => (
    <div className={`h-full ${sidebarBg} flex flex-col`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <i className="fas fa-book-open text-white text-sm"></i>
          </div>
          <div>
            <div className="text-white font-bold font-poppins text-lg">Abhyasika</div>
            <div className="text-white/60 text-xs capitalize">{sidebarTitle || user?.role}</div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{user?.first_name[0]}{user?.last_name[0]}</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-white/60 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? `${activeColors[sidebarColor]} shadow-lg`
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <i className={`fas ${item.icon} w-5 text-center text-sm`}></i>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                  {item.badge}
                </span>
              )}
              {isActive && <i className="fas fa-chevron-right text-xs opacity-70"></i>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm"
        >
          <i className="fas fa-right-from-bracket w-5 text-center"></i>
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 fixed top-0 left-0 h-full z-40 shadow-2xl">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="mobile-overlay fixed inset-0" onClick={() => setMobileOpen(false)}></div>
          <div className="relative w-72 slide-in">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header */}
        <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setMobileOpen(true)}>
                <i className="fas fa-bars text-gray-600"></i>
              </button>
              <div>
                {title && <h1 className="text-lg font-bold text-gray-800">{title}</h1>}
                {subtitle && <p className="text-xs text-gray-500 hidden sm:block">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
export function StatCard({ title, value, icon, color = 'indigo', change, subtitle }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500 text-white',
    green: 'bg-emerald-500 text-white',
    blue: 'bg-blue-500 text-white',
    orange: 'bg-orange-500 text-white',
    purple: 'bg-purple-500 text-white',
    red: 'bg-red-500 text-white',
    yellow: 'bg-yellow-500 text-white'
  };
  const bgColors: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-100',
    green: 'bg-emerald-50 border-emerald-100',
    blue: 'bg-blue-50 border-blue-100',
    orange: 'bg-orange-50 border-orange-100',
    purple: 'bg-purple-50 border-purple-100',
    red: 'bg-red-50 border-red-100',
    yellow: 'bg-yellow-50 border-yellow-100'
  };

  return (
    <div className={`bg-white rounded-2xl p-5 border ${bgColors[color] || bgColors.indigo} card-hover shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colors[color] || colors.indigo} rounded-xl flex items-center justify-center shadow-md`}>
          <i className={`fas ${icon} text-xl`}></i>
        </div>
        {change !== undefined && (
          <span className={`badge text-xs ${change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <i className={`fas fa-arrow-${change >= 0 ? 'up' : 'down'} mr-1`}></i>
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm font-medium text-gray-600 mt-1">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

// Table Component
export function DataTable({ columns, data, loading, emptyText = 'No data found' }: {
  columns: { key: string; label: string; render?: (val: any, row: any) => React.ReactNode; className?: string }[];
  data: any[];
  loading?: boolean;
  emptyText?: string;
}) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-t">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded loading-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <i className="fas fa-inbox text-4xl text-gray-300 mb-3"></i>
        <p className="text-gray-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${col.className || ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-4 text-sm text-gray-700 ${col.className || ''}`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Badge component
export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; icon: string }> = {
    approved: { color: 'bg-green-100 text-green-700', icon: 'fa-check-circle' },
    active: { color: 'bg-green-100 text-green-700', icon: 'fa-circle' },
    confirmed: { color: 'bg-green-100 text-green-700', icon: 'fa-circle-check' },
    completed: { color: 'bg-blue-100 text-blue-700', icon: 'fa-flag-checkered' },
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: 'fa-clock' },
    rejected: { color: 'bg-red-100 text-red-700', icon: 'fa-circle-xmark' },
    cancelled: { color: 'bg-red-100 text-red-700', icon: 'fa-ban' },
    suspended: { color: 'bg-gray-100 text-gray-600', icon: 'fa-pause-circle' },
    success: { color: 'bg-green-100 text-green-700', icon: 'fa-check' },
    failed: { color: 'bg-red-100 text-red-700', icon: 'fa-xmark' },
    processing: { color: 'bg-blue-100 text-blue-700', icon: 'fa-spinner' },
    refunded: { color: 'bg-purple-100 text-purple-700', icon: 'fa-rotate-left' },
  };
  const c = configs[status?.toLowerCase()] || { color: 'bg-gray-100 text-gray-600', icon: 'fa-circle' };
  return (
    <span className={`badge ${c.color}`}>
      <i className={`fas ${c.icon} mr-1 text-xs`}></i>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}
