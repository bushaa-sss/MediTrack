// One-time bootstrap: create the first admin account for the clinic.
// Usage: node scripts/createAdmin.js <email> <password> <firstName> <lastName> [username]
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDb = require('../config/db');
const Doctor = require('../models/Doctor');
const { getDefaultClinic } = require('../services/clinicService');

const isClinicEmail = (email) => /@clinic\.com$/i.test(email || '');

const run = async () => {
  const [email, password, firstName, lastName, usernameArg] = process.argv.slice(2);

  if (!email || !password || !firstName || !lastName) {
    console.error('Usage: node scripts/createAdmin.js <email> <password> <firstName> <lastName> [username]');
    process.exit(1);
  }

  if (!isClinicEmail(email)) {
    console.error('Email must end with @clinic.com');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  const username = (usernameArg || email.split('@')[0]).toLowerCase();

  await connectDb();
  const clinic = await getDefaultClinic();

  const existing = await Doctor.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`An account with email ${email} already exists (role: ${existing.role}).`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Doctor.create({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    username,
    email: email.toLowerCase(),
    passwordHash,
    role: 'admin',
    clinic: clinic._id
  });

  console.log('Admin account created.');
  console.log(`Email: ${email}`);
  console.log(`Username: ${username}`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
