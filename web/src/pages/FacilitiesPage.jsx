import React from 'react';
import { Building2, Phone, MapPin, Clock, Navigation } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* Header */}
      <div className="bg-[#0D2040] text-white pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl font-bold text-white">Campus Health Facilities</h1>
          <p className="text-xs text-slate-300 mt-1">
            Designated clinics and medical centers across FUHSI campus
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
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
                    Active Station
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{fac.name}</h3>
                <p className="text-xs text-blue-600 font-medium mb-3">{fac.facility_type}</p>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{fac.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{fac.hours}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <a
                  href={`tel:${fac.phone}`}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {fac.phone}</span>
                </a>

                <a
                  href={`https://www.google.com/maps?q=${fac.latitude},${fac.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-slate-200"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
