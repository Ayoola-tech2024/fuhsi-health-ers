import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  CreditCard,
  X,
  Loader2,
  Building2,
  Lock,
  Clock,
  Check,
  UserX,
  BellRing
} from 'lucide-react';
import { api } from '../services/api';

export default function BuddyManagerModal({ isOpen, onClose, buddies = [], onBuddyUpdated, onBuddiesChanged }) {
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [respondingId, setRespondingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Local buddies state for instant UI responsiveness
  const [buddiesList, setBuddiesList] = useState(buddies);

  // Sync when prop changes
  useEffect(() => {
    if (buddies && Array.isArray(buddies)) {
      setBuddiesList(buddies);
    }
  }, [buddies]);

  // Incoming Requests State
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [incomingLoading, setIncomingLoading] = useState(false);

  // Fetch full live buddy data
  const refreshAll = useCallback(async () => {
    try {
      setIncomingLoading(true);
      const [budRes, incRes] = await Promise.all([
        api.getBuddies().catch(() => ({ buddies: [] })),
        api.getIncomingBuddies().catch(() => ({ incoming: [] }))
      ]);
      if (budRes && Array.isArray(budRes.buddies)) {
        setBuddiesList(budRes.buddies);
      }
      if (incRes && Array.isArray(incRes.incoming)) {
        setIncomingRequests(incRes.incoming);
      }
      if (typeof onBuddyUpdated === 'function') onBuddyUpdated();
      if (typeof onBuddiesChanged === 'function') onBuddiesChanged();
    } catch {
      // ignore
    } finally {
      setIncomingLoading(false);
    }
  }, [onBuddyUpdated, onBuddiesChanged]);

  useEffect(() => {
    if (isOpen) {
      refreshAll();
    }
  }, [isOpen, refreshAll]);

  if (!isOpen) return null;

  // 1. Search and verify account from FUHSI ERS Database
  const handleSearchUser = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter your friend’s Matric Number, FUHSI Email, or Phone Number.');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setVerifiedUser(null);
      setSuccessMsg(null);

      const res = await api.lookupBuddy(searchQuery.trim());
      if (res && res.user) {
        setVerifiedUser(res.user);
      } else {
        setError('No registered student account found with those credentials.');
      }
    } catch (err) {
      setError(err.message || 'No registered account found. Your friend must register on FUHSI ERS first.');
    } finally {
      setSearching(false);
    }
  };

  // 2. Send authorization request to link verified account
  const handleSendBuddyRequest = async () => {
    if (!verifiedUser) return;
    if (buddiesList.length >= 3) {
      setError('You can link a maximum of 3 trusted friends.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await api.createBuddy({
        buddyUserId: verifiedUser.id,
        notes: notes.trim() || null,
      });

      setSuccessMsg(
        res?.message ||
        `Buddy link request sent to ${verifiedUser.fullName}. They must approve it before emergency dispatch is activated.`
      );
      setVerifiedUser(null);
      setSearchQuery('');
      setNotes('');
      setAdding(false);

      await refreshAll();
    } catch (err) {
      setError(err.message || 'Failed to send buddy request.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Respond to Incoming Request (Accept / Decline)
  const handleRespond = async (requestId, action) => {
    try {
      setRespondingId(requestId);
      setError(null);
      await api.respondBuddyRequest(requestId, action);
      setSuccessMsg(
        action === 'accept'
          ? 'You have approved the buddy request! You can now protect each other in emergencies.'
          : 'Buddy request declined.'
      );
      await refreshAll();
    } catch (err) {
      setError(err.message || 'Failed to process response.');
    } finally {
      setRespondingId(null);
    }
  };

  // 4. Unlink / Cancel Request
  const handleDeleteBuddy = async (id) => {
    try {
      setDeletingId(id);
      setError(null);
      await api.deleteBuddy(id);
      await refreshAll();
    } catch (err) {
      setError(err.message || 'Failed to unlink friend.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D2040] text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Trusted Friends & Permissions</h2>
              <p className="text-[11px] text-slate-300">
                Mutual consent required before emergency SOS dispatch
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
          {/* Permission Security Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">2-Way Mutual Consent Authorization</p>
              <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                To prevent unauthorized additions, your friend will receive an instant authorization request. 
                They must explicitly approve it before you can trigger emergency dispatches on their behalf.
              </p>
            </div>
          </div>

          {/* Success / Error alerts */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Incoming Requests Section (Needs Approval) */}
          {incomingRequests.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                  <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
                  <span>Incoming Permission Requests ({incomingRequests.length})</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>

              <div className="space-y-2">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{req.requester_name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {req.requester_matric || req.requester_email}
                        </p>
                        {req.requester_department && (
                          <p className="text-[10px] text-slate-500">{req.requester_department}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Wants permission to trigger emergency SOS for you when you are offline or out of battery.
                    </p>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRespond(req.id, 'accept')}
                        disabled={respondingId === req.id}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                      >
                        {respondingId === req.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Approve & Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRespond(req.id, 'decline')}
                        disabled={respondingId === req.id}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Friends List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                My Emergency Buddies ({buddiesList.length}/3)
              </span>
              {!adding && buddiesList.length < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    setAdding(true);
                    setError(null);
                    setSuccessMsg(null);
                    setVerifiedUser(null);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Request Friend</span>
                </button>
              )}
            </div>

            {buddiesList.length === 0 && !adding && (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Trusted Friends Added</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Search by Matric Number or Email to request your roommate or coursemate.
                </p>
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Request First Friend</span>
                </button>
              </div>
            )}

            {buddiesList.map((buddy) => {
              const isPending = buddy.status === 'pending';

              return (
                <div
                  key={buddy.id}
                  className={`border rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm transition-all ${
                    isPending ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{buddy.name}</span>
                      {isPending ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 rounded-full text-[10px] font-bold">
                          <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                          <span>Pending Approval</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Authorized</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                      {buddy.matric_number && (
                        <span className="flex items-center space-x-1 font-mono text-slate-700">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>{buddy.matric_number}</span>
                        </span>
                      )}
                      {buddy.phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{buddy.phone}</span>
                        </span>
                      )}
                    </div>

                    {isPending ? (
                      <p className="text-[10px] text-amber-800 bg-amber-100/50 p-1.5 rounded-lg border border-amber-200/60 mt-1">
                        ⏳ Awaiting approval from {buddy.name.split(' ')[0]}. SOS triggering is locked until accepted.
                      </p>
                    ) : buddy.notes ? (
                      <p className="text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/80 mt-1">
                        📝 {buddy.notes}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteBuddy(buddy.id)}
                    disabled={deletingId === buddy.id}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 flex items-center justify-center transition-colors shrink-0"
                    title={isPending ? 'Cancel Request' : 'Unlink Friend'}
                  >
                    {deletingId === buddy.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Account Verification & Request Form */}
          {adding && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-emerald-300 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lookup FUHSI Registered Account</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setVerifiedUser(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchUser} className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Friend's Matric Number or FUHSI Email *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. FUHSI/2023/MBBS/0142 or email@fuhsi.edu.ng"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    {searching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>{searching ? 'Checking...' : 'Verify'}</span>
                  </button>
                </div>
              </form>

              {/* Verified Account Preview Card */}
              {verifiedUser && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      ✓ Registered Student Found
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-emerald-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {verifiedUser.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{verifiedUser.fullName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {verifiedUser.matricNumber || verifiedUser.email}
                      </p>
                      {verifiedUser.department && (
                        <p className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{verifiedUser.department}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-amber-900 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200/70">
                    <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>
                      An authorization request will be sent to <strong>{verifiedUser.fullName}</strong>. They must approve before link activation.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Emergency Notes / Dorm Location (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room 14 Hostel B, Asthmatic"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendBuddyRequest}
                    disabled={saving}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>{saving ? 'Sending Request...' : `Send Buddy Request to ${verifiedUser.fullName}`}</span>
                  </button>
                </div>
              )}
            </div>
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
