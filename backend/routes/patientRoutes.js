// Patient routes for CRUD, prescriptions, reports, and reminders.
const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
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

router.get('/', auth, listPatients);
router.post('/', auth, createPatient);
router.get('/:id', auth, getPatient);
router.put('/:id', auth, updatePatient);
router.delete('/:id', auth, deletePatient);

router.post('/:id/prescriptions', auth, addPrescription);
router.put('/:id/prescriptions/:prescriptionId', auth, updatePrescription);
router.delete('/:id/prescriptions/:prescriptionId', auth, deletePrescription);

router.post('/:id/reports', auth, upload.single('report'), uploadReport);
router.get('/:id/reports/:reportId', auth, getReport);
router.delete('/:id/reports/:reportId', auth, deleteReport);

router.post('/:id/reminders', auth, sendReminder);
router.get('/:id/reminders', auth, listReminders);

router.post('/:id/followups', auth, addFollowUp);
router.get('/:id/followups', auth, getFollowUps);
router.put('/:id/followups/:followUpId', auth, updateFollowUp);
router.delete('/:id/followups/:followUpId', auth, deleteFollowUp);

module.exports = router;
