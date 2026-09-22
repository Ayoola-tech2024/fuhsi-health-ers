const express = require('express');
const bookingController = require('../controllers/bookingController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All booking routes require login
router.use(requireAuth);

// GET /api/bookings/responders — any authenticated user can view responders
router.get('/responders', bookingController.listResponders);

// POST /api/bookings — students create bookings
router.post('/', requireRole('student'), bookingController.createBooking);

// GET /api/bookings — students view their own bookings
router.get('/', requireRole('student'), bookingController.listBookings);

module.exports = router;
