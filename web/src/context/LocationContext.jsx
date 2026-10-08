import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

const LocationContext = createContext(null);

const CACHE_KEY = 'fuhsi_geo_cache';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache
const MIN_SIGNIFICANT_MOVE_KM = 0.050; // 50 meters deadband to ignore jitter/room pacing

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

// Built-in regional corridor dictionary for instant offline resolution
function getCorridorName(lat, lng) {
  if (!lat || !lng) return null;
  if (lat >= 7.50 && lat <= 7.85 && lng >= 5.10 && lng <= 5.55) return 'Ado-Ekiti & Ekiti Region';
  if (lat >= 7.95 && lat <= 8.12 && lng >= 4.80 && lng <= 5.05) return 'Ila-Orangun (Main Campus)';
  if (lat >= 7.65 && lat <= 7.85 && lng >= 4.40 && lng <= 4.65) return 'Osogbo Metropolis';
  if (lat >= 7.45 && lat <= 7.60 && lng >= 4.45 && lng <= 4.65) return 'Ile-Ife & OAU Corridor';
  if (lat >= 8.10 && lat <= 8.25 && lng >= 4.65 && lng <= 4.80) return 'Offa / Kwara South';
  if (lat >= 8.40 && lat <= 8.60 && lng >= 4.45 && lng <= 4.70) return 'Ilorin Metropolis';
  if (lat >= 6.35 && lat <= 6.70 && lng >= 3.15 && lng <= 3.65) return 'Lagos Metropolis';
  if (lat >= 7.30 && lat <= 7.55 && lng >= 3.80 && lng <= 4.05) return 'Ibadan Metropolis';
  if (lat >= 8.85 && lat <= 9.20 && lng >= 7.20 && lng <= 7.60) return 'Abuja FCT & Central';
  if (lat >= 7.15 && lat <= 7.35 && lng >= 5.10 && lng <= 5.30) return 'Akure & Ondo Region';
  if (lat >= 6.25 && lat <= 6.45 && lng >= 5.50 && lng <= 5.75) return 'Benin City & Edo';
  if (lat >= 4.70 && lat <= 4.95 && lng >= 6.85 && lng <= 7.15) return 'Port Harcourt & Rivers';
  if (lat >= 6.35 && lat <= 6.55 && lng >= 7.40 && lng <= 7.60) return 'Enugu Metropolis';
  return null;
}

export function LocationProvider({ children }) {
  // Read initial state from cache if available to prevent any page transition delays
  const cached = (() => {
    try {
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

  const [userLocation, setUserLocation] = useState(cached?.coords || null);
  const [locationName, setLocationName] = useState(cached?.locationName || 'Detecting Location...');
  const [gpsAccuracy, setGpsAccuracy] = useState(cached?.accuracy || null);
  const [locationSource, setLocationSource] = useState(cached?.source || 'locating'); // 'gps' | 'ip' | 'campus'
  const [isLocating, setIsLocating] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  const lastCoordsRef = useRef(cached?.coords || null);
  const isResolvingCityRef = useRef(false);

  // Save to storage cache helper
  const saveCache = (coords, name, accuracy, source) => {
    try {
      const payload = { coords, locationName: name, accuracy, source, timestamp: Date.now() };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {}
  };

  // Reverse geocode to real city name
  const resolveCityName = useCallback(async (lat, lng, source) => {
    const corridor = getCorridorName(lat, lng);
    if (corridor) {
      setLocationName(corridor);
      saveCache({ latitude: lat, longitude: lng }, corridor, gpsAccuracy, source);
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
        saveCache({ latitude: lat, longitude: lng }, formattedName, gpsAccuracy, source);
        return formattedName;
      }
    } catch {
      const generic = `GPS: ${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
      setLocationName(generic);
      saveCache({ latitude: lat, longitude: lng }, generic, gpsAccuracy, source);
      return generic;
    } finally {
      isResolvingCityRef.current = false;
    }
  }, [gpsAccuracy]);

  // IP fallback lookup
  const fetchIpLocation = useCallback(async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = Number(data.latitude);
          const lng = Number(data.longitude);
          const coords = { latitude: lat, longitude: lng };
          
          if (!lastCoordsRef.current || locationSource !== 'gps') {
            lastCoordsRef.current = coords;
            setUserLocation(coords);
            setLocationSource('ip');
            const city = data.city ? `${data.city}, ${data.region || data.country_name}` : `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
            setLocationName(city);
            saveCache(coords, city, 2500, 'ip');
          }
        }
      }
    } catch {
      if (!lastCoordsRef.current) {
        const fallback = { latitude: 8.0194, longitude: 4.9042 };
        lastCoordsRef.current = fallback;
        setUserLocation(fallback);
        setLocationSource('campus');
        setLocationName('FUHSI Main Campus (Ila-Orangun)');
        saveCache(fallback, 'FUHSI Main Campus (Ila-Orangun)', 50, 'campus');
      }
    }
  }, [locationSource]);

  // Main high-precision location acquirer with smart caching
  const refreshLocation = useCallback((options = {}) => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      fetchIpLocation();
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude);
        const lng = Number(pos.coords.longitude);
        const accuracy = Math.round(pos.coords.accuracy || 10);
        const coords = { latitude: lat, longitude: lng };

        lastCoordsRef.current = coords;
        setUserLocation(coords);
        setGpsAccuracy(accuracy);
        setLocationSource('gps');
        setIsLocating(false);
        resolveCityName(lat, lng, 'gps');
      },
      (err) => {
        console.warn('LocationContext GPS acquisition notice:', err.message);
        setIsLocating(false);
        if (!lastCoordsRef.current) {
          fetchIpLocation();
        }
      },
      { 
        enableHighAccuracy: options.highAccuracy ?? true, 
        timeout: 8000, 
        maximumAge: options.bypassCache ? 0 : 30000 
      }
    );
  }, [fetchIpLocation, resolveCityName]);

  // Run initial acquisition once on app start
  useEffect(() => {
    if (!cached) {
      refreshLocation();
    }

    // Passive background listener with 50-meter deadband filter to prevent jitter
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude);
          const lng = Number(pos.coords.longitude);
          const accuracy = Math.round(pos.coords.accuracy || 10);

          // Apply 50-meter deadband filter
          if (lastCoordsRef.current) {
            const distKm = getGeodesicDistanceKm(
              lastCoordsRef.current.latitude,
              lastCoordsRef.current.longitude,
              lat,
              lng
            );
            if (distKm < MIN_SIGNIFICANT_MOVE_KM) {
              return; // Ignore small room/hand movements
            }
          }

          const coords = { latitude: lat, longitude: lng };
          lastCoordsRef.current = coords;
          setUserLocation(coords);
          setGpsAccuracy(accuracy);
          setLocationSource('gps');
          resolveCityName(lat, lng, 'gps');
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch facilities once globally
  useEffect(() => {
    let isMounted = true;
    async function loadGlobalFacilities() {
      try {
        setFacilitiesLoading(true);
        const res = await api.getFacilities();
        if (isMounted && res && Array.isArray(res.facilities) && res.facilities.length > 0) {
          setFacilities(res.facilities);
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
