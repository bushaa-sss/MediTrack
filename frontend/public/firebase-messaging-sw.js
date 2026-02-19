/* eslint-disable no-undef */
// Service worker for offline caching and Firebase messaging.
const CACHE_NAME = 'doctor-portal-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});

// importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');


// Replace the placeholder config with your Firebase project credentials.
const firebaseConfig ={
  apiKey: "AIzaSyBPp4oqqjuU2n8VOT8EW9z2Mn72riDYrgA",
  authDomain: "doctorpatientmanagement.firebaseapp.com",
  projectId: "doctorpatientmanagement",
  storageBucket: "doctorpatientmanagement.firebasestorage.app",
  messagingSenderId: "593887033027",
  appId: "1:593887033027:web:e2313be2be6b71032e9476",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
// const title = payload?.notification?.title || 'MediTrack Notification';
const title = payload?.data?.title || 'MediTrack Notification';

  const options = {
    // body: payload?.notification?.body || 'You have a new update.',
     body: payload?.data?.body || 'You have a new update.',
    data: payload?.data
  };

  self.registration.showNotification(title, options);
});
