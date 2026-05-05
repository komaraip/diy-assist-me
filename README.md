# DIY Assist Me

Research prototype for comparing touch and voice navigation in DIY tutorial tasks. The app is a Vite React JavaScript application with Firebase Firestore support and localStorage fallback.

## Setup

```bash
npm install
npm run dev
npm run build
```

The app uses JavaScript/JSX only. It does not use TypeScript or Next.js.

## Firebase Configuration

Copy `.env.example` to `.env` and fill the Firebase values when Firestore persistence is needed:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_PASSCODE=
```

When Firebase values are missing or reads/writes fail, the app uses localStorage fallback collections with the same collection names:

- `tutorials`
- `participants`
- `sessions`
- `taskTrials`
- `interactionLogs`
- `susResponses`
- `debriefResponses`
- `observerNotes`

## Admin Passcode

Set `VITE_ADMIN_PASSCODE` to unlock `/admin` and `/exports`. This is prototype-level client-side gating only. It is not a replacement for Firebase Auth or Firestore security rules.

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

## Privacy Rules

- Do not store participant real names by default.
- Use anonymous participant codes such as `P001`.
- Do not store raw microphone audio.
- Store transcripts, command results, timestamps, and interaction metadata only.
- Consent must be confirmed before session creation.

## Admin Review

Open `/admin` after setting `VITE_ADMIN_PASSCODE`.

The admin dashboard includes:

- Session list and session detail review.
- Environment, condition, task, SUS, debrief, observer note, and technical note summaries.
- Interaction log viewer with filters for session, participant, condition, task, modality, event type, and command success.
- Chapter 4 summary metric preview.
- Chapter 4 evidence checklist.

## Export Usage

Open `/exports`, unlock with the admin passcode, generate exports, and download the required files:

- `task_trials_export.csv`
- `sus_responses_export.csv`
- `voice_logs_export.csv`
- `full_sessions_export.json`
- `chapter4_summary_metrics.json`

CSV exports safely escape quotes, commas, and newlines. JSON exports include metadata:

- `exportedAt`
- `exportSource`
- `appVersion`

## Chapter 4 Evidence

The evidence checklist maps data availability to research questions:

- RQ1: measured task timing comparison by modality.
- RQ2: SUS score comparison by modality.
- RQ3: voice command reliability, failures, confidence type, recovery, and fallback use.
- RQ4: usability problems from notes, failed/repeated commands, fallback use, debrief responses, and technical notes.

Invalid measured trials remain exportable and are counted separately in summary metrics.
