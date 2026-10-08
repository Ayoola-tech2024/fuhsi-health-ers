const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'https://fuhsi-emergency-response-backend.onrender.com/api');

// Pre-warm the backend server quietly on page load
if (typeof window !== 'undefined') {
  const healthUrl = API_BASE.replace(/\/api$/, '') + '/health';
  fetch(healthUrl, { method: 'GET', keepalive: true }).catch(() => {});
}

function getAuthHeader() {
  const token = localStorage.getItem('fuhsi_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = 'Request failed';
    if (typeof data.error === 'string') {
      errorMsg = data.error;
    } else if (data.error && typeof data.error.message === 'string') {
      errorMsg = data.error.message;
    } else if (typeof data.message === 'string') {
      errorMsg = data.message;
    } else if (Array.isArray(data.errors)) {
      errorMsg = data.errors.map((e) => e.msg || e.message).join(', ');
    }

    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  demoLogin: (role) => request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Profile & Medical info
  getProfile: () => request('/profile'),
  getStudentProfile: (studentId) => request(`/profile/${encodeURIComponent(studentId)}`),
  updateProfile: (profileData) => request('/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // Clinical entries (Clinician verification)
  getClinicalEntries: (studentId) => request(`/clinical-entries/${studentId}`),
  createClinicalEntry: (payload) => request('/clinical-entries', { method: 'POST', body: JSON.stringify(payload) }),
  verifyClinicalEntry: (id, payload) => request(`/clinical-entries/${id}/verify`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Emergency Contacts
  getContacts: () => request('/contacts'),
  createContact: (contact) => request('/contacts', { method: 'POST', body: JSON.stringify(contact) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // Trusted Friends / Buddies (Proxy SOS)
  getBuddies: () => request('/buddies'),
  getIncomingBuddies: () => request('/buddies/incoming'),
  lookupBuddy: (query) => request(`/buddies/lookup?query=${encodeURIComponent(query)}`),
  createBuddy: (payload) => request('/buddies', { method: 'POST', body: JSON.stringify(payload) }),
  respondBuddyRequest: (id, action) => request(`/buddies/${id}/respond`, { method: 'POST', body: JSON.stringify({ action }) }),
  deleteBuddy: (id) => request(`/buddies/${id}`, { method: 'DELETE' }),

  // Facilities
  getFacilities: (coords) => request(`/facilities${coords?.latitude && coords?.longitude ? `?lat=${coords.latitude}&lng=${coords.longitude}` : ''}`),
  getNearestFacility: (lat, lng) => request(`/facilities/nearest?lat=${lat}&lng=${lng}`),

  // Incidents / SOS lifecycle
  triggerSOS: (payload) => request('/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  getIncident: (id) => request(`/incidents/${id}`),
  listIncidents: (status) => request(`/incidents${status ? `?status=${status}` : ''}`),
  updateIncidentStatus: (id, payload) => request(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateIncidentLocation: (id, coords) => request(`/incidents/${id}/location`, { method: 'POST', body: JSON.stringify(coords) }),

  // Doctor bookings
  createBooking: (payload) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  listBookings: () => request('/bookings'),

  // Campus responders / first-aiders
  listResponders: () => request('/bookings/responders'),

  // Notifications (user's personal alerts)
  listNotifications: () => request('/incidents?status=reported'),
};
