const express = require('express');
const clinicalController = require('../controllers/clinicalController');
const { requireAuth, requireRole, requireSelfOrRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Clinicians (and responders, for emergency overrides) create entries.
router.post('/', requireRole('clinician', 'responder'), clinicalController.createEntry);

// Student can view their own entries; clinical/response/admin roles can view any.
router.get(
  '/student/:studentId',
  requireSelfOrRole('studentId', 'clinician', 'responder', 'admin'),
  clinicalController.listForStudent
);

router.patch('/:id/verify', requireRole('clinician'), clinicalController.verifyEntry);
router.get('/:id/audit', requireRole('clinician', 'admin'), clinicalController.getAuditTrail);

module.exports = router;
