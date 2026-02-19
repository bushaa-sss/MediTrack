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

module.exports = { getMe, updateFcmToken, clearFcmToken };
