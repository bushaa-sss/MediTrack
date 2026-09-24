# Public demo deployment

The public demo uses a **separate Render service and MongoDB database**. It contains only synthetic records and has a read-only account. Never point it at the production clinic database.

## 1. Create an isolated MongoDB database

In MongoDB Atlas, create a database named `meditrack_demo` and a database user whose access is limited to that database. Use a fresh password. Put `/meditrack_demo` in the database path of its connection URI, for example:

```text
mongodb+srv://<demo-user>:<encoded-password>@<cluster-host>/meditrack_demo?retryWrites=true&w=majority
```

Do not reuse the production database user or URI.

## 2. Create a second Render web service

Create a new Web Service from the MediTrack GitHub repository, using the same branch as production. Set the root directory to `backend` and use the repository's Dockerfile. Configure these environment variables on the new service:

```text
NODE_ENV=production
DEMO_MODE=true
DEMO_DATABASE_NAME=meditrack_demo
MONGO_URI=<the dedicated demo database URI>
JWT_SECRET=<a new random secret, different from production>
CORS_ORIGINS=https://medi-track-lovat.vercel.app
CLINIC_NAME=Public Demo Clinic
PUBLIC_DEMO_EMAIL=publicdemo@clinic.com
PUBLIC_DEMO_USERNAME=publicdemo
PUBLIC_DEMO_PASSWORD=PreviewOnly2026!
```

The service validates the database name before seeding. On startup it creates one demo login and three fictional patient records. Seeding is safe to repeat; it does not delete records. The public account is read-only at the API layer, and writes are disabled across the demo service.

Keep the demo password the same as above because it is displayed publicly on the login page. It is not an admin password and must never be reused elsewhere.

## 3. Connect the Vercel login page

In the Vercel project's environment variables, add:

```text
VITE_DEMO_API_BASE_URL=https://<new-demo-service>.onrender.com
VITE_DEMO_LOGIN_EMAIL=publicdemo@clinic.com
VITE_DEMO_LOGIN_PASSWORD=PreviewOnly2026!
```

Keep the existing `VITE_API_BASE_URL` configuration for the production app unchanged. Redeploy Vercel after saving these variables. The login page then shows the demo credentials and an **Open read-only demo** button.

## 4. Verify

- Open `https://<new-demo-service>.onrender.com/health`; expect JSON with `"status":"ok"`.
- Open the Vercel site's `/login`, choose **Open read-only demo**, and confirm the synthetic patients appear.
- Try to create or edit data only as a safety check; the demo API must respond with `403`.

The existing GitHub Actions workflow pings the production Render service every ten minutes to reduce free-tier sleep. Render may still sleep or delay scheduled jobs, so this is best-effort. The second demo service needs its own keep-awake configuration if you want it pinged too.
