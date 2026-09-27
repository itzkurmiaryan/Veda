# RxVault MVP

React Native + Expo mobile app with Node.js/Express + MongoDB backend.

## 1. Backend

```bash
cd server
npm install
copy .env.example .env
```

Edit `.env` and put your MongoDB Atlas connection string and a strong JWT secret.
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` as well; the server creates this admin account on first startup. Optional: `ADMIN_NAME`.

Then:

```bash
npm run dev
```

API runs on `http://localhost:5000`.

## 2. Mobile

```bash
cd mobile
npm install
npx expo start
```

Android emulator uses `http://10.0.2.2:5000/api`.
For a physical phone, change `API_URL` in `mobile/src/api/api.js` to your computer's LAN IP, e.g. `http://192.168.1.10:5000/api`.

## Included MVP

- Doctor registration/login
- JWT authentication
- Doctor-isolated patient records
- Add/search patients
- Patient history
- Create visits/prescriptions
- Vitals
- Medicines
- Advice
- Copy old visit as new visit
- PDF generation/share
- Printing

## Important

This is an MVP starter, not a production medical-record compliance package. Before real patient use, add stronger authorization, refresh tokens, audit logs, encrypted/managed backups, secure storage, privacy/compliance review, rate limiting, validated file uploads, and production HTTPS/deployment controls.
