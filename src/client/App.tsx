import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Public Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import AbhyasikaDetailPage from './pages/AbhyasikaDetailPage';
import BookingPage from './pages/BookingPage';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentBookings from './pages/student/Bookings';
import StudentProfile from './pages/student/Profile';
import StudentWishlist from './pages/student/Wishlist';

// Owner Pages
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerListings from './pages/owner/Listings';
import OwnerAddAbhyasika from './pages/owner/AddAbhyasika';
import OwnerEditAbhyasika from './pages/owner/EditAbhyasika';
import OwnerSeats from './pages/owner/Seats';
import OwnerBookings from './pages/owner/Bookings';
import OwnerRevenue from './pages/owner/Revenue';
import OwnerProfile from './pages/owner/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminAbhyasikas from './pages/admin/Abhyasikas';
import AdminUsers from './pages/admin/Users';
import AdminRevenue from './pages/admin/Revenue';
import AdminSettings from './pages/admin/Settings';
import AdminAds from './pages/admin/Advertisements';
import AdminPayouts from './pages/admin/Payouts';

// Layout
import Navbar from './components/common/Navbar';
import LoadingScreen from './components/common/LoadingScreen';
import ToastProvider from './components/common/ToastProvider';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'super_admin') return <Navigate to="/admin" replace />;
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    return <Navigate to="/student" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/abhyasika/:id" element={<AbhyasikaDetailPage />} />
        <Route path="/login" element={user ? <Navigate to={`/${user.role === 'super_admin' ? 'admin' : user.role}`} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />

        {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/bookings" element={<ProtectedRoute roles={['student']}><StudentBookings /></ProtectedRoute>} />
        <Route path="/student/wishlist" element={<ProtectedRoute roles={['student']}><StudentWishlist /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute roles={['student']}><StudentProfile /></ProtectedRoute>} />
        <Route path="/booking/:abhyasikaId" element={<ProtectedRoute roles={['student']}><BookingPage /></ProtectedRoute>} />

        {/* Owner Routes */}
        <Route path="/owner" element={<ProtectedRoute roles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/listings" element={<ProtectedRoute roles={['owner']}><OwnerListings /></ProtectedRoute>} />
        <Route path="/owner/listings/new" element={<ProtectedRoute roles={['owner']}><OwnerAddAbhyasika /></ProtectedRoute>} />
        <Route path="/owner/listings/:id/edit" element={<ProtectedRoute roles={['owner']}><OwnerEditAbhyasika /></ProtectedRoute>} />
        <Route path="/owner/listings/:id/seats" element={<ProtectedRoute roles={['owner']}><OwnerSeats /></ProtectedRoute>} />
        <Route path="/owner/bookings" element={<ProtectedRoute roles={['owner']}><OwnerBookings /></ProtectedRoute>} />
        <Route path="/owner/revenue" element={<ProtectedRoute roles={['owner']}><OwnerRevenue /></ProtectedRoute>} />
        <Route path="/owner/profile" element={<ProtectedRoute roles={['owner']}><OwnerProfile /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['super_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/abhyasikas" element={<ProtectedRoute roles={['super_admin']}><AdminAbhyasikas /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['super_admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/revenue" element={<ProtectedRoute roles={['super_admin']}><AdminRevenue /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['super_admin']}><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/ads" element={<ProtectedRoute roles={['super_admin']}><AdminAds /></ProtectedRoute>} />
        <Route path="/admin/payouts" element={<ProtectedRoute roles={['super_admin']}><AdminPayouts /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
