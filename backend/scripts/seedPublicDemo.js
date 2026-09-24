require('dotenv').config();
const mongoose = require('mongoose');
const connectDb = require('../config/db');
const { ensureClinicWorkspace } = require('../services/clinicService');
const seedPublicDemo = require('../services/seedPublicDemo');

const run = async () => {
  const expectedDatabase = process.env.DEMO_DATABASE_NAME || 'meditrack_demo';
  await connectDb();

  const actualDatabase = mongoose.connection.db.databaseName;
  if (actualDatabase !== expectedDatabase) {
    throw new Error(`Refusing to seed public demo into "${actualDatabase}"; expected "${expectedDatabase}"`);
  }

  await ensureClinicWorkspace();
  const result = await seedPublicDemo();
  console.log(`Public demo initialized with ${result.patientCount} synthetic patients.`);
};

run()
  .catch((err) => {
    console.error('Public demo seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
