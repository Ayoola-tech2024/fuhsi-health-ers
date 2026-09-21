import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, PhoneCall, FileText, Menu, ShieldAlert } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-3 pointer-events-none">
      <div className="max-w-md w-full bg-[#0B1E36] text-slate-300 rounded-[2rem] px-5 py-2.5 shadow-2xl border border-slate-700/60 backdrop-blur-xl flex items-center justify-between pointer-events-auto relative">
        {/* 1. Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 transition-colors ${
              isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        {/* 2. Emergency */}
        <NavLink
          to="/responder"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 transition-colors ${
              isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <PhoneCall className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Emergency</span>
        </NavLink>

        {/* 3. Center Elevated Floating Red Call / SOS Button */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => navigate('/')}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-700 to-rose-500 border-4 border-[#0B1E36] flex items-center justify-center text-white shadow-xl shadow-red-600/50 hover:scale-105 active:scale-95 transition-all group"
          >
            <div className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-25" />
            <PhoneCall className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* 4. History */}
        <NavLink
          to="/clinician"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 transition-colors ${
              isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">History</span>
        </NavLink>

        {/* 5. More */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 transition-colors ${
              isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">More</span>
        </NavLink>
      </div>
    </div>
  );
}
