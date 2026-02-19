// Doctor model stores auth credentials and FCM token.
const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fcmToken: { type: String, default: null },
    timezone: { type: String, default: 'UTC', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', DoctorSchema);
