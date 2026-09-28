const facilityModel = require('../models/facilityModel');
const { asyncHandler, ApiError } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
  const facilities = await facilityModel.listActive();
  res.json({ facilities });
});

const create = asyncHandler(async (req, res) => {
  const { name, facilityType, latitude, longitude, address, phone } = req.body;
  if (!name || latitude === undefined || longitude === undefined) {
    throw new ApiError(422, 'name, latitude, and longitude are required');
  }
  const facility = await facilityModel.create({ name, facilityType, latitude, longitude, address, phone });
  res.status(201).json({ facility });
});

module.exports = { list, create };
