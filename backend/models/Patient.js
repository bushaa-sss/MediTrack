// Patient model with embedded prescriptions and reports.
const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema(
  {
    diagnosis: { type: String, required: true, trim: true },
    medicines: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    followUpDate: { type: Date }
  },
  { timestamps: true }
);

const ReportSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const FollowUpSchema = new mongoose.Schema(
  {
    followUpDate: { type: Date, required: true },
    description: { type: String, trim: true },
    notificationSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const PatientSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    mrNumber: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'], lowercase: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^(\+9665\d{8}|05\d{8})$/, 'Invalid Saudi phone number']
    },
    address: { type: String, trim: true },
    medicalHistory: { type: String, trim: true },
    prescriptions: [PrescriptionSchema],
    reports: [ReportSchema],
    followUps: [FollowUpSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', PatientSchema);
