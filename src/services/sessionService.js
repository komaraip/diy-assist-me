import { addDoc, arrayUnion, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { createLocalRecord, getLocalRecord, updateLocalRecord } from "./localStore.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";

const LOCAL_CONFIG_WARNING = "Session was saved on this device.";
const FIREBASE_FALLBACK_WARNING = "Session was saved on this device.";
const LOCAL_READ_WARNING = "Session was loaded from this device.";
const FIREBASE_READ_FALLBACK_WARNING = "Session was loaded from this device.";
const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";

export async function createSession({
  participantId,
  participantCode,
  consentConfirmed,
  environment = {},
  sequenceAssignment = "",
  tutorialRotation = "",
  conditions = [],
}) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!consentConfirmed) {
    return serviceFailure("Please confirm consent before creating a guided session.", source);
  }

  const sessionData = {
    participantId,
    participantCode,
    schemaVersion: SCHEMA_VERSION,
    consentConfirmed: true,
    status: "created",
    startedAt: new Date().toISOString(),
    endedAt: null,
    browserInfo: getBrowserInfo(),
    environment: normalizeEnvironment(environment),
    sequenceAssignment,
    tutorialRotation,
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

function normalizeEnvironment(environment) {
  return {
    deviceType: environment.deviceType || "",
    browserName: environment.browserName || "",
    microphonePermissionStatus: environment.microphonePermissionStatus || "",
    roomNoiseLevelNote: environment.roomNoiseLevelNote || "",
    internetConnectionNote: environment.internetConnectionNote || "",
    taskEnvironmentNote: environment.taskEnvironmentNote || "",
    researcherObservationNote: environment.researcherObservationNote || "",
  };
}

function getBrowserInfo() {
  if (typeof navigator === "undefined") {
    return {
      userAgent: "",
      language: "",
      platform: "",
    };
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
  };
}
