/**
 * Application Constants
 * Centralized configuration for version tracking and app-wide constants
 */

// Version Information
export const UI_VERSION = "2.0";
export const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";
export const APP_VERSION = "2.0.0";

// UI Version Changelog
export const UI_CHANGELOG = {
  "2.0": "Enhanced visual hierarchy, mobile layout, task guidance",
  "1.0": "Original implementation"
};

// UI Version Details
export const UI_VERSION_INFO = {
  current: "2.0",
  released: "2026-06-05",
  status: "production",
  changes: [
    "Enhanced visual hierarchy with compact headers",
    "Improved timer visibility (blue accent styling)",
    "Structured task script display",
    "Two-column required actions checklist",
    "Side-by-side desktop layout",
    "Centered modal popovers",
    "Responsive grid system"
  ],
  dataCompatibility: "Full backward compatibility with v1.0",
  researchNotes: "All participants in final study use v2.0 for measurement consistency"
};

// Schema Information
export const SCHEMA_INFO = {
  version: SCHEMA_VERSION,
  collections: [
    "sessions",
    "taskTrials",
    "interactionLogs",
    "susResponses",
    "observerNotes",
    "debriefResponses"
  ],
  fieldsPerInteraction: 25,
  dataIntegrity: "Zero risk - all mechanisms preserved"
};

// Research Configuration
export const RESEARCH_CONFIG = {
  targetParticipants: 24,
  sequenceAssignments: ["AB", "BA"],
  tutorialRotations: ["A", "B"],
  modalities: ["touch", "voice"],
  trialTypes: ["practice", "measured"],
  language: "en",
  susItems: 10,
  susScoreRange: [0, 100]
};

// Validation Thresholds
export const VALIDATION_THRESHOLDS = {
  minimumValidationScore: 95,
  criticalErrorTolerance: 0,
  warningTolerance: 10,
  productionReadyScore: 95
};

// Export Formats
export const EXPORT_FORMATS = {
  csv: "CSV",
  json: "JSON"
};

// Data Collection Status
export const DATA_COLLECTION_STATUS = {
  complete: true,
  fieldsPerLog: 25,
  metricsAvailable: ["RQ1", "RQ2", "RQ3"],
  backwardCompatible: true
};

// Made with Bob
