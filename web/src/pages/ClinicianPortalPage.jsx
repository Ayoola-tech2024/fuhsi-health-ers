import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Stethoscope, 
  Search, 
  ShieldCheck, 
  Plus, 
  FileCheck2, 
  Clock, 
  User, 
  History, 
  CheckCircle2, 
  Lock,
  AlertCircle,
  Loader2,
  Activity,
  Bell,
  Droplet,
  Asterisk,
  HeartPulse,
  ArrowRight,
  ShieldAlert,
  MapPin,
  ExternalLink,
  Navigation
} from 'lucide-react';

export default function ClinicianPortalPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [inboundIncidents, setInboundIncidents] = useState([]);
  const [inboundLoading, setInboundLoading] = useState(true);

  const [newEntryType, setNewEntryType] = useState('allergy_confirmation');
  const [entryText, setEntryText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Poll active emergencies for incoming patient feed
  const fetchInboundEmergencies = async () => {
    try {
      const res = await api.listIncidents();
      if (res && Array.isArray(res.incidents)) {
        const active = res.incidents.filter(i => i.status !== 'resolved' && i.status !== 'cancelled');
        setInboundIncidents(active);
      }
    } catch (e) {
      // ignore
    } finally {
      setInboundLoading(false);
    }
  };

  useEffect(() => {
    fetchInboundEmergencies();
    const interval = setInterval(fetchInboundEmergencies, 3000);
    window.addEventListener('focus', fetchInboundEmergencies);
    document.addEventListener('visibilitychange', fetchInboundEmergencies);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchInboundEmergencies);
      document.removeEventListener('visibilitychange', fetchInboundEmergencies);
    };
  }, []);

  const handleSelectInboundPatient = async (incident) => {
    setSearching(true);
    setSearchError(null);
    setSelectedStudent(null);
    setEntries([]);
    setSearchQuery(incident.matric_number || incident.student_name || '');

    try {
      const identifier = incident.student_id || incident.matric_number;
      const res = await api.getStudentProfile(identifier);
      const studentData = res.student || res.profile;
      if (studentData) {
        setSelectedStudent({
          ...studentData,
          activeIncidentId: incident.id,
          activeIncidentStatus: incident.status,
          emergencyDescription: incident.description,
        });
        const studentId = studentData.id || studentData.student_id || incident.student_id;
        if (studentId) {
          const entryRes = await api.getClinicalEntries(studentId).catch(() => ({ entries: [] }));
          if (entryRes && Array.isArray(entryRes.entries)) {
            setEntries(entryRes.entries);
          }
        }
      }
    } catch (err) {
      setSearchError(err.message || 'Failed to auto-load student EHR record');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSelectedStudent(null);
    setEntries([]);

    try {
      const res = await api.getStudentProfile(searchQuery.trim());
      const studentData = res.student || res.profile;
      if (studentData) {
        setSelectedStudent(studentData);
        // Fetch real clinical entries for this student
        const studentId = studentData.id || studentData.student_id;
        if (studentId) {
          const entryRes = await api.getClinicalEntries(studentId).catch(() => ({ entries: [] }));
          if (entryRes && Array.isArray(entryRes.entries)) {
            setEntries(entryRes.entries);
          }
        }
      } else {
        setSearchError('No student record found for that matric number.');
      }
    } catch (err) {
      setSearchError(err.message || 'Student not found in database.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryText.trim() || !selectedStudent) return;
    setSaving(true);

    try {
      const studentId = selectedStudent.id || selectedStudent.student_id;
      const res = await api.createClinicalEntry({
        studentId,
        entryType: newEntryType,
        content: { note: entryText.trim() },
      });

      if (res && res.entry) {
        setEntries(prev => [res.entry, ...prev]);
      } else {
        // Refresh entries
        const fresh = await api.getClinicalEntries(studentId);
        if (fresh && Array.isArray(fresh.entries)) setEntries(fresh.entries);
      }
      setEntryText('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save clinical entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* Top Header */}
      <div className="bg-[#0D2040] text-white pt-6 pb-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Clinician Verification Portal</h1>
              <p className="text-xs text-slate-300">
                Official medical officer record verification & emergency triage feed
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            Active Clinician: <strong>{user?.full_name || 'Dr. Medical Officer'}</strong>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 space-y-6">
        {/* Inbound Emergency Alerts Feed */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${inboundIncidents.length > 0 ? 'bg-red-600 animate-ping' : 'bg-emerald-500'}`} />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Inbound Emergency Alerts & Triage Feed ({inboundIncidents.length})
              </h2>
            </div>
            <button
              onClick={fetchInboundEmergencies}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              Refresh Feed
            </button>
          </div>

          {inboundLoading ? (
            <div className="py-4 text-center text-xs text-slate-400">Loading incoming alerts...</div>
          ) : inboundIncidents.length === 0 ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">No active campus SOS emergencies right now.</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium">All Units Standing By</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inboundIncidents.map((inc) => (
                <div key={inc.id} className="p-3.5 bg-red-50/80 border border-red-200 rounded-xl flex flex-col justify-between space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <h3 className="font-bold text-sm text-slate-900">{inc.student_name}</h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Matric: <span className="font-mono font-semibold">{inc.matric_number || 'N/A'}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-extrabold uppercase">
                      {inc.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 py-1 text-center bg-white/80 rounded-lg p-1.5 border border-red-100 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">Blood Group</span>
                      <strong className="text-red-700 font-black">{inc.blood_group || 'Not Set'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Genotype</span>
                      <strong className="text-slate-900 font-bold">{inc.genotype || 'Not Set'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Allergies</span>
                      <strong className="text-slate-900 font-bold truncate block">{Array.isArray(inc.allergies) ? inc.allergies.join(', ') : 'None'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-red-100">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-600 truncate max-w-[150px] font-medium">
                        📍 {inc.facility_name || 'FUHSI Health Centre'}
                      </span>
                      {inc.latitude && inc.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${inc.latitude},${inc.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-bold text-blue-600 hover:underline flex items-center space-x-0.5 bg-white px-1.5 py-0.5 rounded border border-blue-200"
                          title="View exact student GPS coordinates"
                        >
                          <span>Maps ({Number(inc.latitude).toFixed(3)}°)</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleSelectInboundPatient(inc)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors shadow-sm shrink-0"
                    >
                      <span>Prepare EHR</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Student Matric Number (e.g. FUHSI/2023/...) or Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="w-full sm:w-auto px-5 py-2 bg-[#0D2040] hover:bg-[#1A365D] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{searching ? 'Querying DB...' : 'Find Student Record'}</span>
            </button>
          </form>
          {searchError && (
            <p className="text-xs text-red-600 font-medium mt-2 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{searchError}</span>
            </p>
          )}
        </div>

        {!selectedStudent ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Student Selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Search by matric number above to look up student medical records, verify health declarations, and append signed clinical entries.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Student Profile Card (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedStudent.full_name}</h3>
                    <span className="text-xs text-slate-500">{selectedStudent.matric_number || selectedStudent.email}</span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.department || 'Not Provided'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Blood Group</span>
                    <span className="font-bold text-red-600">{selectedStudent.blood_group || 'Unset'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Genotype</span>
                    <span className="font-bold text-slate-800">{selectedStudent.genotype || 'Unset'}</span>
                  </div>
                  <div className="py-1 border-b border-slate-100">
                    <span className="text-slate-500 block mb-0.5">Known Allergies</span>
                    <span className="font-semibold text-slate-800">
                      {Array.isArray(selectedStudent.allergies) && selectedStudent.allergies.length > 0
                        ? selectedStudent.allergies.join(', ')
                        : 'None Reported'}
                    </span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-500 block mb-0.5">Chronic Conditions</span>
                    <span className="font-semibold text-slate-800">
                      {Array.isArray(selectedStudent.chronic_conditions) && selectedStudent.chronic_conditions.length > 0
                        ? selectedStudent.chronic_conditions.join(', ')
                        : 'None Reported'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Record & History (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Form */}
              <form onSubmit={handleAddEntry} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Add Clinician Verified Record</span>
                  </h4>
                  {saveSuccess && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Entry Signed & Saved</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
                    <select
                      value={newEntryType}
                      onChange={(e) => setNewEntryType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    >
                      <option value="allergy_confirmation">Allergy Confirmation</option>
                      <option value="diagnosis">Clinical Diagnosis</option>
                      <option value="medication">Prescribed Medication</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Doctor's Observation</label>
                  <textarea
                    rows={2}
                    placeholder="Enter clinical assessment, lab confirmation, or prescription..."
                    value={entryText}
                    onChange={(e) => setEntryText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>{saving ? 'Signing Entry...' : 'Sign & Save to Medical Record'}</span>
                  </button>
                </div>
              </form>

              {/* History */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Verified Clinical Entries ({entries.length})</span>
                </h4>

                {entries.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                    <p className="text-xs text-slate-500">No verified clinical entries recorded for this student yet.</p>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <div key={entry.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase">
                            {entry.entry_type ? entry.entry_type.replace('_', ' ') : 'Record'}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{entry.entered_by_name || 'Medical Officer'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(entry.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-700">
                        {entry.content?.note || entry.content?.allergy || entry.content?.condition || JSON.stringify(entry.content)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
