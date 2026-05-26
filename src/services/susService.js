import { addDoc, collection } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { createLocalRecord } from "./localStore.js";
import { calculateSusScore, hasCompleteSusResponses } from "../utils/susScoring.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";

const LOCAL_CONFIG_WARNING = "Questionnaire response was saved on this device.";
const FIREBASE_FALLBACK_WARNING = "Questionnaire response was saved on this device.";
const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";

export async function submitSusResponse({
  participantId,
  participantCode,
  sessionId,
  conditionId,
  conditionOrder,
  modality,
  responses,
} = {}) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!participantId || !sessionId || !conditionId || !modality) {
    return serviceFailure("Session and mode are required for questionnaire responses.", source);
  }

  if (!hasCompleteSusResponses(responses)) {
    return serviceFailure("All 10 SUS items must be answered from 1 to 5.", source);
  }

  const scoring = calculateSusScore(responses);
  const submittedAt = new Date().toISOString();
  const record = {
    participantId,
    participantCode: participantCode || "",
    schemaVersion: SCHEMA_VERSION,
    sessionId,
    conditionId,
    conditionOrder,
    modality,
    itemResponses: responses,
    contributions: scoring.contributions,
    contributionSum: scoring.contributionSum,
    susScore: scoring.susScore,
    timestamp: submittedAt,
    createdAt: submittedAt,
  };

  if (!isFirebaseEnabled || !db) {
    const localResult = createLocalRecord("susResponses", record);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const docRef = await addDoc(collection(db, "susResponses"), record);
    return serviceSuccess({ id: docRef.id, ...record }, "firebase");
  } catch {
    const localResult = createLocalRecord("susResponses", record);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", FIREBASE_FALLBACK_WARNING);
  }
}
