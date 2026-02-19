// Patient controller handles CRUD, prescriptions, reports, and reminders.
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const ReminderLog = require('../models/ReminderLog');
const { sendPushToDoctor } = require('../services/notificationService');
const { sendSms } = require('../services/smsService');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const normalizeGender = (gender) => (typeof gender === 'string' ? gender.toLowerCase() : gender);

const listPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find({ doctor: req.doctor._id }).sort({ createdAt: -1 });
    return res.json({ patients });
  } catch (err) {
    next(err);
  }
};

const createPatient = async (req, res, next) => {
  try {
    const { mrNumber, name, age, gender, phone, address, medicalHistory } = req.body;

    if (!mrNumber || !name || age === undefined || !gender || !phone) {
      return res.status(400).json({ message: 'MR number, name, age, gender, and phone are required' });
    }

    const patient = await Patient.create({
      doctor: req.doctor._id,
      mrNumber: mrNumber.toString().trim(),
      name,
      age,
      gender: normalizeGender(gender),
      phone,
      address,
      medicalHistory
    });

    return res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
};

const getPatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.json({ patient });
  } catch (err) {
    next(err);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }

    const updates = {
      name: req.body.name,
      age: req.body.age,
      gender: normalizeGender(req.body.gender),
      phone: req.body.phone,
      address: req.body.address,
      medicalHistory: req.body.medicalHistory
    };

    if (req.body.mrNumber !== undefined) {
      updates.mrNumber = req.body.mrNumber;
    }

    const patient = await Patient.findOneAndUpdate(
      { _id: id, doctor: req.doctor._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.json({ patient });
  } catch (err) {
    next(err);
  }
};

const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }

    const patient = await Patient.findOneAndDelete({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.json({ message: 'Patient deleted' });
  } catch (err) {
    next(err);
  }
};

const addPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }

    const { diagnosis, medicines, notes, followUpDate } = req.body;
    if (!diagnosis) {
      return res.status(400).json({ message: 'Diagnosis is required' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    let nextFollowUpDate;
    if (followUpDate) {
      nextFollowUpDate = new Date(followUpDate);
      if (Number.isNaN(nextFollowUpDate.getTime())) {
        return res.status(400).json({ message: 'Invalid follow-up date' });
      }
    }

    patient.prescriptions.push({
      diagnosis,
      medicines: Array.isArray(medicines) ? medicines : [],
      notes,
      followUpDate: nextFollowUpDate
    });

    await patient.save();
    return res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
};

const updatePrescription = async (req, res, next) => {
  try {
    const { id, prescriptionId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(prescriptionId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescription = patient.prescriptions.id(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    prescription.diagnosis = req.body.diagnosis ?? prescription.diagnosis;
    prescription.medicines = Array.isArray(req.body.medicines) ? req.body.medicines : prescription.medicines;
    prescription.notes = req.body.notes ?? prescription.notes;
    if (req.body.followUpDate !== undefined) {
      if (!req.body.followUpDate) {
        prescription.followUpDate = undefined;
      } else {
        const nextDate = new Date(req.body.followUpDate);
        if (Number.isNaN(nextDate.getTime())) {
          return res.status(400).json({ message: 'Invalid follow-up date' });
        }
        prescription.followUpDate = nextDate;
      }
    }

    await patient.save();
    return res.json({ patient });
  } catch (err) {
    next(err);
  }
};

const deletePrescription = async (req, res, next) => {
  try {
    const { id, prescriptionId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(prescriptionId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescription = patient.prescriptions.id(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    prescription.deleteOne();
    await patient.save();
    return res.json({ patient });
  } catch (err) {
    next(err);
  }
};

const uploadReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Report file is required' });
    }

    patient.reports.push({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    await patient.save();
    return res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
};

const getReport = async (req, res, next) => {
  try {
    const { id, reportId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const report = patient.reports.id(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const absolutePath = path.resolve(report.path);
    return res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const { id, reportId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const report = patient.reports.id(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const reportPath = report.path;
    report.deleteOne();
    await patient.save();

    if (reportPath) {
      fs.promises.unlink(path.resolve(reportPath)).catch(() => {});
    }

    return res.json({ patient });
  } catch (err) {
    next(err);
  }
};

const sendReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const channel = req.body.channel || 'push';
    const message = req.body.message || `Reminder for ${patient.name}`;

    let status = 'sent';
    let error;

    if (channel === 'sms') {
      const result = await sendSms(patient.phone, message);
      if (!result.success) {
        status = 'failed';
        error = result.error || 'SMS failed';
      }
    } else {
      const result = await sendPushToDoctor(req.doctor, {
        title: 'Patient Reminder',
        body: message,
        data: { patientId: patient._id.toString() }
      });
      if (!result.success) {
        status = 'failed';
        error = result.error || 'Push failed';
      }
    }

    const log = await ReminderLog.create({
      doctor: req.doctor._id,
      patient: patient._id,
      channel,
      message,
      status,
      error
    });

    return res.json({ reminder: log, status });
  } catch (err) {
    next(err);
  }
};

const listReminders = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const reminders = await ReminderLog.find({
      doctor: req.doctor._id,
      patient: id
    }).sort({ createdAt: -1 });

    return res.json({ reminders });
  } catch (err) {
    next(err);
  }
};

const addFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }

    const { followUpDate } = req.body;
    if (!followUpDate) {
      return res.status(400).json({ message: 'Follow-up date is required' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const parsedDate = new Date(followUpDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid follow-up date' });
    }

    patient.followUps.push({
      followUpDate: parsedDate,
      notificationSent: false
    });
    await patient.save();

    const sortedFollowUps = [...patient.followUps].sort(
      (a, b) => new Date(a.followUpDate) - new Date(b.followUpDate)
    );

    return res.status(201).json({ followUps: sortedFollowUps });
  } catch (err) {
    next(err);
  }
};

const getFollowUps = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id }).select('followUps');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const sortedFollowUps = [...patient.followUps].sort(
      (a, b) => new Date(a.followUpDate) - new Date(b.followUpDate)
    );

    return res.json({ followUps: sortedFollowUps });
  } catch (err) {
    next(err);
  }
};

const updateFollowUp = async (req, res, next) => {
  try {
    const { id, followUpId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(followUpId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const followUp = patient.followUps.id(followUpId);
    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    if (req.body.followUpDate) {
      const nextDate = new Date(req.body.followUpDate);
      if (Number.isNaN(nextDate.getTime())) {
        return res.status(400).json({ message: 'Invalid follow-up date' });
      }
      const changed = followUp.followUpDate?.toISOString() !== nextDate.toISOString();
      followUp.followUpDate = nextDate;
      if (changed) {
        followUp.notificationSent = false;
      }
    }

    if (req.body.description !== undefined) {
      followUp.description = req.body.description;
    }

    await patient.save();
    return res.json({ followUp });
  } catch (err) {
    next(err);
  }
};

const deleteFollowUp = async (req, res, next) => {
  try {
    const { id, followUpId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(followUpId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const patient = await Patient.findOne({ _id: id, doctor: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const followUp = patient.followUps.id(followUpId);
    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    followUp.deleteOne();
    await patient.save();

    return res.json({ message: 'Follow-up deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
