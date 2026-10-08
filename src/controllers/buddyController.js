const buddyModel = require('../models/buddyModel');
const { asyncHandler, ApiError } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  const buddies = await buddyModel.listForStudent(req.user.id);
  res.json({ buddies });
});

const listIncoming = asyncHandler(async (req, res) => {
  const incoming = await buddyModel.listIncomingRequests(req.user.id);
  res.json({ incoming });
});

const lookup = asyncHandler(async (req, res) => {
  const query = req.query.query || req.query.identifier;
  if (!query || !query.trim()) {
    throw new ApiError(400, 'Please provide a Matric Number, FUHSI Email, or Phone Number to search.');
  }

  const found = await buddyModel.lookupStudentAccount(query);
  if (!found) {
    throw new ApiError(404, `No registered student found matching "${query}". Your friend must create an active account on FUHSI ERS first.`);
  }

  if (found.id === req.user.id) {
    throw new ApiError(400, 'You cannot link your own account as an emergency buddy.');
  }

  // Check if already in list
  const existingList = await buddyModel.listForStudent(req.user.id);
  const alreadyAdded = existingList.some(b => b.buddy_user_id === found.id || (b.matric_number && b.matric_number.toLowerCase() === (found.matric_number || '').toLowerCase()));
  if (alreadyAdded) {
    throw new ApiError(400, `${found.full_name} is already in your Trusted Friends list.`);
  }

  res.json({
    found: true,
    user: {
      id: found.id,
      fullName: found.full_name,
      matricNumber: found.matric_number,
      department: found.department || 'FUHSI Student',
      phone: found.phone || null,
      email: found.email,
      isVerified: true
    }
  });
});

const create = asyncHandler(async (req, res) => {
  const { buddyUserId, identifier, notes } = req.body;
  let targetId = buddyUserId;

  if (!targetId && identifier) {
    const found = await buddyModel.lookupStudentAccount(identifier);
    if (!found) {
      throw new ApiError(404, `No registered FUHSI account found matching "${identifier}". Your friend must be registered.`);
    }
    targetId = found.id;
  }

  if (!targetId) {
    throw new ApiError(422, 'Target verified student account ID is required.');
  }

  if (targetId === req.user.id) {
    throw new ApiError(400, 'You cannot link your own account as an emergency buddy.');
  }

  const buddy = await buddyModel.createBuddyRequest({
    studentId: req.user.id,
    buddyUserId: targetId,
    notes: notes || null
  });

  res.status(201).json({
    message: 'Buddy link request sent successfully. Awaiting approval from your friend.',
    buddy
  });
});

const respond = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'accept' | 'decline'
  if (!action || !['accept', 'decline'].includes(action)) {
    throw new ApiError(400, 'Action must be "accept" or "decline".');
  }

  const result = await buddyModel.respondToRequest({
    requestId: req.params.id,
    studentId: req.user.id,
    action
  });

  res.json({
    message: action === 'accept' ? 'Emergency buddy request approved.' : 'Emergency buddy request declined.',
    result
  });
});

const remove = asyncHandler(async (req, res) => {
  const buddy = await buddyModel.deleteForStudent(req.params.id, req.user.id);
  if (!buddy) {
    throw new ApiError(404, 'Trusted friend not found');
  }
  res.json({ message: 'Trusted friend removed successfully', buddy });
});

module.exports = { list, listIncoming, lookup, create, respond, remove };
