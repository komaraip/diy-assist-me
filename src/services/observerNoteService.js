import { addDoc, collection } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { createLocalRecord } from "./localStore.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";

const LOCAL_CONFIG_WARNING = "Observer note was saved on this device.";
const FIREBASE_FALLBACK_WARNING = "Observer note was saved on this device.";
const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";

export async function createObserverNote({
  participantId,
  participantCode,
  sessionId,
  conditionId = null,
  taskId = null,
  taskTrialId = null,
  note,
  severity = "note",
  tags = "",
} = {}) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!participantId || !sessionId || !note?.trim()) {
    return serviceFailure("Session and note are required for observer notes.", source);
  }

  const createdAt = new Date().toISOString();
  const record = {
    participantId,
    participantCode: participantCode || "",
    schemaVersion: SCHEMA_VERSION,
    sessionId,
    conditionId,
    taskId,
    taskTrialId,
    note: note.trim(),
    severity,
    tags: tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    timestamp: createdAt,
    createdAt,
  };

  if (!isFirebaseEnabled || !db) {
    const localResult = createLocalRecord("observerNotes", record);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const docRef = await addDoc(collection(db, "observerNotes"), record);
    return serviceSuccess({ id: docRef.id, ...record }, "firebase");
  } catch {
    const localResult = createLocalRecord("observerNotes", record);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", FIREBASE_FALLBACK_WARNING);
  }
}
