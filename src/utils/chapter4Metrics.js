export function calculateChapter4Metrics(data = {}) {
  const taskTrials = data.taskTrials || [];
  const susResponses = data.susResponses || [];
  const interactionLogs = data.interactionLogs || [];
  const observerNotes = data.observerNotes || [];
  const debriefResponses = data.debriefResponses || [];
  const sessions = data.sessions || [];
  const measuredTrials = taskTrials.filter((trial) => trial.trialType === "measured");
  const validMeasuredTrials = measuredTrials.filter((trial) => !trial.invalidTrial);
  const sessionLinkedLogs = interactionLogs.filter((log) => log.sessionId);
  const voiceLogs = sessionLinkedLogs.filter((log) => log.modality === "voice");
  const failedVoiceLogs = voiceLogs.filter((log) => log.commandSuccess === false);
  const fallbackLogs = sessionLinkedLogs.filter((log) => log.fallbackUsed);
  const technicalNotes = getTechnicalNotes(sessions);
  const analysisRows = buildAnalysisReadyRows(data);

  return {
    researchQuestions: {
      RQ1: {
        description: "Touch vs voice task performance and perceived usability",
        metrics: {
          taskCompletionTimeByModality: summarizeDurationsBy(validMeasuredTrials, "modality"),
          taskSuccessByModality: summarizeTaskSuccessByModality(validMeasuredTrials),
          susByModality: summarizeSusByModality(susResponses),
          pairedDifferences: summarizePairedDifferences(analysisRows),
        },
      },
      RQ2: {
        description: "Browser-based voice reliability",
        metrics: {
          recognitionAccuracy: summarizeBooleanRate(voiceLogs, "recognized"),
          commandSuccessRate: summarizeBooleanRate(
            voiceLogs.filter((log) => log.commandSuccess !== null && log.commandSuccess !== undefined),
            "commandSuccess"
          ),
          recoveryEffort: summarizeRecoveryEffort(voiceLogs),
          failureReasons: countBy(failedVoiceLogs, "failureReason"),
          fallbackUse: {
            voiceFallbackCount: voiceLogs.filter((log) => log.fallbackUsed).length,
            totalFallbackCount: fallbackLogs.length,
          },
          noMatchCount: voiceLogs.filter((log) => log.eventType === "voice_no_match").length,
          recognitionErrors: countBy(voiceLogs.filter((log) => log.recognitionErrorCode), "recognitionErrorCode"),
        },
      },
      RQ3: {
        description: "Usability problems and design implications",
        metrics: {
          observerNoteCategories: summarizeObserverNotes(observerNotes),
          debriefThemes: summarizeDebriefThemes(debriefResponses),
          technicalIssues: {
            count: technicalNotes.length,
            examples: technicalNotes.slice(0, 10).map((note) => note.note),
          },
          failedCommandExamples: failedVoiceLogs
            .filter((log) => log.rawTranscript || log.failureReason)
            .slice(0, 10)
            .map((log) => ({
              rawTranscript: log.rawTranscript || "",
              matchedIntent: log.matchedIntent || "",
              failureReason: log.failureReason || "",
              recoveryType: log.recoveryType || "",
            })),
          fallbackUseCount: fallbackLogs.length,
        },
      },
    },
    dataQuality: {
      participantCount: uniqueCount([
        ...(data.participants || []).map((participant) => participant.id),
        ...sessions.map((session) => session.participantId),
      ]),
      completedSessionCount: sessions.filter((session) => session.completedAt || session.endedAt || hasDebrief(session, debriefResponses)).length,
      abCount: sessions.filter((session) => session.sequenceAssignment === "AB").length,
      baCount: sessions.filter((session) => session.sequenceAssignment === "BA").length,
      invalidTrialCount: measuredTrials.filter((trial) => trial.invalidTrial).length,
      missingSusCount: countMissingSusByCondition(sessions, susResponses),
      missingVoiceLogCount: countMissingVoiceLogs(sessions, voiceLogs),
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
  const measuredTrials = taskTrials.filter((trial) => trial.trialType === "measured");
  const voiceLogs = interactionLogs.filter((log) => log.sessionId && log.modality === "voice");
  const technicalNoteCount = sessions.reduce((count, session) => count + (session.technicalNotes || []).length, 0);

  return [
    {
      id: "RQ1",
      label: "Touch vs voice performance and perceived usability",
      complete: measuredTrials.some((trial) =>
        trial.participantId &&
        trial.conditionId &&
        trial.taskId &&
        trial.startedAt &&
        trial.endedAt &&
        trial.durationSeconds !== null &&
        trial.completionStatus
      ) && susResponses.some((response) =>
        response.participantId &&
        response.conditionId &&
        response.itemResponses &&
        Number.isFinite(Number(response.susScore))
      ),
      detail: "Requires measured task trials with duration and completion coding plus SUS scores after each condition.",
    },
    {
      id: "RQ2",
      label: "Browser-based voice reliability",
      complete: voiceLogs.some((log) =>
        log.rawTranscript !== undefined &&
        log.normalizedTranscript !== undefined &&
        log.matchedIntent !== undefined &&
        log.commandSuccess !== undefined &&
        log.fallbackUsed !== undefined
      ),
      detail: "Requires session-linked voice logs with transcripts, matched intent, command success, failure/recovery data, and fallback usage.",
    },
    {
      id: "RQ3",
      label: "Usability problems and design implications",
      complete: observerNotes.length > 0 ||
        debriefResponses.length > 0 ||
        voiceLogs.some((log) => log.commandSuccess === false) ||
        technicalNoteCount > 0,
      detail: "Uses observer notes, debrief responses, failed or repeated commands, fallback use, and technical notes.",
    },
  ];
}

export function buildAnalysisReadyRows(data = {}) {
  const taskTrials = data.taskTrials || [];
  const susResponses = data.susResponses || [];
  const interactionLogs = data.interactionLogs || [];
  const sessions = getAnalysisSessions(data);

  return sessions.map((session) => {
    const sessionTrials = taskTrials.filter((trial) => trial.sessionId === session.id);
    const measuredTrials = sessionTrials.filter((trial) => trial.trialType === "measured");
    const touchTrial = findLatestByModality(measuredTrials, "touch");
    const voiceTrial = findLatestByModality(measuredTrials, "voice");
    const touchSus = findLatestSusByModality(susResponses, session.id, "touch");
    const voiceSus = findLatestSusByModality(susResponses, session.id, "voice");
    const voiceLogs = interactionLogs.filter((log) => log.sessionId === session.id && log.modality === "voice");
    const voiceCommandLogs = voiceLogs.filter((log) => log.commandSuccess !== null && log.commandSuccess !== undefined);
    const invalidReasons = [
      !touchTrial ? "missing_touch_trial" : "",
      !voiceTrial ? "missing_voice_trial" : "",
      touchTrial?.invalidTrial ? `touch_invalid:${touchTrial.invalidTrialReason || "not specified"}` : "",
      voiceTrial?.invalidTrial ? `voice_invalid:${voiceTrial.invalidTrialReason || "not specified"}` : "",
      !touchSus ? "missing_touch_sus" : "",
      !voiceSus ? "missing_voice_sus" : "",
    ].filter(Boolean);

    return {
      participantCode: session.participantCode || touchTrial?.participantCode || voiceTrial?.participantCode || "",
      participantId: session.participantId || touchTrial?.participantId || voiceTrial?.participantId || "",
      sessionId: session.id || "",
      sequenceAssignment: session.sequenceAssignment || touchTrial?.sequenceAssignment || voiceTrial?.sequenceAssignment || "",
      tutorialRotation: session.tutorialRotation || touchTrial?.tutorialRotation || voiceTrial?.tutorialRotation || "",
      touch_task_duration_seconds: touchTrial?.durationSeconds ?? "",
      voice_task_duration_seconds: voiceTrial?.durationSeconds ?? "",
      touch_task_success: touchTrial?.completionStatus || "",
      voice_task_success: voiceTrial?.completionStatus || "",
      touch_sus_score: touchSus?.susScore ?? "",
      voice_sus_score: voiceSus?.susScore ?? "",
      voice_total_commands: voiceLogs.length,
      voice_recognized_count: voiceLogs.filter((log) => log.recognized === true).length,
      voice_command_success_count: voiceCommandLogs.filter((log) => log.commandSuccess === true).length,
      voice_command_success_rate: ratio(
        voiceCommandLogs.filter((log) => log.commandSuccess === true).length,
        voiceCommandLogs.length
      ),
      voice_recognition_accuracy: ratio(
        voiceLogs.filter((log) => log.recognized === true).length,
        voiceLogs.filter((log) => log.recognized !== null && log.recognized !== undefined).length
      ),
      voice_recovery_effort: voiceLogs.filter((log) =>
        log.recoveryType ||
        log.fallbackUsed ||
        log.commandSuccess === false ||
        log.eventType === "voice_no_match"
      ).length,
      voice_fallback_count: voiceLogs.filter((log) => log.fallbackUsed).length,
      voice_no_match_count: voiceLogs.filter((log) => log.eventType === "voice_no_match").length,
      voice_command_failed_count: voiceCommandLogs.filter((log) => log.commandSuccess === false).length,
      invalid_pair: invalidReasons.length > 0,
      exclusion_reason: invalidReasons.join("; "),
    };
  });
}

function getAnalysisSessions(data) {
  const sessions = data.sessions || [];
  if (sessions.length) return sessions;

  const taskTrials = data.taskTrials || [];
  const sessionIds = Array.from(new Set(taskTrials.map((trial) => trial.sessionId).filter(Boolean)));
  return sessionIds.map((sessionId) => {
    const firstTrial = taskTrials.find((trial) => trial.sessionId === sessionId) || {};
    return {
      id: sessionId,
      participantId: firstTrial.participantId,
      participantCode: firstTrial.participantCode,
      sequenceAssignment: firstTrial.sequenceAssignment,
      tutorialRotation: firstTrial.tutorialRotation,
      conditions: [],
    };
  });
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
          completedCount: items.filter((item) => item.completed || item.completionStatus === "successful").length,
          averageDurationSeconds: average(durations),
          medianDurationSeconds: median(durations),
          minDurationSeconds: durations.length ? Math.min(...durations) : null,
          maxDurationSeconds: durations.length ? Math.max(...durations) : null,
        },
      ];
    })
  );
}

function summarizeTaskSuccessByModality(records) {
  return Object.fromEntries(
    Object.entries(groupBy(records, "modality")).map(([modality, items]) => [
      modality,
      {
        count: items.length,
        byCompletionStatus: countBy(items, "completionStatus"),
      },
    ])
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
          medianSusScore: median(scores),
          minSusScore: scores.length ? Math.min(...scores) : null,
          maxSusScore: scores.length ? Math.max(...scores) : null,
        },
      ];
    })
  );
}

function summarizePairedDifferences(rows) {
  const validRows = rows.filter((row) => !row.invalid_pair);
  const durationDifferences = validRows
    .map((row) => Number(row.voice_task_duration_seconds) - Number(row.touch_task_duration_seconds))
    .filter((value) => Number.isFinite(value));
  const susDifferences = validRows
    .map((row) => Number(row.voice_sus_score) - Number(row.touch_sus_score))
    .filter((value) => Number.isFinite(value));

  return {
    validPairCount: validRows.length,
    invalidPairCount: rows.length - validRows.length,
    voiceMinusTouchDurationSeconds: summarizeNumberList(durationDifferences),
    voiceMinusTouchSusScore: summarizeNumberList(susDifferences),
  };
}

function summarizeBooleanRate(records, field) {
  const eligible = records.filter((record) => record[field] !== null && record[field] !== undefined);
  const positiveCount = eligible.filter((record) => record[field] === true).length;
  return {
    count: eligible.length,
    positiveCount,
    rate: ratio(positiveCount, eligible.length),
  };
}

function summarizeRecoveryEffort(voiceLogs) {
  const recoveryLogs = voiceLogs.filter((log) =>
    log.recoveryType ||
    log.fallbackUsed ||
    log.commandSuccess === false ||
    log.eventType === "voice_no_match"
  );
  return {
    totalCount: recoveryLogs.length,
    byRecoveryType: countBy(recoveryLogs, "recoveryType"),
    repeatedCommandCount: voiceLogs.filter((log) => isRepeatLog(log)).length,
  };
}

function summarizeObserverNotes(observerNotes) {
  const tagCounts = observerNotes.reduce((counts, note) => {
    (note.tags || []).forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
    return counts;
  }, {});

  return {
    count: observerNotes.length,
    bySeverity: countBy(observerNotes, "severity"),
    byTag: tagCounts,
  };
}

function summarizeDebriefThemes(debriefResponses) {
  const fields = [
    "easiestPart",
    "hardestPart",
    "voiceProblems",
    "touchProblems",
    "fallbackComments",
    "commandClarity",
    "recoveryEffort",
    "designImplications",
    "suggestions",
  ];
  return fields.reduce((summary, field) => {
    summary[field] = debriefResponses.filter((response) => response.responses?.[field]).length;
    return summary;
  }, { responseCount: debriefResponses.length });
}

function getTechnicalNotes(sessions) {
  return sessions.flatMap((session) =>
    (session.technicalNotes || []).map((note) => ({
      ...note,
      sessionId: session.id,
      participantId: session.participantId,
    }))
  );
}

function countMissingSusByCondition(sessions, susResponses) {
  return sessions.reduce((missingCount, session) => {
    return missingCount + (session.conditions || []).filter((condition) =>
      !susResponses.some((response) => response.sessionId === session.id && response.conditionId === condition.id)
    ).length;
  }, 0);
}

function countMissingVoiceLogs(sessions, voiceLogs) {
  return sessions.reduce((missingCount, session) => {
    return missingCount + (session.conditions || []).filter((condition) =>
      condition.modality === "voice" &&
      !voiceLogs.some((log) => log.sessionId === session.id && log.conditionId === condition.id)
    ).length;
  }, 0);
}

function hasDebrief(session, debriefResponses) {
  return debriefResponses.some((response) => response.sessionId === session.id);
}

function findLatestByModality(trials, modality) {
  return [...trials]
    .filter((trial) => trial.modality === modality)
    .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime())[0] || null;
}

function findLatestSusByModality(susResponses, sessionId, modality) {
  return [...susResponses]
    .filter((response) => response.sessionId === sessionId && response.modality === modality)
    .sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())[0] || null;
}

function summarizeNumberList(values) {
  return {
    count: values.length,
    average: average(values),
    median: median(values),
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
  };
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

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return Number(sorted[midpoint].toFixed(2));
  return Number(((sorted[midpoint - 1] + sorted[midpoint]) / 2).toFixed(2));
}

function ratio(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function isRepeatLog(log) {
  const eventType = log.eventType || "";
  const matchedIntent = log.matchedIntent || "";
  return eventType.includes("repeat") || matchedIntent.includes("repeat");
}
