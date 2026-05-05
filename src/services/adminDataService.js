import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { listLocalRecords } from "./localStore.js";
import { serviceSuccess } from "../utils/serviceResult.js";

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
