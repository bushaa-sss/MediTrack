// App shell with routing and FCM setup + in-app notifications.
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import TopNav from './components/TopNav';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';
import OfflineBanner from './components/OfflineBanner';
import ToastStack from './components/ToastStack';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddPatient from './pages/AddPatient';
import PatientDetails from './pages/PatientDetails';
import Notifications from './pages/Notifications';
import { getFcmToken, onMessageListener, requestNotificationPermission } from './firebase';
import { updateFcmToken } from './services/authService';

const FCM_PERMISSION_REQUESTED_KEY = 'fcm.permission.requested';
const FCM_LAST_TOKEN_KEY = 'fcm.lastToken';
const FCM_LAST_USER_KEY = 'fcm.lastUserId';
const FCM_LAST_TIMEZONE_KEY = 'fcm.lastTimezone';
const TOAST_TTL_MS = 6000;
const MAX_TOASTS = 4;

const App = () => {
  const { token, doctor, loading } = useContext(AuthContext);
  const fcmSyncInFlight = useRef(false);
  const toastTimers = useRef(new Map());
  const toastId = useRef(0);
  const doctorId = doctor?.id || doctor?._id || '';
  const hasDoctor = Boolean(doctor);
  const [toasts, setToasts] = useState([]);
  const isDev = import.meta.env.DEV;

  // Remove a toast and clear its auto-dismiss timer.
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }, []);

  // Add a toast to the stack and auto-dismiss after a short delay.
  const pushToast = useCallback(
    ({ title, body, icon, image }) => {
      const safeTitle = title || 'New notification';
      const nextId = toastId.current + 1;
      toastId.current = nextId;

      const nextToast = {
        id: nextId,
        title: safeTitle,
        body: body || '',
        icon,
        image
      };

      setToasts((prev) => [nextToast, ...prev].slice(0, MAX_TOASTS));
      const timer = setTimeout(() => dismissToast(nextId), TOAST_TTL_MS);
      toastTimers.current.set(nextId, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    // Dev-only FCM probe so you can always see permission + token in the console.
    if (!isDev) return;

    let isActive = true;

    const debugFcm = async () => {
      try {
        if (!('Notification' in window)) {
          console.log('Notification API not supported');
          return;
        }

        const granted = await requestNotificationPermission();
        if (!isActive) return;
        console.log(`Notification permission granted: ${granted}`);

        const fcmToken = await getFcmToken();
        if (!isActive) return;
        console.log(`FCM Token received: ${fcmToken}`);
      } catch (err) {
        console.error('FCM debug failed', err);
      }
    };

    debugFcm();

    return () => {
      isActive = false;
    };
  }, [isDev]);

  useEffect(() => {
    // Wait for auth hydration so we have a stable user + token.
    if (loading) return;
    if (!token || !hasDoctor) {
      // When logged out, clear the last user marker so a new login re-syncs.
      localStorage.removeItem(FCM_LAST_USER_KEY);
      localStorage.removeItem(FCM_LAST_TIMEZONE_KEY);
      return;
    }

    let isActive = true;

    const syncFcm = async () => {
      if (fcmSyncInFlight.current) return;
      fcmSyncInFlight.current = true;

      try {
        // Ensure this browser supports notifications.
        if (!('Notification' in window)) {
          return;
        }

        // Request permission once per device if not already granted.
        const permission = Notification.permission;
        let granted = permission === 'granted';

        if (!granted && permission === 'default') {
          const alreadyPrompted = localStorage.getItem(FCM_PERMISSION_REQUESTED_KEY) === 'true';
          if (!alreadyPrompted) {
            localStorage.setItem(FCM_PERMISSION_REQUESTED_KEY, 'true');
            granted = await requestNotificationPermission();
          }
        }

        console.log(`Notification permission granted: ${granted}`);
        if (!granted || !isActive) return;

        // Fetch the current FCM token (may rotate over time).
        const fcmToken = await getFcmToken();
        console.log(`FCM Token received: ${fcmToken}`);
        if (!fcmToken || !isActive) return;

        // Avoid re-sending the same token for the same user.
        const lastToken = localStorage.getItem(FCM_LAST_TOKEN_KEY);
        const lastUser = localStorage.getItem(FCM_LAST_USER_KEY);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const lastTimezone = localStorage.getItem(FCM_LAST_TIMEZONE_KEY);
        if (lastToken === fcmToken && lastUser === doctorId && lastTimezone === timezone) {
          return;
        }

        // Send the token to the backend for this logged-in user.
        await updateFcmToken(fcmToken, timezone);
        if (!isActive) return;

        localStorage.setItem(FCM_LAST_TOKEN_KEY, fcmToken);
        if (doctorId) {
          localStorage.setItem(FCM_LAST_USER_KEY, doctorId);
        }
        localStorage.setItem(FCM_LAST_TIMEZONE_KEY, timezone);
      } catch (err) {
        // Keep the app usable even if FCM fails.
      } finally {
        fcmSyncInFlight.current = false;
      }
    };

    syncFcm();

    return () => {
      isActive = false;
    };
  }, [token, doctorId, hasDoctor, loading]);

  useEffect(() => {
    // Foreground messages arrive here; background notifications are handled by the service worker.
    const unsubscribe = onMessageListener((payload) => {
      const title = payload?.notification?.title || payload?.data?.title;
      const body = payload?.notification?.body || payload?.data?.body;
      const icon = payload?.notification?.icon || payload?.data?.icon;
      const image = payload?.notification?.image || payload?.data?.image;

      if (!title && !body) return;
      console.log('Foreground message received:', payload);
      // Update app state to show the in-app notification.
      pushToast({ title, body, icon, image });
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [pushToast]);

  useEffect(() => {
    // Cleanup any pending toast timers on unmount.
    return () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, []);

  return (
    <div className="app-shell">
      <TopNav />
      <OfflineBanner />
      <InstallPrompt />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/new"
          element={
            <ProtectedRoute>
              <AddPatient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute>
              <PatientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
      </Routes>
      {/* In-app toasts for foreground notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
