import { createParticipant } from "./participantService.js";
import { createSession, getSessionById } from "./sessionService.js";
import { listTutorials } from "./tutorialService.js";
import { buildStudyPlan } from "../utils/studyAssignments.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";
import { DEFAULT_STUDY_LANGUAGE, getStudyCopy, normalizeStudyLanguage } from "../i18n/studyCopy.js";

export async function createStudySession({
  participantProfile = {},
  consentConfirmed,
  environment = {},
  sequenceAssignment = "AB",
  tutorialRotation = "rotation_a",
  language = DEFAULT_STUDY_LANGUAGE,
} = {}) {
  const normalizedLanguage = normalizeStudyLanguage(language);
  const copy = getStudyCopy(normalizedLanguage).setupPage;
  const normalizedParticipantProfile = normalizeParticipantProfile(participantProfile);

  if (!hasCompleteParticipantProfile(normalizedParticipantProfile)) {
    return serviceFailure(copy.participantError, "local");
  }

  if (!consentConfirmed) {
    return serviceFailure(copy.consentError, "local");
  }

  const tutorialResult = await listTutorials();
  if (tutorialResult.error || !tutorialResult.data?.length) {
    return serviceFailure(tutorialResult.error || copy.missingTutorialsError, tutorialResult.source);
  }

  const conditions = buildStudyPlan({
    sequenceAssignment,
    tutorialRotation,
    tutorials: tutorialResult.data,
    language: normalizedLanguage,
  });

  const participantResult = await createParticipant({
    sequenceAssignment,
    tutorialRotation,
    language: normalizedLanguage,
    participantProfile: normalizedParticipantProfile,
  });

  if (participantResult.error) {
    return participantResult;
  }

  const participant = participantResult.data;
  const sessionResult = await createSession({
    participantId: participant.id,
    participantCode: participant.participantCode,
    participantProfile: normalizedParticipantProfile,
    consentConfirmed,
    environment,
    sequenceAssignment,
    tutorialRotation,
    language: normalizedLanguage,
    conditions,
  });

  if (sessionResult.error) {
    return sessionResult;
  }

  return serviceSuccess(
    {
      ...sessionResult.data,
      participant,
      tutorialSource: tutorialResult.source,
    },
    sessionResult.source,
    combineWarnings([tutorialResult.warning, participantResult.warning, sessionResult.warning])
  );
}

export async function getStudySession(sessionId) {
  return getSessionById(sessionId);
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

function hasCompleteParticipantProfile(participantProfile) {
  return [
    participantProfile.fullName,
    participantProfile.email,
    participantProfile.ageRange,
    participantProfile.englishAbility,
    participantProfile.tutorialAppUsage,
  ].every(Boolean);
}

function combineWarnings(warnings) {
  return warnings.filter(Boolean).join(" ") || null;
}
