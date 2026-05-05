import { createParticipant } from "./participantService.js";
import { createSession, getSessionById } from "./sessionService.js";
import { listTutorials } from "./tutorialService.js";
import { buildStudyPlan } from "../utils/studyAssignments.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";

export async function createStudySession({
  consentConfirmed,
  environment = {},
  sequenceAssignment = "AB",
  tutorialRotation = "rotation_a",
} = {}) {
  if (!consentConfirmed) {
    return serviceFailure("Please confirm consent before creating a guided session.", "local");
  }

  const tutorialResult = await listTutorials();
  if (tutorialResult.error || !tutorialResult.data?.length) {
    return serviceFailure(tutorialResult.error || "At least one tutorial is needed before starting a guided session.", tutorialResult.source);
  }

  const conditions = buildStudyPlan({
    sequenceAssignment,
    tutorialRotation,
    tutorials: tutorialResult.data,
  });

  const participantResult = await createParticipant({
    sequenceAssignment,
    tutorialRotation,
  });

  if (participantResult.error) {
    return participantResult;
  }

  const participant = participantResult.data;
  const sessionResult = await createSession({
    participantId: participant.id,
    participantCode: participant.participantCode,
    consentConfirmed,
    environment,
    sequenceAssignment,
    tutorialRotation,
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

function combineWarnings(warnings) {
  return warnings.filter(Boolean).join(" ") || null;
}
