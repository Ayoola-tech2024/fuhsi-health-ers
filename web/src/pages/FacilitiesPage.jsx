import React from 'react';
import { Building2, Phone, MapPin, Clock, ShieldCheck, Navigation } from 'lucide-react';

export default function FacilitiesPage() {
  const facilities = [
    {
      id: '1',
      name: 'FUHSI Health & Medical Centre',
      facility_type: 'Main Campus Clinic & Emergency Ward',
      address: 'Main Campus Administrative Area, Gate 1, Ila-Orangun',
      phone: '+234 800 384 7437',
      hours: '24/7 Emergency & Inpatient Services',
      is_active: true,
      latitude: 8.0194,
      longitude: 4.9042,
      distanceKm: 0.3,
    },
    {
      id: '2',
      name: 'Campus Dispensary & First Aid Unit 1',
      facility_type: 'Dispensary / Outpatient Triage',
      address: 'Student Hostel Complex B, Near Sports Pavilion',
      phone: '+234 802 111 2233',
      hours: '08:00 AM - 10:00 PM Daily',
      is_active: true,
      latitude: 8.0182,
      longitude: 4.9031,
      distanceKm: 0.6,
    },
    {
      id: '3',
      name: 'Ila-Orangun General Referral Centre',
      facility_type: 'General Referral Hospital',
      address: 'Ila-Orangun Town Bypass, Osun State',
      phone: '+234 803 999 8877',
      hours: '24/7 Tertiary Trauma Care',
      is_active: true,
      latitude: 8.0150,
      longitude: 4.8980,
      distanceKm: 1.8,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 pb-28">
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-950/60 border border-red-500/30 rounded-full text-xs font-semibold text-red-400 mb-3">
          <Building2 className="w-3.5 h-3.5" />
          <span>CAMPUS HEALTH NETWORK</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Campus Health Facilities</h1>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Designated medical clinics and emergency stations supporting FUHSI campus response routing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {facilities.map((fac) => (
          <div
            key={fac.id}
            className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 backdrop-blur-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-2xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full text-[10px] font-bold">
                  Active
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{fac.name}</h3>
              <p className="text-xs text-red-400 font-semibold mb-3">{fac.facility_type}</p>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>{fac.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{fac.hours}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
              <a
                href={`tel:${fac.phone}`}
                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {fac.phone}</span>
              </a>

              <a
                href={`https://www.google.com/maps?q=${fac.latitude},${fac.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>View Map</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
