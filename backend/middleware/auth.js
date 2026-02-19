// JWT auth middleware to protect routes.
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const doctor = await Doctor.findById(payload.id).select('-passwordHash');

    if (!doctor) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.doctor = doctor;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;