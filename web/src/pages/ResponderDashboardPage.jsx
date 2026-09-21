import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
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
  FileText, 
  Navigation,
  Activity,
  Filter
} from 'lucide-react';

export default function ResponderDashboardPage() {
  const { user, loginAsDemo } = useAuth();
  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState([
    {
      id: 'inc-fuhsi-802',
      status: 'reported',
      description: 'Severe Asthma / Respiratory Distress: Student collapsed near Lecture Theatre B',
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
      id: 'inc-fuhsi-799',
      status: 'dispatched',
      description: 'Severe Trauma: Sports complex leg fracture during football practice',
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

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [triageNotes, setTriageNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadIncidents() {
      try {
        const res = await api.listIncidents();
        if (res.incidents && res.incidents.length > 0) {
          setIncidents(res.incidents);
        }
      } catch (err) {
        // Fallback to sample incidents
      }
    }
    loadIncidents();
  }, []);

  const handleUpdateStatus = async (incidentId, newStatus) => {
    setUpdating(true);
    try {
      await api.updateIncidentStatus(incidentId, {
        status: newStatus,
        notes: triageNotes || `Status updated to ${newStatus} by responder ${user?.full_name || 'EMS'}`,
      });
      setIncidents(incidents.map(inc => inc.id === incidentId ? { ...inc, status: newStatus } : inc));
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident({ ...selectedIncident, status: newStatus });
      }
    } catch (err) {
      // Local optimistic update
      setIncidents(incidents.map(inc => inc.id === incidentId ? { ...inc, status: newStatus } : inc));
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident({ ...selectedIncident, status: newStatus });
      }
    } finally {
      setUpdating(false);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'all') return true;
    return inc.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reported':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'triaged':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'dispatched':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'at_facility':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'resolved':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-950/60 border border-red-500/30 rounded-full text-xs font-semibold text-red-400 mb-2">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            <span>DISPATCH TELEMETRY ACTIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Emergency Response Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor incoming SOS calls, triage severity, and coordinate ambulance routing.
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
          {['all', 'reported', 'dispatched', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                filter === st
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident List (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {filteredIncidents.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No active emergencies</h3>
              <p className="text-xs text-slate-400 mt-1">Campus response system is on standby.</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-red-500 shadow-xl shadow-red-950/20'
                      : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {incident.student_name || 'Anonymous Student'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {incident.matric_number || 'Matric Pending'}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] font-extrabold uppercase rounded-full border ${getStatusBadge(incident.status)}`}>
                      {incident.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium line-clamp-2 mb-3">
                    {incident.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-700/60 gap-2">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Incident Action Drawer (Right 5 Cols) */}
        <div className="lg:col-span-5">
          {selectedIncident ? (
            <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 backdrop-blur-xl sticky top-24 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Incident Details</div>
                  <div className="font-mono text-sm text-red-400 font-bold">{selectedIncident.id}</div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full border ${getStatusBadge(selectedIncident.status)}`}>
                  {selectedIncident.status}
                </span>
              </div>

              {/* Student Vitals & Medical Records */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Student Emergency Vitals</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Blood Group</span>
                    <span className="font-bold text-white">{selectedIncident.blood_group || 'O+'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Known Allergies</span>
                    <span className="font-bold text-amber-300">
                      {Array.isArray(selectedIncident.allergies) ? selectedIncident.allergies.join(', ') : 'Penicillin'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nearest Facility & Directions */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Routed Facility</span>
                </div>
                <div className="text-xs font-bold text-white">{selectedIncident.nearest_facility_name || 'FUHSI Medical Centre'}</div>
                <div className="mt-3 flex items-center space-x-2">
                  <a
                    href={`https://www.google.com/maps?q=${selectedIncident.latitude},${selectedIncident.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open Live GPS in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Update Emergency Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'dispatched')}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Ambulance</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'resolved')}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-lg"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-3xl p-10 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-xs">Select an incident from the queue to view medical details, launch GPS navigation, or update dispatch status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
