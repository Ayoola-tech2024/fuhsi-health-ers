const facilityModel = require('../models/facilityModel');
const { asyncHandler, ApiError, haversineKm } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const facilities = await facilityModel.listActive();

  if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    const userLat = Number(lat);
    const userLng = Number(lng);
    const withDistance = facilities.map((f) => {
      const dist = haversineKm(userLat, userLng, Number(f.latitude), Number(f.longitude));
      return {
        ...f,
        distanceKm: Number(dist.toFixed(2)),
        distanceMeters: Math.round(dist * 1000),
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    return res.json({ facilities: withDistance, userCoords: { latitude: userLat, longitude: userLng } });
  }

  res.json({ facilities });
});

const getNearest = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
    throw new ApiError(422, 'Valid lat and lng query parameters are required');
  }
  const userLat = Number(lat);
  const userLng = Number(lng);
  const facilities = await facilityModel.listActive();
  if (facilities.length === 0) {
    return res.json({ facility: null });
  }

  let nearest = null;
  let minDistance = Infinity;
  for (const f of facilities) {
    const dist = haversineKm(userLat, userLng, Number(f.latitude), Number(f.longitude));
    if (dist < minDistance) {
      minDistance = dist;
      nearest = f;
    }
  }

  res.json({
    facility: nearest ? { ...nearest, distanceKm: Number(minDistance.toFixed(2)) } : null,
  });
});

const create = asyncHandler(async (req, res) => {
  const { name, facilityType, latitude, longitude, address, phone } = req.body;
  if (!name || latitude === undefined || longitude === undefined) {
    throw new ApiError(422, 'name, latitude, and longitude are required');
  }
  const facility = await facilityModel.create({ name, facilityType, latitude, longitude, address, phone });
  res.status(201).json({ facility });
});

module.exports = { list, getNearest, create };
