import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      api.notifications.list({ limit: 10 }).then((res: any) => {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'super_admin') return '/admin';
    if (user.role === 'owner') return '/owner';
    return '/student';
  };

  const markNotifRead = async () => {
    if (unreadCount > 0) {
      await api.notifications.markRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    }
  };

  const navClass = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isHomePage && !scrolled 
      ? 'bg-transparent' 
      : 'bg-white shadow-md'
  }`;

  const textClass = isHomePage && !scrolled ? 'text-white' : 'text-gray-700';
  const logoClass = isHomePage && !scrolled ? 'text-white' : 'text-teal-700';

  return (
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md">
              <i className="fas fa-book-open text-white text-sm"></i>
            </div>
            <span className={`text-xl font-bold font-poppins ${logoClass}`}>BookMyStudy</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/search" className={`text-sm font-medium hover:text-teal-600 transition-colors ${textClass}`}>
              <i className="fas fa-search mr-1.5"></i>Find Rooms
            </Link>
            {!user && (
              <>
                <Link to="/login" className={`text-sm font-medium hover:text-teal-600 transition-colors ${textClass}`}>Login</Link>
                <Link to="/register" className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
                  Get Started
                </Link>
              </>
            )}

            {user && (
              <div className="flex items-center gap-3" ref={menuRef}>
                {/* Notifications */}
                <div className="relative">
                  <button onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); markNotifRead(); }}
                    className={`relative p-2 rounded-xl hover:bg-white/10 transition-colors ${textClass}`}>
                    <i className="fas fa-bell text-lg"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden fade-in">
                      <div className="p-4 border-b gradient-card">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">
                            <i className="fas fa-bell-slash text-2xl mb-2 text-gray-300"></i>
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : notifications.map(n => (
                          <div key={n.id} className={`p-3 border-b hover:bg-gray-50 ${!n.is_read ? 'bg-teal-50' : ''}`}>
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-bell text-teal-600 text-xs"></i>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 rounded-xl hover:bg-white/20 transition-colors">
                    <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{user.first_name[0]}{user.last_name[0]}</span>
                    </div>
                    <span className={`text-sm font-medium ${textClass}`}>{user.first_name}</span>
                    <i className={`fas fa-chevron-down text-xs ${textClass}`}></i>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden fade-in">
                      <div className="p-4 gradient-card border-b">
                        <p className="font-semibold text-gray-800">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        <span className={`badge mt-2 text-xs ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : user.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          <i className={`fas ${user.role === 'super_admin' ? 'fa-crown' : user.role === 'owner' ? 'fa-building' : 'fa-graduation-cap'} mr-1 text-xs`}></i>
                          {user.role === 'super_admin' ? 'Super Admin' : user.role === 'owner' ? 'Owner' : 'Student'}
                        </span>
                      </div>
                      <div className="py-2">
                        <Link to={getDashboardLink()} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                          <i className="fas fa-grid-2 w-5 text-center"></i> Dashboard
                        </Link>
                        {user.role === 'student' && (
                          <Link to="/student/bookings" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                            <i className="fas fa-calendar-check w-5 text-center"></i> My Bookings
                          </Link>
                        )}
                        {user.role === 'owner' && (
                          <Link to="/owner/listings" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                            <i className="fas fa-building w-5 text-center"></i> My Listings
                          </Link>
                        )}
                        <div className="border-t my-2"></div>
                        <button onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <i className="fas fa-right-from-bracket w-5 text-center"></i> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'} text-xl ${textClass}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t shadow-lg slide-in">
          <div className="px-4 py-4 space-y-2">
            <Link to="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-teal-50 text-gray-700">
              <i className="fas fa-search text-teal-500 w-5 text-center"></i>
              <span className="font-medium">Find Study Rooms</span>
            </Link>
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-gray-50 text-gray-700">
                  <i className="fas fa-right-to-bracket text-teal-500 w-5 text-center"></i>
                  <span className="font-medium">Login</span>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block py-3 px-4 gradient-primary text-white rounded-xl font-semibold text-center">
                  Get Started Free
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 py-3 px-4 bg-teal-50 rounded-xl">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">{user.first_name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                </div>
                <Link to={getDashboardLink()} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-teal-50 text-gray-700">
                  <i className="fas fa-grid-2 text-teal-500 w-5 text-center"></i>
                  <span className="font-medium">Dashboard</span>
                </Link>
                <button onClick={() => { setMobileOpen(false); logout(); }} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-red-50 text-red-600">
                  <i className="fas fa-right-from-bracket w-5 text-center"></i>
                  <span className="font-medium">Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
