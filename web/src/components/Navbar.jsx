import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ShieldAlert, User, Stethoscope, Building2, LogOut, LogIn } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Emergency SOS', icon: ShieldAlert, show: true },
    { to: '/profile', label: 'Medical Profile', icon: User, show: isAuthenticated && user?.role === 'student' },
    { to: '/responder', label: 'Responder Queue', icon: AlertCircle, show: isAuthenticated && (user?.role === 'responder' || user?.role === 'admin') },
    { to: '/clinician', label: 'Doctor Portal', icon: Stethoscope, show: isAuthenticated && (user?.role === 'clinician' || user?.role === 'admin') },
    { to: '/facilities', label: 'Facilities', icon: Building2, show: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-lg text-white tracking-tight leading-none">
                FUHSI <span className="text-red-500 font-extrabold">ERS</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Health Emergency Service
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.filter(l => l.show).map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User / Auth Actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-white truncate max-w-[140px]">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800/50 inline-block">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white border border-slate-700 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
