import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, Lock, Mail, User, Stethoscope, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="max-w-md mx-auto px-4 py-8 sm:py-14 pb-28">
      <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In to FUHSI ERS</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access student profile, clinical logs, or dispatch console
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Demo Fast Login Buttons */}
        <div className="mb-6 p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
            🚀 1-Click Demo Login (Instant Pitch Mode)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSelect('student')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center transition-colors border border-slate-700/60"
            >
              <User className="w-4 h-4 text-red-400 mb-1" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('clinician')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center transition-colors border border-slate-700/60"
            >
              <Stethoscope className="w-4 h-4 text-emerald-400 mb-1" />
              <span>Doctor</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('responder')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center transition-colors border border-slate-700/60"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 mb-1" />
              <span>EMS</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                placeholder="e.g. yourname@fuhsi.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-red-600/30"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          New to FUHSI ERS?{' '}
          <Link to="/register" className="text-red-400 font-bold hover:underline">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
}
