// Firebase Admin initialization for server-side FCM.
const admin = require('firebase-admin');
const fs = require('fs');

let initialized = false;

const initFirebase = () => {
  if (initialized) {
    return admin.app();
  }

  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!jsonEnv && !jsonPath) {
    console.warn('Firebase service account not configured. FCM will be disabled.');
    return null;
  }

  let serviceAccount;
  if (jsonEnv) {
    serviceAccount = JSON.parse(jsonEnv);
  } else {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    serviceAccount = JSON.parse(raw);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  initialized = true;
  return admin.app();
};

const getMessaging = () => {
  const app = initFirebase();
  if (!app) return null;
  return admin.messaging();
};

module.exports = { initFirebase, getMessaging };