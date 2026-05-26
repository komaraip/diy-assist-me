export function buildStudyLogContext({ session, task, taskTrial }) {
  return {
    participantId: session?.participantId || null,
    participantCode: session?.participantCode || null,
    sessionId: session?.id || null,
    conditionId: task?.conditionId || null,
    conditionOrder: task?.conditionOrder ?? null,
    taskId: task?.id || task?.taskId || null,
    trialType: task?.trialType || null,
    taskTrialId: taskTrial?.id || null,
    modality: task?.modality || null,
    startedAt: taskTrial?.startedAt || null,
    sequenceAssignment: session?.sequenceAssignment || "",
    tutorialRotation: session?.tutorialRotation || "",
    targetKeyword: task?.targetKeyword || "",
    targetStep: task?.targetStep ?? null,
  };
}

export function getElapsedMsFromStartedAt(startedAt) {
  if (!startedAt) return null;
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return null;
  return Math.max(0, Date.now() - started);
}
