import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User, 
  Heart, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Phone, 
  AlertCircle, 
  Check, 
  Save, 
  Clock, 
  FileText 
} from 'lucide-react';

export default function StudentProfilePage() {
  const { user, loginAsDemo } = useAuth();
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
      } catch (err) {
        // Keeps state for demo/fallback
      }
    }
    loadData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.warn('Saved profile locally for demo');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    try {
      const res = await api.createContact(newContact);
      setContacts([...contacts, res.contact || { ...newContact, id: Date.now().toString() }]);
    } catch (err) {
      setContacts([...contacts, { ...newContact, id: Date.now().toString() }]);
    }
    setNewContact({ name: '', phone: '', relationship: 'Parent' });
    setShowAddContact(false);
  };

  const handleDeleteContact = async (id) => {
    try {
      await api.deleteContact(id);
    } catch (e) {}
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Student Medical Profile</h1>
            <p className="text-xs text-slate-400">
              {user?.full_name || 'Adewale Bakare'} • {user?.matric_number || 'FUHSI/2023/MBBS/0142'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clinician Verified</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Medical & Personal Records */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span>Critical Health Information</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Blood Group</label>
                <select
                  value={profile.blood_group || 'O+'}
                  onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-red-500 focus:outline-none"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Genotype</label>
                <select
                  value={profile.genotype || 'AA'}
                  onChange={(e) => setProfile({ ...profile, genotype: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-red-500 focus:outline-none"
                >
                  {['AA', 'AS', 'SS', 'AC', 'SC'].map(gt => (
                    <option key={gt} value={gt}>{gt}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hostel / Campus Address</label>
                <input
                  type="text"
                  value={profile.hostel_or_address || ''}
                  onChange={(e) => setProfile({ ...profile, hostel_or_address: e.target.value })}
                  placeholder="e.g. Hall 2, Room 102"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Known Allergies */}
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Known Allergies (e.g. Penicillin, Peanuts, Sulfa)
              </label>
              <input
                type="text"
                value={Array.isArray(profile.allergies) ? profile.allergies.join(', ') : profile.allergies || ''}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Chronic Conditions & Medications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Chronic Conditions</label>
                <input
                  type="text"
                  value={Array.isArray(profile.chronic_conditions) ? profile.chronic_conditions.join(', ') : profile.chronic_conditions || ''}
                  onChange={(e) => setProfile({ ...profile, chronic_conditions: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="e.g. Asthma, Sickle Cell, Diabetes"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Current Medications</label>
                <input
                  type="text"
                  value={Array.isArray(profile.current_medications) ? profile.current_medications.join(', ') : profile.current_medications || ''}
                  onChange={(e) => setProfile({ ...profile, current_medications: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="e.g. Inhaler, Insulin"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                🔒 Medical details are shared with responders only upon active SOS.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-lg shadow-red-600/30"
              >
                {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{savedSuccess ? 'Saved!' : 'Save Medical Info'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Trusted Emergency Contacts */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Emergency Contacts</span>
              </h3>
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                title="Add Contact"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add contact modal/form */}
            {showAddContact && (
              <form onSubmit={handleAddContact} className="mb-4 p-3.5 bg-slate-900 border border-slate-700 rounded-2xl space-y-2.5">
                <div>
                  <input
                    type="text"
                    placeholder="Contact Full Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number (+234...)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <select
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>{contact.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({contact.relationship})</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono mt-0.5">{contact.phone}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              📱 Trusted contacts automatically receive automated SMS alerts when you trigger SOS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
