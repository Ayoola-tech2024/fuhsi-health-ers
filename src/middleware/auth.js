const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('../utils/helpers');

// Verifies the Bearer token and attaches { id, role, email } to req.user
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

// Restricts a route to specific roles, e.g. requireRole('clinician', 'admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

// Allows a student to act on their own record OR a privileged role to act on any record.
// studentIdParam is the route/body field holding the target student id.
function requireSelfOrRole(studentIdParam, ...roles) {
  return (req, res, next) => {
    const targetId = req.params[studentIdParam] || req.body[studentIdParam];
    if (req.user.id === targetId || roles.includes(req.user.role)) {
      return next();
    }
    next(new ApiError(403, 'Not authorized for this student record'));
  };
}

module.exports = { requireAuth, requireRole, requireSelfOrRole };
