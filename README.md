# DIY Assist Me

Research prototype for "Mitigating Situational Impairments in DIY Instructional Tasks: An Empirical Evaluation of Web-Native Voice-Driven Navigation." It compares conventional touch navigation with a constrained set of English voice commands in structured DIY tutorial tasks. The app is a Vite React JavaScript application with Firebase Firestore support and localStorage fallback.

## Setup

```bash
npm install
npm run dev
npm run build
```

The app uses JavaScript/JSX only. It does not use TypeScript or Next.js.

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

## Tutorial Content CRUD

Open `/admin/tutorials` after signing in. Tutorial CRUD writes to Firestore `tutorials/{tutorialId}` only.

The tutorial manager supports:

- listing tutorials
- searching by title or ID
- filtering by category
- creating tutorials
- editing tutorials
- deleting tutorials with confirmation
- repeatable tags, materials, optional images, and steps
- step reordering with automatic `step_index` normalization

Tutorial documents should use fields compatible with the public tutorial normalizer:

- `id`
- `title`
- `category`
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
- `active`
- `createdAt`
- `updatedAt`

Materials can be strings or objects with `name`, `quantity`, `unit`, and `notes`; new admin-created materials use object form. Steps use `step_index`, `step_text`, `imageUrl`, `imageAlt`, and `keywords`.

## Browser Guidance

Primary voice testing browser: Google Chrome desktop.

The Web Speech API is browser-dependent and may require network support. If voice recognition is unavailable, the app shows an unsupported-browser warning and touch controls remain available as fallback. Microphone and browser errors are logged as technical notes during study sessions when a session context exists.

## Study Flow

1. Open `/study`.
2. Confirm participant consent.
3. Select AB or BA condition sequence.
4. Select tutorial rotation.
5. Create an anonymous participant/session.
6. Run practice and measured task trials separately.
7. Complete each task trial with completion coding.
8. Submit SUS after each condition.
9. Submit final debrief responses.
10. Add observer or technical notes as needed.

Condition IDs are `condition_1` and `condition_2`; modality is stored separately as `touch` or `voice`. Practice trials are stored with `trialType: "practice"` and measured trials with `trialType: "measured"`.

Measured task records include `taskScript`, `requiredActions`, `targetKeyword`, `targetStep`, and `successCriteria` so Chapter 4 can describe the exact navigation actions participants performed.

## Privacy Rules

- Do not store participant real names by default.
- Use anonymous participant codes such as `P001`.
- Do not store raw microphone audio.
- Store transcripts, command results, timestamps, and interaction metadata only.
- Consent must be confirmed before session creation.

## Admin Review

Open `/admin` and sign in with an active admin username and password.

The admin dashboard includes:

- Session list and session detail review.
- Environment, condition, task, SUS, debrief, observer note, and technical note summaries.
- Interaction log viewer with filters for session, participant, condition, task, modality, event type, and command success.
- Chapter 4 summary metric preview.
- Chapter 4 evidence checklist.
- A separate Tutorials admin section for tutorial content CRUD.

## Export Usage

Open `/admin/export` or `/exports`, sign in as an admin, generate exports, and download the required files:

- `task_trials_export.csv`
- `sus_responses_export.csv`
- `voice_logs_export.csv`
- `touch_logs_export.csv`
- `observer_notes_export.csv`
- `debrief_responses_export.csv`
- `full_sessions_export.json`
- `chapter4_summary_metrics.json`
- `chapter4_analysis_ready_dataset.csv`

CSV exports safely escape quotes, commas, and newlines. JSON exports include metadata:

- `exportedAt`
- `source`
- `exportSource`
- `appVersion`

## Chapter 4 Evidence

The evidence checklist maps data availability to research questions:

- RQ1: touch vs voice task performance and perceived usability from measured task timing, task success, and SUS scores.
- RQ2: browser-based voice reliability from recognition accuracy, command success rate, recovery effort, failures, and fallback use.
- RQ3: usability problems and design implications from observer notes, debrief responses, failed/repeated commands, fallback use, and technical notes.

Invalid measured trials remain exportable and are counted separately in summary metrics.
