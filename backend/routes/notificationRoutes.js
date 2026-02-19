// Notification routes for retrieving logs.
const express = require('express');
const auth = require('../middleware/auth');
const { listNotifications } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', auth, listNotifications);

module.exports = router;