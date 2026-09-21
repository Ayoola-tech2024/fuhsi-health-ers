import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Stethoscope, 
  Search, 
  ShieldCheck, 
  Plus, 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  User, 
  History,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function ClinicianPortalPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('FUHSI/2023/MBBS/0142');
  const [selectedStudent, setSelectedStudent] = useState({
    id: 'student-fuhsi-0142',
    full_name: 'Adewale Bakare',
    matric_number: 'FUHSI/2023/MBBS/0142',
    department: 'Medicine & Surgery',
    blood_group: 'O+',
    genotype: 'AA',
  });

  const [entries, setEntries] = useState([
    {
      id: 'entry-1',
      entry_type: 'allergy_confirmation',
      content: { allergy: 'Penicillin (Severe Anaphylaxis Risk)', confirmed_by_lab: true },
      verification_status: 'verified',
      entered_by_name: 'Dr. Fatima Olamide (Clinician)',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: 'entry-2',
      entry_type: 'diagnosis',
      content: { condition: 'Exercise-Induced Bronchospasm (Mild Asthma)', inhaler_prescribed: 'Salbutamol 100mcg' },
      verification_status: 'verified',
      entered_by_name: 'Dr. Fatima Olamide (Clinician)',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ]);

  const [newEntryType, setNewEntryType] = useState('allergy_confirmation');
  const [entryText, setEntryText] = useState('');
  const [isEmergencyOverride, setIsEmergencyOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!entryText) return;
    setSaving(true);

    const newEntry = {
      id: `entry-${Date.now()}`,
      entry_type: newEntryType,
      content: { note: entryText, is_emergency_override: isEmergencyOverride, override_reason: overrideReason },
      verification_status: 'verified',
      entered_by_name: user?.full_name || 'Dr. Verified Clinician',
      created_at: new Date().toISOString(),
    };

    setTimeout(() => {
      setEntries([newEntry, ...entries]);
      setEntryText('');
      setOverrideReason('');
      setIsEmergencyOverride(false);
      setSaving(false);
    }, 400);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Clinician Verification Portal</h1>
            <p className="text-xs text-slate-400">
              Identity-linked clinical verification with immutable audit logging.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-300 font-semibold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            Logged Clinician: <span className="text-emerald-400">{user?.full_name || 'Dr. Fatima Olamide'}</span>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-5 mb-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by Matric Number (e.g. FUHSI/2023/MBBS/0142) or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors">
            Look Up Student
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Verified Profile Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedStudent.full_name}</h3>
                <div className="text-xs text-slate-400">{selectedStudent.matric_number}</div>
              </div>
              <span className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800/50">
                <ShieldCheck className="w-5 h-5" />
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-slate-200">{selectedStudent.department}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Blood Group</span>
                <span className="font-bold text-red-400">{selectedStudent.blood_group}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Genotype</span>
                <span className="font-bold text-slate-200">{selectedStudent.genotype}</span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start space-x-2.5 text-[11px] text-slate-400">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>All medical entries are signed with your clinician ID and recorded in the permanent audit trail.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Add Entry & Audit Trail (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* New Clinical Write Form */}
          <form onSubmit={handleAddEntry} className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Verified Clinical Record</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Entry Category</label>
                <select
                  value={newEntryType}
                  onChange={(e) => setNewEntryType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="allergy_confirmation">Allergy Confirmation</option>
                  <option value="diagnosis">Clinical Diagnosis</option>
                  <option value="medication">Prescribed Medication</option>
                  <option value="emergency_note">Emergency Clinical Note</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergencyOverride}
                    onChange={(e) => setIsEmergencyOverride(e.target.checked)}
                    className="rounded border-slate-700 text-red-600 focus:ring-0"
                  />
                  <span className="text-xs text-amber-300 font-semibold">Emergency Override (Audit Flagged)</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Clinical Findings & Notes</label>
              <textarea
                rows={3}
                placeholder="Enter verified medical observations, severity, or medication directions..."
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {isEmergencyOverride && (
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-amber-400 mb-1">Override Justification (Required for Audit)</label>
                <input
                  type="text"
                  placeholder="e.g. Acute trauma unconscious patient on-scene intervention"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-lg"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Sign & Save to Record</span>
              </button>
            </div>
          </form>

          {/* Audit Trail List */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>Identity-Linked Clinical Entry History</span>
            </h3>

            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full text-[10px] font-bold uppercase">
                        {entry.entry_type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-300">
                        {entry.entered_by_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 mt-1">
                    {entry.content.note || entry.content.allergy || entry.content.condition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
