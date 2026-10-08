import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation as useLocationContext } from '../context/LocationContext';
import { LogOut, MapPin } from 'lucide-react';
import CityPickerModal from './CityPickerModal';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { locationName } = useLocationContext();
  const [showCityPicker, setShowCityPicker] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Home (SOS)' },
    { to: '/facilities', label: 'Facilities' },
    { to: '/responder', label: 'EMS Dispatch', role: ['responder', 'admin'] },
    { to: '/clinician', label: 'Doctor Portal', role: ['clinician', 'admin'] },
    { to: '/profile', label: 'Medical Profile' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0D2040] border-b border-white/10 shadow-sm text-white backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 group-hover:bg-white/20 transition-all shadow-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v8" />
                  <path d="M9 11h6" />
                </svg>
              </div>
              <div>
                <div className="font-black text-sm leading-tight text-white tracking-tight flex items-center space-x-1">
                  <span>FUHSI</span>
                  <span className="text-red-400 font-extrabold text-[10px] bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/60">ERS</span>
                </div>
              </div>
            </Link>

            {/* Location Pill */}
            <button
              type="button"
              onClick={() => setShowCityPicker(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-[11px] sm:text-xs font-bold text-white transition-all active:scale-95 cursor-pointer backdrop-blur-md"
              title="Tap to switch active city / campus"
            >
              <MapPin className="w-3 h-3 text-red-400 shrink-0" />
              <span className="truncate max-w-[85px] sm:max-w-[130px]">{locationName.split(',')[0]}</span>
              <span className="text-[9px] opacity-70">▾</span>
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                if (link.role && (!user || !link.role.includes(user.role))) {
                  return null;
                }
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* User badge / Logout / Sign In */}
            <div className="flex items-center space-x-2 shrink-0">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/profile"
                    className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-200 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="truncate max-w-[100px]">{user?.full_name?.split(' ')[0] || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global City Picker Modal */}
      <CityPickerModal isOpen={showCityPicker} onClose={() => setShowCityPicker(false)} />
    </>
  );
}
