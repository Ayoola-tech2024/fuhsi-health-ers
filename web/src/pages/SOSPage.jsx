import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
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
  X,
  Building2,
  ArrowRight,
  Shield,
  Clock,
  Check,
  AlertCircle,
  Apple,
  MessageSquare,
  Cross
} from 'lucide-react';

export default function SOSPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Student Profile State
  const [student, setStudent] = useState({
    name: user?.full_name || 'Akinlabi',
    role: 'Medical Student • FUHSI',
    bloodGroup: 'O+',
    allergies: 'None',
    currentMeds: 'None',
    chronicIllness: 'None',
    emergencyContactsCount: 2,
    location: 'Hostel Block B, Main Campus',
  });

  // Emergency SOS State
  const [activeSOS, setActiveSOS] = useState(false);
  const [sosStatus, setSosStatus] = useState('reported'); // 'reported', 'dispatched', 'arrived'
  const [etaMinutes, setEtaMinutes] = useState(4);
  const [arming, setArming] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [incidentId, setIncidentId] = useState('INC-FUHSI-842');

  // Interactive Modals
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [ambulanceLocation, setAmbulanceLocation] = useState('Hostel Block B (Current GPS)');
  const [ambulanceUrgency, setAmbulanceUrgency] = useState('High');

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Fatima Olamide (Medical Officer)');
  const [bookingTime, setBookingTime] = useState('Today, 2:30 PM');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const [showVolunteersModal, setShowVolunteersModal] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Volunteers sample data
  const volunteers = [
    { id: 1, name: 'Deborah Adeleke', role: 'Nursing Dept (Year 4)', distance: '120m away', phone: '+234 803 111 4455', certified: 'Red Cross Certified' },
    { id: 2, name: 'Samuel Oladipo', role: 'Physiotherapy (Year 3)', distance: '250m away', phone: '+234 814 222 3344', certified: 'First Aid Responder' },
    { id: 3, name: 'Halimat Ibrahim', role: 'MBBS (Year 5)', distance: '400m away', phone: '+234 802 999 8811', certified: 'Basic Life Support (BLS)' },
  ];

  // SOS Countdown Timer
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

  const triggerEmergency = () => {
    setActiveSOS(true);
    setSosStatus('reported');
    setIncidentId(`INC-FUHSI-${Math.floor(100 + Math.random() * 900)}`);
    setEtaMinutes(4);

    // Simulate dispatch progression
    setTimeout(() => setSosStatus('dispatched'), 3000);
  };

  const handleBookDoctor = (e) => {
    e.preventDefault();
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingConfirmed(false);
      setShowBookingModal(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* 1. Header Section with FUHSI Crest & Institutional Navy Background */}
      <div className="relative bg-[#0D2040] text-white pt-5 pb-20 px-5 rounded-b-[2.2rem] shadow-md overflow-hidden">
        {/* Subtle campus image pattern */}
        <div 
          className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80')" }}
        />

        <div className="max-w-md mx-auto relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* FUHSI Official Medical Crest */}
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 p-2 flex items-center justify-center backdrop-blur-sm shadow-sm">
              <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-none stroke-current stroke-2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
                <path d="M9 11h6" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight leading-tight text-white">
                FUHSI
              </h1>
              <p className="text-xs font-medium text-slate-200">
                Emergency Response System (ERS)
              </p>
              <p className="text-[10px] text-slate-300 font-medium tracking-wide">
                Your Safety • Our Priority
              </p>
            </div>
          </div>

          {/* Top Right: Sign Up / Sign In & Bell */}
          <div className="flex items-center space-x-2">
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-bold shadow-sm transition-colors border border-red-400/40 flex items-center space-x-1"
            >
              <span>Sign Up</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowNotificationsModal(true)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
              >
                <Bell className="w-4 h-4 text-white" />
              </button>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E02424] text-white text-[9px] font-extrabold flex items-center justify-center shadow border-2 border-[#0D2040]">
                3
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-14 relative z-20 space-y-4">
        {/* 2. User Status Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
                alt="Student Profile"
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
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

          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl px-3 py-2 text-right">
            <div className="flex items-center justify-end space-x-1 text-[#059669]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">You're Safe</span>
            </div>
            <span className="text-[10px] text-slate-500 block font-medium">Location active</span>
          </div>
        </div>

        {/* 3. Hero Emergency SOS Banner Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#8B0000] via-[#B91C1C] to-[#7F1D1D] text-white p-4 sm:p-5 shadow-lg">
          {/* Ambulance image illustration on the right */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-52 opacity-30 bg-contain bg-right bg-no-repeat pointer-events-none"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=400&auto=format&fit=crop&q=80')" }}
          />

          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* Circular Tactile SOS Button */}
            <div className="shrink-0">
              {arming ? (
                <button
                  onClick={handleCancelArming}
                  className="w-20 h-20 rounded-full bg-white text-red-600 flex flex-col items-center justify-center shadow-xl border-4 border-red-200"
                >
                  <span className="text-2xl font-black">{countdown}</span>
                  <span className="text-[8px] font-black uppercase tracking-wider">Cancel</span>
                </button>
              ) : (
                <button
                  onClick={handleStartSOS}
                  className="relative w-20 h-20 rounded-full bg-gradient-to-b from-red-600 to-red-700 flex flex-col items-center justify-center text-white shadow-xl border-4 border-white/20 active:scale-95 transition-all group"
                >
                  <span className="text-base font-black tracking-wider leading-none">SOS</span>
                  <PhoneCall className="w-4 h-4 mt-1 text-white group-hover:rotate-12 transition-transform" />
                </button>
              )}
            </div>

            {/* Description & Tags */}
            <div className="flex-1 pl-1">
              <h3 className="text-lg font-black tracking-tight text-white">Emergency?</h3>
              <p className="text-[11px] text-red-100 font-medium leading-tight mt-0.5">
                Tap to send help request to clinic, responders and trusted contacts.
              </p>

              {/* Clean tags */}
              <div className="mt-2.5 inline-flex items-center space-x-1.5 px-2.5 py-1 bg-black/25 rounded-full text-[9px] font-semibold text-white">
                <span>📍 Live location</span>
                <span>•</span>
                <span>Medical profile</span>
                <span>•</span>
                <span>Ambulance dispatch</span>
              </div>
            </div>

            {/* Action Arrow Button */}
            <button
              onClick={handleStartSOS}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Active Emergency Status Card (When SOS Triggered) */}
        {activeSOS && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                  Active Emergency Alert ({incidentId})
                </h4>
              </div>
              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-extrabold uppercase">
                {sosStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-red-100">
              <div>
                <span className="text-[10px] text-slate-500 block">Dispatched Unit</span>
                <span className="font-bold text-slate-900">Ambulance Unit 1 (EMS)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Estimated Arrival</span>
                <span className="font-bold text-red-600">~{etaMinutes} Minutes</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-600 font-medium">
                📲 2 Emergency contacts alerted via SMS.
              </span>
              <button
                onClick={() => setActiveSOS(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Resolve Case
              </button>
            </div>
          </div>
        )}

        {/* 4. Quick Access Grid (6 Cards) */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-sm font-extrabold text-slate-900">Quick Access</h3>
            <Link to="/facilities" className="text-xs font-bold text-[#1C64F2] flex items-center space-x-1 hover:underline">
              <span>All Services</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. Medical Profile (Soft Red) */}
            <Link
              to="/profile"
              className="bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FEE2E2] rounded-2xl p-3 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-2">
                  <Cross className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">Medical Profile</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">View & manage health info</p>
              </div>
              <div className="flex justify-end mt-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
              </div>
            </Link>

            {/* 2. Request Ambulance (Soft Blue) */}
            <button
              onClick={() => setShowAmbulanceModal(true)}
              className="bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-2xl p-3 flex flex-col justify-between text-left transition-all group"
            >
              <div>
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">Request Ambulance</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Fast dispatch to location</p>
              </div>
              <div className="flex justify-end mt-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
              </div>
            </button>

            {/* 3. Nearest Facilities (Soft Green) */}
            <Link
              to="/facilities"
              className="bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#D1FAE5] rounded-2xl p-3 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">Nearest Facilities</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Find nearby clinics</p>
              </div>
              <div className="flex justify-end mt-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </div>
            </Link>

            {/* 4. Volunteers (Soft Purple) */}
            <button
              onClick={() => setShowVolunteersModal(true)}
              className="bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#EDE9FE] rounded-2xl p-3 flex flex-col justify-between text-left transition-all group"
            >
              <div>
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">Volunteers</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Registered first-aiders</p>
              </div>
              <div className="flex justify-end mt-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500" />
              </div>
            </button>

            {/* 5. Doctor Booking (Soft Amber) */}
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FEF3C7] rounded-2xl p-3 flex flex-col justify-between text-left transition-all group"
            >
              <div>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">Doctor Booking</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Consult & assessment</p>
              </div>
              <div className="flex justify-end mt-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500" />
              </div>
            </button>

            {/* 6. Nutrition Follow-up (Soft Teal) */}
            <button
              onClick={() => setShowNutritionModal(true)}
              className="bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#CCFBF1] rounded-2xl p-3 flex flex-col justify-between text-left transition-all group"
            >
              <div>
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center mb-2">
                  <Pill className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">Nutrition Follow-up</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Track wellness & diet</p>
              </div>
              <div className="flex justify-end mt-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500" />
              </div>
            </button>
          </div>
        </div>

        {/* 5. Your Health Information (Quick View) */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-sm font-extrabold text-slate-900">
              Your Health Information <span className="text-xs font-normal text-slate-500">(Quick View)</span>
            </h3>
            <Link to="/profile" className="text-xs font-bold text-[#1C64F2] flex items-center space-x-1 hover:underline">
              <span>View Details</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80">
            <div className="grid grid-cols-5 divide-x divide-slate-100 text-center">
              {/* 1: Blood Group */}
              <div className="px-1">
                <Droplet className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <span className="text-[8px] font-semibold text-slate-400 block uppercase tracking-tight">Blood Group</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{student.bloodGroup}</span>
              </div>

              {/* 2: Allergies */}
              <div className="px-1">
                <Asterisk className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <span className="text-[8px] font-semibold text-slate-400 block uppercase tracking-tight">Allergies</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.allergies}</span>
              </div>

              {/* 3: Current Meds */}
              <div className="px-1">
                <Pill className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                <span className="text-[8px] font-semibold text-slate-400 block uppercase tracking-tight">Current Meds</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.currentMeds}</span>
              </div>

              {/* 4: Chronic Illness */}
              <div className="px-1">
                <HeartPulse className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                <span className="text-[8px] font-semibold text-slate-400 block uppercase tracking-tight">Chronic Illness</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.chronicIllness}</span>
              </div>

              {/* 5: Emergency Contact */}
              <div className="px-1">
                <UserCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <span className="text-[8px] font-semibold text-slate-400 block uppercase tracking-tight">Emergency Contact</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.emergencyContactsCount} added</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Request Ambulance */}
      {showAmbulanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-blue-600">
                <Truck className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Dispatch Ambulance</h3>
              </div>
              <button onClick={() => setShowAmbulanceModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pick Location</label>
                <select
                  value={ambulanceLocation}
                  onChange={(e) => setAmbulanceLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Hostel Block B (Current GPS)">Hostel Block B (Current GPS)</option>
                  <option value="Faculty of Basic Medical Sciences">Faculty of Basic Medical Sciences</option>
                  <option value="Main Lecture Theatre A">Main Lecture Theatre A</option>
                  <option value="University Sports Complex">University Sports Complex</option>
                  <option value="Main Gate / Security Post">Main Gate / Security Post</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Emergency Urgency</label>
                <div className="grid grid-cols-3 gap-2">
                  {['High', 'Moderate', 'Standard'].map(urg => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setAmbulanceUrgency(urg)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        ambulanceUrgency === urg
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAmbulanceModal(false);
                triggerEmergency();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Confirm & Dispatch Immediately</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: Doctor Booking */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-amber-600">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Doctor Consultation</h3>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingConfirmed ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Appointment Confirmed!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Booked with {selectedDoctor} for {bookingTime}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookDoctor} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Physician</label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Dr. Fatima Olamide (Medical Officer)">Dr. Fatima Olamide (Medical Officer)</option>
                    <option value="Dr. K. A. Adeleke (Consultant Physician)">Dr. K. A. Adeleke (Consultant Physician)</option>
                    <option value="Nurse Triage Station (Campus Clinic)">Nurse Triage Station (Campus Clinic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Slot</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Today, 2:30 PM">Today, 2:30 PM</option>
                    <option value="Today, 4:00 PM">Today, 4:00 PM</option>
                    <option value="Tomorrow, 10:00 AM">Tomorrow, 10:00 AM</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Confirm Appointment Pass
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 3: Campus Volunteers */}
      {showVolunteersModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-purple-600">
                <Users className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Campus First-Aiders</h3>
              </div>
              <button onClick={() => setShowVolunteersModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Certified medical and nursing student responders on standby near your hostel:
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {volunteers.map(v => (
                <div key={v.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{v.name}</div>
                    <div className="text-[10px] text-slate-500">{v.role} • <span className="text-purple-600 font-semibold">{v.distance}</span></div>
                    <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">✓ {v.certified}</div>
                  </div>
                  <a
                    href={`tel:${v.phone}`}
                    className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                    title="Call Volunteer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Nutrition & Wellness Follow-up */}
      {showNutritionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-teal-600">
                <Apple className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Nutrition & Wellness</h3>
              </div>
              <button onClick={() => setShowNutritionModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl">
                <h5 className="font-bold text-teal-900">Post-Emergency Hydration & Diet</h5>
                <p className="text-teal-700 text-[11px] mt-0.5">Maintain 2.5L water daily and avoid known allergen traces.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-800">Dietary Allergen Shield: Active</div>
                <div className="text-slate-500 text-[11px]">Flagged food allergens: Penicillin, Peanuts (Strictly restricted).</div>
              </div>
            </div>

            <button
              onClick={() => setShowNutritionModal(false)}
              className="w-full mt-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Close Wellness Guide
            </button>
          </div>
        </div>
      )}

      {/* Modal 5: Notification Center */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-900">
                <Bell className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-slate-900">Campus Alerts (3)</h3>
              </div>
              <button onClick={() => setShowNotificationsModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs">
                <div className="font-bold text-red-900">Emergency Protocol Active</div>
                <div className="text-red-700 text-[11px] mt-0.5">Ambulance Unit 1 is stationed at Gate 1 for rapid response.</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="font-bold text-slate-900">Medical Record Verified</div>
                <div className="text-slate-600 text-[11px] mt-0.5">Dr. Fatima Olamide confirmed your annual health record.</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="font-bold text-slate-900">New First-Aider on Duty</div>
                <div className="text-slate-600 text-[11px] mt-0.5">Samuel Oladipo (Year 3) is active near Hostel Block B.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
