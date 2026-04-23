import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/common/ToastProvider';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { error, success } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return error('Please enter your email address');
    setLoading(true);
    try {
      await api.auth.forgotPassword({ email });
      setSent(true);
      success('Password reset link sent!');
    } catch (err: any) {
      error(err.message || 'Failed to send reset email');
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
          <h1 className="text-2xl font-bold text-gray-800 mt-6">Forgot Password?</h1>
          <p className="text-gray-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 fade-in">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope-circle-check text-green-500 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Check Your Email!</h3>
              <p className="text-sm text-gray-500 mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox (and spam folder).
              </p>
              {/* Demo: show the token link since no real email server */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
                <p className="text-xs font-semibold text-amber-700 mb-1">
                  <i className="fas fa-info-circle mr-1"></i>Demo Mode
                </p>
                <p className="text-xs text-amber-600">
                  In production, a real email would be sent. For now, use the
                  reset token from the server logs or ask admin to reset your password.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setSent(false); setEmail(''); }}
                  className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  <i className="fas fa-redo mr-2"></i>Try Again
                </button>
                <Link to="/login"
                  className="w-full py-3 gradient-primary text-white rounded-xl text-sm font-semibold text-center hover:opacity-90 transition-opacity">
                  <i className="fas fa-arrow-left mr-2"></i>Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
                <p className="text-sm text-blue-700">
                  <i className="fas fa-info-circle mr-2"></i>
                  Enter your registered email address and we'll send you a link to reset your password.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-70 shadow-lg flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Reset Link
                  </>
                )}
              </button>

              <div className="text-center pt-2">
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
