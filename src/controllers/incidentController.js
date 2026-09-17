const incidentModel = require('../models/incidentModel');
const facilityModel = require('../models/facilityModel');
const contactModel = require('../models/contactModel');
const userModel = require('../models/userModel');
const notificationModel = require('../models/notificationModel');
const { asyncHandler, ApiError, haversineKm } = require('../utils/helpers');

const SEARCH_RADIUS_KM = Number(process.env.NEAREST_FACILITY_SEARCH_RADIUS_KM) || 15;

async function findNearestFacility(latitude, longitude) {
  const facilities = await facilityModel.listActive();
  if (facilities.length === 0) return null;

  let nearest = null;
  let nearestDist = Infinity;
  for (const f of facilities) {
    const dist = haversineKm(latitude, longitude, f.latitude, f.longitude);
    if (dist < nearestDist) {
      nearest = f;
      nearestDist = dist;
    }
  }
  if (nearestDist > SEARCH_RADIUS_KM) {
    // Still return the nearest even if outside the "ideal" radius — better
    // than sending no facility during an emergency.
    return { ...nearest, distanceKm: nearestDist, outsideIdealRadius: true };
  }
  return { ...nearest, distanceKm: nearestDist, outsideIdealRadius: false };
}

// POST /api/incidents  — the SOS trigger
const triggerSOS = asyncHandler(async (req, res) => {
  const { latitude, longitude, description } = req.body;
  if (latitude === undefined || longitude === undefined) {
    throw new ApiError(422, 'latitude and longitude are required');
  }

  const nearest = await findNearestFacility(latitude, longitude);

  const incident = await incidentModel.createIncident({
    studentId: req.user.id,
    latitude,
    longitude,
    description,
    nearestFacilityId: nearest ? nearest.id : null,
  });

  // Notify responders/clinicians so someone triages immediately.
  const responders = await userModel.listByRole('responder');
  const clinicians = await userModel.listByRole('clinician');
  const recipientIds = [...responders, ...clinicians].map((u) => u.id);
  const student = await userModel.findById(req.user.id);

  await notificationModel.notifyMany(recipientIds, {
    incidentId: incident.id,
    channel: 'push',
    message: `SOS from ${student.full_name}: new emergency incident reported.`,
  });

  // Notify the student's own trusted contacts. emergency_contacts stores
  // name/phone, not a user_id, since trusted contacts (parents/guardians)
  // typically aren't platform accounts — so this goes through an SMS
  // provider keyed on `phone` rather than notificationModel's user_id path.
  const contacts = await contactModel.listForStudent(req.user.id);
  for (const contact of contacts) {
    // TODO: wire to SMS provider using contact.phone
    console.log(`[stub] would SMS ${contact.name} (${contact.phone}) about incident ${incident.id}`);
  }

  res.status(201).json({
    incident,
    nearestFacility: nearest,
  });
});

const getIncident = asyncHandler(async (req, res) => {
  const incident = await incidentModel.findById(req.params.id);
  if (!incident) throw new ApiError(404, 'Incident not found');

  if (req.user.role === 'student' && incident.student_id !== req.user.id) {
    throw new ApiError(403, 'Not authorized to view this incident');
  }

  res.json({ incident });
});

const listIncidents = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const incidents = await incidentModel.listForUser({
    role: req.user.role,
    userId: req.user.id,
    status,
  });
  res.json({ incidents });
});

// PATCH /api/incidents/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const { status, notes, responderId, triageNotes } = req.body;
  if (!status) throw new ApiError(422, 'status is required');

  const result = await incidentModel.updateStatus(req.params.id, req.user.id, status, {
    notes, responderId, triageNotes,
  });

  if (result.error === 'not_found') throw new ApiError(404, 'Incident not found');
  if (result.error === 'invalid_transition') {
    throw new ApiError(409, `Cannot move incident from '${result.from}' to '${result.to}'`);
  }

  const incident = result.incident;

  await notificationModel.queue({
    userId: incident.student_id,
    incidentId: incident.id,
    channel: 'push',
    message: `Your emergency incident status is now: ${incident.status.replace('_', ' ')}.`,
  }).then((n) => notificationModel.dispatch(n));

  res.json({ incident });
});

// POST /api/incidents/:id/location — live location ping during an active incident
const addLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude === undefined || longitude === undefined) {
    throw new ApiError(422, 'latitude and longitude are required');
  }
  const incident = await incidentModel.findById(req.params.id);
  if (!incident) throw new ApiError(404, 'Incident not found');
  if (incident.student_id !== req.user.id) {
    throw new ApiError(403, 'Only the reporting student can update this incident location');
  }

  const ping = await incidentModel.addLocationPing(req.params.id, latitude, longitude);
  res.status(201).json({ location: ping });
});

const getLocationHistory = asyncHandler(async (req, res) => {
  const history = await incidentModel.locationHistory(req.params.id);
  res.json({ locations: history });
});

const getLogs = asyncHandler(async (req, res) => {
  const logEntries = await incidentModel.logs(req.params.id);
  res.json({ logs: logEntries });
});

module.exports = {
  triggerSOS,
  getIncident,
  listIncidents,
  updateStatus,
  addLocation,
  getLocationHistory,
  getLogs,
};
