import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { error, success } = useToast();

  const strength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-400'];
  const pw_strength = strength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return error('Invalid or missing reset token. Please request a new reset link.');
    if (form.password.length < 6) return error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return error('Passwords do not match');
    setLoading(true);
    try {
      await api.auth.resetPassword({ token, password: form.password });
      setDone(true);
      success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      error(err.message || 'Invalid or expired reset token');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-500 text-sm mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password"
            className="inline-block w-full py-3 gradient-primary text-white rounded-xl text-sm font-semibold text-center hover:opacity-90">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md">
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
          <h1 className="text-2xl font-bold text-gray-800 mt-6">Reset Password</h1>
          <p className="text-gray-500 mt-1">Create a new secure password for your account</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 fade-in">
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-circle text-green-500 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Password Reset!</h3>
              <p className="text-sm text-gray-500 mb-6">
                Your password has been successfully reset. Redirecting to login...
              </p>
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <Link to="/login"
                className="w-full inline-block py-3 gradient-primary text-white rounded-xl text-sm font-semibold text-center hover:opacity-90">
                <i className="fas fa-right-to-bracket mr-2"></i>Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Enter new password"
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= pw_strength ? strengthColor[pw_strength] : 'bg-gray-200'}`}></div>
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${pw_strength <= 1 ? 'text-red-500' : pw_strength === 2 ? 'text-amber-500' : pw_strength === 3 ? 'text-blue-500' : 'text-green-500'}`}>
                      {strengthLabel[pw_strength]} password
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Confirm new password"
                    className={`w-full pl-11 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      form.confirm && form.confirm !== form.password
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : form.confirm && form.confirm === form.password
                        ? 'border-green-300 focus:border-green-400 focus:ring-green-100'
                        : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                  </button>
                  {form.confirm && (
                    <div className="absolute right-11 top-1/2 -translate-y-1/2">
                      <i className={`fas text-sm ${form.confirm === form.password ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-400'}`}></i>
                    </div>
                  )}
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Password Requirements:</p>
                <ul className="text-xs text-gray-500 space-y-0.5">
                  <li className={form.password.length >= 6 ? 'text-green-600' : ''}><i className={`fas fa-${form.password.length >= 6 ? 'check' : 'circle'} mr-1 text-xs`}></i>At least 6 characters</li>
                  <li className={/[A-Z]/.test(form.password) ? 'text-green-600' : ''}><i className={`fas fa-${/[A-Z]/.test(form.password) ? 'check' : 'circle'} mr-1 text-xs`}></i>One uppercase letter</li>
                  <li className={/[0-9]/.test(form.password) ? 'text-green-600' : ''}><i className={`fas fa-${/[0-9]/.test(form.password) ? 'check' : 'circle'} mr-1 text-xs`}></i>One number</li>
                </ul>
              </div>

              <button type="submit" disabled={loading || form.password !== form.confirm || form.password.length < 6}
                className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key"></i>
                    Reset Password
                  </>
                )}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  <i className="fas fa-arrow-left mr-1"></i>Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
