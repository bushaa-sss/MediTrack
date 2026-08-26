// Patient routes for CRUD, prescriptions, reports, and reminders.
const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');
const {
  listPatients,
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  addPrescription,
  updatePrescription,
  deletePrescription,
  uploadReport,
  deleteReport,
  getReport,
  sendReminder,
  listReminders,
  addFollowUp,
  getFollowUps,
  updateFollowUp,
  deleteFollowUp
} = require('../controllers/patientController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, PNG, and JPEG files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

const clinicalStaff = authorizeRoles('doctor', 'receptionist', 'admin');
const clinicalOnly = authorizeRoles('doctor', 'admin');
const frontDeskOnly = authorizeRoles('doctor', 'receptionist');
const doctorOnly = authorizeRoles('doctor');

// Viewing the patient list/detail is shared by everyone. Registering/editing a
// patient is front-desk data entry (doctor + receptionist); admin only views at
// the administrative level. Deleting a patient is destructive, so that stays
// doctor/admin. Prescriptions, reports, and follow-ups are clinical judgment calls
// and stay doctor-only — admin is not treated as a doctor just because it's a
// privileged role.
router.get('/', auth, clinicalStaff, listPatients);
router.post('/', auth, frontDeskOnly, createPatient);
router.get('/:id', auth, clinicalStaff, getPatient);
router.put('/:id', auth, frontDeskOnly, updatePatient);
router.delete('/:id', auth, clinicalOnly, deletePatient);

router.post('/:id/prescriptions', auth, doctorOnly, addPrescription);
router.put('/:id/prescriptions/:prescriptionId', auth, doctorOnly, updatePrescription);
router.delete('/:id/prescriptions/:prescriptionId', auth, doctorOnly, deletePrescription);

router.post('/:id/reports', auth, doctorOnly, upload.single('report'), uploadReport);
router.get('/:id/reports/:reportId', auth, doctorOnly, getReport);
router.delete('/:id/reports/:reportId', auth, doctorOnly, deleteReport);

// Sending reminders is front-desk work, so all clinical staff can use these.
router.post('/:id/reminders', auth, clinicalStaff, sendReminder);
router.get('/:id/reminders', auth, clinicalStaff, listReminders);

// Follow-ups are tied to clinical prescriptions/diagnosis, so they stay doctor-only.
// Front-desk scheduling lives in the separate Appointment system instead.
router.post('/:id/followups', auth, doctorOnly, addFollowUp);
router.get('/:id/followups', auth, doctorOnly, getFollowUps);
router.put('/:id/followups/:followUpId', auth, doctorOnly, updateFollowUp);
router.delete('/:id/followups/:followUpId', auth, doctorOnly, deleteFollowUp);

module.exports = router;
