import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User, 
  Heart, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Phone, 
  Check, 
  Save, 
  Clock, 
  FileText,
  Building,
  Mail,
  Edit2,
  AlertCircle
} from 'lucide-react';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    blood_group: '',
    genotype: '',
    allergies: [],
    chronic_conditions: [],
    current_medications: [],
    department: '',
    hostel_or_address: '',
    self_reported_notes: '',
  });

  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: 'Parent' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [profRes, contactRes] = await Promise.all([
          api.getProfile().catch(() => ({ profile: null })),
          api.getContacts().catch(() => ({ contacts: [] }))
        ]);

        if (isMounted) {
          if (profRes && profRes.profile) {
            setProfile(prev => ({
              ...prev,
              ...profRes.profile,
              allergies: Array.isArray(profRes.profile.allergies) ? profRes.profile.allergies : [],
              chronic_conditions: Array.isArray(profRes.profile.chronic_conditions) ? profRes.profile.chronic_conditions : [],
              current_medications: Array.isArray(profRes.profile.current_medications) ? profRes.profile.current_medications : [],
            }));
          }
          if (contactRes && Array.isArray(contactRes.contacts)) {
            setContacts(contactRes.contacts);
          }
        }
      } catch (err) {
        console.warn('Profile load notice:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateProfile(profile);
      if (res && res.profile) {
        setProfile(prev => ({ ...prev, ...res.profile }));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) return;

    try {
      const res = await api.createContact(newContact);
      if (res && res.contact) {
        setContacts(prev => [...prev, res.contact]);
      } else {
        const fresh = await api.getContacts();
        if (fresh && fresh.contacts) setContacts(fresh.contacts);
      }
      setNewContact({ name: '', phone: '', relationship: 'Parent' });
      setShowAddContact(false);
    } catch (err) {
      alert(err.message || 'Failed to add contact');
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      await api.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.warn('Delete contact error:', err.message);
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  const displayUserFullName = user?.full_name || 'FUHSI Student Record';
  const displayUserSub = user?.matric_number || user?.email || 'Live Database Session';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* Top Header */}
      <div className="bg-[#0D2040] text-white pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Student Medical Profile</h1>
              <p className="text-xs text-slate-300">
                {displayUserFullName} • {displayUserSub}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/20"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300 border border-white/10">
                Active Session
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Health Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-600" />
                  <span>Emergency Health Records</span>
                </h3>
                {savedSuccess && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved to Database</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Group</label>
                  <select
                    value={profile.blood_group || ''}
                    onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Genotype</label>
                  <select
                    value={profile.genotype || ''}
                    onChange={(e) => setProfile({ ...profile, genotype: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Select</option>
                    {['AA', 'AS', 'SS', 'AC', 'SC'].map(gt => (
                      <option key={gt} value={gt}>{gt}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hostel Room / Campus Address</label>
                  <input
                    type="text"
                    value={profile.hostel_or_address || ''}
                    onChange={(e) => setProfile({ ...profile, hostel_or_address: e.target.value })}
                    placeholder="e.g. Hall 2, Room 102"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Known Allergies */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Known Allergies (Food & Drug)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts, Sulfa drugs (or leave empty)"
                  value={Array.isArray(profile.allergies) ? profile.allergies.join(', ') : profile.allergies || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    setProfile({ ...profile, allergies: text ? text.split(',').map(s => s.trim()) : [] });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Chronic Conditions & Medications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chronic Medical Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Asthma, Sickle Cell (or None)"
                    value={Array.isArray(profile.chronic_conditions) ? profile.chronic_conditions.join(', ') : profile.chronic_conditions || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      setProfile({ ...profile, chronic_conditions: text ? text.split(',').map(s => s.trim()) : [] });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Daily Medications</label>
                  <input
                    type="text"
                    placeholder="e.g. Salbutamol Inhaler (or None)"
                    value={Array.isArray(profile.current_medications) ? profile.current_medications.join(', ') : profile.current_medications || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      setProfile({ ...profile, current_medications: text ? text.split(',').map(s => s.trim()) : [] });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department / Faculty</label>
                <input
                  type="text"
                  placeholder="e.g. Medicine & Surgery, Nursing Science"
                  value={profile.department || ''}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Self-reported Emergency Notes */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Special Medical Notes for Responders</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Wears medical bracelet, carries epinephrine auto-injector..."
                  value={profile.self_reported_notes || ''}
                  onChange={(e) => setProfile({ ...profile, self_reported_notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  Shared strictly with FUHSI emergency responders during an active SOS.
                </span>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saving ? 'Saving...' : savedSuccess ? 'Saved' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Emergency Contacts (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Trusted Contacts ({contacts.length})</span>
                </h3>
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {showAddContact && (
                <form onSubmit={handleAddContact} className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <input
                    type="text"
                    placeholder="Contact Name (e.g. Parent / Roommate)"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (+234...)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                    required
                  />
                  <div className="flex justify-between items-center pt-1">
                    <select
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Roommate">Roommate</option>
                      <option value="Friend">Friend</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      Save Contact
                    </button>
                  </div>
                </form>
              )}

              {contacts.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                  <Phone className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">No emergency contacts yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Add family, guardians, or roommates to be notified when you trigger an emergency alert.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {contacts.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{c.phone}</div>
                        <span className="text-[9px] text-slate-400 font-medium">Relationship: {c.relationship}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
