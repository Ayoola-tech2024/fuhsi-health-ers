import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Compass, 
  ExternalLink, 
  Layers
} from 'lucide-react';

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
  responderCoords,
  status = 'reported',
  facilityName = 'FUHSI Health & Medical Centre',
  studentName = 'Student Live GPS',
  height = '260px',
  className = '',
  showDirectionsButton = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const routeLineRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null);
  const [currentStyle, setCurrentStyle] = useState('humanitarian');

  // Safe fallback to FUHSI campus coordinates
  const sLat = Number(studentCoords?.latitude) || 8.0194;
  const sLng = Number(studentCoords?.longitude) || 4.9042;
  const fLat = Number(facilityCoords?.latitude) || 8.0210;
  const fLng = Number(facilityCoords?.longitude) || 4.9055;

  // Haversine distance in meters/km
  useEffect(() => {
    const R = 6371; // km
    const dLat = (fLat - sLat) * Math.PI / 180;
    const dLon = (fLng - sLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(sLat * Math.PI / 180) * Math.cos(fLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    setDistanceKm(d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(2)}km`);
  }, [sLat, sLng, fLat, fLng]);

  // Handle Layer switching
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map instance once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [sLat, sLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // 100% Free Open-Source Tiles (Humanitarian OpenStreetMap / Zero API Key / Forever Free)
      const preset = TILE_PRESETS[currentStyle];
      const tiles = L.tileLayer(preset.url, {
        maxZoom: preset.maxZoom,
        subdomains: preset.subdomains || 'abc',
      }).addTo(map);
      tileLayerRef.current = tiles;

      // Clean Attribution
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('© OpenStreetMap & HOT contributors')
        .addTo(map);

      // Add zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // 1. Sleek Student GPS Pin (Pulsing Red Marker)
    const studentIcon = L.divIcon({
      className: 'custom-student-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-red-600/30 animate-ping"></div>
          <div class="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
            <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const studentMarker = L.marker([sLat, sLng], { icon: studentIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; font-weight: bold; color: #0f172a; padding: 2px;">
          <div style="color: #dc2626; font-size: 9px; text-transform: uppercase; font-weight: 800;">Emergency Beacon</div>
          <div>${studentName}</div>
          <div style="color: #64748b; font-size: 10px; font-weight: normal;">${sLat.toFixed(5)}°, ${sLng.toFixed(5)}°</div>
        </div>
      `);
    markersGroup.addLayer(studentMarker);

    // 2. Sleek Health Facility Pin (Green Cross Marker)
    const facilityIcon = L.divIcon({
      className: 'custom-facility-pin',
      html: `
        <div class="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19z"/></svg>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const facilityMarker = L.marker([fLat, fLng], { icon: facilityIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; font-weight: bold; color: #0f172a; padding: 2px;">
          <div style="color: #059669; font-size: 9px; text-transform: uppercase; font-weight: 800;">Campus Health Station</div>
          <div>${facilityName}</div>
          <div style="color: #64748b; font-size: 10px; font-weight: normal;">${fLat.toFixed(5)}°, ${fLng.toFixed(5)}°</div>
        </div>
      `);
    markersGroup.addLayer(facilityMarker);

    // 3. Connect route line between student and facility
    const latlngs = [
      [sLat, sLng],
      [fLat, fLng]
    ];

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
    }

    const routeLine = L.polyline(latlngs, {
      color: status === 'dispatched' ? '#2563eb' : '#dc2626',
      weight: 3,
      dashArray: '6, 8',
      opacity: 0.85,
    }).addTo(map);

    routeLineRef.current = routeLine;

    // Fit bounds smoothly to contain both points
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [35, 35], maxZoom: 17, animate: true });

  }, [sLat, sLng, fLat, fLng, facilityName, studentName, status, isExpanded]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([[sLat, sLng], [fLat, fLng]]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm bg-slate-100 ${className} ${isExpanded ? 'fixed inset-4 z-50 rounded-3xl shadow-2xl flex flex-col h-[calc(100vh-2rem)]' : ''}`}>
      {/* Top Overlay Badge Bar */}
      <div className="absolute top-3 left-3 right-14 z-[400] flex items-center justify-between pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center space-x-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
          <div className="text-[10px] font-bold text-slate-800 flex items-center space-x-1">
            <span>Direct Campus GPS</span>
            {distanceKm && (
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">
                {distanceKm}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Map Action Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col space-y-1.5">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 transition-transform active:scale-95"
          title={isExpanded ? 'Minimize Map' : 'Expand Fullscreen Map'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 transition-transform active:scale-95"
          title="Recenter Map"
        >
          <Compass className="w-4 h-4 text-blue-600" />
        </button>
        <button
          type="button"
          onClick={switchMapStyle}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 transition-transform active:scale-95 text-[10px]"
          title={`Switch Style (Current: ${TILE_PRESETS[currentStyle].name})`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height: isExpanded ? '100%' : height, width: '100%' }}
        className="z-0"
      />

      {/* Bottom Status / Navigation Footer */}
      {showDirectionsButton && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[400] flex items-center justify-between gap-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl text-[10px] font-semibold flex items-center space-x-1.5 shadow-lg pointer-events-auto">
            <MapPin className="w-3 h-3 text-red-400 shrink-0" />
            <span className="font-mono text-[9px] truncate max-w-[150px] sm:max-w-[200px]">
              {sLat.toFixed(4)}°, {sLng.toFixed(4)}°
            </span>
          </div>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${sLat},${sLng}`}
            target="_blank"
            rel="noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1 shadow-lg pointer-events-auto transition-colors"
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
