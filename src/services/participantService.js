import { addDoc, collection, getDocs } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { createLocalRecord, listLocalRecords } from "./localStore.js";
import { serviceSuccess } from "../utils/serviceResult.js";

const LOCAL_CONFIG_WARNING = "User record was saved on this device.";
const FIREBASE_FALLBACK_WARNING = "User record was saved on this device.";

export async function createParticipant({
  sequenceAssignment = "",
  tutorialRotation = "",
  notes = "",
} = {}) {
  const createdAt = new Date().toISOString();

  if (!isFirebaseEnabled || !db) {
    const participant = createLocalParticipant({ sequenceAssignment, tutorialRotation, notes, createdAt });
    if (participant.error) return participant;
    return serviceSuccess(participant.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const participantCode = await getNextFirebaseParticipantCode();
    const participantData = {
      participantCode,
      sequenceAssignment,
      tutorialRotation,
      notes,
      createdAt,
    };
    const docRef = await addDoc(collection(db, "participants"), participantData);
    return serviceSuccess({ id: docRef.id, ...participantData }, "firebase");
  } catch {
    const participant = createLocalParticipant({ sequenceAssignment, tutorialRotation, notes, createdAt });
    if (participant.error) return participant;
    return serviceSuccess(participant.data, "local", FIREBASE_FALLBACK_WARNING);
  }
}

function createLocalParticipant({ sequenceAssignment, tutorialRotation, notes, createdAt }) {
  const participantCode = getNextLocalParticipantCode();
  return createLocalRecord("participants", {
    participantCode,
    sequenceAssignment,
    tutorialRotation,
    notes,
    createdAt,
  });
}

function getNextLocalParticipantCode() {
  const participants = listLocalRecords("participants").data || [];
  return formatParticipantCode(participants.length + 1);
}

async function getNextFirebaseParticipantCode() {
  try {
    const snapshot = await getDocs(collection(db, "participants"));
    return formatParticipantCode(snapshot.size + 1);
  } catch {
    return `P${Date.now().toString().slice(-6)}`;
  }
}

function formatParticipantCode(number) {
  return `P${String(number).padStart(3, "0")}`;
}
