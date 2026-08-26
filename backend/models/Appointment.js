// Appointment model for front-desk scheduling, separate from Patient.followUps
// (which stays tied to prescriptions/clinical follow-up dates).
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, trim: true },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled'
    },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);
