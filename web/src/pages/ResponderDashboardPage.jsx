import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AlertCircle, 
  MapPin, 
  Clock, 
  User, 
  Building2, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  PhoneCall, 
  Activity,
  Filter,
  Check,
  Navigation
} from 'lucide-react';

export default function ResponderDashboardPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState([
    {
      id: 'INC-FUHSI-802',
      status: 'reported',
      description: 'Severe Asthma Attack: Student collapsed near Lecture Theatre B',
      student_name: 'Adewale Bakare',
      matric_number: 'FUHSI/2023/MBBS/0142',
      phone: '+234 803 123 4567',
      blood_group: 'O+',
      allergies: ['Penicillin', 'Peanuts'],
      chronic_conditions: ['Asthma'],
      latitude: 8.0198,
      longitude: 4.9048,
      nearest_facility_name: 'FUHSI Health & Medical Centre',
      created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    },
    {
      id: 'INC-FUHSI-799',
      status: 'dispatched',
      description: 'Sports complex ankle fracture during football tournament',
      student_name: 'Chioma Okeke',
      matric_number: 'FUHSI/2022/NURS/0055',
      phone: '+234 814 999 1122',
      blood_group: 'B+',
      allergies: ['None known'],
      chronic_conditions: ['None'],
      latitude: 8.0175,
      longitude: 4.9015,
      nearest_facility_name: 'Campus Dispensary Unit 1',
      created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    },
  ]);

  const [selectedIncident, setSelectedIncident] = useState(incidents[0]);

  const handleUpdateStatus = (incidentId, newStatus) => {
    setIncidents(incidents.map(inc => inc.id === incidentId ? { ...inc, status: newStatus } : inc));
    if (selectedIncident?.id === incidentId) {
      setSelectedIncident({ ...selectedIncident, status: newStatus });
    }
  };

  const filteredIncidents = incidents.filter(inc => filter === 'all' || inc.status === filter);

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'reported': return 'bg-red-50 text-red-700 border-red-200';
      case 'dispatched': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* Top Header */}
      <div className="bg-[#0D2040] text-white pt-6 pb-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Emergency Response Queue</h1>
            <p className="text-xs text-slate-300">
              Campus dispatch queue & live emergency coordination console
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white/10 p-1 rounded-xl">
            {['all', 'reported', 'dispatched', 'resolved'].map(st => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  filter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Incident List (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            {filteredIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                    isSelected ? 'border-red-500 shadow-md' : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{inc.student_name}</h4>
                        <span className="text-[10px] text-slate-500">{inc.matric_number}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border ${getBadgeStyle(inc.status)}`}>
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium line-clamp-2 mb-3">
                    {inc.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>{inc.latitude?.toFixed(4)}, {inc.longitude?.toFixed(4)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Details (5 Cols) */}
          <div className="lg:col-span-5">
            {selectedIncident && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 sticky top-20 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Incident Details</span>
                    <h3 className="text-sm font-bold text-slate-900">{selectedIncident.id}</h3>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getBadgeStyle(selectedIncident.status)}`}>
                    {selectedIncident.status}
                  </span>
                </div>

                {/* Vitals Summary */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="font-bold text-slate-800">Student Health Snapshot</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Blood Group</span>
                      <span className="font-bold text-slate-900">{selectedIncident.blood_group}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Allergies</span>
                      <span className="font-bold text-red-600">{selectedIncident.allergies.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Facility Routing */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Matched Facility</span>
                  <div className="font-bold text-slate-900">{selectedIncident.nearest_facility_name}</div>
                  <a
                    href={`https://www.google.com/maps?q=${selectedIncident.latitude},${selectedIncident.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors mt-2"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open Live GPS in Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Actions */}
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'dispatched')}
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Unit</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'resolved')}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
