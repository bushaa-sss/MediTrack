// Auth controller for doctor registration and login.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

const isClinicEmail = (email) => /@clinic\.com$/i.test(email || '');
const isValidUsername = (username) => /^[a-zA-Z0-9._-]{3,20}$/.test(username || '');

const signToken = (doctorId) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: doctorId }, process.env.JWT_SECRET, { expiresIn });
};

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, password, timezone } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, username, email, and password are required' });
    }

    if (!isClinicEmail(email)) {
      return res.status(400).json({ message: 'Email must end with @clinic.com' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({ message: 'Username must be 3-20 characters (letters, numbers, . _ -)' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await Doctor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const existingUsername = await Doctor.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const doctor = await Doctor.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      timezone: timezone || 'UTC'
    });

    const token = signToken(doctor._id);
    return res.status(201).json({
      token,
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        name: doctor.name,
        username: doctor.username,
        email: doctor.email
      }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').toString().trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email or username and password are required' });
    }

    let query;
    if (identifier.includes('@')) {
      if (!isClinicEmail(identifier)) {
        return res.status(400).json({ message: 'Email must end with @clinic.com' });
      }
      query = { email: identifier.toLowerCase() };
    } else {
      if (!isValidUsername(identifier)) {
        return res.status(400).json({ message: 'Username must be 3-20 characters (letters, numbers, . _ -)' });
      }
      query = { username: identifier.toLowerCase() };
    }

    const doctor = await Doctor.findOne(query);
    if (!doctor) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, doctor.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(doctor._id);
    return res.json({
      token,
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        name: doctor.name,
        username: doctor.username,
        email: doctor.email
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
