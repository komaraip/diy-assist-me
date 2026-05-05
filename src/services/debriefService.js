import { addDoc, collection } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { createLocalRecord } from "./localStore.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";

const LOCAL_CONFIG_WARNING = "Feedback was saved on this device.";
const FIREBASE_FALLBACK_WARNING = "Feedback was saved on this device.";

export async function submitDebriefResponse({
  participantId,
  participantCode,
  sessionId,
  responses = {},
} = {}) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!participantId || !sessionId) {
    return serviceFailure("Session is required before saving feedback.", source);
  }

  const submittedAt = new Date().toISOString();
  const record = {
    participantId,
    participantCode: participantCode || "",
    sessionId,
    responses: normalizeDebriefResponses(responses),
    timestamp: submittedAt,
    createdAt: submittedAt,
  };

  if (!isFirebaseEnabled || !db) {
    const localResult = createLocalRecord("debriefResponses", record);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const docRef = await addDoc(collection(db, "debriefResponses"), record);
    return serviceSuccess({ id: docRef.id, ...record }, "firebase");
  } catch {
    const localResult = createLocalRecord("debriefResponses", record);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", FIREBASE_FALLBACK_WARNING);
  }
}

function normalizeDebriefResponses(responses) {
  return {
    preferredModality: responses.preferredModality || "",
    easiestPart: responses.easiestPart || "",
    hardestPart: responses.hardestPart || "",
    voiceProblems: responses.voiceProblems || "",
    touchProblems: responses.touchProblems || "",
    fallbackComments: responses.fallbackComments || "",
    suggestions: responses.suggestions || "",
  };
}
