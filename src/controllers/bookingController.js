const bookingModel = require('../models/bookingModel');
const { ApiError } = require('../utils/helpers');

// POST /api/bookings — create a booking (student only)
async function createBooking(req, res, next) {
  try {
    const { physician, appointmentSlot, notes } = req.body;
    if (!physician || !appointmentSlot) {
      throw new ApiError(400, 'physician and appointmentSlot are required');
    }
    const booking = await bookingModel.create({
      studentId: req.user.id,
      physician,
      appointmentSlot,
      notes,
    });
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings — list bookings for the authenticated student
async function listBookings(req, res, next) {
  try {
    const bookings = await bookingModel.listForStudent(req.user.id);
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/responders — list all active responders for volunteers modal
async function listResponders(req, res, next) {
  try {
    const responders = await bookingModel.listResponders();
    res.json({ responders });
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, listBookings, listResponders };
