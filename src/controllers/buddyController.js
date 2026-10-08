const buddyModel = require('../models/buddyModel');
const { asyncHandler, ApiError } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  const buddies = await buddyModel.listForStudent(req.user.id);
  res.json({ buddies });
});

const create = asyncHandler(async (req, res) => {
  const { name, phone, matricNumber, bloodGroup, allergies, notes } = req.body;
  if (!name || !phone) {
    throw new ApiError(422, 'Friend name and phone number are required');
  }

  const buddy = await buddyModel.create({
    studentId: req.user.id,
    name,
    phone,
    matricNumber,
    bloodGroup,
    allergies,
    notes,
  });

  res.status(201).json({ buddy });
});

const remove = asyncHandler(async (req, res) => {
  const buddy = await buddyModel.deleteForStudent(req.params.id, req.user.id);
  if (!buddy) {
    throw new ApiError(404, 'Trusted friend not found');
  }
  res.json({ message: 'Trusted friend removed successfully', buddy });
});

module.exports = { list, create, remove };
