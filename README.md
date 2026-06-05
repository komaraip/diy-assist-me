# DIY Assist Me

Research prototype for "Mitigating Situational Impairments in DIY Instructional Tasks: An Empirical Evaluation of Web-Native Voice-Driven Navigation." It compares conventional touch navigation with a constrained set of English voice commands in structured DIY tutorial tasks. The app is a Vite React JavaScript application with Firebase Firestore support and localStorage fallback.

## UI Version

**Current Version**: 2.0
**Schema Version**: chapter4-rq1-rq3-v1
**Last Updated**: 2026-06-05

### Version History

#### Version 2.0 (Current - Production)
**Released**: 2026-06-05
**Status**: ✅ Production Ready

**UI Enhancements**:
- Enhanced visual hierarchy with compact headers
- Improved timer visibility (blue accent styling for better time awareness)
- Structured task script display with numbered instructions
- Two-column required actions checklist for better scanning (when >4 actions)
- Side-by-side desktop layout (1/3 instructions, 2/3 tutorial)
- Centered modal popovers for better mobile UX
- Responsive grid system with mobile-first design

**Data Collection**:
- ✅ All data collection mechanisms preserved from v1.0
- ✅ No database schema changes
- ✅ Full backward compatibility with existing data
- ✅ 25+ fields captured per interaction
- ✅ Complete task trial lifecycle tracking
- ✅ SUS scoring with 10-item instrument
- ✅ Voice metrics: recognition accuracy, command success, recovery effort

**Research Validity**:
- All participants in final study use same UI version (v2.0)
- UI changes documented in research methodology
- Measurement instruments unchanged
- Within-subject design preserved
- AB/BA counterbalancing maintained

#### Version 1.0 (Original)
**Released**: 2025
**Status**: ⚠️ Deprecated

**Original Features**:
- Basic layout with top/bottom positioning
- Standard timer display
- Single-column required actions
- Full-width tutorial layout
- Basic mobile responsiveness

**Migration Notes**:
- No data migration required
- All v1.0 data compatible with v2.0
- UI version tracking recommended for analysis

### UI Version Tracking

For research integrity, all sessions should be tagged with UI version:

```javascript
// Automatically added to session metadata
{
  uiVersion: "2.0",
  uiChangelog: "Enhanced visual hierarchy and mobile layout"
}
```

### Data Collection Fields

**Core Collections** (unchanged across versions):
- `sessions` - Participant session data
- `taskTrials` - Task performance metrics
- `interactionLogs` - Granular interaction tracking (25+ fields)
- `susResponses` - System Usability Scale scores
- `observerNotes` - Qualitative observations
- `debriefResponses` - Post-session feedback

**Key Metrics Captured**:
- Task completion time (millisecond precision)
- Task success (successful/partially_successful/unsuccessful)
- SUS scores (0-100 scale)
- Voice recognition accuracy (per command)
- Command success rate (per interaction)
- Recovery effort (repeated/rephrased commands, fallback usage)
- Required actions completion (checklist tracking)
- Timestamp sequences (for duration validation)

### Troubleshooting

**Common Issues**:

1. **Timer not updating**: Check browser console for JavaScript errors
2. **Required actions not tracking**: Verify interaction logs are being created
3. **Modal not appearing**: Check z-index conflicts in custom CSS
4. **Mobile layout broken**: Verify viewport meta tag is present
5. **Data not saving**: Check Firebase connection and localStorage fallback

**Debug Mode**:
```javascript
// Enable debug logging in browser console
localStorage.setItem('DEBUG_MODE', 'true');
```

**Validation**:
```bash
# Validate current data integrity
node src/scripts/validateData.js

# Export validation report
node src/scripts/validateData.js --export validation-report.json
```

See [`docs/QUICK_START.md`](docs/QUICK_START.md) for quick reference guide.

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
11. Submit final debrief responses. The final feedback requires preferred modality plus short answers for what was easiest, what was hardest, and what would make the experience better; additional diagnostic fields remain optional.
12. Add issue, feedback, or technical notes as needed.

Condition IDs are `condition_1` and `condition_2`; modality is stored separately as `touch` or `voice`. Practice trials are stored with `trialType: "practice"` and measured trials with `trialType: "measured"`. Guided sessions and participants store `language` as `en`; old sessions with another language value render in English.

Measured task records include `taskScript`, `requiredActions`, `targetKeyword`, `targetStep`, and `successCriteria` so Chapter 4 can describe the exact navigation actions participants performed. Measured actions cover materials, next, repeat, search, overview/jump, previous, return-to-target-step behavior, and scrolling.

The four guided-session core tutorials are `tutorial_001`, `tutorial_002`, `tutorial_005`, and `tutorial_009`. Rotation A uses `tutorial_001` for practice and `tutorial_002` for measured tasks. Rotation B uses `tutorial_005` for practice and `tutorial_009` for measured tasks.

`tutorial_open` is recorded as a system/open event when a guided task renders the tutorial. It is not counted as a spoken command in RQ2 speech-recognition accuracy, command success rate, or recovery-effort metrics.

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
- RQ3: usability problems and design implications from observer notes, core-complete debrief responses, failed/repeated commands, fallback use, and technical notes.

Invalid measured trials remain exportable and are counted separately in summary metrics. The analysis-ready CSV includes paired duration and SUS differences, numeric completion values, sequence/rotation metadata, validity flags, and exclusion reasons for external statistical analysis such as Shapiro-Wilk, paired t-test, Wilcoxon signed-rank test, confidence intervals, and effect sizes.
