const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fuhsi_emergency_secret_key_default_2026';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
