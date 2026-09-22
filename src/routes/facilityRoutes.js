const express = require('express');
const facilityController = require('../controllers/facilityController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Publicly visible so students, visitors, and responders can locate health facilities immediately
router.get('/', facilityController.list);

// Admin-only facility creation
router.post('/', requireAuth, requireRole('admin'), facilityController.create);

module.exports = router;
