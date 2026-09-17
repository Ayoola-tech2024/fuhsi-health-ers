const express = require('express');
const incidentController = require('../controllers/incidentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// SOS trigger — any authenticated student.
router.post('/', requireRole('student'), incidentController.triggerSOS);

router.get('/', incidentController.listIncidents);
router.get('/:id', incidentController.getIncident);
router.get('/:id/logs', incidentController.getLogs);
router.get('/:id/locations', incidentController.getLocationHistory);

// Live location ping — reporting student only (enforced in controller).
router.post('/:id/location', incidentController.addLocation);

// Status transitions — triage/dispatch/resolve — clinician/responder/admin.
router.patch(
  '/:id/status',
  requireRole('clinician', 'responder', 'admin'),
  incidentController.updateStatus
);

module.exports = router;
