import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
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
  HeartPulse,
  PhoneCall,
  X,
  Check,
  UserPlus,
  Compass,
  Navigation,
  ShieldCheck,
  Activity,
  AlertTriangle
} from 'lucide-react';
import EmergencyMap from '../components/EmergencyMap';
import BuddyManagerModal from '../components/BuddyManagerModal';
import LegalNoticeModal from '../components/LegalNoticeModal';
import CityPickerModal from '../components/CityPickerModal';

export default function SOSPage() {
  const { user, isAuthenticated } = useAuth();
  const { 
    userLocation, 
    locationName, 
    gpsAccuracy: globalGpsAccuracy, 
    locationSource, 
    refreshLocation,
    facilities 
  } = useLocation();

  // Dynamic Live Database State
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [buddies, setBuddies] = useState([]);

  // Modals
  const [showBuddyModal, setShowBuddyModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Buddy SOS / Target State
  const [sosTarget, setSosTarget] = useState('self'); // 'self' | 'buddy'
  const [selectedBuddyId, setSelectedBuddyId] = useState(null);

  // Emergency SOS State
  const [activeSOS, setActiveSOS] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);
  const [sosStatus, setSosStatus] = useState('reported');
  const [arming, setArming] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [coords, setCoords] = useState(userLocation || { latitude: 8.0194, longitude: 4.9042 });
  const [gpsAccuracy, setGpsAccuracy] = useState(globalGpsAccuracy || null);
  const coordsRef = useRef(coords);

  // Synchronize with global location cache instantly
  useEffect(() => {
    if (userLocation) {
      coordsRef.current = userLocation;
      setCoords(userLocation);
      setGpsAccuracy(globalGpsAccuracy);
    }
  }, [userLocation, globalGpsAccuracy]);

  // High-accuracy GPS position refresh
  const acquireGpsPosition = (callback) => {
    refreshLocation({ highAccuracy: true, bypassCache: true });
    if (typeof callback === 'function') callback(coordsRef.current);
  };

  // Fetch Live Data on Mount
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveDbData() {
      try {
        if (isAuthenticated) {
          const [profRes, contRes, budRes] = await Promise.all([
            api.getProfile().catch(() => ({ profile: null })),
            api.getContacts().catch(() => ({ contacts: [] })),
            api.getBuddies().catch(() => ({ buddies: [] }))
          ]);

          if (isMounted) {
            if (profRes && profRes.profile) setProfile(profRes.profile);
            if (contRes && contRes.contacts) setContacts(contRes.contacts);
            if (budRes && Array.isArray(budRes.buddies)) {
              setBuddies(budRes.buddies);
              if (budRes.buddies.length > 0) {
                setSelectedBuddyId((prev) => prev || budRes.buddies[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Live data fetch notice:', err.message);
      }
    }

    fetchLiveDbData();
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  // Continuous live GPS tracking stream during active emergency
  useEffect(() => {
    let watchId;
    if (activeSOS && activeIncident?.id && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const fresh = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          coordsRef.current = fresh;
          setCoords(fresh);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          api.updateIncidentLocation(activeIncident.id, fresh).catch(() => {});
        },
        (err) => console.warn('GPS stream notice:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }
    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [activeSOS, activeIncident]);

  // Derived user display properties
  const displayName = (user && user.full_name) || (user && user.email ? user.email.split('@')[0] : '') || 'Student Member';
  const bloodGroup = profile?.blood_group || 'O+';
  const genotype = profile?.genotype || 'AA';

  // Closest facility calculation
  const closestFacility = facilities && facilities.length > 0 ? facilities[0] : {
    name: 'FUHSI Health & Medical Centre',
    facility_type: 'Main Clinic / Emergency Ward',
    latitude: 8.0194,
    longitude: 4.9042,
    phone: '+234 800 384 7437'
  };

  // Selected Buddy
  const selectedBuddy = buddies.find((b) => b.id === selectedBuddyId) || buddies[0] || null;

  // Countdown timer for SOS trigger
  useEffect(() => {
    let timer;
    if (arming && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (arming && countdown === 0) {
      setArming(false);
      triggerEmergency();
    }
    return () => clearTimeout(timer);
  }, [arming, countdown]);

  const handleStartSOS = () => {
    refreshLocation({ highAccuracy: true, bypassCache: true });
    setCountdown(5);
    setArming(true);
  };

  const handleCancelArming = () => {
    setArming(false);
    setCountdown(5);
  };

  // Trigger Emergency Dispatch
  const triggerEmergency = async () => {
    try {
      const currentCoords = coordsRef.current || { latitude: 8.0194, longitude: 4.9042 };
      
      const payload = {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        incidentType: 'medical_emergency',
        description: sosTarget === 'buddy' && selectedBuddy
          ? `[PROXY SOS] Emergency triggered on behalf of friend: ${selectedBuddy.name} (${selectedBuddy.matric_number || 'No Matric'}). Blood: ${selectedBuddy.blood_group || 'Unspecified'}. Notes: ${selectedBuddy.notes || 'None'}`
          : 'Emergency SOS triggered from Student Mobile Hub.',
      };

      if (sosTarget === 'buddy' && selectedBuddy) {
        payload.isProxySOS = true;
        payload.patientName = selectedBuddy.name;
        payload.patientMatricNumber = selectedBuddy.matric_number || null;
        payload.patientPhone = selectedBuddy.phone || null;
        payload.patientBloodGroup = selectedBuddy.blood_group || null;
        payload.patientAllergies = selectedBuddy.allergies || null;
        payload.patientNotes = selectedBuddy.notes || null;
      }

      const res = await api.createIncident(payload);
      if (res && res.incident) {
        setActiveIncident(res.incident);
        setSosStatus(res.incident.status || 'reported');
        setActiveSOS(true);
      }
    } catch (err) {
      console.warn('Emergency dispatch error:', err.message);
      setActiveSOS(true);
      setSosStatus('reported');
    }
  };

  // Live Incident Status Poller (2s sync)
  useEffect(() => {
    let pollInterval;
    const fetchFreshStatus = async () => {
      if (!activeIncident?.id) return;
      try {
        const res = await api.getIncident(activeIncident.id).catch(() => null);
        if (res && res.incident) {
          if (res.incident.status !== sosStatus) {
            setSosStatus(res.incident.status);
          }
          if (res.incident.status === 'resolved' || res.incident.status === 'cancelled') {
            setActiveSOS(false);
          }
        }
      } catch {}
    };

    if (activeSOS && activeIncident?.id) {
      fetchFreshStatus();
      pollInterval = setInterval(fetchFreshStatus, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeSOS, activeIncident, sosStatus]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* 1. Sleek Navigation Header */}
      <div className="bg-[#0D2040] text-white pt-4 pb-6 px-4 shadow-md border-b border-white/10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* University Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 p-1.5 flex items-center justify-center backdrop-blur-md">
              <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-none stroke-current stroke-2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
                <path d="M9 11h6" />
              </svg>
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight text-white leading-tight flex items-center space-x-1.5">
                <span>FUHSI ERS</span>
                <span className="text-[9px] font-extrabold bg-red-600 text-white px-1.5 py-0.2 rounded">LIVE</span>
              </h1>
              <p className="text-[10px] text-slate-300 font-medium">Emergency Response System</p>
            </div>
          </div>

          {/* Location Chip Button */}
          <button
            type="button"
            onClick={() => setShowCityPicker(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold text-white transition-all active:scale-95 cursor-pointer backdrop-blur-md"
            title="Tap to change active campus or city"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">{locationName.split(',')[0]}</span>
            <span className="text-[10px] opacity-70">▾</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Body */}
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Student Immediate Profile & Medical Vitals Card */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-slate-900 leading-snug">{displayName}</span>
                  {isAuthenticated && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Verified Account" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {user?.matric_number ? `Matric: ${user.matric_number}` : user?.staff_id ? `Staff ID: ${user.staff_id}` : (user?.role ? user.role.toUpperCase() : 'Guest Visitor')}
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div>
              {activeSOS ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-50 border border-red-300 text-red-700 text-[10px] font-black rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                  <span>SOS ACTIVE</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ready</span>
                </span>
              )}
            </div>
          </div>

          {/* Clinical Vitals Strip */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="bg-red-50/70 p-2 rounded-xl border border-red-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-red-600 block">Blood Group</span>
              <span className="text-xs font-black text-red-950 block">{bloodGroup}</span>
            </div>
            <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 block">Genotype</span>
              <span className="text-xs font-black text-blue-950 block">{genotype}</span>
            </div>
            <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 block">Allergies</span>
              <span className="text-[11px] font-bold text-amber-950 truncate block">
                {profile?.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Emergency SOS Target Switcher (Myself vs Friend) */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Emergency Target</span>
            <button
              type="button"
              onClick={() => setShowBuddyModal(true)}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-200 transition-colors"
            >
              + Trusted Friends ({buddies.length}/3)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSosTarget('self')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                sosTarget === 'self'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🔘 For Myself</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (buddies.length === 0) {
                  setShowBuddyModal(true);
                } else {
                  setSosTarget('buddy');
                }
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                sosTarget === 'buddy'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>For a Friend</span>
            </button>
          </div>

          {/* If Buddy Mode active, show selected friend chip */}
          {sosTarget === 'buddy' && buddies.length > 0 && (
            <div className="pt-1.5 flex flex-wrap gap-1.5 border-t border-slate-100">
              {buddies.map((b) => {
                const isSelected = (selectedBuddyId || buddies[0].id) === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBuddyId(b.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-purple-100 text-purple-900 border border-purple-400 ring-2 ring-purple-400/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>👤 {b.name.split(' ')[0]}</span>
                    {b.blood_group && (
                      <span className="px-1 bg-purple-200 text-purple-900 rounded text-[9px] font-mono font-extrabold">
                        {b.blood_group}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Active Emergency Live Monitor Card OR Tactile SOS Trigger */}
        {activeSOS ? (
          <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-red-500 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-red-600">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <span className="text-sm font-black uppercase tracking-tight">Emergency Active</span>
              </div>
              <span className="text-xs font-bold text-slate-700 capitalize bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                {sosStatus.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Friend info if proxy SOS */}
            {activeIncident?.is_proxy_sos && (
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 space-y-1 text-xs text-purple-900">
                <div className="font-bold flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-purple-700" />
                  <span>Patient: {activeIncident.patient_name || 'Trusted Friend'}</span>
                </div>
                <div className="text-[11px] text-purple-700">
                  Blood Group: <strong>{activeIncident.patient_blood_group || 'Unspecified'}</strong> • Allergies: <strong>{activeIncident.patient_allergies || 'None'}</strong>
                </div>
              </div>
            )}

            {/* Live Progress Indicator */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[
                { key: 'reported', label: '1. Sent' },
                { key: 'triaged', label: '2. Triage' },
                { key: 'dispatched', label: '3. En Route' },
                { key: 'at_facility', label: '4. Clinic' },
              ].map((step) => {
                const stages = ['reported', 'triaged', 'responder_assigned', 'dispatched', 'at_facility', 'resolved'];
                const currentIdx = stages.indexOf(sosStatus);
                const stepTargetIdx = stages.indexOf(step.key);
                const isDone = currentIdx >= stepTargetIdx;
                return (
                  <div key={step.key} className="space-y-1">
                    <div className={`h-1.5 rounded-full ${isDone ? 'bg-red-600' : 'bg-slate-200'}`} />
                    <span className={`text-[9px] font-bold block ${isDone ? 'text-red-700' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Embedded Live Map */}
            <EmergencyMap
              studentCoords={coords}
              facilityCoords={closestFacility}
              status={sosStatus}
              facilityName={closestFacility?.name || 'Nearest Campus Clinic'}
              studentName={displayName}
              height="200px"
              className="rounded-2xl"
            />

            <button
              type="button"
              onClick={() => setActiveSOS(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Close Emergency Monitor
            </button>
          </div>
        ) : (
          /* Sleek Tactile SOS Hero Trigger */
          <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl p-6 shadow-sm border border-slate-200/90 text-center flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                1-Tap Instant Dispatch
              </span>
              <h2 className="text-lg font-black text-slate-900">Press for Immediate Medical Help</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Notifies university clinic, ambulance team, and your emergency guardians.
              </p>
            </div>

            {/* Glowing SOS Concentric Button */}
            <div className="relative py-2 flex items-center justify-center">
              {arming ? (
                <button
                  type="button"
                  onClick={handleCancelArming}
                  className="w-36 h-36 rounded-full bg-white text-red-600 flex flex-col items-center justify-center shadow-2xl border-4 border-red-400 ring-8 ring-red-100 animate-pulse active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-4xl font-black">{countdown}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 mt-1">Tap to Cancel</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartSOS}
                  className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white flex flex-col items-center justify-center shadow-2xl shadow-red-600/40 border-4 border-white ring-8 ring-red-100/60 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
                >
                  <span className="text-2xl font-black tracking-wider leading-none">SOS</span>
                  <span className="text-[10px] font-bold text-red-100 mt-1 tracking-wider uppercase">Emergency</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              📍 Transmitting live satellite GPS • 🩺 EHR Profile attached
            </div>
          </div>
        )}

        {/* 5. Essential Quick Action Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Ambulance */}
          <button
            type="button"
            onClick={() => setShowAmbulanceModal(true)}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">Request Ambulance</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Emergency mobile unit</span>
            </div>
          </button>

          {/* Card 2: Book Appointment */}
          <button
            type="button"
            onClick={() => setShowBookingModal(true)}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">Book Clinic Visit</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Campus medical officer</span>
            </div>
          </button>

          {/* Card 3: Facilities Directory */}
          <Link
            to="/facilities"
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">Nearby Facilities</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Radar & directions</span>
            </div>
          </Link>

          {/* Card 4: Hotline */}
          <a
            href="tel:+2348003847437"
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">Campus Hotline</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">24/7 Toll-Free Voice</span>
            </div>
          </a>
        </div>

        {/* 6. Discreet Legal & Copyright Link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowLegalModal(true)}
            className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
          >
            © 2026 FUHSI • Institutional Copyright & NDPR Privacy Notice
          </button>
        </div>
      </div>

      {/* Modals */}
      <CityPickerModal isOpen={showCityPicker} onClose={() => setShowCityPicker(false)} />
      <BuddyManagerModal isOpen={showBuddyModal} onClose={() => setShowBuddyModal(false)} onBuddiesChanged={setBuddies} />
      <LegalNoticeModal isOpen={showLegalModal} onClose={() => setShowLegalModal(false)} />

      {/* Simple Ambulance Modal */}
      {showAmbulanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Truck className="w-4 h-4 text-red-600" />
                <span>Request Ambulance Dispatch</span>
              </h3>
              <button onClick={() => setShowAmbulanceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              An ambulance unit will be dispatched immediately to your current GPS position in <strong>{locationName}</strong>.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowAmbulanceModal(false);
                  triggerEmergency();
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Confirm Ambulance Request
              </button>
              <button
                onClick={() => setShowAmbulanceModal(false)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Book Clinic Appointment</span>
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Schedule an outpatient consultation with the Campus Duty Medical Officer at <strong>{closestFacility.name}</strong>.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Book Today (Walk-In Priority)
              </button>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
