# Running the Prototype Locally

This document is for readers who want to install and try the DIY Assist Me prototype. The main README is paper-facing and intentionally avoids setup details.

## Requirements

- Node.js and npm.
- A browser that supports the Web Speech API if testing voice commands.
- Optional Firebase project for Firestore persistence, admin login, tutorial CRUD, and full admin review.

## Install and Run

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

The app is a Vite React JavaScript application. It does not use TypeScript or Next.js.

## Validation

Validate the exported research files with:

```bash
npm run validate
```

This runs `src/scripts/validateResearchExports.js`.

## Firebase Configuration

Copy `.env.example` to `.env` and fill the Firebase values when Firestore persistence and admin access are needed:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Public study data can still use local fallback behavior when Firebase values are missing or reads/writes fail. Admin authentication and tutorial CRUD require Firebase and will be blocked until Firebase is configured.

The app uses these Firestore collections:

- `tutorials`
- `participants`
- `sessions`
- `taskTrials`
- `interactionLogs`
- `susResponses`
- `debriefResponses`
- `observerNotes`
- `admins`
- `adminUsernames`

## Admin Authentication

Admin access uses Firebase Authentication plus Firestore admin profile documents. Enable the Firebase Auth Email/Password provider in Firebase Console.

Admins sign in with username and password. The username is not an email address in the UI. The app resolves the username through Firestore and then verifies the password with Firebase Auth.

Create admin accounts outside the frontend:

1. Create a Firebase Authentication user with email/password.
2. Create `admins/{uid}`:

```json
{
  "uid": "firebase-auth-uid",
  "username": "adminuser",
  "email": "admin@example.com",
  "displayName": "Admin User",
  "role": "admin",
  "isActive": true,
  "createdAt": "server timestamp or ISO string",
  "updatedAt": "server timestamp or ISO string"
}
```

3. Create `adminUsernames/{usernameLower}`:

```json
{
  "uid": "firebase-auth-uid",
  "username": "adminuser",
  "email": "admin@example.com",
  "isActive": true
}
```

The frontend must not create admin passwords or hardcode admin accounts. For multiple admins, repeat the same Auth user plus Firestore profile and username lookup setup for each account.

Client-side route protection is not enough for real security. Firestore security rules should restrict reads and writes.

Recommended rules concept:

- Public users can read active `tutorials` if public browsing is intended.
- Only authenticated active admins can create, update, or delete tutorials.
- Only authenticated active admins can read admin dashboard collections.
- Admin profile writes should be restricted to `super_admin` accounts or managed manually/server-side.
- Store only minimal non-sensitive data in `adminUsernames`; use generic login errors to reduce username enumeration.

## Main Routes

- `/`: public landing page.
- `/tutorials`: tutorial catalog.
- `/guided-session`: participant guided-study setup.
- `/admin`: admin dashboard.
- `/admin/tutorials`: tutorial content management.
- `/admin/thesis?tab=exports`: thesis export controls.

## Tutorial Content Management

Open `/admin/tutorials` after signing in. Tutorial CRUD writes to Firestore `tutorials/{tutorialId}` only.

The tutorial manager supports:

- listing tutorials
- searching by title or ID
- filtering by category
- importing the local `data.json` tutorial dataset into Firestore
- creating tutorials
- editing tutorials
- deleting tutorials with confirmation
- repeatable tags, materials, optional images, and steps
- step reordering with automatic `step_index` normalization

Tutorial documents should use fields compatible with the public tutorial normalizer:

- `id`
- `title`
- `category`
- `study_role`
- `guided_session_priority`
- `thumbnailUrl`
- `tags`
- `source`
- `source_url`
- `verification_level`
- `summary`
- `materials`
- `steps`
- `optional_images`
- `estimated_minutes`
- `difficulty`
- `risk_level`
- `selection_rationale`
- `active`
- `createdAt`
- `updatedAt`

`thumbnailUrl` is used for tutorial cards on the public tutorial list. Materials can be strings or objects with `name`, `quantity`, `unit`, and `notes`; new admin-created materials use object form. Steps use `step_index`, `step_text`, `imageUrl`, `imageAlt`, and `keywords`.

Study roles use `core_practice`, `core_measured`, or `catalog`. Guided sessions prioritize the four core tutorials marked with `guided_session_priority`.

Use the `Import local dataset` action in `/admin/tutorials` to upsert the 12 local tutorials from `data.json` into Firestore `tutorials/{tutorialId}` documents.

## Browser Guidance

Voice testing should use a documented device and browser for the whole session. Laptop, tablet, and smartphone sessions are allowed because DIY tutorial use is often mobile, but the same device, browser, screen orientation, microphone, and internet setup should remain consistent within a participant session.

The Web Speech API is browser-dependent and may require network support. Guided sessions use `en-US` speech recognition only. If voice recognition is unavailable, the app shows an unsupported-browser warning and touch controls remain available as fallback. Microphone and browser errors are logged as technical notes during study sessions when a session context exists.

## Debugging

Enable debug logging in the browser console with:

```javascript
localStorage.setItem("DEBUG_MODE", "true");
```

Common checks:

- Timer not updating: check browser console for JavaScript errors.
- Required actions not tracking: verify interaction logs are being created.
- Modal not appearing: check z-index conflicts in custom CSS.
- Mobile layout broken: verify the viewport meta tag is present.
- Data not saving: check Firebase configuration and localStorage fallback behavior.

## Public Release Hygiene

Before publishing a fork or reproduction bundle:

- Do not commit `.env`.
- Do not commit real Firebase credentials.
- Do not publish identifiable participant exports unless they are redacted.
- Prefer anonymized CSV exports for paper-facing data release.
