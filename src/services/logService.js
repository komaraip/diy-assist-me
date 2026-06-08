import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { createLocalRecord, deleteLocalRecord, listLocalRecords } from "./localStore.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";

const LOCAL_CONFIG_WARNING = "Interaction was saved on this device.";
const FIREBASE_FALLBACK_WARNING = "Interaction was saved on this device.";
const LOCAL_VOICE_WARNING = "Voice interaction was saved on this device.";
const FIREBASE_VOICE_FALLBACK_WARNING = "Voice interaction was saved on this device.";
const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";

export async function logTouchInteraction(event = {}) {
  return writeInteractionLog(buildInteractionLogRecord({ ...event, modality: "touch" }), {
    localWarning: LOCAL_CONFIG_WARNING,
    firebaseFallbackWarning: FIREBASE_FALLBACK_WARNING,
  });
}

export async function logVoiceInteraction(event = {}) {
  return writeInteractionLog(buildInteractionLogRecord({ ...event, modality: "voice" }), {
    localWarning: LOCAL_VOICE_WARNING,
    firebaseFallbackWarning: FIREBASE_VOICE_FALLBACK_WARNING,
  });
}

export async function listInteractionLogsBySession(sessionId) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!sessionId) {
    return serviceFailure("Session id is required.", source, []);
  }

  if (!isFirebaseEnabled || !db) {
    const localResult = listLocalRecords("interactionLogs");
    if (localResult.error) return localResult;
    return serviceSuccess(
      (localResult.data || []).filter((log) => log.sessionId === sessionId),
      "local",
      LOCAL_CONFIG_WARNING
    );
  }

  try {
    const snapshot = await getDocs(query(collection(db, "interactionLogs"), where("sessionId", "==", sessionId)));
    return serviceSuccess(snapshot.docs.map((logDoc) => ({ id: logDoc.id, ...logDoc.data() })), "firebase");
  } catch {
    const localResult = listLocalRecords("interactionLogs");
    return serviceSuccess(
      (localResult.data || []).filter((log) => log.sessionId === sessionId),
      "local",
      FIREBASE_FALLBACK_WARNING
    );
  }
}

export async function deleteInteractionLogsForTask({ sessionId, taskId, trialType } = {}) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!sessionId || !taskId || !trialType) {
    return serviceFailure("Session, task, and trial type are required to delete interaction logs.", source);
  }

  const matchesTask = (log) =>
    log.sessionId === sessionId &&
    log.taskId === taskId &&
    log.trialType === trialType;

  if (!isFirebaseEnabled || !db) {
    const logs = listLocalRecords("interactionLogs").data || [];
    const matchingLogs = logs.filter(matchesTask);
    matchingLogs.forEach((log) => {
      if (log.id) deleteLocalRecord("interactionLogs", log.id);
    });
    return serviceSuccess({ deletedCount: matchingLogs.length }, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const snapshot = await getDocs(query(collection(db, "interactionLogs"), where("sessionId", "==", sessionId)));
    const matchingDocs = snapshot.docs.filter((logDoc) => matchesTask({ id: logDoc.id, ...logDoc.data() }));
    await Promise.all(matchingDocs.map((logDoc) => deleteDoc(doc(db, "interactionLogs", logDoc.id))));
    return serviceSuccess({ deletedCount: matchingDocs.length }, "firebase");
  } catch (error) {
    return serviceFailure(`Failed to delete interaction logs: ${error?.message || error}`, source);
  }
}

function buildInteractionLogRecord(event = {}) {
  const timestamp = new Date().toISOString();

  return {
    participantId: event.participantId || null,
    participantCode: event.participantCode || "",
    schemaVersion: SCHEMA_VERSION,
    sessionId: event.sessionId || null,
    conditionId: event.conditionId || null,
    conditionOrder: event.conditionOrder ?? null,
    taskId: event.taskId || null,
    trialType: event.trialType || null,
    tutorialId: event.tutorialId || null,
    modality: event.modality || "touch",
    eventType: event.eventType || "interaction",
    timestamp,
    createdAt: timestamp,
    clientTimestamp: timestamp,
    elapsedMsFromTaskStart: event.elapsedMsFromTaskStart ?? null,
    stepIndexBefore: event.stepIndexBefore ?? null,
    stepIndexAfter: event.stepIndexAfter ?? null,
    rawTranscript: event.rawTranscript ?? null,
    normalizedTranscript: event.normalizedTranscript ?? null,
    recognized: event.recognized ?? null,
    recognitionErrorCode: event.recognitionErrorCode ?? null,
    matchedIntent: event.matchedIntent ?? null,
    confidenceType: event.confidenceType ?? null,
    commandSuccess: event.commandSuccess ?? null,
    failureReason: event.failureReason ?? null,
    recoveryType: event.recoveryType ?? null,
    isRecoveryAttempt: event.isRecoveryAttempt ?? false,
    recoveryAttemptType: event.recoveryAttemptType ?? "",
    fallbackUsed: event.fallbackUsed ?? false,
    touchUseContext: event.touchUseContext ?? event.metadata?.touchUseContext ?? "",
    previousVoiceFailureEventId: event.previousVoiceFailureEventId ?? event.metadata?.previousVoiceFailureEventId ?? "",
    speechConfidence: event.speechConfidence ?? event.metadata?.speechConfidence ?? null,
    matchedPhrase: event.matchedPhrase ?? event.metadata?.matchedPhrase ?? "",
    query: event.query ?? event.metadata?.query ?? "",
    stepNumber: event.stepNumber ?? event.metadata?.stepNumber ?? null,
    metadata: event.metadata || {},
  };
}

async function writeInteractionLog(logRecord, { localWarning, firebaseFallbackWarning }) {
  if (!isFirebaseEnabled || !db) {
    const localResult = createLocalRecord("interactionLogs", logRecord);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", localWarning);
  }

  try {
    const docRef = await addDoc(collection(db, "interactionLogs"), logRecord);
    return serviceSuccess({ id: docRef.id, ...logRecord }, "firebase");
  } catch {
    const localResult = createLocalRecord("interactionLogs", logRecord);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", firebaseFallbackWarning);
  }
}
