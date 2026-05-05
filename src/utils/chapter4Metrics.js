export function calculateChapter4Metrics(data = {}) {
  const taskTrials = data.taskTrials || [];
  const susResponses = data.susResponses || [];
  const interactionLogs = data.interactionLogs || [];
  const observerNotes = data.observerNotes || [];
  const debriefResponses = data.debriefResponses || [];
  const sessions = data.sessions || [];
  const measuredTrials = taskTrials.filter((trial) => trial.trialType === "measured");
  const validMeasuredTrials = measuredTrials.filter((trial) => !trial.invalidTrial);
  const voiceLogs = interactionLogs.filter((log) => log.modality === "voice");
  const failedVoiceLogs = voiceLogs.filter((log) => log.commandSuccess === false);
  const fallbackLogs = interactionLogs.filter((log) => log.fallbackUsed);
  const technicalNotes = sessions.flatMap((session) =>
    (session.technicalNotes || []).map((note) => ({
      ...note,
      sessionId: session.id,
      participantId: session.participantId,
    }))
  );

  return {
    rq1TaskCompletionTime: {
      measuredTrialCount: measuredTrials.length,
      validMeasuredTrialCount: validMeasuredTrials.length,
      invalidTrialCount: measuredTrials.length - validMeasuredTrials.length,
      byModality: summarizeDurationsBy(validMeasuredTrials, "modality"),
      invalidTrialsByModality: countBy(measuredTrials.filter((trial) => trial.invalidTrial), "modality"),
    },
    rq2SusUsability: {
      responseCount: susResponses.length,
      byModality: summarizeSusByModality(susResponses),
    },
    rq3VoiceReliability: {
      voiceLogCount: voiceLogs.length,
      successfulCommandCount: voiceLogs.filter((log) => log.commandSuccess === true).length,
      failedCommandCount: failedVoiceLogs.length,
      successRate: ratio(
        voiceLogs.filter((log) => log.commandSuccess === true).length,
        voiceLogs.filter((log) => log.commandSuccess !== null && log.commandSuccess !== undefined).length
      ),
      fallbackUseCount: voiceLogs.filter((log) => log.fallbackUsed).length,
      unknownCommandCount: voiceLogs.filter((log) => log.confidenceType === "unknown").length,
      byMatchedIntent: countBy(voiceLogs, "matchedIntent"),
      byConfidenceType: countBy(voiceLogs, "confidenceType"),
      byFailureReason: countBy(failedVoiceLogs, "failureReason"),
      byRecoveryType: countBy(voiceLogs, "recoveryType"),
      recognitionErrors: countBy(voiceLogs.filter((log) => log.recognitionErrorCode), "recognitionErrorCode"),
    },
    rq4UsabilityProblems: {
      observerNoteCount: observerNotes.length,
      debriefResponseCount: debriefResponses.length,
      technicalNoteCount: technicalNotes.length,
      failedCommandCount: failedVoiceLogs.length,
      repeatedCommandCount: interactionLogs.filter((log) => isRepeatLog(log)).length,
      fallbackUseCount: fallbackLogs.length,
      observerNotesBySeverity: countBy(observerNotes, "severity"),
      topFailureReasons: countBy(failedVoiceLogs, "failureReason"),
    },
  };
}

export function buildEvidenceChecklist(data = {}) {
  const taskTrials = data.taskTrials || [];
  const susResponses = data.susResponses || [];
  const interactionLogs = data.interactionLogs || [];
  const observerNotes = data.observerNotes || [];
  const debriefResponses = data.debriefResponses || [];
  const sessions = data.sessions || [];
  const voiceLogs = interactionLogs.filter((log) => log.modality === "voice");
  const technicalNoteCount = sessions.reduce((count, session) => count + (session.technicalNotes || []).length, 0);

  return [
    {
      id: "RQ1",
      label: "Task completion time comparison",
      complete: taskTrials.some((trial) =>
        trial.trialType === "measured" &&
        trial.participantId &&
        trial.conditionId &&
        trial.taskId &&
        trial.startedAt &&
        trial.endedAt &&
        trial.durationSeconds !== null &&
        trial.completed !== undefined
      ),
      detail: "Requires measured taskTrials with participantId, condition, taskId, startedAt, endedAt, durationSeconds, completed, and invalidTrialReason when applicable.",
    },
    {
      id: "RQ2",
      label: "SUS usability comparison",
      complete: susResponses.some((response) =>
        response.participantId &&
        response.conditionId &&
        response.itemResponses &&
        Number.isFinite(Number(response.susScore)) &&
        response.timestamp
      ),
      detail: "Requires SUS item responses, calculated score, condition, participantId, and timestamp.",
    },
    {
      id: "RQ3",
      label: "Voice reliability analysis",
      complete: voiceLogs.some((log) =>
        log.rawTranscript !== undefined &&
        log.normalizedTranscript !== undefined &&
        log.matchedIntent !== undefined &&
        log.commandSuccess !== undefined &&
        log.fallbackUsed !== undefined
      ),
      detail: "Requires voice logs with transcripts, matched intent, command success, failure/recovery data, and fallback usage.",
    },
    {
      id: "RQ4",
      label: "Usability problem identification",
      complete: observerNotes.length > 0 || debriefResponses.length > 0 || voiceLogs.some((log) => log.commandSuccess === false) || technicalNoteCount > 0,
      detail: "Uses observer notes, failed/repeated commands, fallback use, debrief responses, and technical notes.",
    },
  ];
}

function summarizeDurationsBy(records, field) {
  return Object.fromEntries(
    Object.entries(groupBy(records, field)).map(([key, items]) => {
      const durations = items
        .map((item) => Number(item.durationSeconds))
        .filter((value) => Number.isFinite(value));
      return [
        key,
        {
          count: items.length,
          completedCount: items.filter((item) => item.completed).length,
          averageDurationSeconds: average(durations),
          minDurationSeconds: durations.length ? Math.min(...durations) : null,
          maxDurationSeconds: durations.length ? Math.max(...durations) : null,
        },
      ];
    })
  );
}

function summarizeSusByModality(records) {
  return Object.fromEntries(
    Object.entries(groupBy(records, "modality")).map(([modality, items]) => {
      const scores = items
        .map((item) => Number(item.susScore))
        .filter((value) => Number.isFinite(value));
      return [
        modality,
        {
          count: items.length,
          averageSusScore: average(scores),
          minSusScore: scores.length ? Math.min(...scores) : null,
          maxSusScore: scores.length ? Math.max(...scores) : null,
        },
      ];
    })
  );
}

function groupBy(records, field) {
  return records.reduce((groups, record) => {
    const key = record[field] || "unknown";
    groups[key] = groups[key] || [];
    groups[key].push(record);
    return groups;
  }, {});
}

function countBy(records, field) {
  return records.reduce((counts, record) => {
    const key = record[field] || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function average(values) {
  if (!values.length) return null;
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(2));
}

function ratio(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

function isRepeatLog(log) {
  const eventType = log.eventType || "";
  const matchedIntent = log.matchedIntent || "";
  return eventType.includes("repeat") || matchedIntent.includes("repeat");
}
