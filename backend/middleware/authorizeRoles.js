// Role-based authorization. Must run after auth.js so req.user is populated.
// Kept separate from authentication: auth.js answers "who are you" (401 if unknown),
// this answers "are you allowed" (403 if known but not permitted).
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const role = req.user.role || 'doctor';
  if (role === 'demo') {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) && allowedRoles.includes('doctor')) {
      return next();
    }
    return res.status(403).json({ message: 'The public demo account is read-only' });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action' });
  }

  next();
};

module.exports = authorizeRoles;
