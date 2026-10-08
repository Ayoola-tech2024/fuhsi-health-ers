import React from 'react';
import { useLocation, REGIONAL_HUBS } from '../context/LocationContext';
import { MapPin, Crosshair, X, Check, Compass, ShieldCheck } from 'lucide-react';

export default function CityPickerModal({ isOpen, onClose }) {
  const { userLocation, locationName, locationSource, refreshLocation, setManualCity, isLocating } = useLocation();

  if (!isOpen) return null;

  const handleSelectHub = (hubId) => {
    setManualCity(hubId);
    onClose();
  };

  const handleAutoGps = () => {
    refreshLocation({ highAccuracy: true, bypassCache: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Active Location / Campus</h3>
              <p className="text-[11px] text-slate-500">Pick your campus or active test city</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Auto GPS Option */}
          <button
            type="button"
            onClick={handleAutoGps}
            className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between ${
              locationSource === 'gps'
                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Crosshair className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>Auto-Detect Real Device GPS</span>
                  {locationSource === 'gps' && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">Uses your phone/computer satellite GPS chip</p>
              </div>
            </div>
            {locationSource === 'gps' && <Check className="w-4 h-4 text-emerald-600" />}
          </button>

          <div className="pt-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Designated Campus & Regional Hubs
            </div>
            <div className="grid grid-cols-1 gap-2">
              {REGIONAL_HUBS.map((hub) => {
                const isSelected = locationName.toLowerCase().includes(hub.id) || locationName.toLowerCase().includes(hub.name.toLowerCase().split(' ')[0]);
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => handleSelectHub(hub.id)}
                    className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                      isSelected && locationSource !== 'gps'
                        ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isSelected && locationSource !== 'gps'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        📍
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{hub.name}</div>
                        <div className="text-[10px] text-slate-500">{hub.state} • {hub.latitude.toFixed(4)}°, {hub.longitude.toFixed(4)}°</div>
                      </div>
                    </div>
                    {isSelected && locationSource !== 'gps' && (
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Current: <strong className="text-slate-800">{locationName}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
