// Main Express server entry.
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDb = require('./config/db');
const buildCorsOptions = require('./config/cors');
const { initFirebase } = require('./config/firebase');
const { ensureClinicWorkspace } = require('./services/clinicService');
const scheduleFollowUpCron = require('./cron/followUpCron');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();


app.use(helmet());
const corsOptions = buildCorsOptions();
app.options('*', (req, res) => {
  const origin = req.get('Origin');
  const allowlist = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (origin && allowlist.length > 0 && !allowlist.includes(origin)) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    req.get('Access-Control-Request-Headers') || 'Content-Type,Authorization'
  );
  return res.sendStatus(204);
});
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Basic health check for uptime monitoring.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Basic rate limiting for auth endpoints to reduce abuse.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve uploaded files only via authenticated routes (no public static route).
app.use('/uploads', (req, res) => {
  res.status(403).json({ message: 'Direct access to uploads is disabled' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDb()
  .then(() => ensureClinicWorkspace())
  .then(() => {
    initFirebase();
    scheduleFollowUpCron();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
