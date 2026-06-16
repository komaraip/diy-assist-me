# DIY Assist Me

Research artifact for the paper:

**Mitigating Situational Impairments in DIY Instructional Tasks: An Empirical Evaluation of Web-Native Voice-Driven Navigation**

This repository contains the web prototype, curated DIY tutorial dataset, study-flow implementation, and exported analysis files used to evaluate touch-based navigation against constrained English voice commands during structured hands-busy DIY tasks.

This README is intentionally written for readers who arrive from the paper. It summarizes what the repository contains and where each research artifact lives. It is not a setup guide. To run or inspect the prototype locally, see [SETUP.md](SETUP.md).

For dataset inspection, use [DATA.md](DATA.md) for the curated source list and thesis-facing dataset documentation, and [data.json](data.json) for the machine-readable fallback and seed copy of the tutorial dataset.

## Repository Purpose

The prototype was built to support a within-subject usability study comparing two navigation modalities:

- Touch navigation: conventional on-screen controls for tutorial navigation.
- Voice navigation: a constrained command set using browser-native speech recognition.

The study focuses on situational impairment contexts where the participant's hands may be occupied by a physical DIY task. The application records task timing, task success, voice recognition behavior, command outcomes, recovery effort, SUS responses, observer notes, and debrief responses.

## Research Questions Supported

- RQ1: Compare touch and voice conditions on task performance and perceived usability.
- RQ2: Evaluate reliability of browser-based voice input through recognition accuracy, command success, recovery effort, and fallback behavior.
- RQ3: Identify usability issues and design implications from quantitative logs and qualitative study notes.

## Artifact Map

| Artifact | Path | Purpose |
| --- | --- | --- |
| Prototype source | `src/` | React/Vite implementation of tutorial browsing, guided study flow, admin review, and exports. |
| Curated tutorial dataset | [data.json](data.json) | Machine-readable fallback and seed copy for the 12 curated tutorial tasks. |
| Dataset documentation | [DATA.md](DATA.md) | Public source URLs, guided-session core tutorial list, and the embedded JSON snapshot used for traceability. |
| Exported thesis data | `docs/export_data/` | CSV/JSON exports used for Chapter 4 analysis and validation. |
| Analysis utilities | `src/utils/chapter4Metrics.js`, `src/utils/analysisDisplay.js`, `src/scripts/validateResearchExports.js` | Metrics, evidence mapping, and export validation logic. |
| Local run instructions | `SETUP.md` | Separate technical guide for installing, configuring, and running the app. |

## Prototype Scope

- Framework: Vite React JavaScript application.
- Persistence: Firebase Firestore support with localStorage fallback.
- Participant flow: profile, eligibility, consent, assigned condition sequence, practice tasks, measured tasks, SUS, and debrief.
- Admin flow: session review, interaction log inspection, thesis metrics, export generation, tutorial content management, and guided-session review.
- Voice language: English only, using `en-US` browser speech recognition.
- Current UI version: `2.0`.
- Current schema version: `chapter4-rq1-rq3-v1`.
- Last documented update: `2026-06-05`.

## Study Design Encoded in the App

The guided-session flow uses AB/BA counterbalancing and two tutorial rotations:

- Rotation A: `tutorial_001` for practice and `tutorial_002` for measured tasks.
- Rotation B: `tutorial_005` for practice and `tutorial_009` for measured tasks.

The four guided-session core tutorials are:

- `tutorial_001`: No-Heat Overnight Oats Bowl
- `tutorial_002`: Microwave Egg and Cheese Wrap
- `tutorial_005`: Clean a Reusable Water Bottle
- `tutorial_009`: Sort and Label Desk Cables

Practice trials are stored with `trialType: "practice"` and measured trials with `trialType: "measured"`. Condition identifiers are stored as `condition_1` and `condition_2`; the actual modality is stored separately as `touch` or `voice`.

Measured task records include `taskScript`, `requiredActions`, `targetKeyword`, `targetStep`, and `successCriteria` so the exact participant-facing task can be reconstructed from the exported records.

## Data Collection Summary

The app collects:

- Task completion time with millisecond precision.
- Task success labels.
- Required-action completion status.
- SUS responses and computed 0-100 SUS scores.
- Voice transcripts, matched intents, command success, recognition errors, fallback use, and recovery behavior.
- Touch interaction logs for comparable navigation events.
- Observer notes, technical notes, and final debrief responses.

The `tutorial_open` event is recorded as a system/open event when a guided task renders the tutorial. It is not counted as a spoken command for RQ2 speech-recognition accuracy, command success rate, or recovery-effort metrics.

## Dataset Documentation

`DATA.md` is the public documentation companion to `data.json`. It lists the source URLs used during manual curation, identifies the guided-session core tutorial set, and includes the current JSON dataset snapshot.

Tutorial content is designed to come from Firebase Firestore when Firebase is configured and tutorial documents are available. The admin tutorial workspace can create, read, update, and delete tutorial records in Firestore, so the deployed study can manage tutorial content through the admin interface instead of editing source files.

`data.json` is kept as the local fallback and seed copy. If Firebase tutorial data is unavailable, the public tutorial catalog can still render the curated tutorial set from `data.json`. The same JSON file is also used by the admin importer to seed or restore the Firestore tutorial collection. For the study artifact, the Firestore tutorial records and `data.json` are intended to contain the same curated tutorial content so the prototype remains reproducible even when Firebase data is not loaded.

## Exported Analysis Data

The exported analysis files are located in `docs/export_data/`:

- `task_trials_export.csv`
- `sus_responses_export.csv`
- `voice_logs_export.csv`
- `touch_logs_export.csv`
- `observer_notes_export.csv`
- `debrief_responses_export.csv`
- `chapter4_summary_metrics.json`
- `chapter4_analysis_ready_dataset.csv`
- `validation_report.json`
- `identifiable_full_sessions_admin_export.json`

The CSV exports are intended for thesis/paper analysis and use participant codes rather than participant names or email addresses. The identifiable full-session admin JSON is an internal review artifact and must not be treated as an anonymized public dataset unless it has been independently checked and redacted.

## Privacy Notes

- The prototype should store only the required respondent profile fields: full name, email, age range, English ability, and tutorial app usage.
- Phone numbers, passwords, raw microphone audio, and account credentials are not part of the intended study dataset.
- Transcripts, command results, timestamps, interaction metadata, SUS responses, observer notes, and debrief responses are the intended research records.
- Public paper artifacts should use anonymized CSV exports and participant codes.
- Identifiable admin exports should be excluded or redacted before public release if they contain real participant identifiers.

## Local Execution

Readers who want to run the prototype can use the separate local guide:

[SETUP.md](SETUP.md)
