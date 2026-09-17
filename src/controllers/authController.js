const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const userModel = require('../models/userModel');
const { signToken } = require('../utils/jwt');
const { asyncHandler, ApiError } = require('../utils/helpers');

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(422, 'Validation failed', errors.array());

  const { email, password, fullName, phone, role, matricNumber, staffId } = req.body;

  const existing = await userModel.findByEmail(email);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  if (role !== 'student' && !staffId) {
    throw new ApiError(422, 'staffId is required for clinician, responder, and admin accounts');
  }
  if (role === 'student' && !matricNumber) {
    throw new ApiError(422, 'matricNumber is required for student accounts');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userModel.createUser({
    email, passwordHash, fullName, phone, role, matricNumber, staffId,
  });

  const token = signToken(user);
  res.status(201).json({ user, token });
});

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(422, 'Validation failed', errors.array());

  const { email, password } = req.body;
  const user = await userModel.findByEmail(email);
  if (!user || !user.is_active) throw new ApiError(401, 'Invalid email or password');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  const token = signToken(user);
  const { password_hash, ...publicUser } = user;
  res.json({ user: publicUser, token });
});

const me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

module.exports = { register, login, me };
