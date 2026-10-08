import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
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
  Sparkles
} from 'lucide-react';
import EmergencyMap from '../components/EmergencyMap';

function getGeodesicDistanceKm(lat1, lon1, lat2, lon2) {
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

function detectRegionName(lat, lng) {
  if (!lat || !lng) return 'FUHSI Network';
  // Ado-Ekiti corridor (~ 7.55 to 7.75 N, 5.15 to 5.40 E)
  if (lat >= 7.50 && lat <= 7.75 && lng >= 5.10 && lng <= 5.45) {
    return 'Ado-Ekiti & Ekiti Central';
  }
  // Ila-Orangun corridor (~ 7.95 to 8.10 N, 4.80 to 5.00 E)
  if (lat >= 7.95 && lat <= 8.12 && lng >= 4.80 && lng <= 5.00) {
    return 'Ila-Orangun (Main Campus)';
  }
  // Osogbo corridor (~ 7.70 to 7.85 N, 4.45 to 4.65 E)
  if (lat >= 7.70 && lat <= 7.85 && lng >= 4.45 && lng <= 4.65) {
    return 'Osogbo Metropolis';
  }
  // Offa corridor (~ 8.10 to 8.20 N, 4.65 to 4.80 E)
  if (lat >= 8.10 && lat <= 8.25 && lng >= 4.65 && lng <= 4.80) {
    return 'Offa / Kwara South';
  }
  // Akure corridor (~ 7.20 to 7.35 N, 5.10 to 5.30 E)
  if (lat >= 7.20 && lat <= 7.35 && lng >= 5.10 && lng <= 5.30) {
    return 'Akure / Ondo Region';
  }
  return `GPS: ${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
}

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, nearby, hospital
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveringNearby, setDiscoveringNearby] = useState(false);

  // 1. Acquire Live GPS Position
  const acquireGps = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: Number(pos.coords.latitude),
          longitude: Number(pos.coords.longitude),
        };
        setUserLocation(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy || 10));
      },
      (err) => {
        console.warn('Live GPS acquisition notice:', err.message);
        // Fallback default coordinates
        setUserLocation({ latitude: 8.0194, longitude: 4.9042 });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    acquireGps();

    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            latitude: Number(pos.coords.latitude),
            longitude: Number(pos.coords.longitude),
          });
          setGpsAccuracy(Math.round(pos.coords.accuracy || 10));
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [acquireGps]);

  // 2. Fetch Facilities from Database (with user coords for live distance ranking)
  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      try {
        setLoading(true);
        const res = await api.getFacilities(userLocation);
        if (isMounted && res && res.facilities) {
          let list = res.facilities;
          
          // Ensure distance calculation is accurate from user location
          if (userLocation) {
            list = list.map((f) => {
              const dist = getGeodesicDistanceKm(
                userLocation.latitude,
                userLocation.longitude,
                Number(f.latitude),
                Number(f.longitude)
              );
              return { ...f, distanceKm: dist };
            }).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
          }

          setFacilities(list);
        }
      } catch (err) {
        console.warn('Failed to load facilities:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFacilities();
    return () => { isMounted = false; };
  }, [userLocation]);

  // 3. Optional OpenStreetMap Overpass live local discovery for any location in Nigeria
  const handleDiscoverOverpass = async () => {
    if (!userLocation) return;
    try {
      setDiscoveringNearby(true);
      const { latitude: lat, longitude: lng } = userLocation;
      const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:20000,${lat},${lng});node["amenity"="clinic"](around:15000,${lat},${lng}););out 10;`;
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

        // Merge without duplicating existing names
        setFacilities((prev) => {
          const existingNames = new Set(prev.map((f) => f.name.toLowerCase()));
          const uniqueDiscovered = discovered.filter((d) => !existingNames.has(d.name.toLowerCase()));
          const combined = [...prev, ...uniqueDiscovered];
          return combined.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        });
      }
    } catch (err) {
      console.warn('Overpass lookup note:', err.message);
    } finally {
      setDiscoveringNearby(false);
    }
  };

  // Filter facilities
  const filteredFacilities = facilities.filter((fac) => {
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
      return (fac.distanceKm || 0) <= 25;
    }
    if (filterType === 'hospital') {
      const type = (fac.facility_type || '').toLowerCase();
      return type.includes('hospital') || type.includes('trauma') || type.includes('referral');
    }
    return true;
  });

  const activeRegion = userLocation ? detectRegionName(userLocation.latitude, userLocation.longitude) : 'Campus Network';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* Header */}
      <div className="bg-[#0D2040] text-white pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-emerald-300 text-[11px] font-semibold mb-2 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>Live Location-Aware Network</span>
          </div>
          <h1 className="text-xl font-bold text-white">Health & Medical Facilities</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-lg mx-auto">
            Real-time proximity directory for designated FUHSI campus clinics, state teaching hospitals, and emergency trauma referral centers.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-5">
        {/* Live GPS & Location Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Crosshair className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">{activeRegion}</span>
                {gpsAccuracy && (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-mono font-medium">
                    ±{gpsAccuracy}m accuracy
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {userLocation ? `${userLocation.latitude.toFixed(4)}° N, ${userLocation.longitude.toFixed(4)}° E` : 'Locating GPS position...'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={acquireGps}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200 active:scale-95"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Refresh GPS</span>
            </button>
            <button
              type="button"
              onClick={handleDiscoverOverpass}
              disabled={discoveringNearby}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-emerald-200 active:scale-95 disabled:opacity-50"
              title="Query OpenStreetMap for hospitals in your immediate surrounding area"
            >
              {discoveringNearby ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>{discoveringNearby ? 'Searching...' : 'Scan Local Area'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Multi-Facility Map Banner */}
        {!loading && facilities.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Interactive Live Emergency Radar
                </h2>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {facilities.length} Health Stations Mapped
              </span>
            </div>
            <EmergencyMap
              studentCoords={userLocation || { latitude: 8.0194, longitude: 4.9042 }}
              facilities={filteredFacilities.length > 0 ? filteredFacilities : facilities}
              studentName="Your Current Location"
              height="260px"
            />
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by facility name, city, or specialty..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({facilities.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('nearby')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'nearby'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Closest &lt;25km
            </button>
            <button
              type="button"
              onClick={() => setFilterType('hospital')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-xs text-slate-500 font-medium">Calculating proximity to regional health stations...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Facilities Match Your Filter</p>
            <p className="text-xs text-slate-500 mt-1">Try switching to "All" or tapping "Scan Local Area" to discover neighborhood hospitals.</p>
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
                            <span>Nearest</span>
                          </span>
                        )}
                        {fac.distanceKm !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            fac.distanceKm < 5 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : fac.distanceKm < 25
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
                      {fac.facility_type || 'Campus Medical Facility'}
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
