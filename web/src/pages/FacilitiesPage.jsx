import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Building2, Phone, MapPin, Clock, Navigation, Loader2 } from 'lucide-react';

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      try {
        const res = await api.getFacilities();
        if (isMounted && res && res.facilities) {
          setFacilities(res.facilities);
        }
      } catch (err) {
        console.warn('Failed to load facilities:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadFacilities();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* Header */}
      <div className="bg-[#0D2040] text-white pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl font-bold text-white">Campus Health Facilities</h1>
          <p className="text-xs text-slate-300 mt-1">
            Designated clinics, dispensaries, and trauma centers across FUHSI campus
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-xs text-slate-500 font-medium">Querying active medical facilities from database...</p>
          </div>
        ) : facilities.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Facilities Registered Yet</p>
            <p className="text-xs text-slate-500 mt-1">Campus health centers will appear here once configured by administrators.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {facilities.map((fac) => (
              <div
                key={fac.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                      {fac.is_active ? 'Active Station' : 'Offline'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">{fac.name}</h3>
                  <p className="text-xs text-blue-600 font-medium mb-3">{fac.facility_type || 'Campus Medical Facility'}</p>

                  <div className="space-y-2 text-xs text-slate-600">
                    {fac.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{fac.address}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>24/7 Emergency & Inpatient Services</span>
                    </div>
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
                    <div className="w-full py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-medium text-center">
                      Emergency dispatch line active
                    </div>
                  )}

                  {fac.latitude && fac.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${fac.latitude},${fac.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-slate-200"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Get Directions</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
