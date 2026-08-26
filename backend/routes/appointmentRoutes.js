// Appointment routes for front-desk scheduling.
const express = require('express');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');
const {
  listAppointments,
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointmentController');

const router = express.Router();

// Appointments are operational scheduling, not clinical judgment, so all
// clinical staff (doctor, receptionist, admin) can view/create/update/cancel
// them (cancellation is a status update, see updateAppointment). Hard delete
// is a destructive correction, not a normal front-desk action, so it's
// narrower than the rest.
const clinicalStaff = authorizeRoles('doctor', 'receptionist', 'admin');
const deleteOnly = authorizeRoles('doctor', 'admin');

router.get('/', auth, clinicalStaff, listAppointments);
router.post('/', auth, clinicalStaff, createAppointment);
router.get('/:id', auth, clinicalStaff, getAppointment);
router.put('/:id', auth, clinicalStaff, updateAppointment);
router.delete('/:id', auth, deleteOnly, deleteAppointment);

module.exports = router;
