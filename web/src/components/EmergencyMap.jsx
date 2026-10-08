import React, { useEffect, useRef, useState, useId } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Compass, 
  ExternalLink, 
  Layers,
  Crosshair
} from 'lucide-react';

// Fix Leaflet's default icon path issues if needed
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TILE_PRESETS = {
  humanitarian: {
    name: 'Emergency (HOT)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Tiles style by HOT',
    maxZoom: 19,
    subdomains: 'abc',
  },
  standard: {
    name: 'Standard OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
  esriStreet: {
    name: 'ESRI Street',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri & OpenStreetMap',
    maxZoom: 18,
    subdomains: '',
  }
};

export default function EmergencyMap({
  studentCoords,
  facilityCoords,
  facilities = [],
  responderCoords,
  status = 'reported',
  facilityName = 'FUHSI Health & Medical Centre',
  studentName = 'Live GPS Location',
  height = '280px',
  className = '',
  showDirectionsButton = true,
  interactive = true,
}) {
  const containerId = useId().replace(/:/g, '-');
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const studentMarkerRef = useRef(null);
  const facilityMarkersLayerRef = useRef(null);
  const routeLineRef = useRef(null);
  const hasFittedBoundsRef = useRef(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null);
  const [currentStyle, setCurrentStyle] = useState('humanitarian');

  // Student coordinates with fallback to Ila-Orangun if geolocation is pending
  const sLat = studentCoords?.latitude ? Number(studentCoords.latitude) : 8.0194;
  const sLng = studentCoords?.longitude ? Number(studentCoords.longitude) : 4.9042;
  const hasLiveStudentGps = Boolean(studentCoords?.latitude && studentCoords?.longitude);

  // Compile list of facilities to display
  const facilityList = facilities.length > 0 
    ? facilities 
    : facilityCoords 
      ? [{ 
          name: facilityName, 
          latitude: Number(facilityCoords.latitude), 
          longitude: Number(facilityCoords.longitude),
          facility_type: 'Campus Health Station'
        }]
      : [{ 
          name: 'FUHSI Health & Medical Centre', 
          latitude: 8.0194, 
          longitude: 4.9042,
          facility_type: 'Main Clinic / Emergency Ward'
        }];

  // Nearest facility for route line and distance pill
  const primaryFac = facilityList[0] || { latitude: 8.0194, longitude: 4.9042, name: facilityName };
  const fLat = Number(primaryFac.latitude) || 8.0194;
  const fLng = Number(primaryFac.longitude) || 4.9042;

  // Real-time geodesic distance calculation in meters or kilometers
  useEffect(() => {
    if (!hasLiveStudentGps) {
      setDistanceKm(null);
      return;
    }
    const R = 6371; // km
    const dLat = ((fLat - sLat) * Math.PI) / 180;
    const dLon = ((fLng - sLng) * Math.PI) / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((sLat * Math.PI) / 180) * Math.cos((fLat * Math.PI) / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    setDistanceKm(d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`);
  }, [sLat, sLng, fLat, fLng, hasLiveStudentGps]);

  // Handle Layer switching (Emergency HOT -> Standard OSM -> ESRI)
  const switchMapStyle = () => {
    const styles = ['humanitarian', 'standard', 'esriStreet'];
    const nextIdx = (styles.indexOf(currentStyle) + 1) % styles.length;
    const nextStyle = styles[nextIdx];
    setCurrentStyle(nextStyle);

    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const preset = TILE_PRESETS[nextStyle];
      const newLayer = L.tileLayer(preset.url, {
        maxZoom: preset.maxZoom,
        subdomains: preset.subdomains || 'abc',
        attribution: preset.attribution,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    }
  };

  // 1. Initialize Map Instance Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double init

    const map = L.map(mapContainerRef.current, {
      center: [sLat, sLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: false, // Prevents accidental zoom while scrolling page
      doubleClickZoom: true,
      boxZoom: true,
      tap: true,
    });

    // 100% Free Open-Source Tiles
    const preset = TILE_PRESETS[currentStyle];
    const tiles = L.tileLayer(preset.url, {
      maxZoom: preset.maxZoom,
      subdomains: preset.subdomains || 'abc',
    }).addTo(map);
    tileLayerRef.current = tiles;

    // Clean Attribution in bottom corner
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© OpenStreetMap & HOT contributors')
      .addTo(map);

    // Zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Facility markers layer
    facilityMarkersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        studentMarkerRef.current = null;
        facilityMarkersLayerRef.current = null;
        routeLineRef.current = null;
        hasFittedBoundsRef.current = false;
      }
    };
  }, []);

  // 2. Update Student Marker & Route smoothly without destroying map or resetting user pan
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const studentIcon = L.divIcon({
      className: 'custom-student-pin',
      html: `
        <div class="relative flex items-center justify-center pointer-events-auto">
          <div class="absolute w-8 h-8 rounded-full bg-red-600/30 animate-ping"></div>
          <div class="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
            <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!studentMarkerRef.current) {
      const marker = L.marker([sLat, sLng], { icon: studentIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; font-weight: bold; color: #0f172a; padding: 2px;">
          <div style="color: #dc2626; font-size: 9px; text-transform: uppercase; font-weight: 800;">Your Live GPS</div>
          <div>${studentName}</div>
          <div style="color: #64748b; font-size: 10px; font-weight: normal;">${sLat.toFixed(5)}°, ${sLng.toFixed(5)}°</div>
        </div>
      `);
      studentMarkerRef.current = marker;
    } else {
      studentMarkerRef.current.setLatLng([sLat, sLng]);
      studentMarkerRef.current.setPopupContent(`
        <div style="font-family: sans-serif; font-size: 11px; font-weight: bold; color: #0f172a; padding: 2px;">
          <div style="color: #dc2626; font-size: 9px; text-transform: uppercase; font-weight: 800;">Your Live GPS</div>
          <div>${studentName}</div>
          <div style="color: #64748b; font-size: 10px; font-weight: normal;">${sLat.toFixed(5)}°, ${sLng.toFixed(5)}°</div>
        </div>
      `);
    }

    // Update route line
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([[sLat, sLng], [fLat, fLng]]);
    } else {
      const routeLine = L.polyline([[sLat, sLng], [fLat, fLng]], {
        color: status === 'dispatched' ? '#2563eb' : '#dc2626',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.85,
      }).addTo(map);
      routeLineRef.current = routeLine;
    }
  }, [sLat, sLng, fLat, fLng, studentName, status]);

  // 3. Update Facility Markers & Initial Fit Bounds (Only on facility list changes, not continuous GPS jitter)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const facLayer = facilityMarkersLayerRef.current;
    if (!map || !facLayer) return;

    facLayer.clearLayers();
    const allPoints = [[sLat, sLng]];

    facilityList.forEach((fac, idx) => {
      const facLat = Number(fac.latitude);
      const facLng = Number(fac.longitude);
      if (isNaN(facLat) || isNaN(facLng)) return;

      const isPrimary = idx === 0;
      const facilityIcon = L.divIcon({
        className: 'custom-facility-pin',
        html: `
          <div class="relative group flex items-center justify-center pointer-events-auto">
            <div class="w-6 h-6 rounded-full ${isPrimary ? 'bg-emerald-600' : 'bg-blue-600'} border-2 border-white shadow-lg flex items-center justify-center text-white">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19z"/></svg>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const distLabel = fac.distanceKm !== undefined 
        ? `${fac.distanceKm} km away` 
        : (isPrimary && distanceKm) ? `${distanceKm} away` : '';

      const facilityMarker = L.marker([facLat, facLng], { icon: facilityIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; color: #0f172a; padding: 4px; min-width: 170px;">
            <div style="color: ${isPrimary ? '#059669' : '#2563eb'}; font-size: 9px; text-transform: uppercase; font-weight: 800;">
              ${isPrimary ? 'Nearest Emergency Station' : (fac.facility_type || 'Health Facility')}
            </div>
            <div style="font-weight: bold; font-size: 12px; margin-top: 2px;">${fac.name}</div>
            ${distLabel ? `<div style="color: #059669; font-size: 10px; font-weight: bold; margin-top: 2px;">📍 ${distLabel}</div>` : ''}
            ${fac.address ? `<div style="color: #64748b; font-size: 10px; margin-top: 2px;">${fac.address}</div>` : ''}
            ${fac.phone ? `<div style="color: #2563eb; font-size: 10px; margin-top: 2px;">📞 ${fac.phone}</div>` : ''}
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${facLat},${facLng}" target="_blank" rel="noreferrer" style="color: #2563eb; text-decoration: none; font-size: 10px; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                Open Directions ↗
              </a>
            </div>
          </div>
        `);
      facLayer.addLayer(facilityMarker);
      allPoints.push([facLat, facLng]);
    });

    // Fit bounds ONLY ONCE initially or on expansion to avoid interrupting user touches
    if (!hasFittedBoundsRef.current && allPoints.length > 0) {
      hasFittedBoundsRef.current = true;
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    }
  }, [facilityList, distanceKm]);

  // Handle Resize / Expand
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timer = setTimeout(() => {
      mapInstanceRef.current.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isExpanded, height]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([sLat, sLng], 16, { animate: true, duration: 0.8 });
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const all = [[sLat, sLng], ...facilityList.map(f => [Number(f.latitude), Number(f.longitude)])].filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));
    if (all.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(all), { padding: [40, 40], animate: true });
    }
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm bg-slate-100 touch-pan-y ${className} ${
        isExpanded ? 'fixed inset-4 z-50 rounded-3xl shadow-2xl flex flex-col h-[calc(100vh-2rem)]' : ''
      }`}
    >
      {/* Top Overlay Badge Bar */}
      <div className="absolute top-3 left-3 right-16 z-[400] flex items-center justify-between pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center space-x-2 pointer-events-auto">
          <span className={`w-2 h-2 rounded-full ${hasLiveStudentGps ? 'bg-red-600 animate-ping' : 'bg-amber-500'} shrink-0`} />
          <div className="text-[10px] font-bold text-slate-800 flex items-center space-x-1.5">
            <span>{hasLiveStudentGps ? 'Live GPS' : 'Campus Radar'}</span>
            {distanceKm && (
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">
                {distanceKm} to {primaryFac.name.split(' ')[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Map Action Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col space-y-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 transition-transform active:scale-95 cursor-pointer"
          title={isExpanded ? 'Minimize Map' : 'Expand Fullscreen Map'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 transition-transform active:scale-95 cursor-pointer"
          title="Recenter to My GPS Location"
        >
          <Crosshair className="w-4 h-4 text-red-600" />
        </button>
        <button
          type="button"
          onClick={handleFitAll}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 transition-transform active:scale-95 cursor-pointer"
          title="Fit All Facilities"
        >
          <Compass className="w-4 h-4 text-blue-600" />
        </button>
        <button
          type="button"
          onClick={switchMapStyle}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 transition-transform active:scale-95 text-[10px] cursor-pointer"
          title={`Switch Style (Current: ${TILE_PRESETS[currentStyle].name})`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* Leaflet Map Canvas */}
      <div
        id={containerId}
        ref={mapContainerRef}
        style={{ height: isExpanded ? '100%' : height, width: '100%', minHeight: '180px' }}
        className="z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Status / Navigation Footer */}
      {showDirectionsButton && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[400] flex items-center justify-between gap-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl text-[10px] font-semibold flex items-center space-x-1.5 shadow-lg pointer-events-auto">
            <MapPin className="w-3 h-3 text-red-400 shrink-0" />
            <span className="font-mono text-[9px] truncate max-w-[140px] sm:max-w-[200px]">
              {sLat.toFixed(4)}°, {sLng.toFixed(4)}°
            </span>
          </div>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${fLat},${fLng}`}
            target="_blank"
            rel="noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1 shadow-lg pointer-events-auto transition-colors cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Turn-by-Turn</span>
            <ExternalLink className="w-3 h-3 text-blue-200" />
          </a>
        </div>
      )}
    </div>
  );
}
