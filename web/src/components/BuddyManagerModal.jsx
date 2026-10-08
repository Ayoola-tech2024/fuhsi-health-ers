import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Shield, Heart, AlertCircle, Phone, CreditCard, X, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function BuddyManagerModal({ isOpen, onClose, buddies = [], onBuddyUpdated }) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleAddBuddy = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Please enter your friend’s full name and phone number.');
      return;
    }
    if (buddies.length >= 3) {
      setError('You can add up to a maximum of 3 trusted friends.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.createBuddy({
        name: name.trim(),
        phone: phone.trim(),
        matricNumber: matricNumber.trim() || null,
        bloodGroup: bloodGroup || null,
        allergies: allergies.trim() || null,
        notes: notes.trim() || null,
      });

      setName('');
      setPhone('');
      setMatricNumber('');
      setBloodGroup('O+');
      setAllergies('');
      setNotes('');
      setAdding(false);

      if (onBuddyUpdated) onBuddyUpdated();
    } catch (err) {
      setError(err.message || 'Failed to save trusted friend.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBuddy = async (id) => {
    try {
      setDeletingId(id);
      setError(null);
      await api.deleteBuddy(id);
      if (onBuddyUpdated) onBuddyUpdated();
    } catch (err) {
      setError(err.message || 'Failed to delete friend.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D2040] text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Trusted Friends (Buddy SOS)</h2>
              <p className="text-[11px] text-slate-300">
                Register up to 3 friends to trigger SOS on their behalf
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Explanation Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-blue-900">
            <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Why Add Trusted Friends?</p>
              <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                If your friend has no battery, runs out of data, or is unconscious, you can trigger an emergency for them from your device. 
                Responders receive <strong>their medical vitals and blood group</strong> while your device acts as the live GPS beacon.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* List of Friends */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Configured Friends ({buddies.length}/3)
              </span>
              {!adding && buddies.length < 3 && (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Friend</span>
                </button>
              )}
            </div>

            {buddies.length === 0 && !adding && (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Trusted Friends Added Yet</p>
                <p className="text-[11px] text-slate-500">
                  Add your room-mate, course-mate, or close friend so you can protect each other in an emergency.
                </p>
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add First Friend</span>
                </button>
              </div>
            )}

            {buddies.map((buddy) => (
              <div
                key={buddy.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{buddy.name}</span>
                    {buddy.blood_group && (
                      <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[10px] font-extrabold">
                        {buddy.blood_group}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{buddy.phone}</span>
                    </span>
                    {buddy.matric_number && (
                      <span className="flex items-center space-x-1 font-mono">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        <span>{buddy.matric_number}</span>
                      </span>
                    )}
                  </div>
                  {buddy.notes && (
                    <p className="text-[10px] text-slate-500 bg-white p-1.5 rounded-lg border border-slate-200/60 mt-1">
                      📝 {buddy.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteBuddy(buddy.id)}
                  disabled={deletingId === buddy.id}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 flex items-center justify-center transition-colors shrink-0"
                  title="Remove Friend"
                >
                  {deletingId === buddy.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Add Friend Form */}
          {adding && (
            <form onSubmit={handleAddBuddy} className="bg-slate-50 p-4 rounded-2xl border border-emerald-300/80 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-800">Add New Trusted Friend</span>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Friend's Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chioma Okeke"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 800 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Matric Number</label>
                  <input
                    type="text"
                    placeholder="FUHSI/2023/..."
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Peanuts"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Emergency Medical Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Asthmatic, carries inhaler; Diabetic"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{saving ? 'Saving Friend...' : 'Save Trusted Friend'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
