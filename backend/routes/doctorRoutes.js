// Doctor routes for profile access and FCM token updates.
const express = require('express');
const auth = require('../middleware/auth');
const { getMe, updateFcmToken, clearFcmToken, listDoctors } = require('../controllers/doctorController');

const router = express.Router();

router.get('/', auth, listDoctors);
router.get('/me', auth, getMe);
router.post('/me/fcm-token', auth, updateFcmToken);
router.delete('/me/fcm-token', auth, clearFcmToken);

module.exports = router;
