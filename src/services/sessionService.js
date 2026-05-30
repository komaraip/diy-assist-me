import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { createLocalRecord, getLocalRecord, listLocalRecords, updateLocalRecord } from "./localStore.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";
import { DEFAULT_STUDY_LANGUAGE, getStudyCopy, normalizeStudyLanguage } from "../config/guidedSessionContent.js";

const LOCAL_CONFIG_WARNING = "Session was saved on this device.";
const FIREBASE_FALLBACK_WARNING = "Session was saved on this device.";
const LOCAL_READ_WARNING = "Session was loaded from this device.";
const FIREBASE_READ_FALLBACK_WARNING = "Session was loaded from this device.";
const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";

export async function createSession({
  participantId,
  participantCode,
  participantProfile = {},
  eligibility = {},
  consentConfirmed,
  environment = {},
  sequenceAssignment = "",
  tutorialRotation = "",
  language = DEFAULT_STUDY_LANGUAGE,
  conditions = [],
}) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";
  const normalizedLanguage = normalizeStudyLanguage(language);

  if (!consentConfirmed) {
    return serviceFailure(getStudyCopy(normalizedLanguage).setupPage.consentError, source);
  }

  const sessionData = {
    participantId,
    participantCode,
    participantProfile: normalizeParticipantProfile(participantProfile),
    eligibility: normalizeEligibility(eligibility),
    schemaVersion: SCHEMA_VERSION,
    consentConfirmed: true,
    status: "created",
    startedAt: new Date().toISOString(),
    endedAt: null,
    browserInfo: getBrowserInfo(),
    environment: normalizeEnvironment(environment),
    sequenceAssignment,
    tutorialRotation,
    language: normalizedLanguage,
    conditions,
    technicalNotes: [],
  };

  if (!isFirebaseEnabled || !db) {
    const localResult = createLocalRecord("sessions", sessionData);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const docRef = await addDoc(collection(db, "sessions"), sessionData);
    return serviceSuccess({ id: docRef.id, ...sessionData }, "firebase");
  } catch {
    const localResult = createLocalRecord("sessions", sessionData);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", FIREBASE_FALLBACK_WARNING);
  }
}

export async function getSessionById(sessionId) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!sessionId) {
    return serviceFailure("Session id is required.", source);
  }

  if (!isFirebaseEnabled || !db) {
    const localResult = getLocalRecord("sessions", sessionId);
    if (localResult.error || !localResult.data) {
      return serviceFailure(localResult.error || "Session not found.", "local");
    }
    return serviceSuccess(localResult.data, "local", LOCAL_READ_WARNING);
  }

  try {
    const snapshot = await getDoc(doc(db, "sessions", sessionId));
    if (!snapshot.exists()) {
      const localResult = getLocalRecord("sessions", sessionId);
      if (localResult.data) {
        return serviceSuccess(localResult.data, "local", FIREBASE_READ_FALLBACK_WARNING);
      }
      return serviceFailure("Session not found.", "firebase");
    }
    return serviceSuccess({ id: snapshot.id, ...snapshot.data() }, "firebase");
  } catch {
    const localResult = getLocalRecord("sessions", sessionId);
    if (localResult.data) {
      return serviceSuccess(localResult.data, "local", FIREBASE_READ_FALLBACK_WARNING);
    }
    return serviceFailure("Session could not be loaded.", "local", null, FIREBASE_READ_FALLBACK_WARNING);
  }
}

export async function updateSession(sessionId, patch) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!sessionId) {
    return serviceFailure("Session id is required.", source);
  }

  if (!isFirebaseEnabled || !db) {
    const localResult = updateLocalRecord("sessions", sessionId, patch);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    await updateDoc(doc(db, "sessions", sessionId), patch);
    return serviceSuccess({ id: sessionId, ...patch }, "firebase");
  } catch {
    const localResult = updateLocalRecord("sessions", sessionId, patch);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", FIREBASE_FALLBACK_WARNING);
  }
}

export async function appendTechnicalNote(sessionId, note) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!sessionId) {
    return serviceFailure("Session id is required to append a technical note.", source);
  }

  const technicalNote = {
    id: `note_${Date.now()}`,
    note,
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseEnabled || !db) {
    const existing = getLocalRecord("sessions", sessionId).data;
    const updated = updateLocalRecord("sessions", sessionId, {
      technicalNotes: [...(existing?.technicalNotes || []), technicalNote],
    });
    if (updated.error) return updated;
    return serviceSuccess(updated.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    await updateDoc(doc(db, "sessions", sessionId), {
      technicalNotes: arrayUnion(technicalNote),
    });
    return serviceSuccess({ sessionId, technicalNote }, "firebase");
  } catch {
    const existing = getLocalRecord("sessions", sessionId).data;
    const updated = updateLocalRecord("sessions", sessionId, {
      technicalNotes: [...(existing?.technicalNotes || []), technicalNote],
    });
    return serviceSuccess(updated.data || { sessionId, technicalNote }, "local", FIREBASE_FALLBACK_WARNING);
  }
}

export async function getSessionBalanceSummary() {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  const summarize = (sessions) => {
    const activeSessions = (sessions || []).filter((session) => session.excludeFromExport !== true);
    const countBy = (field, value) => activeSessions.filter((session) => session[field] === value).length;
    const sequenceRecommendation = countBy("sequenceAssignment", "AB") <= countBy("sequenceAssignment", "BA") ? "AB" : "BA";
    const rotationRecommendation = countBy("tutorialRotation", "rotation_a") <= countBy("tutorialRotation", "rotation_b")
      ? "rotation_a"
      : "rotation_b";

    return {
      totalSessions: activeSessions.length,
      abCount: countBy("sequenceAssignment", "AB"),
      baCount: countBy("sequenceAssignment", "BA"),
      rotationACount: countBy("tutorialRotation", "rotation_a"),
      rotationBCount: countBy("tutorialRotation", "rotation_b"),
      targetParticipants: 24,
      targetPerSequence: 12,
      recommendedSequenceAssignment: sequenceRecommendation,
      recommendedTutorialRotation: rotationRecommendation,
    };
  };

  if (!isFirebaseEnabled || !db) {
    return serviceSuccess(summarize(listLocalRecords("sessions").data || []), "local", LOCAL_READ_WARNING);
  }

  try {
    const snapshot = await getDocs(collection(db, "sessions"));
    return serviceSuccess(summarize(snapshot.docs.map((documentSnapshot) => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data(),
    }))), "firebase");
  } catch {
    return serviceSuccess(summarize(listLocalRecords("sessions").data || []), "local", FIREBASE_READ_FALLBACK_WARNING);
  }
}

function normalizeEnvironment(environment) {
  return {
    deviceType: environment.deviceType || "",
    browserName: environment.browserName || "",
    microphonePermissionStatus: environment.microphonePermissionStatus || "",
    roomNoiseLevelNote: environment.roomNoiseLevelNote || "",
    internetConnectionNote: environment.internetConnectionNote || "",
    taskEnvironmentNote: environment.taskEnvironmentNote || "",
    participantSetupNote: environment.participantSetupNote || environment.researcherObservationNote || "",
    researcherObservationNote: environment.researcherObservationNote || environment.participantSetupNote || "",
    sameDeviceConfirmed: environment.sameDeviceConfirmed === true,
    cacheResetConfirmed: environment.cacheResetConfirmed === true,
    microphoneCheckConfirmed: environment.microphoneCheckConfirmed === true,
  };
}

function normalizeParticipantProfile(participantProfile = {}) {
  return {
    fullName: String(participantProfile.fullName || "").trim(),
    email: String(participantProfile.email || "").trim(),
    ageRange: String(participantProfile.ageRange || "").trim(),
    englishAbility: String(participantProfile.englishAbility || "").trim(),
    tutorialAppUsage: String(participantProfile.tutorialAppUsage || "").trim(),
  };
}

function normalizeEligibility(eligibility = {}) {
  return {
    familiarWithWebTutorials: eligibility.familiarWithWebTutorials === true,
    canPerformSimulatedDiy: eligibility.canPerformSimulatedDiy === true,
    notPrototypeDeveloper: eligibility.notPrototypeDeveloper === true,
    notExpertInSelectedTasks: eligibility.notExpertInSelectedTasks === true,
    noTemporaryVoiceCondition: eligibility.noTemporaryVoiceCondition === true,
    noUncorrectedHearingVisualLimit: eligibility.noUncorrectedHearingVisualLimit === true,
  };
}

function getBrowserInfo() {
  if (typeof navigator === "undefined") {
    return {
      userAgent: "",
      language: "",
      platform: "",
      detectedBrowserName: "unknown",
      detectedBrowserVersion: "",
      speechRecognitionSupported: false,
      isSecureContext: false,
      viewportWidth: null,
      viewportHeight: null,
      screenWidth: null,
      screenHeight: null,
      devicePixelRatio: null,
      orientation: "",
    };
  }

  const detected = detectBrowserFromUserAgent(navigator.userAgent || "");

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    detectedBrowserName: detected.name,
    detectedBrowserVersion: detected.version,
    speechRecognitionSupported: isSpeechRecognitionSupported(),
    isSecureContext: typeof window !== "undefined" ? window.isSecureContext === true : false,
    viewportWidth: typeof window !== "undefined" ? window.innerWidth : null,
    viewportHeight: typeof window !== "undefined" ? window.innerHeight : null,
    screenWidth: typeof window !== "undefined" && window.screen ? window.screen.width : null,
    screenHeight: typeof window !== "undefined" && window.screen ? window.screen.height : null,
    devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : null,
    orientation: typeof window !== "undefined" && window.screen?.orientation
      ? window.screen.orientation.type
      : "",
  };
}

function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

function detectBrowserFromUserAgent(userAgent) {
  const browserPatterns = [
    { name: "Microsoft Edge", pattern: /Edg\/([\d.]+)/ },
    { name: "Chrome", pattern: /Chrome\/([\d.]+)/ },
    { name: "Firefox", pattern: /Firefox\/([\d.]+)/ },
    { name: "Safari", pattern: /Version\/([\d.]+).*Safari/ },
  ];
  const match = browserPatterns
    .map((browser) => ({ ...browser, match: userAgent.match(browser.pattern) }))
    .find((browser) => browser.match);

  return {
    name: match?.name || "unknown",
    version: match?.match?.[1] || "",
  };
}
