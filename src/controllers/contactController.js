const contactModel = require('../models/contactModel');
const { asyncHandler, ApiError } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  const contacts = await contactModel.listForStudent(req.user.id);
  res.json({ contacts });
});

const create = asyncHandler(async (req, res) => {
  const { name, relationship, phone, priority } = req.body;
  if (!name || !phone) throw new ApiError(422, 'name and phone are required');
  const contact = await contactModel.create(req.user.id, { name, relationship, phone, priority });
  res.status(201).json({ contact });
});

const update = asyncHandler(async (req, res) => {
  const contact = await contactModel.update(req.user.id, req.params.id, req.body);
  if (!contact) throw new ApiError(404, 'Contact not found');
  res.json({ contact });
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await contactModel.remove(req.user.id, req.params.id);
  if (!deleted) throw new ApiError(404, 'Contact not found');
  res.status(204).send();
});

module.exports = { list, create, update, remove };
