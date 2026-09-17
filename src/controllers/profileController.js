const profileModel = require('../models/profileModel');
const { asyncHandler } = require('../utils/helpers');

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileModel.getProfile(req.user.id);
  res.json({ profile: profile || null });
});

const getStudentProfile = asyncHandler(async (req, res) => {
  const profile = await profileModel.getProfile(req.params.studentId);
  res.json({ profile: profile || null });
});

const upsertMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileModel.upsertProfile(req.user.id, req.body);
  res.json({ profile });
});

module.exports = { getMyProfile, getStudentProfile, upsertMyProfile };
