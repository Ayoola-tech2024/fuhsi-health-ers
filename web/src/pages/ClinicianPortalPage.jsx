import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';

export default function ClinicianPortalPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [newEntryType, setNewEntryType] = useState('allergy_confirmation');
  const [entryText, setEntryText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
                Official medical officer record verification & audit trail
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            Active Clinician: <strong>{user?.full_name || 'Dr. Medical Officer'}</strong>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 space-y-6">
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
