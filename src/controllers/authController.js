const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const userModel = require('../models/userModel');
const profileModel = require('../models/profileModel');
const { signToken } = require('../utils/jwt');
const { asyncHandler, ApiError } = require('../utils/helpers');

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(422, 'Validation failed', errors.array());

  const { email, password, fullName, phone, role = 'student', matricNumber, staffId, department } = req.body;

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

  let profile = null;
  if (role === 'student') {
    try {
      profile = await profileModel.upsertProfile(user.id, { department });
    } catch (e) {
      console.warn('Initial student profile creation error:', e.message);
    }
  }

  const token = signToken(user);
  res.status(201).json({ user, profile, token });
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
  
  // Attach student profile if applicable
  let profile = null;
  if (user.role === 'student') {
    profile = await profileModel.getProfile(user.id);
  }

  res.json({ user: publicUser, profile, token });
});

const DEMO_ACCOUNTS = {
  student: {
    email: 'student@fuhsi.edu.ng',
    fullName: 'Chioma Okeke',
    phone: '+234 803 123 4567',
    role: 'student',
    matricNumber: 'FUHSI/2023/MBBS/0142',
    staffId: null,
    profile: {
      bloodGroup: 'O+',
      genotype: 'AA',
      allergies: ['Penicillin'],
      department: 'Medicine & Surgery (MBBS)',
      hostelOrAddress: 'Hostel A, Room 104'
    }
  },
  student1: {
    email: 'student@fuhsi.edu.ng',
    fullName: 'Chioma Okeke',
    phone: '+234 803 123 4567',
    role: 'student',
    matricNumber: 'FUHSI/2023/MBBS/0142',
    staffId: null,
    profile: {
      bloodGroup: 'O+',
      genotype: 'AA',
      allergies: ['Penicillin'],
      department: 'Medicine & Surgery (MBBS)',
      hostelOrAddress: 'Hostel A, Room 104'
    }
  },
  student2: {
    email: 'student2@fuhsi.edu.ng',
    fullName: 'Emeka Adeyemi',
    phone: '+234 802 345 6789',
    role: 'student',
    matricNumber: 'FUHSI/2023/NURS/0088',
    staffId: null,
    profile: {
      bloodGroup: 'A+',
      genotype: 'AS',
      allergies: ['Peanuts'],
      department: 'Nursing Science',
      hostelOrAddress: 'Hostel B, Room 212'
    }
  },
  student3: {
    email: 'student3@fuhsi.edu.ng',
    fullName: 'Amina Bello',
    phone: '+234 805 678 9012',
    role: 'student',
    matricNumber: 'FUHSI/2023/MLS/0055',
    staffId: null,
    profile: {
      bloodGroup: 'B+',
      genotype: 'AA',
      allergies: ['Sulfa drugs'],
      department: 'Medical Laboratory Science',
      hostelOrAddress: 'Hostel C, Room 305'
    }
  },
  doctor: {
    email: 'doctor@fuhsi.edu.ng',
    fullName: 'Dr. Olawale Babatunde',
    phone: '+234 802 987 6543',
    role: 'clinician',
    matricNumber: null,
    staffId: 'DOC-FUHSI-088'
  },
  clinician: {
    email: 'doctor@fuhsi.edu.ng',
    fullName: 'Dr. Olawale Babatunde',
    phone: '+234 802 987 6543',
    role: 'clinician',
    matricNumber: null,
    staffId: 'DOC-FUHSI-088'
  },
  responder: {
    email: 'responder@fuhsi.edu.ng',
    fullName: 'Officer Tunde Williams',
    phone: '+234 814 555 0199',
    role: 'responder',
    matricNumber: null,
    staffId: 'EMS-FUHSI-012'
  },
  ems: {
    email: 'responder@fuhsi.edu.ng',
    fullName: 'Officer Tunde Williams',
    phone: '+234 814 555 0199',
    role: 'responder',
    matricNumber: null,
    staffId: 'EMS-FUHSI-012'
  }
};

const demoLogin = asyncHandler(async (req, res) => {
  const { role = 'student' } = req.body;
  const config = DEMO_ACCOUNTS[role.toLowerCase()] || DEMO_ACCOUNTS.student;

  let user = await userModel.findByEmail(config.email);
  if (!user) {
    const passwordHash = await bcrypt.hash('password123', 10);
    user = await userModel.createUser({
      email: config.email,
      passwordHash,
      fullName: config.fullName,
      phone: config.phone,
      role: config.role,
      matricNumber: config.matricNumber,
      staffId: config.staffId
    });
  }

  let profile = null;
  if (user.role === 'student') {
    if (config.profile) {
      profile = await profileModel.upsertProfile(user.id, config.profile);
    } else {
      profile = await profileModel.getProfile(user.id);
    }
  }

  const token = signToken(user);
  const { password_hash, ...publicUser } = user;
  res.json({ user: publicUser, profile, token });
});

const me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  
  let profile = null;
  if (user.role === 'student') {
    profile = await profileModel.getProfile(user.id);
  }

  res.json({ user, profile });
});

module.exports = { register, login, demoLogin, me };
