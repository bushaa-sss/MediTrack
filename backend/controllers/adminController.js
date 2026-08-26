// Admin controller: staff management and clinic-level stats.
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { isClinicEmail, isValidUsername } = require('./authController');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const ROLE_VALUES = ['doctor', 'receptionist', 'admin'];

const listStaff = async (req, res, next) => {
  try {
    const staff = await Doctor.find({ clinic: req.doctor.clinic })
      .select('-passwordHash')
      .sort({ name: 1 });

    return res.json({ staff });
  } catch (err) {
    next(err);
  }
};

const createStaff = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, password, role } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !role) {
      return res.status(400).json({ message: 'First name, last name, username, email, password, and role are required' });
    }

    if (!ROLE_VALUES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
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
    const staff = await Doctor.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role,
      clinic: req.doctor.clinic
    });

    return res.status(201).json({
      staff: {
        id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        name: staff.name,
        username: staff.username,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateStaffRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    if (!ROLE_VALUES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (id === req.doctor._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const staff = await Doctor.findOneAndUpdate(
      { _id: id, clinic: req.doctor.clinic },
      { role },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    return res.json({ staff });
  } catch (err) {
    next(err);
  }
};

const updateStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be true or false' });
    }

    if (id === req.doctor._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const staff = await Doctor.findOneAndUpdate(
      { _id: id, clinic: req.doctor.clinic },
      { isActive },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    return res.json({ staff });
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const clinic = req.doctor.clinic;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      doctorCount,
      receptionistCount,
      adminCount,
      totalAppointments,
      upcomingAppointments,
      scheduledCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      noShowCount,
      recentStaff
    ] = await Promise.all([
      Patient.countDocuments({ clinic }),
      Doctor.countDocuments({ clinic, role: 'doctor' }),
      Doctor.countDocuments({ clinic, role: 'receptionist' }),
      Doctor.countDocuments({ clinic, role: 'admin' }),
      Appointment.countDocuments({ clinic }),
      Appointment.countDocuments({ clinic, date: { $gte: startOfToday } }),
      Appointment.countDocuments({ clinic, status: 'scheduled' }),
      Appointment.countDocuments({ clinic, status: 'confirmed' }),
      Appointment.countDocuments({ clinic, status: 'completed' }),
      Appointment.countDocuments({ clinic, status: 'cancelled' }),
      Appointment.countDocuments({ clinic, status: 'no_show' }),
      Doctor.find({ clinic }).select('name role createdAt').sort({ createdAt: -1 }).limit(5)
    ]);

    return res.json({
      stats: {
        totalPatients,
        staff: { doctor: doctorCount, receptionist: receptionistCount, admin: adminCount },
        totalAppointments,
        upcomingAppointments,
        appointmentsByStatus: {
          scheduled: scheduledCount,
          confirmed: confirmedCount,
          completed: completedCount,
          cancelled: cancelledCount,
          no_show: noShowCount
        },
        recentStaff
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listStaff, createStaff, updateStaffRole, updateStaffStatus, getStats };
