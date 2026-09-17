const express = require('express');
const profileController = require('../controllers/profileController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// The student's own profile — self-owned, self-editable.
router.get('/me', profileController.getMyProfile);
router.put('/me', profileController.upsertMyProfile);

// Clinician/responder/admin lookup of a specific student's profile.
router.get(
  '/:studentId',
  requireRole('clinician', 'responder', 'admin'),
  profileController.getStudentProfile
);

module.exports = router;
