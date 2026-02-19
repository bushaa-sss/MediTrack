// Reminder log tracks patient reminder attempts.
const mongoose = require('mongoose');

const ReminderLogSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    channel: { type: String, enum: ['push', 'sms'], default: 'push' },
    message: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'sent' },
    sentAt: { type: Date, default: Date.now },
    error: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReminderLog', ReminderLogSchema);