// FCM push notification helper.
const NotificationLog = require('../models/NotificationLog');
const { getMessaging } = require('../config/firebase');

const sendPushToDoctor = async (doctor, { title, body, data }) => {
  const log = new NotificationLog({
    doctor: doctor._id,
    title,
    body,
    data,
    success: false
  });

  try {
    const messaging = getMessaging();
    if (!messaging || !doctor.fcmToken) {
      throw new Error('FCM not configured or doctor token missing');
    }

    // await messaging.send({
    //   token: doctor.fcmToken,
    //   notification: { title, body },
    //   data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined
    // });

    await messaging.send({
  token: doctor.fcmToken,
  data: {
    title: String(title),
    body: String(body),
    ...(data
      ? Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        )
      : {})
  }
});


    log.success = true;
    log.sentAt = new Date();
    await log.save();
    return { success: true };
  } catch (err) {
    log.error = err.message;
    await log.save();
    return { success: false, error: err.message };
  }
};

module.exports = { sendPushToDoctor };