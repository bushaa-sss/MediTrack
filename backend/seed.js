// Seed script for demo data.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDb = require('./config/db');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const NotificationLog = require('./models/NotificationLog');
const ReminderLog = require('./models/ReminderLog');

const CLINIC_EMAIL_PATTERN = /@clinic\.com$/i;

const seed = async () => {
  await connectDb();

  const configuredDemoEmail = process.env.DEMO_EMAIL || 'demo@clinic.com';
  const demoEmail = CLINIC_EMAIL_PATTERN.test(configuredDemoEmail)
    ? configuredDemoEmail
    : 'demo@clinic.com';
  const demoPassword = process.env.DEMO_PASSWORD || 'Demo1234!';
  const demoFirstName = process.env.DEMO_FIRST_NAME || 'Taylor';
  const demoLastName = process.env.DEMO_LAST_NAME || 'Demo';
  const demoUsername = process.env.DEMO_USERNAME || 'drdemo';

  if (!CLINIC_EMAIL_PATTERN.test(configuredDemoEmail)) {
    console.warn(
      `DEMO_EMAIL "${configuredDemoEmail}" is invalid for this app. Using "${demoEmail}" instead.`
    );
  }

  // Reset collections for a clean preview environment.
  await Promise.all([
    Doctor.deleteMany({}),
    Patient.deleteMany({}),
    NotificationLog.deleteMany({}),
    ReminderLog.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const doctor = await Doctor.create({
    firstName: demoFirstName,
    lastName: demoLastName,
    name: `${demoFirstName} ${demoLastName}`.trim(),
    username: demoUsername.toLowerCase(),
    email: demoEmail.toLowerCase(),
    passwordHash
  });

  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  inThreeDays.setHours(9, 0, 0, 0);

  const inOneMonth = new Date();
  inOneMonth.setMonth(inOneMonth.getMonth() + 1);
  inOneMonth.setHours(9, 0, 0, 0);

  const inOneWeek = new Date();
  inOneWeek.setDate(inOneWeek.getDate() + 7);
  inOneWeek.setHours(9, 0, 0, 0);

  const patients = await Patient.create([
    {
      doctor: doctor._id,
      mrNumber: 'MR-1001',
      name: 'Ava Hart',
      age: 32,
      gender: 'female',
      phone: '0551234567',
      address: '12 Market Street, San Diego, CA',
      medicalHistory: 'Asthma, seasonal allergies',
      prescriptions: [
        {
          diagnosis: 'Mild asthma flare',
          medicines: ['Albuterol inhaler', 'Cetirizine 10mg'],
          notes: 'Use inhaler before activity',
          followUpDate: inThreeDays
        }
      ],
      followUps: [
        {
          followUpDate: inOneWeek,
          description: 'Check respiratory symptoms',
          notificationSent: false
        }
      ]
    },
    {
      doctor: doctor._id,
      mrNumber: 'MR-1002',
      name: 'Noah Reyes',
      age: 45,
      gender: 'male',
      phone: '0559876543',
      address: '98 Willow Ave, Austin, TX',
      medicalHistory: 'Hypertension',
      prescriptions: [
        {
          diagnosis: 'Blood pressure monitoring',
          medicines: ['Lisinopril 10mg'],
          notes: 'Take in the morning',
          followUpDate: inOneMonth
        }
      ]
    },
    {
      doctor: doctor._id,
      mrNumber: 'MR-1003',
      name: 'Maya Singh',
      age: 29,
      gender: 'female',
      phone: '0555551234',
      address: '233 Cedar Blvd, Seattle, WA',
      medicalHistory: 'Migraines',
      prescriptions: [
        {
          diagnosis: 'Migraine management',
          medicines: ['Sumatriptan 50mg'],
          notes: 'Log triggers'
        }
      ]
    }
  ]);

  await NotificationLog.create({
    doctor: doctor._id,
    title: 'Welcome to Doctor Portal',
    body: `Demo data loaded with ${patients.length} patients.`,
    data: { seeded: true },
    success: true
  });

  console.log('Seed completed.');
  console.log(`Demo doctor: ${demoEmail}`);
  console.log(`Demo password: ${demoPassword}`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
