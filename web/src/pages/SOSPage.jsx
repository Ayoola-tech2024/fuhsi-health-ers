import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldAlert,
  Bell,
  CheckCircle2,
  ChevronRight,
  Cross,
  Truck,
  MapPin,
  Users,
  Calendar,
  Pill,
  Droplet,
  Asterisk,
  HeartPulse,
  UserCheck,
  PhoneCall,
  Activity,
  X,
  Radio,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function SOSPage() {
  const { user, isAuthenticated, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [coords, setCoords] = useState({ latitude: 8.0194, longitude: 4.9042 });
  const [activeSOS, setActiveSOS] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [arming, setArming] = useState(false);
  const [incidentData, setIncidentData] = useState(null);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showVolunteersModal, setShowVolunteersModal] = useState(false);

  // Student Profile Data
  const student = {
    name: user?.full_name || 'Akinlabi',
    role: 'Medical Student • FUHSI',
    bloodGroup: 'O+',
    allergies: 'None',
    currentMeds: 'None',
    chronicIllness: 'None',
    emergencyContactsCount: 2,
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => console.log('Using default FUHSI GPS coordinates')
      );
    }
  }, []);

  // Countdown timer for SOS trigger
  useEffect(() => {
    let timer;
    if (arming && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (arming && countdown === 0) {
      setArming(false);
      triggerEmergency();
    }
    return () => clearTimeout(timer);
  }, [arming, countdown]);

  const handleStartSOS = () => {
    setCountdown(5);
    setArming(true);
  };

  const handleCancelArming = () => {
    setArming(false);
    setCountdown(5);
  };

  const triggerEmergency = async () => {
    setActiveSOS(true);
    try {
      const res = await api.triggerSOS({
        latitude: coords.latitude,
        longitude: coords.longitude,
        description: 'Emergency SOS initiated from Mobile Home Dashboard.',
      });
      setIncidentData(res);
    } catch (e) {
      setIncidentData({
        incident: { id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`, status: 'reported' },
        nearestFacility: { name: 'FUHSI Health & Medical Centre', distanceKm: 0.4, phone: '+234 800 384 7437' },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 pb-28">
      {/* 1. Header Section with FUHSI Crest & Campus Image Background */}
      <div className="relative bg-[#0B1E36] text-white pt-6 pb-20 px-5 rounded-b-[2.5rem] shadow-xl overflow-hidden">
        {/* Background ambient pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-xl mx-auto relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* FUHSI Emblem */}
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 p-2 flex items-center justify-center backdrop-blur-md shadow-inner">
              <svg viewBox="0 0 24 24" className="w-full h-full text-emerald-400 fill-none stroke-current stroke-2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
                <path d="M9 11h6" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight">
                FUHSI
              </h1>
              <p className="text-xs font-semibold text-slate-200">
                Emergency Response System (ERS)
              </p>
              <p className="text-[10px] text-emerald-400 font-medium tracking-wide">
                Your Safety • Our Priority
              </p>
            </div>
          </div>

          {/* Notification Bell with Badge */}
          <div className="relative">
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-slate-200" />
            </button>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-lg border-2 border-[#0B1E36]">
              3
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-14 relative z-20 space-y-4">
        {/* 2. User Status Floating Card */}
        <div className="bg-white rounded-3xl p-4 shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
                alt="Student Profile"
                className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="font-bold text-sm text-slate-900">Hello, {student.name}</h2>
                <span className="text-sm">👋</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{student.role}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-600">Live location shared</span>
              </div>
            </div>
          </div>

          <div className="bg-[#EBFBF3] border border-[#D1F7E2] rounded-2xl px-3 py-2 text-right">
            <div className="flex items-center justify-end space-x-1 text-[#0E9F6E]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">You're Safe</span>
            </div>
            <span className="text-[10px] text-slate-500 block font-medium">Location active</span>
          </div>
        </div>

        {/* 3. Hero Emergency SOS Banner Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#990000] via-[#C81E1E] to-[#800000] text-white p-5 shadow-xl shadow-red-900/30">
          {/* Subtle background ambulance illustration */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* SOS Glowing Trigger Button */}
            <div className="shrink-0">
              {arming ? (
                <button
                  onClick={handleCancelArming}
                  className="w-22 h-22 rounded-full bg-white text-red-600 flex flex-col items-center justify-center shadow-2xl border-4 border-red-200 animate-pulse"
                >
                  <span className="text-2xl font-black">{countdown}</span>
                  <span className="text-[8px] font-black uppercase tracking-wider">Cancel</span>
                </button>
              ) : (
                <button
                  onClick={handleStartSOS}
                  className="relative w-22 h-22 rounded-full bg-gradient-to-tr from-red-800 to-red-500 flex flex-col items-center justify-center text-white shadow-2xl border-4 border-white/20 active:scale-95 transition-all group"
                >
                  <div className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-30" />
                  <span className="text-lg font-black tracking-wider leading-none">SOS</span>
                  <PhoneCall className="w-4 h-4 mt-1 text-white group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>

            {/* Text & Details */}
            <div className="flex-1 pl-2">
              <h3 className="text-lg sm:text-xl font-black tracking-tight">Emergency?</h3>
              <p className="text-[11px] text-red-100 font-medium leading-relaxed mt-0.5">
                Tap to send help request to clinic, responders and trusted contacts.
              </p>

              {/* Pill tags */}
              <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 bg-black/25 backdrop-blur-md rounded-full text-[9px] font-bold text-white border border-white/10">
                <span>📍 Live location</span>
                <span>•</span>
                <span>Medical profile</span>
                <span>•</span>
                <span>Ambulance dispatch</span>
              </div>
            </div>

            {/* Circular Arrow Button */}
            <button
              onClick={handleStartSOS}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Active Emergency Status Banner (when SOS triggered) */}
        {activeSOS && (
          <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-4 shadow-lg animate-bounce-short">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <div>
                  <h4 className="text-xs font-bold text-red-900">SOS ALERT BROADCASTED</h4>
                  <p className="text-[10px] text-red-700">Responders dispatched to your live coordinates.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSOS(false)}
                className="px-3 py-1 bg-red-600 text-white rounded-xl text-xs font-bold"
              >
                Resolve
              </button>
            </div>
          </div>
        )}

        {/* 4. Quick Access Grid (6 Action Cards) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-extrabold text-slate-900">Quick Access</h3>
            <Link to="/facilities" className="text-xs font-bold text-[#1C64F2] flex items-center space-x-1 hover:underline">
              <span>All Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Card 1: Medical Profile */}
            <Link
              to="/profile"
              className="bg-[#FEF2F2] hover:bg-[#FDE8E8] border border-[#FDE8E8] rounded-2xl p-3.5 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Cross className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Medical Profile</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">View & manage your health info</p>
              </div>
              <div className="flex justify-end mt-2">
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
              </div>
            </Link>

            {/* Card 2: Request Ambulance */}
            <button
              onClick={() => setShowAmbulanceModal(true)}
              className="bg-[#EBF5FF] hover:bg-[#E1EFFE] border border-[#E1EFFE] rounded-2xl p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Truck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Request Ambulance</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Fast dispatch to your location</p>
              </div>
              <div className="flex justify-end mt-2">
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
              </div>
            </button>

            {/* Card 3: Nearest Facilities */}
            <Link
              to="/facilities"
              className="bg-[#EBFBF3] hover:bg-[#D1F7E2] border border-[#D1F7E2] rounded-2xl p-3.5 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Nearest Facilities</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Find nearby clinics & pharmacies</p>
              </div>
              <div className="flex justify-end mt-2">
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
              </div>
            </Link>

            {/* Card 4: Volunteers */}
            <button
              onClick={() => setShowVolunteersModal(true)}
              className="bg-[#F6F5FF] hover:bg-[#EDEBFE] border border-[#EDEBFE] rounded-2xl p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Volunteers</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Get help from registered volunteers</p>
              </div>
              <div className="flex justify-end mt-2">
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500" />
              </div>
            </button>

            {/* Card 5: Doctor Booking */}
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-[#FFF8E6] hover:bg-[#FDF0CD] border border-[#FDF0CD] rounded-2xl p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Doctor Booking</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Consult & get pre-diagnosis</p>
              </div>
              <div className="flex justify-end mt-2">
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
              </div>
            </button>

            {/* Card 6: Nutrition Follow-up */}
            <Link
              to="/profile"
              className="bg-[#E6F9F9] hover:bg-[#D5F5F6] border border-[#D5F5F6] rounded-2xl p-3.5 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Pill className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Nutrition Follow-up</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Track your nutrition & wellness</p>
              </div>
              <div className="flex justify-end mt-2">
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500" />
              </div>
            </Link>
          </div>
        </div>

        {/* 5. Your Health Information (Quick View) Card */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-sm font-extrabold text-slate-900">Your Health Information <span className="text-xs font-normal text-slate-500">(Quick View)</span></h3>
            <Link to="/profile" className="text-xs font-bold text-[#1C64F2] flex items-center space-x-1 hover:underline">
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <div className="grid grid-cols-5 divide-x divide-slate-100 text-center">
              {/* Item 1: Blood Group */}
              <div className="px-1">
                <Droplet className="w-4 h-4 text-red-500 mx-auto mb-1.5" />
                <span className="text-[9px] font-semibold text-slate-400 block uppercase">Blood Group</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{student.bloodGroup}</span>
              </div>

              {/* Item 2: Allergies */}
              <div className="px-1">
                <Asterisk className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
                <span className="text-[9px] font-semibold text-slate-400 block uppercase">Allergies</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.allergies}</span>
              </div>

              {/* Item 3: Current Meds */}
              <div className="px-1">
                <Pill className="w-4 h-4 text-indigo-500 mx-auto mb-1.5" />
                <span className="text-[9px] font-semibold text-slate-400 block uppercase">Current Meds</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.currentMeds}</span>
              </div>

              {/* Item 4: Chronic Illness */}
              <div className="px-1">
                <HeartPulse className="w-4 h-4 text-rose-500 mx-auto mb-1.5" />
                <span className="text-[9px] font-semibold text-slate-400 block uppercase">Chronic Illness</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.chronicIllness}</span>
              </div>

              {/* Item 5: Emergency Contact */}
              <div className="px-1">
                <UserCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1.5" />
                <span className="text-[9px] font-semibold text-slate-400 block uppercase">Emergency Contact</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.emergencyContactsCount} added</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ambulance Modal */}
      {showAmbulanceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-blue-600">
                <Truck className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Request Campus Ambulance</h3>
              </div>
              <button onClick={() => setShowAmbulanceModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Dispatch rapid ambulance team to your current GPS position: <strong className="text-slate-900">Main Campus Zone B</strong>
            </p>
            <button
              onClick={() => {
                setShowAmbulanceModal(false);
                handleStartSOS();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
            >
              Confirm Ambulance Dispatch
            </button>
          </div>
        </div>
      )}

      {/* Doctor Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-amber-600">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Doctor Consultation Booking</h3>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Schedule an in-person or virtual clinical assessment with FUHSI University Health Medical Officers.
            </p>
            <button
              onClick={() => setShowBookingModal(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
            >
              Book Available Slot (Today 2:00 PM)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
