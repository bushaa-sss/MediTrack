// Clinic model: shared workspace that staff accounts and clinical records belong to.
const mongoose = require('mongoose');

const ClinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, default: 'Default Clinic' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Clinic', ClinicSchema);
