# Fitness App — Backend (Render) + APK Build Instructions

Stack: React Native + Expo (frontend) · Node.js (backend) · MongoDB · Firebase Google Auth · SMTP email/OTP

Goal: Backend already deployed (or being deployed) on Render. This doc covers everything needed
to point the Expo app at the live backend, update config/package files, and produce an installable
`.apk`.

---

## 1. Backend — Render deployment checklist

1. Push backend repo to GitHub (separate repo from frontend).
2. On Render: **New → Web Service** → connect the GitHub repo.
3. Build command: `npm install`
4. Start command: `npm start` (confirm this matches the `"start"` script in backend `package.json`,
   e.g. `node server.js` or `node index.js`)
5. Add these Environment Variables in the Render dashboard (do NOT commit them to git):
   - `MONGO_URI` — MongoDB Atlas connection string
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (or full service account JSON, however the backend currently reads it)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - `JWT_SECRET` (or whatever session/token secret is used)
   - `NODE_ENV=production`
6. Deploy. Confirm the live URL works, e.g.:
   ```
   https://your-backend-name.onrender.com
   ```
   Test a basic route (health check or `/api/ping`) in browser/Postman before moving on.
7. **Note:** Render free tier spins down after inactivity — first request after idle can take
   30–50 seconds. Mention this if testing feels slow; not a bug.

---

## 2. Frontend (Expo app) — code changes required

### 2.1 Point the app at the live backend
Find wherever the API base URL is defined (commonly `config.js`, `constants.js`, `.env`, or
hardcoded in an api/axios file) and replace any `localhost` / local IP with the Render URL.

Example (`config.js` or similar):
```js
export const API_URL = "https://your-backend-name.onrender.com";
```

If using `.env` with `expo-constants` / `react-native-dotenv`:
```
API_URL=https://your-backend-name.onrender.com
```

> ⚠️ Search the whole project for `localhost`, `127.0.0.1`, or any local network IP
> (e.g. `192.168.x.x`) and replace every instance — dev-only values left in by mistake
> are the #1 cause of "APK builds fine but app can't log in / fetch data."

### 2.2 Firebase config for production
Confirm `google-services.json` (Android) is present and matches the Firebase project being used
in production (not a dev/test Firebase project). Place it at the project root or wherever
`app.json` references it (see below).

### 2.3 `app.json` / `app.config.js` — required fields
```json
{
  "expo": {
    "name": "YourAppName",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.yourapp",
      "versionCode": 1,
      "googleServicesFile": "./google-services.json",
      "permissions": []
    },
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```
- `android.package` must be a unique reverse-domain string — this becomes the app's permanent ID,
  cannot be changed later without publishing as a new app.
- `versionCode` must increment on every new build submitted anywhere (even internal testing).

### 2.4 `package.json` — what to check/add
Ensure these are present (versions may already be fine — just confirm, don't blindly downgrade):
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android"
  },
  "dependencies": {
    "expo": "...",
    "react-native": "...",
    "firebase": "...",
    "axios": "..."
  }
}
```
Install/update EAS CLI as a dev dependency or globally:
```bash
npm install -g eas-cli
```

### 2.5 Install/sync packages
Run inside the Expo project root:
```bash
npm install
npx expo install --fix
```
`expo install --fix` aligns native package versions with the installed Expo SDK version —
important before a production build, since mismatched native deps are a common build failure.

---

## 3. EAS Build setup (produces the APK)

### 3.1 Login & configure (one-time)
```bash
eas login
eas build:configure
```
This generates `eas.json` if it doesn't exist.

### 3.2 `eas.json` — build profiles
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```
- `preview` profile → produces a `.apk` (good for direct install/testing, sideloading)
- `production` profile → produces a `.aab` (required format for Play Store upload later)

### 3.3 Run the build
```bash
eas build --platform android --profile preview
```
- This builds on Expo's cloud servers (no local Android Studio needed).
- Takes ~10–20 minutes. Outputs a download link for the `.apk` at the end.

---

## 4. Pre-build verification checklist

Before triggering `eas build`, confirm:

- [ ] `API_URL` (or equivalent) points to the live Render URL, not localhost
- [ ] No leftover `console.log` of secrets/tokens
- [ ] `google-services.json` matches production Firebase project
- [ ] `app.json` → `android.package` is finalized (cannot change later without re-publishing)
- [ ] `versionCode` incremented if this isn't the first build
- [ ] `npx expo install --fix` run with no errors
- [ ] Backend tested live (hit a real endpoint from Postman/browser) and responding correctly
- [ ] SMTP OTP and Google Sign-In tested against the **production** Firebase project, not a dev one

---

## 5. After the build

- Download the `.apk` from the link EAS provides.
- Install directly on an Android phone (enable "Install from unknown sources" if needed) to test
  end-to-end: signup, OTP email, Google login, and core fitness features against the live Render
  backend.
- Once verified working, Play Store submission (AAB build + Play Console) is the next phase —
  not covered in this APK-stage document.
