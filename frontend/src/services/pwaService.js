// Registers the Firebase messaging service worker for PWA + push.
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then(() => {
          console.log('Service worker registered');
        })
        .catch((err) => {
          console.error('Service worker registration failed', err);
        });
    });
  }
};