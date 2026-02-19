# Doctor Patient Management System

## System Architecture
- React PWA frontend communicates with an Express REST API.
- Express API uses MongoDB (Mongoose) for data storage.
- JWT secures all doctor-only routes.
- Firebase Cloud Messaging delivers push notifications.
- node-cron runs daily follow-up checks at 9 AM.
- Multer handles report uploads and stores them in `backend/uploads`.

## Backend Structure
```
backend/
  controllers/
  models/
  routes/
  middleware/
  services/
  uploads/
  cron/
  config/
  server.js
```

## Frontend Structure
```
frontend/
  src/
    components/
    pages/
    services/
    context/
    hooks/
    firebase.js
    App.jsx
  public/
    manifest.json
    firebase-messaging-sw.js
    icons/
```

## Database Schema (Summary)
- Doctor
  - firstName, lastName, name, username, email, passwordHash, fcmToken
- Patient
  - doctor (ref), name, age, gender, phone, address, medicalHistory
  - prescriptions[] (diagnosis, medicines[], notes, followUpDate)
  - reports[] (fileName, originalName, mimeType, size, path, uploadedAt)
  - followUps[] (followUpDate, description, notificationSent)
- NotificationLog
  - doctor, title, body, data, success, error, sentAt
- ReminderLog
  - doctor, patient, channel, message, status, error, sentAt

## API Endpoints
- Auth
  - POST `/api/auth/register`
  - POST `/api/auth/login`
- Doctor
  - GET `/api/doctors/me`
  - POST `/api/doctors/me/fcm-token`
- Patients
  - GET `/api/patients`
  - POST `/api/patients`
  - GET `/api/patients/:id`
  - PUT `/api/patients/:id`
  - DELETE `/api/patients/:id`
  - POST `/api/patients/:id/prescriptions`
  - PUT `/api/patients/:id/prescriptions/:prescriptionId`
  - DELETE `/api/patients/:id/prescriptions/:prescriptionId`
  - POST `/api/patients/:id/reports`
  - GET `/api/patients/:id/reports/:reportId`
  - POST `/api/patients/:id/reminders`
  - GET `/api/patients/:id/reminders`
  - POST `/api/patients/:id/followups`
  - GET `/api/patients/:id/followups`
  - PUT `/api/patients/:id/followups/:followUpId`
  - DELETE `/api/patients/:id/followups/:followUpId`
- Notifications
  - GET `/api/notifications`

## Local Setup
1. Start MongoDB locally or configure a hosted MongoDB URI.
2. Backend
   - `cd backend`
   - `npm install`
   - `npm run seed` (creates demo account + sample patients)
   - copy `backend/.env.example` to `backend/.env` and update values
   - `npm run dev`
3. Frontend
   - `cd frontend`
   - `npm install`
   - copy `frontend/.env.example` to `frontend/.env` and update values
   - `npm run dev`

## Environment Variables
- Backend: see `backend/.env.example`
- Frontend: see `frontend/.env.example`

## Demo Account (Seeded)
- Email: `demo@clinic.com`
- Password: `Demo1234!`
- Username: `drdemo`
- You can override these in `backend/.env` with `DEMO_EMAIL`, `DEMO_PASSWORD`, `DEMO_FIRST_NAME`, `DEMO_LAST_NAME`, `DEMO_USERNAME` before running `npm run seed`.

## PWA Enablement
- Ensure the app is served over HTTPS in production.
- The service worker file is `frontend/public/firebase-messaging-sw.js`.
- The manifest is `frontend/public/manifest.json`.
- Build the frontend with `npm run build` and serve `frontend/dist` over HTTPS.
- Verify installability in Chrome DevTools > Application > Manifest.

## Firebase Cloud Messaging
1. Create a Firebase project with web app credentials.
2. Generate a Web Push certificate (VAPID key).
3. Set Firebase credentials in `frontend/.env`.
4. Update `frontend/public/firebase-messaging-sw.js` with the same Firebase config.
5. Backend: set `FIREBASE_SERVICE_ACCOUNT_PATH` to your service account JSON.

## Testing Push Notifications
1. Run backend and frontend locally.
2. Login and allow notifications.
3. Confirm the FCM token is saved in MongoDB for the doctor.
4. Trigger a reminder or wait for the follow-up cron.
5. Inspect browser notifications.

## Deployment Guide
- Backend
  - Host on a Node.js server (Render, Railway, AWS, Azure).
  - Provide environment variables and ensure outbound HTTPS access to FCM.
  - Set `CORS_ORIGINS` to the deployed frontend URL.
- Frontend
  - Build with `npm run build`.
  - Deploy `frontend/dist` to a static host (Netlify, Vercel, S3 + CloudFront).
  - Ensure HTTPS is enabled and service worker scope is root.

## Notes
- SMS delivery is stubbed; integrate a provider in `backend/services/smsService.js`.
- For production, rotate JWT secrets regularly and enable a stronger password policy.
