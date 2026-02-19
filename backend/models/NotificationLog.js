// Notification log for follow-up summaries and manual reminders.
const mongoose = require('mongoose');

const NotificationLogSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    sentAt: { type: Date, default: Date.now },
    success: { type: Boolean, default: false },
    error: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);