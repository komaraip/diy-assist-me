import { addDoc, collection, getDocs } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { createLocalRecord, listLocalRecords } from "./localStore.js";
import { serviceSuccess } from "../utils/serviceResult.js";
import { DEFAULT_STUDY_LANGUAGE, normalizeStudyLanguage } from "../config/guidedSessionContent.js";

const LOCAL_CONFIG_WARNING = "User record was saved on this device.";
const FIREBASE_FALLBACK_WARNING = "User record was saved on this device.";
const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";

export async function createParticipant({
  sequenceAssignment = "",
  tutorialRotation = "",
  language = DEFAULT_STUDY_LANGUAGE,
  participantProfile = {},
  eligibility = {},
  notes = "",
} = {}) {
  const createdAt = new Date().toISOString();
  const normalizedLanguage = normalizeStudyLanguage(language);
  const normalizedParticipantProfile = normalizeParticipantProfile(participantProfile);

  if (!isFirebaseEnabled || !db) {
    const participant = createLocalParticipant({
      sequenceAssignment,
      tutorialRotation,
      language: normalizedLanguage,
      participantProfile: normalizedParticipantProfile,
      eligibility: normalizeEligibility(eligibility),
      notes,
      createdAt,
    });
    if (participant.error) return participant;
    return serviceSuccess(participant.data, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const participantCode = await getNextFirebaseParticipantCode();
    const participantData = {
      participantCode,
      schemaVersion: SCHEMA_VERSION,
      sequenceAssignment,
      tutorialRotation,
      language: normalizedLanguage,
      participantProfile: normalizedParticipantProfile,
      eligibility: normalizeEligibility(eligibility),
      notes,
      createdAt,
    };
    const docRef = await addDoc(collection(db, "participants"), participantData);
    return serviceSuccess({ id: docRef.id, ...participantData }, "firebase");
  } catch {
    const participant = createLocalParticipant({
      sequenceAssignment,
      tutorialRotation,
      language: normalizedLanguage,
      participantProfile: normalizedParticipantProfile,
      eligibility: normalizeEligibility(eligibility),
      notes,
      createdAt,
    });
    if (participant.error) return participant;
    return serviceSuccess(participant.data, "local", FIREBASE_FALLBACK_WARNING);
  }
}

function createLocalParticipant({ sequenceAssignment, tutorialRotation, language, participantProfile, eligibility, notes, createdAt }) {
  const participantCode = getNextLocalParticipantCode();
  return createLocalRecord("participants", {
    participantCode,
    schemaVersion: SCHEMA_VERSION,
    sequenceAssignment,
    tutorialRotation,
    language,
    participantProfile,
    eligibility,
    notes,
    createdAt,
  });
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

function getNextLocalParticipantCode() {
  const participants = listLocalRecords("participants").data || [];
  return formatParticipantCode(participants.length + 1);
}

async function getNextFirebaseParticipantCode() {
  try {
    const snapshot = await getDocs(collection(db, "participants"));
    return formatParticipantCode(snapshot.size + 1);
  } catch {
    const localParticipants = listLocalRecords("participants").data || [];
    const fallbackNumber = localParticipants.length + 1;
    return formatParticipantCode(fallbackNumber);
  }
}

function formatParticipantCode(number) {
  return `P${String(number).padStart(3, "0")}`;
}
