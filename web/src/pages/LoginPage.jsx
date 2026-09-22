import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, User, Stethoscope, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === 'responder') navigate('/responder');
      else if (user.role === 'clinician') navigate('/clinician');
      else navigate('/profile');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (role) => {
    loginAsDemo(role);
    if (role === 'responder') navigate('/responder');
    else if (role === 'clinician') navigate('/clinician');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto mb-3">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-current stroke-2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
                <path d="M9 11h6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">FUHSI ERS Login</h2>
            <p className="text-xs text-slate-500 mt-1">
              Federal University of Health Sciences, Ila-Orangun
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Quick Demo Switch */}
          <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 text-center">
              Quick Role Test (Instant Login)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('student')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-colors border border-slate-200"
              >
                <User className="w-4 h-4 text-red-600 mb-1" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('clinician')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-colors border border-slate-200"
              >
                <Stethoscope className="w-4 h-4 text-emerald-600 mb-1" />
                <span>Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('responder')}
                className="p-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-colors border border-slate-200"
              >
                <AlertCircle className="w-4 h-4 text-blue-600 mb-1" />
                <span>EMS</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  placeholder="student@fuhsi.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
