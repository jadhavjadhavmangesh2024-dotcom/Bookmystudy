import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/ToastProvider';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { register } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) return error('Passwords do not match');
    if (form.password.length < 6) return error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      success('Account created successfully!');
      navigate('/');
    } catch (err: any) {
      if (err.pending_approval) {
        setPendingApproval(true);
      } else {
        error(err.message || 'Registration failed');
      }
    }
    setLoading(false);
  };

  // Show pending approval screen for owners
  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-clock text-amber-500 text-4xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Registration Submitted!</h1>
          <p className="text-gray-600 mb-4">
            तुमची owner registration request आमच्या admin कडे गेली आहे.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
            <h3 className="font-bold text-amber-800 mb-3"><i className="fas fa-info-circle mr-2"></i>पुढे काय होईल?</h3>
            <ol className="text-sm text-amber-700 space-y-2">
              <li className="flex items-start gap-2"><span className="font-bold">1.</span> Admin तुमची details review करेल</li>
              <li className="flex items-start gap-2"><span className="font-bold">2.</span> Approval नंतर तुम्हाला email/notification येईल</li>
              <li className="flex items-start gap-2"><span className="font-bold">3.</span> तुम्ही login करून तुमची study room add करू शकाल</li>
            </ol>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            <i className="fas fa-envelope mr-2"></i>
            <strong>{form.email}</strong> वर approval notification येईल.
          </p>
          <Link to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors">
            <i className="fas fa-sign-in-alt"></i>Login Page वर जा
          </Link>
          <div className="mt-4">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
              <i className="fas fa-home mr-1"></i>Homepage वर जा
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-book-open text-white text-xl"></i>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-gray-800 font-poppins">BookMyStudy</div>
              <div className="text-xs text-gray-500">Book Your Study Room</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-6">Create Your Account</h1>
          <p className="text-gray-500 mt-1">Start your learning journey today</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            { role: 'student', label: 'I\'m a Student', desc: 'Find & book study rooms', icon: 'fa-graduation-cap', color: 'indigo' },
            { role: 'owner', label: 'I\'m an Owner', desc: 'List my study rooms', icon: 'fa-building', color: 'blue' }
          ].map(opt => (
            <button key={opt.role} type="button" onClick={() => update('role', opt.role)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${form.role === opt.role ? `border-${opt.color}-500 bg-${opt.color}-50` : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className={`w-10 h-10 ${form.role === opt.role ? `bg-${opt.color}-100` : 'bg-gray-100'} rounded-xl flex items-center justify-center mb-3`}>
                <i className={`fas ${opt.icon} ${form.role === opt.role ? `text-${opt.color}-600` : 'text-gray-500'}`}></i>
              </div>
              <div className={`font-semibold text-sm ${form.role === opt.role ? `text-${opt.color}-700` : 'text-gray-700'}`}>{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
                <input type="text" value={form.first_name} onChange={e => update('first_name', e.target.value)} required
                  placeholder="Amit"
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
                <input type="text" value={form.last_name} onChange={e => update('last_name', e.target.value)} required
                  placeholder="Kumar"
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
                  placeholder="amit@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</div>
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input type="password" value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} required
                  placeholder="Repeat password"
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none transition-all ${form.confirm_password && form.password !== form.confirm_password ? 'border-red-400 bg-red-50 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`} />
              </div>
              {form.confirm_password && form.password !== form.confirm_password && (
                <p className="text-xs text-red-500 mt-1"><i className="fas fa-exclamation-circle mr-1"></i>Passwords don't match</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-70 shadow-lg flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full loading-spinner"></div>Creating Account...</>
              ) : (
                <><i className="fas fa-user-plus"></i>Create Account</>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
            By registering, you agree to our <a href="#" className="text-indigo-600">Terms of Service</a> and <a href="#" className="text-indigo-600">Privacy Policy</a>
          </p>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
