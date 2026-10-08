import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, REGIONAL_HUBS } from '../context/LocationContext';
import { 
  Building2, 
  Phone, 
  MapPin, 
  Clock, 
  Navigation, 
  Loader2, 
  Crosshair, 
  Compass, 
  ShieldCheck, 
  Activity, 
  Search, 
  Sparkles, 
  Globe
} from 'lucide-react';
import EmergencyMap from '../components/EmergencyMap';

function getGeodesicDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export default function FacilitiesPage() {
  const { 
    userLocation, 
    locationName, 
    gpsAccuracy, 
    locationSource, 
    isLocating, 
    refreshLocation,
    setManualCity,
    facilities,
    setFacilities,
    facilitiesLoading 
  } = useLocation();

  const [filterType, setFilterType] = useState('all'); // all, nearby, hospital
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveringNearby, setDiscoveringNearby] = useState(false);

  // 1. Compute Live Geodesic Distance and Proximity Ranking instantly from Global Location
  const rankedFacilities = useMemo(() => {
    if (!facilities || facilities.length === 0) return [];
    if (!userLocation) return facilities;

    return facilities.map((f) => {
      const dist = getGeodesicDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        Number(f.latitude),
        Number(f.longitude)
      );
      return { ...f, distanceKm: dist };
    }).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }, [facilities, userLocation]);

  // 2. OpenStreetMap Overpass Live Local Area Discovery
  const handleDiscoverOverpass = useCallback(async () => {
    if (!userLocation) return;
    try {
      setDiscoveringNearby(true);
      const { latitude: lat, longitude: lng } = userLocation;
      const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:25000,${lat},${lng});node["amenity"="clinic"](around:20000,${lat},${lng}););out 15;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Overpass network error');
      const data = await res.json();
      
      if (data.elements && data.elements.length > 0) {
        const discovered = data.elements
          .filter((el) => el.tags && (el.tags.name || el.tags['name:en']))
          .map((el) => {
            const name = el.tags.name || el.tags['name:en'];
            const dist = getGeodesicDistanceKm(lat, lng, el.lat, el.lon);
            return {
              id: `osm-${el.id}`,
              name,
              facility_type: el.tags.amenity === 'hospital' ? 'General Hospital / Emergency' : 'Community Clinic',
              latitude: el.lat,
              longitude: el.lon,
              address: el.tags['addr:street'] ? `${el.tags['addr:street']}, ${el.tags['addr:city'] || ''}` : 'Local Medical Center',
              phone: el.tags.phone || el.tags['contact:phone'] || null,
              distanceKm: dist,
              is_active: true,
              is_osm_discovered: true,
            };
          });

        setFacilities((prev) => {
          const existingNames = new Set(prev.map((f) => f.name.toLowerCase()));
          const uniqueDiscovered = discovered.filter((d) => !existingNames.has(d.name.toLowerCase()));
          return [...prev, ...uniqueDiscovered];
        });
      }
    } catch (err) {
      console.warn('Overpass lookup note:', err.message);
    } finally {
      setDiscoveringNearby(false);
    }
  }, [userLocation, setFacilities]);

  // 3. Filter facilities based on search, category and proximity
  const filteredFacilities = useMemo(() => {
    return rankedFacilities.filter((fac) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = fac.name?.toLowerCase().includes(q);
        const matchType = fac.facility_type?.toLowerCase().includes(q);
        const matchAddr = fac.address?.toLowerCase().includes(q);
        if (!matchName && !matchType && !matchAddr) return false;
      }

      // Category filter
      if (filterType === 'nearby') {
        const hasClose = rankedFacilities.some(f => (f.distanceKm || 0) <= 30);
        if (hasClose) {
          return (fac.distanceKm || 0) <= 30;
        }
        return (fac.distanceKm || 0) <= 100;
      }
      if (filterType === 'hospital') {
        const type = (fac.facility_type || '').toLowerCase();
        return type.includes('hospital') || type.includes('trauma') || type.includes('referral') || type.includes('teaching');
      }
      return true;
    });
  }, [rankedFacilities, searchQuery, filterType]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* Header Section */}
      <div className="bg-[#0D2040] text-white pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-emerald-300 text-[11px] font-semibold mb-2 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>Live Regional Healthcare Radar</span>
          </div>
          <h1 className="text-xl font-bold text-white">Health & Medical Facilities</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-lg mx-auto">
            Real-time proximity directory for designated FUHSI campus clinics, teaching hospitals, and emergency trauma referral centers across Nigeria.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-4">
        {/* Live Location Card with Instant City Override */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                locationSource === 'gps' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {locationSource === 'gps' ? (
                  <Crosshair className="w-5 h-5 text-emerald-600 animate-pulse" />
                ) : (
                  <Globe className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold text-slate-900">{locationName}</span>
                  {locationSource === 'gps' && gpsAccuracy && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] rounded font-mono font-bold">
                      GPS ±{gpsAccuracy}m
                    </span>
                  )}
                  {locationSource === 'manual' && (
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] rounded font-bold">
                      Active Hub
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  {userLocation ? `${userLocation.latitude.toFixed(4)}° N, ${userLocation.longitude.toFixed(4)}° E` : 'Pinpointing location...'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => refreshLocation({ highAccuracy: true, bypassCache: true })}
                disabled={isLocating}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Compass className="w-3.5 h-3.5 text-blue-600" />}
                <span>{isLocating ? 'Locating...' : 'Auto-Detect GPS'}</span>
              </button>
              <button
                type="button"
                onClick={handleDiscoverOverpass}
                disabled={discoveringNearby}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-emerald-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Query OpenStreetMap for hospitals in your immediate surrounding area"
              >
                {discoveringNearby ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{discoveringNearby ? 'Scanning...' : 'Scan Local Area'}</span>
              </button>
            </div>
          </div>

          {/* 1-Tap Quick Regional Hub Selector */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Active City / Campus Hub:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REGIONAL_HUBS.map((hub) => {
                const isSelected = locationName.toLowerCase().includes(hub.id) || locationName.toLowerCase().includes(hub.name.toLowerCase().split(' ')[0]);
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => setManualCity(hub.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>📍 {hub.name.split(' ')[0]}</span>
                    {isSelected && <ShieldCheck className="w-3 h-3 text-white ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive Multi-Facility Map Banner */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Interactive Emergency Radar
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {rankedFacilities.length} Stations Active
            </span>
          </div>
          <EmergencyMap
            studentCoords={userLocation || { latitude: 8.0194, longitude: 4.9042 }}
            facilities={filteredFacilities.length > 0 ? filteredFacilities : rankedFacilities}
            studentName={locationName}
            height="270px"
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by facility name, city (e.g. Akure, Ado-Ekiti, Ila, Osogbo, Ibadan)..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({rankedFacilities.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('nearby')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'nearby'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nearest Stations
            </button>
            <button
              type="button"
              onClick={() => setFilterType('hospital')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'hospital'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trauma / Teaching
            </button>
          </div>
        </div>

        {/* Facilities Grid */}
        {facilitiesLoading && facilities.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-xs text-slate-500 font-medium">Connecting to emergency facilities directory...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Facilities Match Your Search</p>
            <p className="text-xs text-slate-500 mt-1">Try tapping "Scan Local Area" above to search OpenStreetMap for hospitals in your immediate city.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFacilities.map((fac, idx) => {
              const isNearest = idx === 0 && !searchQuery && filterType === 'all';
              return (
                <div
                  key={fac.id || fac.name}
                  className={`bg-white rounded-2xl p-5 shadow-sm border transition-all flex flex-col justify-between ${
                    isNearest 
                       ? 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-emerald-500/5' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isNearest ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {isNearest && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Closest Station</span>
                          </span>
                        )}
                        {fac.distanceKm !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            fac.distanceKm < 10 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : fac.distanceKm < 50
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            📍 {fac.distanceKm < 1 ? `${Math.round(fac.distanceKm * 1000)}m` : `${fac.distanceKm} km`}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">{fac.name}</h3>
                    <p className="text-xs text-blue-600 font-semibold mb-3">
                      {fac.facility_type || 'Campus & Regional Medical Centre'}
                    </p>

                    <div className="space-y-2 text-xs text-slate-600">
                      {fac.address && (
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{fac.address}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>24/7 Emergency & Inpatient Services</span>
                      </div>
                      {fac.is_osm_discovered && (
                        <div className="flex items-center space-x-1.5 text-[10px] text-emerald-700 font-medium bg-emerald-50/70 px-2 py-1 rounded-lg">
                          <Activity className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Discovered in Your Current Local Area</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                    {fac.phone ? (
                      <a
                        href={`tel:${fac.phone}`}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call {fac.phone}</span>
                      </a>
                    ) : (
                      <div className="w-full py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-medium text-center border border-slate-100">
                        Official Emergency Dispatch Line
                      </div>
                    )}

                    {fac.latitude && fac.longitude && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors border border-slate-200 shadow-sm"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        <span>Navigate Here (Turn-by-Turn)</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
