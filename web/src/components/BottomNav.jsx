import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, PhoneCall, Building2, User, Stethoscope, ShieldAlert, Radio, Activity } from 'lucide-react';

export default function BottomNav() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'student';

  if (role === 'responder') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-3 pointer-events-none">
        <div className="max-w-md w-full bg-[#0B1E36] text-slate-300 rounded-[2rem] px-5 py-2.5 shadow-2xl border border-slate-700/60 backdrop-blur-xl flex items-center justify-between pointer-events-auto relative">
          {/* 1. Dispatch Queue */}
          <NavLink
            to="/responder"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 transition-colors ${
                isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <ShieldAlert className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Dispatch</span>
          </NavLink>

          {/* 2. Facilities */}
          <NavLink
            to="/facilities"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 transition-colors ${
                isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Clinics</span>
          </NavLink>

          {/* 3. Center Responder Action Button */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => navigate('/responder')}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 border-4 border-[#0B1E36] flex items-center justify-center text-white shadow-xl shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all group"
            >
              <div className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-25" />
              <Radio className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
            </button>
          </div>

          {/* 4. SOS Campus Live View */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 transition-colors ${
                isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Campus</span>
          </NavLink>

          {/* 5. Account */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 transition-colors ${
                isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Account</span>
          </NavLink>
        </div>
      </div>
    );
  }

  if (role === 'clinician') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-3 pointer-events-none">
        <div className="max-w-md w-full bg-[#0B1E36] text-slate-300 rounded-[2rem] px-5 py-2.5 shadow-2xl border border-slate-700/60 backdrop-blur-xl flex items-center justify-between pointer-events-auto relative">
          {/* 1. Doctor Triage */}
          <NavLink
            to="/clinician"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 transition-colors ${
                isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <Stethoscope className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Triage EHR</span>
          </NavLink>

          {/* 2. Facilities */}
          <NavLink
            to="/facilities"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 transition-colors ${
                isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Clinics</span>
          </NavLink>

          {/* 3. Center Doctor Action Button */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => navigate('/clinician')}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-600 border-4 border-[#0B1E36] flex items-center justify-center text-white shadow-xl shadow-emerald-600/50 hover:scale-105 active:scale-95 transition-all group"
            >
              <div className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-25" />
              <Activity className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* 4. SOS Campus Live View */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 transition-colors ${
                isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Campus</span>
          </NavLink>

          {/* 5. Account */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 transition-colors ${
                isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Account</span>
          </NavLink>
        </div>
      </div>
    );
  }

  // Default: Student & Public Visitor
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-3 pointer-events-none">
      <div className="max-w-md w-full bg-[#0B1E36] text-slate-300 rounded-[2rem] px-5 py-2.5 shadow-2xl border border-slate-700/60 backdrop-blur-xl flex items-center justify-between pointer-events-auto relative">
        {/* 1. Home (SOS) */}
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

        {/* 2. Facilities */}
        <NavLink
          to="/facilities"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 transition-colors ${
              isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Facilities</span>
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

        {/* 4. Student Medical Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 transition-colors ${
              isActive ? 'text-[#3F83F8] font-bold' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Profile</span>
        </NavLink>

        {/* 5. EMS Emergency Hotline */}
        <a
          href="tel:+2348003847437"
          className="flex flex-col items-center py-1 transition-colors text-slate-400 hover:text-white"
        >
          <PhoneCall className="w-5 h-5 mb-0.5 text-red-400" />
          <span className="text-[10px] font-medium">Hotline</span>
        </a>
      </div>
    </div>
  );
}
