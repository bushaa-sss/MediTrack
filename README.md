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
### Backend on AWS EC2 (Ubuntu, recommended)
1. Launch an EC2 instance (Ubuntu 22.04+).
2. Security Group inbound rules:
   - `22` from your IP
   - `80` from `0.0.0.0/0`
   - `443` from `0.0.0.0/0`
3. SSH into the instance and install runtime tools:
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```
4. Deploy backend code:
```bash
git clone <your-repo-url>
cd "<repo>/backend"
npm ci --omit=dev
cp .env.example .env
```
5. Configure `backend/.env` for production:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGO_URI=<mongodb-atlas-uri>`
   - `JWT_SECRET=<strong-random-secret>`
   - `JWT_EXPIRES_IN=7d`
   - `CORS_ORIGINS=https://<your-vercel-domain>,https://<your-custom-frontend-domain>`
   - `CRON_TZ=UTC`
   - Firebase: set `FIREBASE_SERVICE_ACCOUNT_JSON` (preferred) or `FIREBASE_SERVICE_ACCOUNT_PATH`
6. Start backend with PM2:
```bash
cd "<repo>/backend"
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```
7. Configure Nginx reverse proxy:
```bash
cd "<repo>/backend"
sudo cp nginx-doctors-portal.conf.example /etc/nginx/sites-available/doctors-portal
sudo ln -s /etc/nginx/sites-available/doctors-portal /etc/nginx/sites-enabled/doctors-portal
sudo nginx -t
sudo systemctl restart nginx
```
8. Update `/etc/nginx/sites-available/doctors-portal` and set your real API domain in `server_name` (for example `api.example.com`).
9. Enable HTTPS:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```
10. Verify backend:
   - `GET https://api.example.com/health` should return `{ "status": "ok" }`.

### Frontend on Vercel (already deployed)
1. In Vercel project settings, set:
   - `VITE_API_BASE_URL=https://api.example.com`
2. Redeploy the Vercel project.
3. Confirm requests from Vercel origin are allowed by backend CORS.

### Important production notes
- `npm run seed` deletes existing collections before inserting demo data. Do not run it on production data.
- Report uploads are stored on local disk (`backend/uploads`). If you replace or auto-scale instances, files can be lost; migrate uploads to S3 for durability.

### Optional App Runner path
- If you prefer managed hosting later, you can use `backend/apprunner.yaml`.

## Notes
- SMS delivery is stubbed; integrate a provider in `backend/services/smsService.js`.
- For production, rotate JWT secrets regularly and enable a stronger password policy.
