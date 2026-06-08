import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { createLocalRecord, deleteLocalRecord, listLocalRecords, updateLocalRecord } from "./localStore.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";

const LOCAL_CONFIG_WARNING = "Task was saved on this device.";
const FIREBASE_FALLBACK_WARNING = "Task was saved on this device.";
const LOCAL_READ_WARNING = "Tasks were loaded from this device.";
const FIREBASE_READ_FALLBACK_WARNING = "Tasks were loaded from this device.";
const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";

export async function startTaskTrial({
  participantId,
  participantCode,
  sessionId,
  conditionId,
  taskId,
  tutorialId,
  modality,
  trialType,
  conditionOrder = null,
  sequenceAssignment = "",
  tutorialRotation = "",
  taskScript = [],
  requiredActions = [],
  targetKeyword = "",
  targetStep = null,
  successCriteria = "",
} = {}) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!participantId || !sessionId || !conditionId || !taskId || !tutorialId || !modality || !trialType) {
    return serviceFailure("Session, mode, task, tutorial, and input type are required.", source);
  }

  const startedAt = new Date().toISOString();
  const taskTrial = {
    participantId,
    participantCode: participantCode || "",
    schemaVersion: SCHEMA_VERSION,
    sessionId,
    conditionId,
    conditionOrder,
    sequenceAssignment,
    tutorialRotation,
    taskId,
    tutorialId,
    modality,
    trialType,
    taskScript: Array.isArray(taskScript) ? taskScript : [],
    requiredActions: Array.isArray(requiredActions) ? requiredActions : [],
    targetKeyword: targetKeyword || "",
    targetStep: targetStep ?? null,
    successCriteria: successCriteria || "",
    startedAt,
    endedAt: null,
    durationSeconds: null,
    completed: false,
    completionStatus: "",
    invalidTrial: false,
    invalidTrialReason: "",
    participantTaskNote: "",
    researcherNote: "",
    status: "in_progress",
    createdAt: startedAt,
    updatedAt: startedAt,
  };

  if (!isFirebaseEnabled || !db) {
    const localResult = createLocalRecord("taskTrials", taskTrial);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const docRef = await addDoc(collection(db, "taskTrials"), taskTrial);
    return serviceSuccess({ id: docRef.id, ...taskTrial }, "firebase");
  } catch {
    const localResult = createLocalRecord("taskTrials", taskTrial);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", FIREBASE_FALLBACK_WARNING);
  }
}

export async function completeTaskTrial(taskTrial, {
  completionStatus,
  invalidTrial = false,
  invalidTrialReason = "",
  participantTaskNote = "",
  researcherNote = "",
} = {}) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!taskTrial?.id) {
    return serviceFailure("Task record is required.", source);
  }

  if (!["successful", "partially_successful", "unsuccessful"].includes(completionStatus)) {
    return serviceFailure("Completion status must be successful, partially_successful, or unsuccessful.", source);
  }

  if (invalidTrial && !invalidTrialReason.trim()) {
    return serviceFailure("Invalid task reason is required when a task is marked invalid.", source);
  }

  const endedAt = new Date().toISOString();
  const durationSeconds = calculateDurationSeconds(taskTrial.startedAt, endedAt);
  const patch = {
    endedAt,
    durationSeconds,
    completed: completionStatus !== "unsuccessful",
    completionStatus,
    invalidTrial,
    invalidTrialReason: invalidTrial ? invalidTrialReason.trim() : "",
    participantTaskNote: (participantTaskNote || researcherNote).trim(),
    researcherNote: (researcherNote || participantTaskNote).trim(),
    status: "completed",
    updatedAt: endedAt,
  };

  if (!isFirebaseEnabled || !db) {
    const localResult = updateLocalRecord("taskTrials", taskTrial.id, patch);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    await updateDoc(doc(db, "taskTrials", taskTrial.id), patch);
    return serviceSuccess({ ...taskTrial, ...patch }, "firebase");
  } catch {
    const localResult = updateLocalRecord("taskTrials", taskTrial.id, patch);
    if (!localResult.error) {
      return serviceSuccess(localResult.data, "local", FIREBASE_FALLBACK_WARNING);
    }
    const createdLocal = createLocalRecord("taskTrials", { ...taskTrial, ...patch });
    if (createdLocal.error) return createdLocal;
    return serviceSuccess(createdLocal.data, "local", FIREBASE_FALLBACK_WARNING);
  }
}

export async function listTaskTrialsBySession(sessionId) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!sessionId) {
    return serviceFailure("Session id is required.", source, []);
  }

  if (!isFirebaseEnabled || !db) {
    const localResult = listLocalRecords("taskTrials");
    if (localResult.error) return localResult;
    return serviceSuccess(
      (localResult.data || []).filter((trial) => trial.sessionId === sessionId),
      "local",
      LOCAL_READ_WARNING
    );
  }

  try {
    const snapshot = await getDocs(query(collection(db, "taskTrials"), where("sessionId", "==", sessionId)));
    const taskTrials = snapshot.docs.map((trialDoc) => ({ id: trialDoc.id, ...trialDoc.data() }));
    return serviceSuccess(taskTrials, "firebase");
  } catch {
    const localResult = listLocalRecords("taskTrials");
    const taskTrials = (localResult.data || []).filter((trial) => trial.sessionId === sessionId);
    return serviceSuccess(taskTrials, "local", FIREBASE_READ_FALLBACK_WARNING);
  }
}

export async function deleteTaskTrial(taskTrialId) {
  const source = isFirebaseEnabled && db ? "firebase" : "local";

  if (!taskTrialId) {
    return serviceFailure("Task trial id is required.", source);
  }

  if (!isFirebaseEnabled || !db) {
    const localResult = deleteLocalRecord("taskTrials", taskTrialId);
    if (localResult.error) return localResult;
    return serviceSuccess(localResult.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    await deleteDoc(doc(db, "taskTrials", taskTrialId));
    return serviceSuccess({ id: taskTrialId }, "firebase");
  } catch (error) {
    return serviceFailure(`Failed to delete task trial: ${error?.message || error}`, "firebase");
  }
}

function calculateDurationSeconds(startedAt, endedAt) {
  const started = new Date(startedAt).getTime();
  const ended = new Date(endedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return null;
  return Math.max(0, Math.round((ended - started) / 1000));
}
