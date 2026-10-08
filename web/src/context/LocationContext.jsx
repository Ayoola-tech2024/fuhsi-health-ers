import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

const LocationContext = createContext(null);

const CACHE_KEY = 'fuhsi_geo_cache_v3';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache
const MIN_SIGNIFICANT_MOVE_KM = 0.050; // 50 meters deadband

export const REGIONAL_HUBS = [
  { id: 'ila', name: 'Ila-Orangun (Main Campus)', latitude: 8.0194, longitude: 4.9042, state: 'Osun State' },
  { id: 'ado', name: 'Ado-Ekiti (Ekiti Central)', latitude: 7.6255, longitude: 5.2155, state: 'Ekiti State' },
  { id: 'akure', name: 'Akure (Ondo State)', latitude: 7.2520, longitude: 5.1980, state: 'Ondo State' },
  { id: 'osogbo', name: 'Osogbo Metropolis', latitude: 7.7827, longitude: 4.5418, state: 'Osun State' },
  { id: 'ife', name: 'Ile-Ife (OAUTHC)', latitude: 7.5140, longitude: 4.5290, state: 'Osun State' },
  { id: 'ibadan', name: 'Ibadan (UCH Premier)', latitude: 7.4022, longitude: 3.9064, state: 'Oyo State' },
  { id: 'lagos', name: 'Lagos Metropolis', latitude: 6.5962, longitude: 3.3458, state: 'Lagos State' },
  { id: 'abuja', name: 'Abuja FCT', latitude: 9.0430, longitude: 7.4645, state: 'FCT' },
];

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
  return Number((R * c).toFixed(3));
}

// Regional corridor dictionary
function getCorridorName(lat, lng) {
  if (!lat || !lng) return null;
  // Akure & Ondo Region (~ 7.10 to 7.42 N, 5.05 to 5.35 E)
  if (lat >= 7.10 && lat <= 7.42 && lng >= 5.05 && lng <= 5.35) return 'Akure, Ondo State';
  // Ado-Ekiti & Ekiti Central (~ 7.50 to 7.85 N, 5.10 to 5.55 E)
  if (lat >= 7.50 && lat <= 7.85 && lng >= 5.10 && lng <= 5.55) return 'Ado-Ekiti, Ekiti State';
  // Ila-Orangun (Main Campus) (~ 7.95 to 8.12 N, 4.80 to 5.05 E)
  if (lat >= 7.95 && lat <= 8.12 && lng >= 4.80 && lng <= 5.05) return 'Ila-Orangun (Main Campus)';
  // Osogbo Metropolis (~ 7.65 to 7.85 N, 4.40 to 4.65 E)
  if (lat >= 7.65 && lat <= 7.85 && lng >= 4.40 && lng <= 4.65) return 'Osogbo Metropolis';
  // Ile-Ife & OAU Corridor (~ 7.45 to 7.60 N, 4.45 to 4.65 E)
  if (lat >= 7.45 && lat <= 7.60 && lng >= 4.45 && lng <= 4.65) return 'Ile-Ife & OAU Corridor';
  // Offa & Kwara South (~ 8.10 to 8.25 N, 4.65 to 4.80 E)
  if (lat >= 8.10 && lat <= 8.25 && lng >= 4.65 && lng <= 4.80) return 'Offa / Kwara South';
  // Ilorin Metropolis (~ 8.40 to 8.60 N, 4.45 to 4.70 E)
  if (lat >= 8.40 && lat <= 8.60 && lng >= 4.45 && lng <= 4.70) return 'Ilorin Metropolis';
  // Lagos Metropolis (~ 6.35 to 6.70 N, 3.15 to 3.65 E)
  if (lat >= 6.35 && lat <= 6.70 && lng >= 3.15 && lng <= 3.65) return 'Lagos Metropolis';
  // Ibadan Metropolis (~ 7.30 to 7.55 N, 3.80 to 4.05 E)
  if (lat >= 7.30 && lat <= 7.55 && lng >= 3.80 && lng <= 4.05) return 'Ibadan Metropolis';
  // Abuja FCT & Central (~ 8.85 to 9.20 N, 7.20 to 7.60 E)
  if (lat >= 8.85 && lat <= 9.20 && lng >= 7.20 && lng <= 7.60) return 'Abuja FCT';
  // Benin City & Edo (~ 6.25 to 6.45 N, 5.50 to 5.75 E)
  if (lat >= 6.25 && lat <= 6.45 && lng >= 5.50 && lng <= 5.75) return 'Benin City, Edo';
  // Port Harcourt & Rivers (~ 4.70 to 4.95 N, 6.85 to 7.15 E)
  if (lat >= 4.70 && lat <= 4.95 && lng >= 6.85 && lng <= 7.15) return 'Port Harcourt, Rivers';
  return null;
}

export function LocationProvider({ children }) {
  // Purge any outdated v1 or v2 caches
  const cached = (() => {
    try {
      sessionStorage.removeItem('fuhsi_geo_cache');
      sessionStorage.removeItem('fuhsi_geo_cache_v2');
      localStorage.removeItem('fuhsi_geo_cache');
      localStorage.removeItem('fuhsi_geo_cache_v2');

      const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - (parsed.timestamp || 0) < CACHE_TTL_MS) {
          return parsed;
        }
      }
    } catch {}
    return null;
  })();

  const [userLocation, setUserLocation] = useState(cached?.coords || { latitude: 8.0194, longitude: 4.9042 });
  const [locationName, setLocationName] = useState(cached?.locationName || 'Ila-Orangun (Main Campus)');
  const [gpsAccuracy, setGpsAccuracy] = useState(cached?.accuracy || null);
  const [locationSource, setLocationSource] = useState(cached?.source || 'campus_fallback'); // 'gps' | 'manual' | 'campus_fallback' | 'denied'
  const [isLocating, setIsLocating] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  const lastCoordsRef = useRef(userLocation);
  const isResolvingCityRef = useRef(false);

  // Save clean cache helper
  const saveCache = (coords, name, accuracy, source) => {
    try {
      const payload = { coords, locationName: name, accuracy, source, timestamp: Date.now() };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {}
  };

  // Explicit manual city override
  const setManualCity = useCallback((hubOrCityId) => {
    const hub = typeof hubOrCityId === 'string' 
      ? REGIONAL_HUBS.find(h => h.id === hubOrCityId || h.name.toLowerCase().includes(hubOrCityId.toLowerCase()))
      : hubOrCityId;

    if (hub) {
      const coords = { latitude: hub.latitude, longitude: hub.longitude };
      lastCoordsRef.current = coords;
      setUserLocation(coords);
      setLocationName(hub.name);
      setGpsAccuracy(10);
      setLocationSource('manual');
      saveCache(coords, hub.name, 10, 'manual');
    }
  }, []);

  // Reverse geocode to exact human city/state name
  const resolveCityName = useCallback(async (lat, lng, accuracy) => {
    const corridor = getCorridorName(lat, lng);
    if (corridor) {
      setLocationName(corridor);
      saveCache({ latitude: lat, longitude: lng }, corridor, accuracy, 'gps');
      return corridor;
    }

    if (isResolvingCityRef.current) return null;
    isResolvingCityRef.current = true;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: { 'Accept-Language': 'en' },
      });
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.county || data.address?.state;
        const state = data.address?.state;
        let formattedName = `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
        if (city && state) formattedName = `${city}, ${state}`;
        else if (city) formattedName = city;

        setLocationName(formattedName);
        saveCache({ latitude: lat, longitude: lng }, formattedName, accuracy, 'gps');
        return formattedName;
      }
    } catch {
      const generic = `GPS: ${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
      setLocationName(generic);
      saveCache({ latitude: lat, longitude: lng }, generic, accuracy, 'gps');
      return generic;
    } finally {
      isResolvingCityRef.current = false;
    }
  }, []);

  // Main Hardware GPS Acquirer with Accuracy Gate
  const refreshLocation = useCallback((options = {}) => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setLocationSource('unsupported');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude);
        const lng = Number(pos.coords.longitude);
        const accuracy = Math.round(pos.coords.accuracy || 10);

        // Accuracy Gate: If accuracy is worse than 3,000 meters (like 50km Damaturu/Yobe ISP tower approximations on PC), ignore the fake ISP location!
        if (accuracy > 3000) {
          console.warn(`Cellular tower approximation detected (±${accuracy}m). Preserving current regional hub.`);
          setIsLocating(false);
          // Keep current accurate position or default to FUHSI campus
          if (!lastCoordsRef.current) {
            setManualCity('ila');
          }
          return;
        }

        const coords = { latitude: lat, longitude: lng };
        lastCoordsRef.current = coords;
        setUserLocation(coords);
        setGpsAccuracy(accuracy);
        setLocationSource('gps');
        setIsLocating(false);
        resolveCityName(lat, lng, accuracy);
      },
      (err) => {
        console.warn('Hardware GPS notice:', err.code, err.message);
        setIsLocating(false);
        if (err.code === 1) {
          setLocationSource('denied');
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: options.bypassCache ? 0 : 15000 
      }
    );
  }, [resolveCityName, setManualCity]);

  // Run initial acquisition on start
  useEffect(() => {
    refreshLocation({ bypassCache: !cached });

    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude);
          const lng = Number(pos.coords.longitude);
          const accuracy = Math.round(pos.coords.accuracy || 10);

          // Ignore inaccurate ISP proxy coordinates > 3000m
          if (accuracy > 3000) return;

          // Apply 50-meter movement deadband
          if (lastCoordsRef.current && locationSource === 'gps') {
            const distKm = getGeodesicDistanceKm(
              lastCoordsRef.current.latitude,
              lastCoordsRef.current.longitude,
              lat,
              lng
            );
            if (distKm < MIN_SIGNIFICANT_MOVE_KM) {
              return;
            }
          }

          const coords = { latitude: lat, longitude: lng };
          lastCoordsRef.current = coords;
          setUserLocation(coords);
          setGpsAccuracy(accuracy);
          setLocationSource('gps');
          resolveCityName(lat, lng, accuracy);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 20000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch facilities once globally from database
  useEffect(() => {
    let isMounted = true;
    async function loadGlobalFacilities() {
      try {
        setFacilitiesLoading(true);
        const res = await api.getFacilities();
        if (isMounted && res && Array.isArray(res.facilities) && res.facilities.length > 0) {
          setFacilities(res.facilities);
        } else if (isMounted) {
          // Nationwide baseline fallback
          setFacilities([
            // Ado-Ekiti (Ekiti State)
            { id: 'f-eksuth', name: 'Ekiti State University Teaching Hospital (EKSUTH)', facility_type: 'State Teaching Hospital / Trauma Centre', latitude: 7.6401, longitude: 5.2345, address: 'Teaching Hospital Road, Ado-Ekiti', phone: '+234 803 400 1122', is_active: true },
            { id: 'f-fthi', name: 'Federal Teaching Hospital (FTHI) - Ado Referral Centre', facility_type: 'Federal Tertiary Referral', latitude: 7.6180, longitude: 5.2210, address: 'Adebayo Area, Ado-Ekiti', phone: '+234 803 555 8899', is_active: true },
            { id: 'f-ssh-ado', name: 'State Specialist Hospital Ado-Ekiti', facility_type: 'Emergency Specialist Hospital', latitude: 7.6255, longitude: 5.2155, address: 'Hospital Road, Ado-Ekiti', phone: '+234 802 333 4455', is_active: true },
            { id: 'f-abuad', name: 'Afe Babalola University Multi-System Hospital (ABUAD)', facility_type: 'Multi-System Tertiary Care', latitude: 7.5992, longitude: 5.3021, address: 'ABUAD Campus, Ado-Ekiti', phone: '+234 808 777 6655', is_active: true },

            // Akure & Ondo State
            { id: 'f-akure-1', name: 'State Specialist Hospital Akure', facility_type: 'State Specialist & Emergency Trauma Centre', latitude: 7.2520, longitude: 5.1980, address: 'Hospital Road, Akure, Ondo State', phone: '+234 802 333 4455', is_active: true },
            { id: 'f-akure-2', name: 'Mother and Child Hospital Akure', facility_type: 'Specialist Emergency Hospital', latitude: 7.2560, longitude: 5.2010, address: 'Oda Road, Akure, Ondo State', phone: '+234 803 777 8899', is_active: true },
            { id: 'f-akure-3', name: 'University of Medical Sciences Teaching Hospital (UNIMEDTH)', facility_type: 'Specialist Medical Teaching Hospital', latitude: 7.0910, longitude: 4.8320, address: 'Laje Road, Ondo Town', phone: '+234 803 444 9988', is_active: true },
            { id: 'f-akure-4', name: 'Federal Medical Centre Owo', facility_type: 'Federal Tertiary Referral Hospital', latitude: 7.1950, longitude: 5.5840, address: 'Owo-Akure Highway, Owo', phone: '+234 803 555 6677', is_active: true },
            
            // FUHSI & Osun State
            { id: 'f-1', name: 'FUHSI Health & Medical Centre', facility_type: 'Main Clinic / Emergency Ward', latitude: 8.0194, longitude: 4.9042, address: 'Main Campus Gate 1, Ila-Orangun', phone: '+234 800 384 7437', is_active: true },
            { id: 'f-2', name: 'Campus Dispensary Unit 1', facility_type: 'Dispensary / Outpatient Triage', latitude: 8.0182, longitude: 4.9031, address: 'Hostel Complex B, Ila-Orangun', phone: '+234 802 111 2233', is_active: true },
            { id: 'f-3', name: 'Ila-Orangun General Hospital', facility_type: 'Tertiary Trauma Referral', latitude: 8.0150, longitude: 4.8980, address: 'Ila-Orangun Town Bypass', phone: '+234 803 999 8877', is_active: true },
            { id: 'f-8', name: 'UNIOSUN Teaching Hospital (UTH)', facility_type: 'State University Teaching Hospital', latitude: 7.7827, longitude: 4.5418, address: 'Idi-Seke, Osogbo', phone: '+234 803 111 9900', is_active: true },
            { id: 'f-9', name: 'State Hospital Asubiaro, Osogbo', facility_type: 'General Hospital / Trauma Ward', latitude: 7.7690, longitude: 4.5620, address: 'Asubiaro, Osogbo', phone: '+234 805 222 3344', is_active: true },
            { id: 'f-oauth', name: 'Obafemi Awolowo University Teaching Hospitals (OAUTHC)', facility_type: 'Federal Teaching Hospital / Trauma Hub', latitude: 7.5140, longitude: 4.5290, address: 'OAUTHC Complex, Ile-Ife', phone: '+234 803 333 7711', is_active: true },

            // Lagos & Oyo
            { id: 'f-10', name: 'Lagos University Teaching Hospital (LUTH)', facility_type: 'Federal Teaching Hospital / Level 1 Trauma', latitude: 6.5201, longitude: 3.3578, address: 'Ishaga Road, Idi-Araba, Surulere, Lagos', phone: '+234 803 200 4455', is_active: true },
            { id: 'f-11', name: 'Lagos State University Teaching Hospital (LASUTH)', facility_type: 'State Teaching Hospital / Emergency Centre', latitude: 6.5962, longitude: 3.3458, address: '1-5 Oba Akinjobi Way, Ikeja, Lagos', phone: '+234 802 444 3322', is_active: true },
            { id: 'f-12', name: 'University College Hospital (UCH) Ibadan', facility_type: 'Premier Tertiary Teaching Hospital & Trauma', latitude: 7.4022, longitude: 3.9064, address: 'Queen Elizabeth II Road, Mokola, Ibadan', phone: '+234 803 555 1100', is_active: true },

            // Abuja & Regional
            { id: 'f-13', name: 'National Hospital Abuja', facility_type: 'Apex Federal Trauma & Referral Hospital', latitude: 9.0430, longitude: 7.4645, address: 'Plot 132 Central Business District, Abuja', phone: '+234 803 900 1100', is_active: true },
            { id: 'f-14', name: 'University of Ilorin Teaching Hospital (UITH)', facility_type: 'Federal University Teaching Hospital', latitude: 8.4833, longitude: 4.5500, address: 'UITH Permanent Site, Ilorin', phone: '+234 803 777 4411', is_active: true },
            { id: 'f-15', name: 'University of Port Harcourt Teaching Hospital (UPTH)', facility_type: 'Federal Tertiary Referral & Trauma', latitude: 4.9020, longitude: 6.9240, address: 'East-West Road, Port Harcourt', phone: '+234 803 666 2200', is_active: true }
          ]);
        }
      } catch (err) {
        console.warn('Global facilities load notice:', err.message);
      } finally {
        if (isMounted) setFacilitiesLoading(false);
      }
    }
    loadGlobalFacilities();
    return () => { isMounted = false; };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        locationName,
        gpsAccuracy,
        locationSource,
        isLocating,
        refreshLocation,
        setManualCity,
        facilities,
        setFacilities,
        facilitiesLoading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
