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
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Profile & Medical info
  getProfile: () => request('/profile'),
  updateProfile: (profileData) => request('/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // Clinical entries (Clinician verification)
  getClinicalEntries: (studentId) => request(`/clinical-entries/${studentId}`),
  createClinicalEntry: (payload) => request('/clinical-entries', { method: 'POST', body: JSON.stringify(payload) }),
  verifyClinicalEntry: (id, payload) => request(`/clinical-entries/${id}/verify`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Emergency Contacts
  getContacts: () => request('/contacts'),
  createContact: (contact) => request('/contacts', { method: 'POST', body: JSON.stringify(contact) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // Facilities
  getFacilities: () => request('/facilities'),
  getNearestFacility: (lat, lng) => request(`/facilities/nearest?lat=${lat}&lng=${lng}`),

  // Incidents / SOS lifecycle
  triggerSOS: (payload) => request('/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  getIncident: (id) => request(`/incidents/${id}`),
  listIncidents: (status) => request(`/incidents${status ? `?status=${status}` : ''}`),
  updateIncidentStatus: (id, payload) => request(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateIncidentLocation: (id, coords) => request(`/incidents/${id}/location`, { method: 'POST', body: JSON.stringify(coords) }),
};
