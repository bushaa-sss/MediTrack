// Appointment controller for front-desk scheduling.
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const STATUS_VALUES = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// A doctor may only ever see/act on their own appointments; receptionist/admin
// see the whole clinic. This is the ownership check that stops a doctor from
// reaching another doctor's appointment just by changing an :id in the URL.
const scopeFilter = (req) => {
  const filter = { clinic: req.doctor.clinic };
  if (req.doctor.role === 'doctor') {
    filter.doctor = req.doctor._id;
  }
  return filter;
};

const listAppointments = async (req, res, next) => {
  try {
    const filter = scopeFilter(req);

    // Receptionist/admin may further narrow by doctor; a doctor's own results
    // are already locked to themselves by scopeFilter above, so this only
    // applies when it doesn't conflict with that.
    if (req.query.doctor && req.doctor.role !== 'doctor') {
      if (!isValidObjectId(req.query.doctor)) {
        return res.status(400).json({ message: 'Invalid doctor id' });
      }
      filter.doctor = req.query.doctor;
    }

    if (req.query.patient) {
      if (!isValidObjectId(req.query.patient)) {
        return res.status(400).json({ message: 'Invalid patient id' });
      }
      filter.patient = req.query.patient;
    }

    if (req.query.status) {
      if (!STATUS_VALUES.includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      filter.status = req.query.status;
    }

    if (req.query.date) {
      const day = new Date(req.query.date);
      if (Number.isNaN(day.getTime())) {
        return res.status(400).json({ message: 'Invalid date' });
      }
      const startOfDay = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
      filter.date = { $gte: startOfDay, $lt: endOfDay };
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name mrNumber phone')
      .populate('doctor', 'firstName lastName name')
      .sort({ date: 1, startTime: 1 });

    return res.json({ appointments });
  } catch (err) {
    next(err);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const { patient, date, startTime, endTime, status, reason, notes } = req.body;
    let { doctor } = req.body;

    // A doctor can only ever schedule appointments under their own name.
    if (req.doctor.role === 'doctor') {
      if (doctor && doctor !== req.doctor._id.toString()) {
        return res.status(403).json({ message: 'Doctors can only create appointments for themselves' });
      }
      doctor = req.doctor._id.toString();
    }

    if (!doctor || !patient || !date || !startTime) {
      return res.status(400).json({ message: 'Doctor, patient, date, and start time are required' });
    }

    if (!isValidObjectId(doctor) || !isValidObjectId(patient)) {
      return res.status(400).json({ message: 'Invalid doctor or patient id' });
    }

    if (!TIME_PATTERN.test(startTime) || (endTime && !TIME_PATTERN.test(endTime))) {
      return res.status(400).json({ message: 'Time must be in HH:mm format' });
    }

    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const [patientDoc, doctorDoc] = await Promise.all([
      Patient.findOne({ _id: patient, clinic: req.doctor.clinic }),
      Doctor.findOne({ _id: doctor, clinic: req.doctor.clinic, role: 'doctor' })
    ]);

    if (!patientDoc) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    if (!doctorDoc) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointment = await Appointment.create({
      clinic: req.doctor.clinic,
      doctor,
      patient,
      date: parsedDate,
      startTime,
      endTime,
      status: status || 'scheduled',
      reason,
      notes,
      createdBy: req.doctor._id
    });

    return res.status(201).json({ appointment });
  } catch (err) {
    next(err);
  }
};

const getAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid appointment id' });
    }

    const appointment = await Appointment.findOne({ _id: id, ...scopeFilter(req) })
      .populate('patient', 'name mrNumber phone')
      .populate('doctor', 'firstName lastName name');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.json({ appointment });
  } catch (err) {
    next(err);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid appointment id' });
    }

    const { doctor, date, startTime, endTime, status, reason, notes } = req.body;
    const updates = {};

    if (doctor !== undefined) {
      // A doctor may not hand their appointment off to someone else's calendar.
      if (req.doctor.role === 'doctor' && doctor !== req.doctor._id.toString()) {
        return res.status(403).json({ message: 'Doctors can only manage their own appointments' });
      }
      if (!isValidObjectId(doctor)) {
        return res.status(400).json({ message: 'Invalid doctor id' });
      }
      const doctorDoc = await Doctor.findOne({ _id: doctor, clinic: req.doctor.clinic, role: 'doctor' });
      if (!doctorDoc) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      updates.doctor = doctor;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date' });
      }
      updates.date = parsedDate;
    }

    if (startTime !== undefined) {
      if (!TIME_PATTERN.test(startTime)) {
        return res.status(400).json({ message: 'Time must be in HH:mm format' });
      }
      updates.startTime = startTime;
    }

    if (endTime !== undefined) {
      if (endTime && !TIME_PATTERN.test(endTime)) {
        return res.status(400).json({ message: 'Time must be in HH:mm format' });
      }
      updates.endTime = endTime;
    }

    if (reason !== undefined) updates.reason = reason;
    if (notes !== undefined) updates.notes = notes;

    if (status !== undefined) {
      if (!STATUS_VALUES.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updates.status = status;
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, ...scopeFilter(req) },
      updates,
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.json({ appointment });
  } catch (err) {
    next(err);
  }
};

// Hard delete is kept only for correcting mistakes (e.g. a duplicate/erroneous
// booking); the normal way to call off a visit is updateAppointment with
// status: 'cancelled', which preserves the record. Route-level authorization
// restricts this to doctor/admin.
const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid appointment id' });
    }

    const appointment = await Appointment.findOneAndDelete({ _id: id, ...scopeFilter(req) });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.json({ message: 'Appointment deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAppointments,
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment
};
