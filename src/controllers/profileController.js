const profileModel = require('../models/profileModel');
const { asyncHandler, ApiError } = require('../utils/helpers');

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileModel.getProfile(req.user.id);
  res.json({ profile: profile || null });
});

const getStudentProfile = asyncHandler(async (req, res) => {
  const query = req.params.studentId;
  const data = await profileModel.getStudentWithProfile(query);
  if (!data) {
    const profile = await profileModel.getProfile(query);
    if (!profile) throw new ApiError(404, 'Student record not found');
    return res.json({ profile });
  }
  res.json({ student: data, profile: data });
});

const upsertMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileModel.upsertProfile(req.user.id, req.body);
  res.json({ profile });
});

module.exports = { getMyProfile, getStudentProfile, upsertMyProfile };
