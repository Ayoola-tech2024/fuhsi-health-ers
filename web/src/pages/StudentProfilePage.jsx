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
  Edit2
} from 'lucide-react';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    blood_group: 'O+',
    genotype: 'AA',
    allergies: ['Penicillin', 'Peanuts'],
    chronic_conditions: ['Mild Asthmatic'],
    current_medications: ['Salbutamol Inhaler (PRN)'],
    department: 'Department of Medicine & Surgery',
    hostel_or_address: 'Hall 2, Room 214, Main Campus',
    self_reported_notes: 'Wears medical alert bracelet.',
  });

  const [contacts, setContacts] = useState([
    { id: '1', name: 'Alhaji Bakare (Father)', phone: '+234 803 555 0101', relationship: 'Parent', priority: 1 },
    { id: '2', name: 'Mrs. Aminat Bakare (Mother)', phone: '+234 802 444 0202', relationship: 'Parent', priority: 2 },
  ]);

  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: 'Parent' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getProfile();
        if (res.profile) setProfile(res.profile);
        const contactRes = await api.getContacts();
        if (contactRes.contacts) setContacts(contactRes.contacts);
      } catch (err) {}
    }
    loadData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(profile);
    } catch (err) {}
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    setSaving(false);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    setContacts([...contacts, { ...newContact, id: Date.now().toString() }]);
    setNewContact({ name: '', phone: '', relationship: 'Parent' });
    setShowAddContact(false);
  };

  const handleDeleteContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

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
                {user?.full_name || 'Adewale Bakare'} • {user?.matric_number || 'FUHSI/2023/MBBS/0142'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Health Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center space-x-2">
                <Heart className="w-4 h-4 text-red-600" />
                <span>Emergency Health Records</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Group</label>
                  <select
                    value={profile.blood_group || 'O+'}
                    onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:border-red-500 focus:outline-none"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Genotype</label>
                  <select
                    value={profile.genotype || 'AA'}
                    onChange={(e) => setProfile({ ...profile, genotype: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:border-red-500 focus:outline-none"
                  >
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
                  value={Array.isArray(profile.allergies) ? profile.allergies.join(', ') : profile.allergies || ''}
                  onChange={(e) => setProfile({ ...profile, allergies: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Chronic Conditions & Medications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chronic Medical Conditions</label>
                  <input
                    type="text"
                    value={Array.isArray(profile.chronic_conditions) ? profile.chronic_conditions.join(', ') : profile.chronic_conditions || ''}
                    onChange={(e) => setProfile({ ...profile, chronic_conditions: e.target.value.split(',').map(s => s.trim()) })}
                    placeholder="e.g. Asthma, Sickle Cell"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Daily Medications</label>
                  <input
                    type="text"
                    value={Array.isArray(profile.current_medications) ? profile.current_medications.join(', ') : profile.current_medications || ''}
                    onChange={(e) => setProfile({ ...profile, current_medications: e.target.value.split(',').map(s => s.trim()) })}
                    placeholder="e.g. Salbutamol Inhaler"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  Shared only with emergency responders during an active SOS.
                </span>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savedSuccess ? 'Saved' : 'Save Changes'}</span>
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
                    placeholder="Contact Name (e.g. Parent)"
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
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
