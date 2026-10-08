import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  Lock,
  Mail,
  User,
  Stethoscope,
  AlertCircle,
  Truck,
  CheckCircle2,
  Users,
  Key
} from 'lucide-react';

export default function LoginPage() {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [demoLoading, setDemoLoading] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === 'responder') navigate('/responder');
      else if (user.role === 'clinician') navigate('/clinician');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (role) => {
    setDemoLoading(role);
    setError(null);
    try {
      const user = await loginAsDemo(role);
      if (user?.role === 'responder') navigate('/responder');
      else if (user?.role === 'clinician') navigate('/clinician');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Demo login failed. Please check credentials or try again.');
    } finally {
      setDemoLoading(null);
    }
  };

  const testAccounts = [
    { role: 'student1', label: 'Student 1 (Chioma)', email: 'student@fuhsi.edu.ng', matric: 'FUHSI/2023/MBBS/0142', icon: User, color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200' },
    { role: 'student2', label: 'Student 2 (Emeka)', email: 'student2@fuhsi.edu.ng', matric: 'FUHSI/2023/NURS/0088', icon: Users, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200' },
    { role: 'student3', label: 'Student 3 (Amina)', email: 'student3@fuhsi.edu.ng', matric: 'FUHSI/2023/MLS/0055', icon: User, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { role: 'clinician', label: 'Doctor (Babatunde)', email: 'doctor@fuhsi.edu.ng', matric: 'DOC-FUHSI-088', icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
    { role: 'responder', label: 'EMS (Tunde)', email: 'responder@fuhsi.edu.ng', matric: 'EMS-FUHSI-012', icon: Truck, color: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-8 px-4">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Main Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto mb-3">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-current stroke-2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
                <path d="M9 11h6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">FUHSI ERS Login</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Federal University of Health Sciences, Ila-Orangun
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Tap Demo Switcher */}
          <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                1-Tap Instant Test Login
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                Pass: password123
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {testAccounts.slice(0, 3).map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={!!demoLoading}
                    onClick={() => handleDemoSelect(acc.role)}
                    className={`p-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-all border shadow-sm active:scale-95 ${acc.color}`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="truncate w-full text-center">
                      {demoLoading === acc.role ? '...' : acc.label.split(' ')[0] + ' ' + acc.label.split(' ')[1]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {testAccounts.slice(3, 5).map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={!!demoLoading}
                    onClick={() => handleDemoSelect(acc.role)}
                    className={`p-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-all border shadow-sm active:scale-95 ${acc.color}`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="truncate w-full text-center">
                      {demoLoading === acc.role ? 'Signing in...' : acc.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regular Login Form */}
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
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            <span>Don't have an account? </span>
            <Link to="/register" className="text-red-600 hover:text-red-700 font-bold">
              Register here
            </Link>
          </div>
        </div>

        {/* Test Accounts Credentials Cheat Sheet */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-xs space-y-2">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800">
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>Test User Credentials Cheat Sheet</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div>🎓 <strong>student@fuhsi.edu.ng</strong> | FUHSI/2023/MBBS/0142 (Chioma)</div>
            <div>🎓 <strong>student2@fuhsi.edu.ng</strong> | FUHSI/2023/NURS/0088 (Emeka)</div>
            <div>🎓 <strong>student3@fuhsi.edu.ng</strong> | FUHSI/2023/MLS/0055 (Amina)</div>
            <div>🩺 <strong>doctor@fuhsi.edu.ng</strong> | DOC-FUHSI-088 (Dr. Babatunde)</div>
            <div>🚑 <strong>responder@fuhsi.edu.ng</strong> | EMS-FUHSI-012 (Officer Williams)</div>
            <div className="text-[10px] text-slate-400 pt-1 font-sans">
              Password for all test accounts: <strong className="text-slate-700 font-mono">password123</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
