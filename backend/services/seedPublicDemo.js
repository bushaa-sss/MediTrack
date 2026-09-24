const bcrypt = require('bcryptjs');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { getDefaultClinic } = require('./clinicService');

const seedPublicDemo = async () => {
  const email = (process.env.PUBLIC_DEMO_EMAIL || 'publicdemo@clinic.com').toLowerCase();
  const username = (process.env.PUBLIC_DEMO_USERNAME || 'publicdemo').toLowerCase();
  const password = process.env.PUBLIC_DEMO_PASSWORD || 'PreviewOnly2026!';

  if (password.length < 12) {
    throw new Error('PUBLIC_DEMO_PASSWORD must be at least 12 characters');
  }

  const [emailMatch, usernameMatch] = await Promise.all([
    Doctor.findOne({ email }),
    Doctor.findOne({ username })
  ]);
  if (emailMatch && usernameMatch && emailMatch.id !== usernameMatch.id) {
    throw new Error('Public demo email and username belong to different accounts');
  }

  const clinic = await getDefaultClinic();
  const passwordHash = await bcrypt.hash(password, 10);
  const doctor = await Doctor.findOneAndUpdate(
    { $or: [{ email }, { username }] },
    {
      $set: {
        firstName: 'Public',
        lastName: 'Demo',
        name: 'Read-only Demo',
        email,
        username,
        passwordHash,
        role: 'demo',
        clinic: clinic._id,
        isActive: true
      }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const samplePatients = [
    {
      mrNumber: 'DEMO-1001',
      name: 'Avery Example',
      age: 34,
      gender: 'female',
      phone: '03000000001',
      address: 'Demo address only',
      medicalHistory: 'Synthetic sample record. Not a real patient.',
      prescriptions: [{ diagnosis: 'Example consultation', medicines: ['Sample medicine'], notes: 'Synthetic demo content only.' }],
      followUps: [{ followUpDate: nextWeek, description: 'Example follow-up', notificationSent: false }]
    },
    {
      mrNumber: 'DEMO-1002',
      name: 'Jordan Sample',
      age: 47,
      gender: 'male',
      phone: '03000000002',
      address: 'Demo address only',
      medicalHistory: 'Synthetic sample record. Not a real patient.',
      prescriptions: [{ diagnosis: 'Example review', medicines: ['Sample medicine'], notes: 'Synthetic demo content only.' }]
    },
    {
      mrNumber: 'DEMO-1003',
      name: 'Riley Demo',
      age: 28,
      gender: 'other',
      phone: '03000000003',
      address: 'Demo address only',
      medicalHistory: 'Synthetic sample record. Not a real patient.'
    }
  ];

  const patients = [];
  for (const patient of samplePatients) {
    const saved = await Patient.findOneAndUpdate(
      { clinic: clinic._id, mrNumber: patient.mrNumber },
      {
        $setOnInsert: {
          ...patient,
          doctor: doctor._id,
          clinic: clinic._id
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    patients.push(saved);
  }

  await Appointment.findOneAndUpdate(
    { clinic: clinic._id, reason: 'Synthetic demo appointment' },
    {
      $setOnInsert: {
        clinic: clinic._id,
        doctor: doctor._id,
        patient: patients[0]._id,
        date: nextWeek,
        startTime: '10:00',
        endTime: '10:30',
        status: 'scheduled',
        reason: 'Synthetic demo appointment',
        notes: 'Example data only.',
        createdBy: doctor._id
      }
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  return { doctor, clinic, patientCount: patients.length };
};

module.exports = seedPublicDemo;
