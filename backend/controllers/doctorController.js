// Doctor controller for profile and token management.
const Doctor = require('../models/Doctor');

const getMe = async (req, res, next) => {
  try {
    return res.json({ doctor: req.doctor });
  } catch (err) {
    next(err);
  }
};

const updateFcmToken = async (req, res, next) => {
  try {
    const { token, timezone } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const updates = { fcmToken: token };
    if (timezone) {
      updates.timezone = timezone;
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.doctor._id,
      updates,
      { new: true }
    ).select('-passwordHash');

    return res.json({ doctor });
  } catch (err) {
    next(err);
  }
};

const clearFcmToken = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.doctor._id,
      { fcmToken: null },
      { new: true }
    ).select('-passwordHash');

    return res.json({ doctor });
  } catch (err) {
    next(err);
  }
};

// Lightweight, read-only listing of clinic doctors (not other roles) so any
// clinical staff can populate a doctor picker, e.g. when booking an appointment.
const listDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ clinic: req.doctor.clinic, role: 'doctor' })
      .select('firstName lastName name _id')
      .sort({ name: 1 });

    return res.json({ doctors });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateFcmToken, clearFcmToken, listDoctors };
