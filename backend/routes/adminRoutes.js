// Admin routes for staff management and clinic stats.
const express = require('express');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');
const { listStaff, createStaff, updateStaffRole, updateStaffStatus, getStats } = require('../controllers/adminController');

const router = express.Router();

const adminOnly = authorizeRoles('admin');

router.get('/staff', auth, adminOnly, listStaff);
router.post('/staff', auth, adminOnly, createStaff);
router.patch('/staff/:id/role', auth, adminOnly, updateStaffRole);
router.patch('/staff/:id/status', auth, adminOnly, updateStaffStatus);
router.get('/stats', auth, adminOnly, getStats);

module.exports = router;
