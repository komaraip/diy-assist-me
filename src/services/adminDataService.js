import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { deleteLocalRecord, deleteLocalRecordsByField, listLocalRecords, updateLocalRecord } from "./localStore.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";

export const ADMIN_COLLECTIONS = [
  "participants",
  "sessions",
  "taskTrials",
  "interactionLogs",
  "susResponses",
  "debriefResponses",
  "observerNotes",
];

const LOCAL_CONFIG_WARNING = "Firebase is not configured. Admin data was loaded from local storage.";
const FIREBASE_FALLBACK_WARNING = "Some Firebase admin data could not be loaded. Local fallback was used where available.";

export async function loadAdminData() {
  if (!isFirebaseEnabled || !db) {
    const data = Object.fromEntries(ADMIN_COLLECTIONS.map((collectionName) => [
      collectionName,
      listLocalRecords(collectionName).data || [],
    ]));
    return serviceSuccess(data, "local", LOCAL_CONFIG_WARNING);
  }

  const data = {};
  const warnings = [];

  await Promise.all(
    ADMIN_COLLECTIONS.map(async (collectionName) => {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        data[collectionName] = snapshot.docs.map((documentSnapshot) => ({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        }));
      } catch {
        data[collectionName] = listLocalRecords(collectionName).data || [];
        warnings.push(`${collectionName} fallback`);
      }
    })
  );

  return serviceSuccess(
    data,
    warnings.length ? "local" : "firebase",
    warnings.length ? `${FIREBASE_FALLBACK_WARNING} ${warnings.join(", ")}.` : null
  );
}

export function buildSessionBundles(data = {}) {
  const participants = data.participants || [];
  const sessions = data.sessions || [];
  const taskTrials = data.taskTrials || [];
  const interactionLogs = data.interactionLogs || [];
  const susResponses = data.susResponses || [];
  const debriefResponses = data.debriefResponses || [];
  const observerNotes = data.observerNotes || [];

  return sessions
    .map((session) => {
      const participant = participants.find((item) => item.id === session.participantId) || null;
      return {
        ...session,
        participant,
        taskTrials: taskTrials.filter((item) => item.sessionId === session.id),
        interactionLogs: interactionLogs.filter((item) => item.sessionId === session.id),
        susResponses: susResponses.filter((item) => item.sessionId === session.id),
        debriefResponses: debriefResponses.filter((item) => item.sessionId === session.id),
        observerNotes: observerNotes.filter((item) => item.sessionId === session.id),
      };
    })
    .sort((a, b) => new Date(b.startedAt || b.createdAt || 0).getTime() - new Date(a.startedAt || a.createdAt || 0).getTime());
}

/** Collections that store session-linked child records keyed by `sessionId`. */
const SESSION_CHILD_COLLECTIONS = [
  "taskTrials",
  "interactionLogs",
  "susResponses",
  "debriefResponses",
  "observerNotes",
];

/**
 * Hard-deletes a session document, its participant document, and ALL linked
 * child records from Firestore (or local storage as a fallback).
 *
 * @param {string} sessionId - The Firestore session document ID.
 * @param {string|null} participantId - The Firestore participant document ID
 *   stored on the session as `session.participantId`. Pass null if unknown.
 */
export async function deleteSessionBundle(sessionId, participantId = null) {
  if (!sessionId) return serviceFailure("Session id is required.", "local");

  if (!isFirebaseEnabled || !db) {
    // Local-storage fallback
    deleteLocalRecord("sessions", sessionId);
    if (participantId) deleteLocalRecord("participants", participantId);
    SESSION_CHILD_COLLECTIONS.forEach((collectionName) => {
      deleteLocalRecordsByField(collectionName, "sessionId", sessionId);
    });
    return serviceSuccess({ sessionId }, "local");
  }

  try {
    // ── 1. Gather all doc refs to delete ──────────────────────────────────────
    const docsToDelete = [];

    // Session doc itself
    docsToDelete.push(doc(db, "sessions", sessionId));

    // Participant doc (no sessionId field — must delete by ID directly)
    if (participantId) {
      docsToDelete.push(doc(db, "participants", participantId));
    }

    // Child collections linked by sessionId
    await Promise.all(
      SESSION_CHILD_COLLECTIONS.map(async (collectionName) => {
        const childQuery = query(
          collection(db, collectionName),
          where("sessionId", "==", sessionId)
        );
        const snapshot = await getDocs(childQuery);
        snapshot.docs.forEach((childDoc) => docsToDelete.push(childDoc.ref));
      })
    );

    // ── 2. Commit in chunks of 499 (Firestore batch limit is 500) ─────────────
    const CHUNK_SIZE = 499;
    for (let i = 0; i < docsToDelete.length; i += CHUNK_SIZE) {
      const chunk = docsToDelete.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    return serviceSuccess({ sessionId, participantId }, "firebase");
  } catch (error) {
    return serviceFailure(`Failed to delete session: ${error?.message || error}`, "firebase");
  }
}

/** Allowed top-level patch keys for session metadata edits. */
const ALLOWED_META_KEYS = [
  "participantCode",
  "participantProfile",
  "excludeFromExport",
  "researcherNote",
];

/**
 * Updates editable metadata fields on a session document.
 * Only `ALLOWED_META_KEYS` are accepted to prevent schema corruption.
 */
export async function updateSessionMeta(sessionId, patch) {
  if (!sessionId) return serviceFailure("Session id is required.", "local");

  const safePatch = Object.fromEntries(
    Object.entries(patch).filter(([key]) => ALLOWED_META_KEYS.includes(key))
  );

  if (!isFirebaseEnabled || !db) {
    return updateLocalRecord("sessions", sessionId, safePatch);
  }

  try {
    await updateDoc(doc(db, "sessions", sessionId), safePatch);
    return serviceSuccess({ id: sessionId, ...safePatch }, "firebase");
  } catch (error) {
    return serviceFailure(`Failed to update session: ${error?.message || error}`, "firebase");
  }
}

/**
 * Nuclear option: deletes EVERY document in ALL study collections.
 * Use this to clean up orphaned records left by previous partial deletes.
 * Collections purged: participants, sessions, taskTrials, interactionLogs,
 * susResponses, debriefResponses, observerNotes.
 *
 * Returns { deleted: number } on success.
 */
export async function purgeAllStudyData() {
  if (!isFirebaseEnabled || !db) {
    // Local storage: clear each collection entirely
    ADMIN_COLLECTIONS.forEach((collectionName) => {
      const records = listLocalRecords(collectionName).data || [];
      records.forEach((record) => deleteLocalRecord(collectionName, record.id));
    });
    return serviceSuccess({ deleted: "all (local)" }, "local");
  }

  try {
    // Fetch all docs from every collection in parallel
    const allRefs = [];
    await Promise.all(
      ADMIN_COLLECTIONS.map(async (collectionName) => {
        const snapshot = await getDocs(collection(db, collectionName));
        snapshot.docs.forEach((d) => allRefs.push(d.ref));
      })
    );

    // Delete in chunks of 499 (Firestore batch limit = 500)
    const CHUNK_SIZE = 499;
    let deleted = 0;
    for (let i = 0; i < allRefs.length; i += CHUNK_SIZE) {
      const chunk = allRefs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
      deleted += chunk.length;
    }

    return serviceSuccess({ deleted }, "firebase");
  } catch (error) {
    return serviceFailure(`Failed to purge data: ${error?.message || error}`, "firebase");
  }
}
