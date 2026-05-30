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

## Guided Session Flow

1. Open `/guided-session`.
2. Complete the participant profile with full name, email, age range, English ability, and tutorial app usage.
3. Confirm eligibility: age 18-35, familiar with web tutorials, able to perform simple simulated DIY tasks, not involved in prototype development, not expert in selected tasks, and no temporary voice/hearing/visual issue that prevents participation.
4. Confirm participant consent.
5. The app assigns AB/BA condition sequence and tutorial rotation automatically from the current balance.
6. Record environment controls and confirm same setup, cache/prototype reset, and microphone check.
7. Create a participant/session.
8. Run practice and measured task trials separately.
9. Complete each task trial with a respondent task completion report.
10. Submit SUS after each condition.
11. Submit final debrief responses.
12. Add issue, feedback, or technical notes as needed.

Condition IDs are `condition_1` and `condition_2`; modality is stored separately as `touch` or `voice`. Practice trials are stored with `trialType: "practice"` and measured trials with `trialType: "measured"`. Guided sessions and participants store `language` as `en`; old sessions with another language value render in English.

Measured task records include `taskScript`, `requiredActions`, `targetKeyword`, `targetStep`, and `successCriteria` so Chapter 4 can describe the exact navigation actions participants performed. Measured actions cover materials, next, repeat, search, overview/jump, previous, return-to-target-step behavior, and scrolling.

The four guided-session core tutorials are `tutorial_001`, `tutorial_002`, `tutorial_005`, and `tutorial_009`. Rotation A uses `tutorial_001` for practice and `tutorial_002` for measured tasks. Rotation B uses `tutorial_005` for practice and `tutorial_009` for measured tasks.

## Privacy Rules

- Store only the required respondent profile fields: full name, email, age range, English ability, and tutorial app usage.
- Do not store phone numbers, passwords, or account credentials.
- Keep participant codes such as `P001` as the stable session identifier.
- Do not store raw microphone audio.
- Store transcripts, command results, timestamps, and interaction metadata only.
- Consent must be confirmed before session creation.
- Thesis CSV exports are anonymized and use participant codes instead of participant names or emails. The identifiable full-session JSON is for admin review only.

## Admin Review

Open `/admin` and sign in with an active admin username and password.

The admin dashboard includes:

- Session list and session detail review.
- Environment, condition, task, SUS, debrief, observer note, and technical note summaries.
- AB/BA and rotation balance monitoring for the 24 participant target.
- Interaction log viewer with filters for session, participant, condition, task, modality, event type, and command success.
- A Guided Sessions workspace with separate Sessions and Logs tabs.
- A Thesis workspace with Metrics & Evidence and Exports tabs.
- A separate Tutorials admin section for tutorial content CRUD.

## Export Usage

Open `/admin/thesis?tab=exports`, sign in as an admin, generate exports, and download the required files. Legacy `/admin/export` and `/exports` links redirect to the same tab.

- `task_trials_export.csv`
- `sus_responses_export.csv`
- `voice_logs_export.csv`
- `touch_logs_export.csv`
- `observer_notes_export.csv`
- `debrief_responses_export.csv`
- `identifiable_full_sessions_admin_export.json`
- `chapter4_summary_metrics.json`
- `chapter4_analysis_ready_dataset.csv`

CSV exports safely escape quotes, commas, and newlines. JSON exports include metadata:

- `exportedAt`
- `source`
- `exportSource`
- `appVersion`

The CSV exports are intended for thesis analysis and exclude participant names/emails. The identifiable admin JSON may include profile details and should not be used as the anonymized thesis dataset.

## Chapter 4 Evidence

The evidence checklist maps data availability to research questions:

- RQ1: touch vs voice task performance and perceived usability from measured task timing, task success, and SUS scores.
- RQ2: browser-based voice reliability from recognition accuracy, command success rate, recovery effort, failures, repeated/rephrased commands, and fallback use.
- RQ3: usability problems and design implications from observer notes, debrief responses, failed/repeated commands, fallback use, and technical notes.

Invalid measured trials remain exportable and are counted separately in summary metrics. The analysis-ready CSV includes paired duration and SUS differences, numeric completion values, sequence/rotation metadata, validity flags, and exclusion reasons for external statistical analysis such as Shapiro-Wilk, paired t-test, Wilcoxon signed-rank test, confidence intervals, and effect sizes.
