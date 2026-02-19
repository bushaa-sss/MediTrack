// Notification controller for viewing logs.
const NotificationLog = require('../models/NotificationLog');

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationLog.find({ doctor: req.doctor._id })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

module.exports = { listNotifications };