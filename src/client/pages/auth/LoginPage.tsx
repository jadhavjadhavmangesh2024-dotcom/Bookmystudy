import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/ToastProvider';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const DEMO_ACCOUNTS = [
    { role: 'Student', email: 'student1@example.com', password: 'any', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: 'fa-graduation-cap', iconBg: 'bg-emerald-100' },
    { role: 'Owner', email: 'owner1@example.com', password: 'any', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: 'fa-building', iconBg: 'bg-blue-100' },
    { role: 'Admin', email: 'admin@abhyasika.in', password: 'any', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: 'fa-crown', iconBg: 'bg-purple-100' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      error(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const loginAs = async (email: string) => {
    setForm(f => ({ ...f, email, password: 'demo123' }));
    setLoading(true);
    try {
      await login(email, 'demo123');
      success('Logged in successfully!');
      navigate('/');
    } catch (err: any) {
      error(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 fade-in">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-book-open text-white text-xl"></i>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-gray-800 font-poppins">BookMyStudy</div>
              <div className="text-xs text-gray-500">Find Your Perfect Study Space</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-6">Welcome Back!</h1>
          <p className="text-gray-500 mt-1">Sign in to continue your learning journey</p>
        </div>

        {/* Demo Accounts */}
        <div className="bg-white rounded-2xl p-4 mb-5 border border-gray-100 shadow-sm fade-in">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Quick Demo Login</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.role} onClick={() => loginAs(acc.email)}
                disabled={loading}
                className={`${acc.color} border rounded-xl p-3 text-center transition-all hover:scale-105 disabled:opacity-60`}>
                <div className={`w-8 h-8 ${acc.iconBg} rounded-lg flex items-center justify-center mx-auto mb-1.5`}>
                  <i className={`fas ${acc.icon} text-sm`}></i>
                </div>
                <div className="text-xs font-semibold">{acc.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-70 shadow-lg flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full loading-spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-right-to-bracket"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
