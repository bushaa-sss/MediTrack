// Firebase client initialization for FCM.
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const getFcmToken = async () => {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error('VITE_FIREBASE_VAPID_KEY is missing');
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('Service worker is not supported in this browser');
  }

  const registration = await navigator.serviceWorker.ready;
  return getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
};

export const onMessageListener = (callback) => onMessage(messaging, callback);
