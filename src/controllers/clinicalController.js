const clinicalModel = require('../models/clinicalModel');
const { asyncHandler, ApiError } = require('../utils/helpers');

// Clinician (or responder, under emergency override) creates a clinical entry for a student.
const createEntry = asyncHandler(async (req, res) => {
  const { studentId, entryType, content, isEmergencyOverride, overrideReason } = req.body;
  if (!studentId || !entryType || !content) {
    throw new ApiError(422, 'studentId, entryType, and content are required');
  }
  if (isEmergencyOverride && !overrideReason) {
    throw new ApiError(422, 'overrideReason is required when using an emergency override');
  }

  const entry = await clinicalModel.createEntry({
    studentId,
    enteredBy: req.user.id,
    entryType,
    content,
    isEmergencyOverride,
    overrideReason,
  });
  res.status(201).json({ entry });
});

const listForStudent = asyncHandler(async (req, res) => {
  const entries = await clinicalModel.listForStudent(req.params.studentId);
  res.json({ entries });
});

const verifyEntry = asyncHandler(async (req, res) => {
  const { status, note } = req.body; // status: 'verified' | 'rejected'
  if (!['verified', 'rejected'].includes(status)) {
    throw new ApiError(422, "status must be 'verified' or 'rejected'");
  }
  const entry = await clinicalModel.findById(req.params.id);
  if (!entry) throw new ApiError(404, 'Clinical entry not found');

  const updated = await clinicalModel.setVerification(req.params.id, req.user.id, status, note);
  res.json({ entry: updated });
});

const getAuditTrail = asyncHandler(async (req, res) => {
  const trail = await clinicalModel.auditTrail(req.params.id);
  res.json({ auditTrail: trail });
});

module.exports = { createEntry, listForStudent, verifyEntry, getAuditTrail };
