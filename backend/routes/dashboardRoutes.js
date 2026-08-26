// Dashboard routes for doctor/receptionist summary metrics.
const express = require('express');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');
const { getDashboardSummary } = require('../controllers/dashboardController');

const router = express.Router();

// Admin has its own dashboard data via /api/admin/stats.
router.get('/summary', auth, authorizeRoles('doctor', 'receptionist'), getDashboardSummary);

module.exports = router;
