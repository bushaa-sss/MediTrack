// Clinic workspace bootstrap: get-or-create the shared clinic and backfill
// legacy documents from before the clinic/workspace model existed.
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const ReminderLog = require('../models/ReminderLog');
const NotificationLog = require('../models/NotificationLog');

const getDefaultClinic = async () => {
  const name = process.env.CLINIC_NAME || 'Default Clinic';
  return Clinic.findOneAndUpdate(
    {},
    { $setOnInsert: { name } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Additive-only: only fills in documents missing `clinic`, never overwrites
// or deletes anything, so it's safe to run on every boot.
const ensureClinicWorkspace = async () => {
  const clinic = await getDefaultClinic();

  await Promise.all([
    Doctor.updateMany({ clinic: { $exists: false } }, { $set: { clinic: clinic._id } }),
    Patient.updateMany({ clinic: { $exists: false } }, { $set: { clinic: clinic._id } }),
    ReminderLog.updateMany({ clinic: { $exists: false } }, { $set: { clinic: clinic._id } }),
    NotificationLog.updateMany({ clinic: { $exists: false } }, { $set: { clinic: clinic._id } })
  ]);

  return clinic;
};

module.exports = { getDefaultClinic, ensureClinicWorkspace };
