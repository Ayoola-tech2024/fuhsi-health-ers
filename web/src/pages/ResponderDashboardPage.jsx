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
  Activity, 
  Filter, 
  Check, 
  Navigation,
  RefreshCw,
  Loader2,
  ShieldAlert
} from 'lucide-react';

export default function ResponderDashboardPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.listIncidents();
      if (res && Array.isArray(res.incidents)) {
        setIncidents(res.incidents);
        setSelectedIncident(current => {
          if (!current && res.incidents.length > 0) return res.incidents[0];
          if (current) {
            const freshMatch = res.incidents.find(i => i.id === current.id);
            return freshMatch || (res.incidents.length > 0 ? res.incidents[0] : null);
          }
          return null;
        });
      }
    } catch (err) {
      console.warn('Incident queue fetch notice:', err.message);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(() => {
      fetchIncidents();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (incidentId, newStatus) => {
    try {
      const res = await api.updateIncidentStatus(incidentId, { status: newStatus });
      if (res && res.incident) {
        setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: newStatus } : inc));
        if (selectedIncident?.id === incidentId) {
          setSelectedIncident(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert(err.message || 'Status transition error');
    }
  };

  const filteredIncidents = incidents.filter(inc => filter === 'all' || inc.status === filter);

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'reported': return 'bg-red-50 text-red-700 border-red-200';
      case 'triaged': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'dispatched': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'at_facility': return 'bg-purple-50 text-purple-700 border-purple-200';
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
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">Emergency Response Queue</h1>
              <button
                onClick={() => fetchIncidents(true)}
                disabled={refreshing}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-300 hover:text-white"
                title="Refresh dispatch queue"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live campus dispatch queue & emergency coordination console • Responder: {user?.full_name || 'Active EMS'}
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
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
            <p className="text-xs text-slate-500 font-medium">Connecting to emergency dispatch pipeline...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Campus Queue Clear</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no {filter !== 'all' ? filter : 'active'} emergency incidents in the queue. The system is listening for live student SOS triggers.
            </p>
            <button
              onClick={() => fetchIncidents(true)}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Now</span>
            </button>
          </div>
        ) : (
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
                      isSelected ? 'border-red-500 shadow-md ring-1 ring-red-500' : 'border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{inc.student_name || 'Anonymous Student'}</h4>
                          <span className="text-[10px] text-slate-500">{inc.matric_number || inc.id}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border ${getBadgeStyle(inc.status)}`}>
                        {inc.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium line-clamp-2 mb-3">
                      {inc.description || 'Emergency SOS triggered from student device.'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>{inc.latitude ? `${Number(inc.latitude).toFixed(4)}, ${Number(inc.longitude).toFixed(4)}` : 'GPS Acquired'}</span>
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
                      <span className="text-[10px] font-bold uppercase text-slate-400">Incident Ticket</span>
                      <h3 className="text-sm font-bold text-slate-900">{selectedIncident.id}</h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getBadgeStyle(selectedIncident.status)}`}>
                      {selectedIncident.status}
                    </span>
                  </div>

                  {/* Student & Phone */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>{selectedIncident.student_name || 'FUHSI Student'}</span>
                      <span className="text-[10px] font-mono text-slate-500">{selectedIncident.matric_number || ''}</span>
                    </div>
                    {selectedIncident.student_phone && (
                      <a
                        href={`tel:${selectedIncident.student_phone}`}
                        className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call Student: {selectedIncident.student_phone}</span>
                      </a>
                    )}
                  </div>

                  {/* Vitals Summary from DB */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="font-bold text-slate-800">Student Health Snapshot (Database)</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Blood Group</span>
                        <span className="font-bold text-slate-900">{selectedIncident.blood_group || 'Not Set'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Genotype</span>
                        <span className="font-bold text-slate-900">{selectedIncident.genotype || 'Not Set'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 block">Allergies</span>
                        <span className="font-bold text-red-600">
                          {Array.isArray(selectedIncident.allergies) && selectedIncident.allergies.length > 0
                            ? selectedIncident.allergies.join(', ')
                            : 'None Reported'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Facility Routing */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Matched Medical Facility</span>
                    <div className="font-bold text-slate-900">{selectedIncident.facility_name || 'FUHSI Health & Medical Centre'}</div>
                    {selectedIncident.latitude && selectedIncident.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedIncident.latitude},${selectedIncident.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors mt-2"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Open Live Student GPS in Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Dispatch Actions */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    {selectedIncident.status === 'reported' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedIncident.id, 'dispatched')}
                        className="col-span-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch EMS Unit</span>
                      </button>
                    )}

                    {selectedIncident.status === 'dispatched' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedIncident.id, 'at_facility')}
                          className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>At Facility</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedIncident.id, 'resolved')}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </>
                    )}

                    {selectedIncident.status === 'at_facility' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedIncident.id, 'resolved')}
                        className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Incident Resolved</span>
                      </button>
                    )}

                    {selectedIncident.status === 'resolved' && (
                      <div className="col-span-2 py-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                        Incident Successfully Resolved
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
