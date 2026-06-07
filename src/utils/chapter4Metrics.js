const VOICE_RECOGNITION_ERROR_THRESHOLD = 3;
const FALLBACK_COMPLETED_RATIO = 0.5;
const FALLBACK_TOUCH_WINDOW_MS = 30000;
const SYSTEM_VOICE_EVENTS = new Set(["tutorial_open"]);
const NON_ISSUE_TECHNICAL_NOTES = new Set([
  "no note",
  "no notes",
  "none",
  "n/a",
  "na",
  "not applicable",
  "no issue",
  "no issues",
]);
const TOUCH_USE_CONTEXTS = {
  voiceConditionTouchUse: "voice_condition_touch_use",
  fallbackAfterVoiceFailure: "fallback_after_voice_failure",
};
const REQUIRED_DEBRIEF_NARRATIVE_FIELDS = ["easiestPart", "hardestPart", "suggestions"];

export function getRequiredActionCoverage({ data = {}, trial = {}, task = null, interactionLogs = [] } = {}) {
  const trialLogs = getLogsForTrial(interactionLogs, trial).sort(compareLogsByTime);
  const requiredActions = getTrialRequiredActions(data, trial, task);
  const metRequiredActions = requiredActions.filter((action) =>
    isRequiredActionMet(trialLogs, action, trial)
  );
  const missingRequiredActions = requiredActions.filter((action) => !metRequiredActions.includes(action));

  return {
    requiredActions,
    metRequiredActions,
    missingRequiredActions,
    requiredActionsMet: missingRequiredActions.length === 0,
    requiredActionCompletionRate: requiredActions.length
      ? ratio(metRequiredActions.length, requiredActions.length)
      : null,
  };
}

export function calculateChapter4Metrics(data = {}) {
  const taskTrials = data.taskTrials || [];
  const susResponses = data.susResponses || [];
  const interactionLogs = data.interactionLogs || [];
  const observerNotes = data.observerNotes || [];
  const debriefResponses = data.debriefResponses || [];
  const sessions = data.sessions || [];
  const measuredTrials = taskTrials.filter((trial) => trial.trialType === "measured");
  const trialValidations = buildTaskTrialValidation(data);
  const validationByTrialKey = mapValidationsByTrialKey(trialValidations);
  const validMeasuredTrials = measuredTrials.filter((trial) =>
    !trial.invalidTrial && isValidForPrimaryMetrics(trial, validationByTrialKey.get(getTrialKey(trial)))
  );
  const sessionLinkedLogs = interactionLogs.filter((log) => log.sessionId);
  const voiceLogs = sessionLinkedLogs.filter((log) => log.modality === "voice");
  const voiceCommandLogs = voiceLogs.filter(isVoiceCommandLog);
  const measuredVoiceCommandLogs = voiceCommandLogs.filter((log) => log.trialType === "measured");
  const failedMeasuredVoiceLogs = measuredVoiceCommandLogs.filter((log) => log.commandSuccess === false);
  const failedVoiceLogs = voiceCommandLogs.filter((log) => log.commandSuccess === false);
  const measuredVoiceTouchLogs = sessionLinkedLogs.filter((log) =>
    log.trialType === "measured" && log.modality === "touch" && log.fallbackUsed
  );
  const measuredFallbackAfterFailureLogs = measuredVoiceTouchLogs.filter((log) =>
    isFallbackAfterVoiceFailure(log, getRelatedLogsForLog(sessionLinkedLogs, log))
  );
  const technicalNotes = getTechnicalNotes(sessions);
  const technicalNoteSummary = summarizeTechnicalNotes(technicalNotes);
  const validationSummary = summarizeTaskTrialValidation(trialValidations);
  const environmentWarnings = buildEnvironmentWarnings(sessions);
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
          recognitionAccuracy: summarizeBooleanRate(measuredVoiceCommandLogs, "recognized"),
          commandSuccessRate: summarizeBooleanRate(
            measuredVoiceCommandLogs.filter((log) => log.commandSuccess !== null && log.commandSuccess !== undefined),
            "commandSuccess"
          ),
          recoveryEffort: summarizeRecoveryEffort(measuredVoiceCommandLogs, measuredFallbackAfterFailureLogs),
          failureReasons: countBy(failedMeasuredVoiceLogs, "failureReason"),
          fallbackUse: {
            voiceFallbackCount: measuredVoiceCommandLogs.filter((log) => log.fallbackUsed).length + measuredFallbackAfterFailureLogs.length,
            totalFallbackCount: measuredVoiceTouchLogs.length,
            fallbackTouchUseCount: measuredVoiceTouchLogs.length,
            fallbackTouchAfterFailureCount: measuredFallbackAfterFailureLogs.length,
          },
          noMatchCount: measuredVoiceCommandLogs.filter((log) => log.eventType === "voice_no_match").length,
          recognitionErrors: countBy(measuredVoiceCommandLogs.filter((log) => log.recognitionErrorCode), "recognitionErrorCode"),
        },
      },
      RQ3: {
        description: "Usability problems and design implications",
        metrics: {
          observerNoteCategories: summarizeObserverNotes(observerNotes),
          debriefThemes: summarizeDebriefThemes(debriefResponses),
          technicalIssues: {
            count: technicalNotes.length,
            uniqueCount: technicalNoteSummary.length,
            examples: technicalNoteSummary.slice(0, 10).map((note) =>
              note.count > 1 ? `${note.note} (${note.count} times)` : note.note
            ),
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
          fallbackUseCount: measuredFallbackAfterFailureLogs.length,
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
      missingVoiceLogCount: countMissingVoiceLogs(sessions, measuredVoiceCommandLogs),
      voiceTechnicalIssueCount: validationSummary.voiceTechnicalIssueCount,
      voiceFallbackCompletedCount: validationSummary.voiceFallbackCompletedCount,
      voiceFallbackTouchActionCount: validationSummary.voiceFallbackTouchActionCount,
      voiceFallbackTouchUseCount: validationSummary.voiceFallbackTouchUseCount,
      invalidVoiceTrialCount: validationSummary.invalidVoiceTrialCount,
      requiredActionWarningCount: validationSummary.requiredActionWarningCount,
      environmentWarningCount: environmentWarnings.length,
      validationWarningCount: validationSummary.validationWarningCount,
      invalidVoiceTrialWarnings: validationSummary.invalidVoiceTrialWarnings,
      requiredActionWarnings: validationSummary.requiredActionWarnings,
      environmentWarnings: environmentWarnings.slice(0, 10),
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
  const voiceLogs = interactionLogs.filter((log) => log.sessionId && log.modality === "voice" && isVoiceCommandLog(log));
  const measuredVoiceLogs = voiceLogs.filter((log) => log.trialType === "measured");
  const contentfulDebriefResponses = debriefResponses.filter(hasContentfulDebriefResponse);
  const technicalNoteCount = getTechnicalNotes(sessions).length;
  const validationSummary = summarizeTaskTrialValidation(buildTaskTrialValidation(data));
  const firstRequiredActionWarning = validationSummary.requiredActionWarnings[0];
  const firstVoiceWarning = validationSummary.invalidVoiceTrialWarnings[0];

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
      complete: measuredVoiceLogs.some((log) =>
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
        contentfulDebriefResponses.length > 0 ||
        voiceLogs.some((log) => log.commandSuccess === false) ||
        technicalNoteCount > 0,
      statusLabel: observerNotes.length > 0 || contentfulDebriefResponses.length > 0
        ? "Evidence available"
        : voiceLogs.some((log) => log.commandSuccess === false) || technicalNoteCount > 0
          ? "Only diagnostic evidence available"
          : "",
      detail: `Direct evidence: ${observerNotes.length} observer note(s), ${contentfulDebriefResponses.length} core-complete debrief response(s). Diagnostic signals: ${voiceLogs.filter((log) => log.commandSuccess === false).length} failed command(s), ${technicalNoteCount} technical note(s).`,
    },
    {
      id: "Validation",
      label: "Task action and voice trial validity",
      complete: measuredTrials.length > 0 && validationSummary.validationWarningCount === 0,
      detail: [
        `${validationSummary.invalidVoiceTrialCount} voice trial validity warning(s) and ${validationSummary.requiredActionWarningCount} required-action warning(s).`,
        firstVoiceWarning ? `First voice warning: ${firstVoiceWarning.taskId} ${firstVoiceWarning.voiceTrialValidity} (${firstVoiceWarning.exclusionReason}).` : "",
        firstRequiredActionWarning ? `First missing action warning: ${firstRequiredActionWarning.taskId} missing ${firstRequiredActionWarning.missingRequiredActions.join(", ")}.` : "",
        "Missing required actions are flagged for review, not blocked in the UI.",
      ].filter(Boolean).join(" "),
    },
  ];
}

export function buildAnalysisIssueCards(data = {}) {
  const metrics = calculateChapter4Metrics(data);
  const rows = buildAnalysisReadyRows(data);
  const interactionLogs = data.interactionLogs || [];
  const debriefResponses = data.debriefResponses || [];
  const sessions = data.sessions || [];
  const sessionLinkedLogs = interactionLogs.filter((log) => log.sessionId);
  const failedVoiceLogs = sessionLinkedLogs.filter((log) =>
    log.modality === "voice" && isVoiceCommandLog(log) && log.commandSuccess === false
  );
  const measuredVoiceTouchLogs = sessionLinkedLogs.filter((log) =>
    log.trialType === "measured" && log.modality === "touch" && log.fallbackUsed
  );
  const nonRecoveryTouchUses = measuredVoiceTouchLogs.filter((log) =>
    !isFallbackAfterVoiceFailure(log, getRelatedLogsForLog(sessionLinkedLogs, log))
  );
  const invalidRows = rows.filter((row) => row.invalid_pair);
  const dataQuality = metrics.dataQuality;
  const debriefGaps = buildDebriefCoreGaps(debriefResponses);
  const sessionsMissingDebrief = sessions.filter((session) =>
    !debriefResponses.some((response) => response.sessionId === session.id)
  );
  const technicalIssues = metrics.researchQuestions.RQ3.metrics.technicalIssues;

  return [
    {
      id: "invalid-pairs",
      severity: invalidRows.length ? "critical" : "ok",
      eyebrow: "Analysis-ready dataset",
      title: "Invalid or incomplete paired rows",
      count: invalidRows.length,
      summary: invalidRows.length
        ? "These rows are excluded from primary paired analysis until the exclusion reasons are resolved."
        : "No invalid paired rows detected.",
      details: invalidRows.slice(0, 5).map((row) =>
        `${formatParticipantSession(row)}: ${row.exclusion_reason || "invalid_pair=true"}`
      ),
      action: "Review the listed session/task evidence before using the row for Chapter 4 paired statistics.",
    },
    {
      id: "required-actions",
      severity: dataQuality.requiredActionWarningCount ? "critical" : "ok",
      eyebrow: "Task script coverage",
      title: "Missing required task actions",
      count: dataQuality.requiredActionWarningCount || 0,
      summary: dataQuality.requiredActionWarningCount
        ? "A measured task was finished, but the logged actions do not cover the full task script."
        : "All measured task scripts are covered by logged actions.",
      details: (dataQuality.requiredActionWarnings || []).slice(0, 5).map((warning) =>
        `${formatWarningLocation(warning)}: missing ${formatRequiredActionList(warning.missingRequiredActions)} (${formatPercentValue(warning.requiredActionCompletionRate)} complete)`
      ),
      action: "Retest or mark the trial invalid if the participant did not complete the scripted action.",
    },
    {
      id: "voice-validity",
      severity: dataQuality.invalidVoiceTrialCount ? "critical" : "ok",
      eyebrow: "Voice validity",
      title: "Voice trials needing exclusion review",
      count: dataQuality.invalidVoiceTrialCount || 0,
      summary: dataQuality.invalidVoiceTrialCount
        ? "At least one voice measured trial has validity problems such as technical issues or heavy touch fallback."
        : "No measured voice validity exclusions detected.",
      details: (dataQuality.invalidVoiceTrialWarnings || []).slice(0, 5).map((warning) =>
        `${formatWarningLocation(warning)}: ${warning.voiceTrialValidity} (${warning.exclusionReason || "no reason"})`
      ),
      action: "Use the exclusion reason when deciding whether the trial can support RQ2 and paired analysis.",
    },
    {
      id: "environment",
      severity: dataQuality.environmentWarningCount ? "warning" : "ok",
      eyebrow: "Setup consistency",
      title: "Environment mismatch warnings",
      count: dataQuality.environmentWarningCount || 0,
      summary: dataQuality.environmentWarningCount
        ? "Manual setup metadata does not match detected browser/device metadata."
        : "No setup mismatch detected.",
      details: (dataQuality.environmentWarnings || []).slice(0, 5).map((warning) =>
        `${formatWarningLocation(warning)}: ${warning.message}`
      ),
      action: "Confirm whether the researcher selected the correct device/browser setup before interpreting device-specific results.",
    },
    {
      id: "debrief",
      severity: debriefGaps.length || sessionsMissingDebrief.length ? "warning" : "ok",
      eyebrow: "RQ3 direct evidence",
      title: "Core feedback completeness",
      count: debriefGaps.length + sessionsMissingDebrief.length,
      summary: `${metrics.researchQuestions.RQ3.metrics.debriefThemes.contentfulResponseCount}/${debriefResponses.length} submitted debrief response(s) have the three required narrative answers.`,
      details: [
        ...debriefGaps.slice(0, 5).map((gap) =>
          `${formatWarningLocation(gap)}: missing ${gap.missingFields.join(", ")}`
        ),
        ...sessionsMissingDebrief.slice(0, Math.max(0, 5 - debriefGaps.length)).map((session) =>
          `${formatSessionLocation(session)}: no final feedback submitted`
        ),
      ],
      action: "Collect the required final feedback prompts: easiest part, hardest part, and improvement suggestion.",
    },
    {
      id: "fallback-semantics",
      severity: nonRecoveryTouchUses.length ? "info" : "ok",
      eyebrow: "RQ2 recovery semantics",
      title: "Touch use that is not recovery fallback",
      count: nonRecoveryTouchUses.length,
      summary: nonRecoveryTouchUses.length
        ? "These touch actions happened in a voice condition, but not after a voice failure, so they are diagnostic touch use rather than recovery fallback."
        : "All voice-condition touch fallback logs are tied to a prior voice failure.",
      details: nonRecoveryTouchUses.slice(0, 5).map((log) =>
        `${formatLogLocation(log)}: ${log.eventType || "touch interaction"}`
      ),
      action: "Keep these in touch-use diagnostics, but do not interpret them as recovery effort after a failed command.",
    },
    {
      id: "voice-failures",
      severity: failedVoiceLogs.length ? "warning" : "ok",
      eyebrow: "Voice command diagnostics",
      title: "Failed voice command examples",
      count: failedVoiceLogs.length,
      summary: failedVoiceLogs.length
        ? "Failed commands support RQ3 diagnostics, but they do not replace direct observer notes or core-complete debrief responses."
        : "No failed voice commands detected.",
      details: failedVoiceLogs.slice(0, 5).map((log) =>
        `${formatLogLocation(log)}: ${formatVoiceFailure(log)}`
      ),
      action: "Use examples to explain command clarity, recognition errors, and recovery effort in qualitative findings.",
    },
    {
      id: "technical-notes",
      severity: technicalIssues.count ? "warning" : "ok",
      eyebrow: "Technical disruptions",
      title: "Technical notes affecting interpretation",
      count: technicalIssues.count || 0,
      summary: technicalIssues.count
        ? "Technical disruptions were recorded and should be discussed separately from normal usability problems."
        : "No meaningful technical disruptions recorded.",
      details: (technicalIssues.examples || []).slice(0, 5),
      action: "Check whether technical disruptions affected measured trials before final Chapter 4 interpretation.",
    },
  ];
}

export function buildTaskTrialValidation(data = {}) {
  const taskTrials = data.taskTrials || [];
  const interactionLogs = data.interactionLogs || [];

  return taskTrials.map((trial) => {
    const trialLogs = getLogsForTrial(interactionLogs, trial).sort(compareLogsByTime);
    const voiceLogs = trialLogs.filter((log) => log.modality === "voice" && isVoiceCommandLog(log));
    const voiceCommandLogs = voiceLogs.filter((log) => log.commandSuccess !== null && log.commandSuccess !== undefined);
    const fallbackTouchUseLogs = trialLogs.filter((log) => log.modality === "touch" && log.fallbackUsed);
    const fallbackTouchLogs = fallbackTouchUseLogs.filter((log) => isFallbackAfterVoiceFailure(log, trialLogs));
    const voiceCommandSuccessCount = voiceCommandLogs.filter((log) => log.commandSuccess === true).length;
    const voiceRecognitionErrorCount = voiceLogs.filter((log) =>
      log.eventType === "voice_recognition_error" || log.eventType === "voice_unsupported" || log.recognitionErrorCode
    ).length;
    const fallbackTouchActionCount = fallbackTouchLogs.length;
    const requiredActionCoverage = getRequiredActionCoverage({ data, trial, interactionLogs: trialLogs });
    const voiceValidity = getVoiceTrialValidity({
      trial,
      voiceCommandSuccessCount,
      voiceRecognitionErrorCount,
      fallbackTouchActionCount,
    });

    return {
      trialId: trial.id || "",
      trialKey: getTrialKey(trial),
      participantId: trial.participantId || "",
      sessionId: trial.sessionId || "",
      conditionId: trial.conditionId || "",
      taskId: trial.taskId || "",
      modality: trial.modality || "",
      trialType: trial.trialType || "",
      voiceCommandSuccessCount,
      voiceRecognitionErrorCount,
      fallbackTouchActionCount,
      fallbackTouchUseCount: fallbackTouchUseLogs.length,
      voiceTrialValidity: voiceValidity.voiceTrialValidity,
      exclusionReason: voiceValidity.exclusionReason,
      requiredActionsMet: requiredActionCoverage.requiredActionsMet,
      missingRequiredActions: requiredActionCoverage.missingRequiredActions,
      requiredActionCompletionRate: requiredActionCoverage.requiredActionCompletionRate,
    };
  });
}

export function buildAnalysisReadyRows(data = {}) {
  const taskTrials = data.taskTrials || [];
  const susResponses = data.susResponses || [];
  const interactionLogs = data.interactionLogs || [];
  const sessions = getAnalysisSessions(data);
  const validationByTrialKey = mapValidationsByTrialKey(buildTaskTrialValidation(data));
  const participants = data.participants || [];
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  return sessions.map((session) => {
    const sessionTrials = taskTrials.filter((trial) => trial.sessionId === session.id);
    const measuredTrials = sessionTrials.filter((trial) => trial.trialType === "measured");
    const touchTrial = findLatestByModality(measuredTrials, "touch");
    const voiceTrial = findLatestByModality(measuredTrials, "voice");
    const touchValidation = touchTrial ? validationByTrialKey.get(getTrialKey(touchTrial)) : null;
    const voiceValidation = voiceTrial ? validationByTrialKey.get(getTrialKey(voiceTrial)) : null;
    const touchSus = findLatestSusByModality(susResponses, session.id, "touch");
    const voiceSus = findLatestSusByModality(susResponses, session.id, "voice");
    const voiceLogs = voiceTrial
      ? getLogsForTrial(interactionLogs, voiceTrial).filter((log) => log.modality === "voice" && isVoiceCommandLog(log))
      : interactionLogs.filter((log) => log.sessionId === session.id && log.modality === "voice" && isVoiceCommandLog(log));
    const voiceCommandLogs = voiceLogs.filter((log) => log.commandSuccess !== null && log.commandSuccess !== undefined);
    const voiceFallbackTouchCount = voiceValidation?.fallbackTouchActionCount || 0;

    const profile = session.participantProfile || participantMap.get(session.participantId)?.participantProfile || {};
    const hasProfile = !!(profile.fullName || profile.email || profile.ageRange || profile.englishAbility);
    const ageInvalid = hasProfile && profile.ageRange && profile.ageRange !== "18-24" && profile.ageRange !== "25-35";
    const languageInvalid = hasProfile && !["can_understand", "comfortable_commands"].includes(profile.englishAbility);
    const repeatedCommandCount = voiceLogs.filter((log) => log.recoveryAttemptType === "repeated_command").length;
    const rephrasedCommandCount = voiceLogs.filter((log) => log.recoveryAttemptType === "rephrased_command").length;
    const touchDuration = Number(touchTrial?.durationSeconds);
    const voiceDuration = Number(voiceTrial?.durationSeconds);
    const touchSusScore = Number(touchSus?.susScore);
    const voiceSusScore = Number(voiceSus?.susScore);

    const invalidReasons = [
      !touchTrial ? "missing_touch_trial" : "",
      !voiceTrial ? "missing_voice_trial" : "",
      touchTrial?.invalidTrial ? `touch_invalid:${touchTrial.invalidTrialReason || "not specified"}` : "",
      voiceTrial?.invalidTrial ? `voice_invalid:${voiceTrial.invalidTrialReason || "not specified"}` : "",
      voiceValidation && voiceValidation.voiceTrialValidity !== "valid" && voiceValidation.voiceTrialValidity !== "not_applicable"
        ? `voice_${voiceValidation.voiceTrialValidity}:${voiceValidation.exclusionReason || "not specified"}`
        : "",
      touchValidation?.requiredActionsMet === false
        ? `touch_required_action_incomplete:${touchValidation.missingRequiredActions.join("|") || "not specified"}`
        : "",
      voiceValidation?.requiredActionsMet === false
        ? `voice_required_action_incomplete:${voiceValidation.missingRequiredActions.join("|") || "not specified"}`
        : "",
      !touchSus ? "missing_touch_sus" : "",
      !voiceSus ? "missing_voice_sus" : "",
      ageInvalid ? "demographic_age_outside_criteria" : "",
      languageInvalid ? "demographic_language_inadequate" : "",
    ].filter(Boolean);

    return {
      participantCode: session.participantCode || touchTrial?.participantCode || voiceTrial?.participantCode || "",
      participantId: session.participantId || touchTrial?.participantId || voiceTrial?.participantId || "",
      sessionId: session.id || "",
      sequenceAssignment: session.sequenceAssignment || touchTrial?.sequenceAssignment || voiceTrial?.sequenceAssignment || "",
      tutorialRotation: session.tutorialRotation || touchTrial?.tutorialRotation || voiceTrial?.tutorialRotation || "",
      touch_task_duration_seconds: touchTrial?.durationSeconds ?? "",
      voice_task_duration_seconds: voiceTrial?.durationSeconds ?? "",
      duration_difference_voice_minus_touch: Number.isFinite(voiceDuration) && Number.isFinite(touchDuration)
        ? Number((voiceDuration - touchDuration).toFixed(2))
        : "",
      touch_task_success: touchTrial?.completionStatus || "",
      voice_task_success: voiceTrial?.completionStatus || "",
      touch_task_success_numeric: completionStatusToNumber(touchTrial?.completionStatus),
      voice_task_success_numeric: completionStatusToNumber(voiceTrial?.completionStatus),
      touch_sus_score: touchSus?.susScore ?? "",
      voice_sus_score: voiceSus?.susScore ?? "",
      sus_difference_voice_minus_touch: Number.isFinite(voiceSusScore) && Number.isFinite(touchSusScore)
        ? Number((voiceSusScore - touchSusScore).toFixed(2))
        : "",
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
        log.isRecoveryAttempt ||
        log.fallbackUsed ||
        log.commandSuccess === false ||
        log.eventType === "voice_no_match"
      ).length + voiceFallbackTouchCount,
      voice_repeated_command_count: repeatedCommandCount,
      voice_rephrased_command_count: rephrasedCommandCount,
      voice_fallback_count: voiceLogs.filter((log) => log.fallbackUsed).length + voiceFallbackTouchCount,
      voice_touch_use_count: voiceValidation?.fallbackTouchUseCount ?? "",
      voice_no_match_count: voiceLogs.filter((log) => log.eventType === "voice_no_match").length,
      voice_command_failed_count: voiceCommandLogs.filter((log) => log.commandSuccess === false).length,
      voice_trial_validity: voiceValidation?.voiceTrialValidity || "missing_voice_trial",
      voice_trial_exclusion_reason: voiceValidation?.exclusionReason || "",
      voiceCommandSuccessCount: voiceValidation?.voiceCommandSuccessCount ?? "",
      voiceRecognitionErrorCount: voiceValidation?.voiceRecognitionErrorCount ?? "",
      fallbackTouchActionCount: voiceValidation?.fallbackTouchActionCount ?? "",
      fallbackTouchUseCount: voiceValidation?.fallbackTouchUseCount ?? "",
      touch_requiredActionsMet: touchValidation?.requiredActionsMet ?? "",
      touch_missingRequiredActions: (touchValidation?.missingRequiredActions || []).join(" | "),
      touch_requiredActionCompletionRate: touchValidation?.requiredActionCompletionRate ?? "",
      voice_requiredActionsMet: voiceValidation?.requiredActionsMet ?? "",
      voice_missingRequiredActions: (voiceValidation?.missingRequiredActions || []).join(" | "),
      voice_requiredActionCompletionRate: voiceValidation?.requiredActionCompletionRate ?? "",
      invalid_pair: invalidReasons.length > 0,
      exclusion_reason: invalidReasons.join("; "),
    };
  });
}

function summarizeTaskTrialValidation(validations) {
  const invalidVoiceValidations = validations.filter((validation) =>
    validation.trialType === "measured" &&
    validation.modality === "voice" &&
    validation.voiceTrialValidity !== "valid"
  );
  const requiredActionWarnings = validations.filter((validation) =>
    validation.trialType === "measured" &&
    validation.requiredActionsMet === false
  );

  return {
    voiceTechnicalIssueCount: invalidVoiceValidations.filter((validation) => validation.voiceTrialValidity === "technical_issue").length,
    voiceFallbackCompletedCount: invalidVoiceValidations.filter((validation) => validation.voiceTrialValidity === "fallback_completed").length,
    invalidVoiceTrialCount: invalidVoiceValidations.length,
    voiceFallbackTouchActionCount: validations
      .filter((validation) => validation.trialType === "measured" && validation.modality === "voice")
      .reduce((total, validation) => total + validation.fallbackTouchActionCount, 0),
    voiceFallbackTouchUseCount: validations
      .filter((validation) => validation.trialType === "measured" && validation.modality === "voice")
      .reduce((total, validation) => total + (validation.fallbackTouchUseCount || 0), 0),
    requiredActionWarningCount: requiredActionWarnings.length,
    validationWarningCount: invalidVoiceValidations.length + requiredActionWarnings.length,
    invalidVoiceTrialWarnings: invalidVoiceValidations.slice(0, 10).map((validation) => ({
      participantId: validation.participantId,
      sessionId: validation.sessionId,
      conditionId: validation.conditionId,
      taskId: validation.taskId,
      voiceTrialValidity: validation.voiceTrialValidity,
      exclusionReason: validation.exclusionReason,
      voiceCommandSuccessCount: validation.voiceCommandSuccessCount,
      voiceRecognitionErrorCount: validation.voiceRecognitionErrorCount,
      fallbackTouchActionCount: validation.fallbackTouchActionCount,
    })),
    requiredActionWarnings: requiredActionWarnings.slice(0, 10).map((validation) => ({
      participantId: validation.participantId,
      sessionId: validation.sessionId,
      conditionId: validation.conditionId,
      taskId: validation.taskId,
      modality: validation.modality,
      missingRequiredActions: validation.missingRequiredActions,
      requiredActionCompletionRate: validation.requiredActionCompletionRate,
    })),
  };
}

function buildDebriefCoreGaps(debriefResponses = []) {
  return debriefResponses
    .map((response) => {
      const responses = response.responses || {};
      const missingFields = REQUIRED_DEBRIEF_NARRATIVE_FIELDS
        .filter((field) => !String(responses[field] || "").trim())
        .map(formatDebriefField);
      return {
        participantId: response.participantId || "",
        participantCode: response.participantCode || "",
        sessionId: response.sessionId || "",
        missingFields,
      };
    })
    .filter((gap) => gap.missingFields.length > 0);
}

function formatParticipantSession(row = {}) {
  return `Participant ${row.participantCode || row.participantId || "unknown"} / Session ${shortId(row.sessionId)}`;
}

function formatWarningLocation(item = {}) {
  const participant = item.participantCode || item.participantId || "unknown participant";
  const session = item.sessionId ? `Session ${shortId(item.sessionId)}` : "No session";
  const task = item.taskId ? ` / ${item.taskId}` : "";
  const modality = item.modality ? ` (${item.modality})` : "";
  return `${participant} / ${session}${task}${modality}`;
}

function formatSessionLocation(session = {}) {
  return `${session.participantCode || session.participantId || "unknown participant"} / Session ${shortId(session.id)}`;
}

function formatLogLocation(log = {}) {
  const task = log.taskId ? ` / ${log.taskId}` : "";
  const elapsed = Number.isFinite(Number(log.elapsedMsFromTaskStart))
    ? ` @ ${Math.round(Number(log.elapsedMsFromTaskStart) / 1000)}s`
    : "";
  return `${log.participantCode || log.participantId || "unknown participant"} / Session ${shortId(log.sessionId)}${task}${elapsed}`;
}

function formatVoiceFailure(log = {}) {
  const transcript = log.rawTranscript ? `"${log.rawTranscript}"` : "no transcript";
  const reason = log.failureReason || log.recognitionErrorCode || "failed command";
  return `${transcript} - ${reason}`;
}

function formatRequiredActionList(actions = []) {
  return actions.map(formatRequiredActionName).join(", ");
}

function formatRequiredActionName(action = "") {
  const labels = {
    materials_open: "open materials",
    step_next: "next step",
    repeat_instruction: "repeat instruction",
    tutorial_search: "tutorial search",
    tutorial_search_target: "target keyword search",
    step_jump: "step jump",
    step_jump_target: "target step jump",
    step_previous: "previous step",
    return_target_step: "return to target step",
    scroll_down: "scroll down",
    scroll_down_after_target: "scroll down after target step",
  };
  return labels[action] || String(action).replace(/_/g, " ");
}

function formatDebriefField(field = "") {
  const labels = {
    easiestPart: "what was easiest",
    hardestPart: "what was hardest",
    suggestions: "what would make this better",
  };
  return labels[field] || field;
}

function shortId(value = "") {
  const text = String(value || "");
  return text.length > 10 ? `${text.slice(0, 8)}...` : text || "unknown";
}

function formatPercentValue(value) {
  if (value === null || value === undefined || value === "") return "n/a";
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "n/a";
}

function mapValidationsByTrialKey(validations) {
  return new Map(validations.map((validation) => [validation.trialKey, validation]));
}

function isValidForPrimaryMetrics(trial, validation) {
  if (trial.trialType === "measured" && validation?.requiredActionsMet === false) return false;
  if (trial.modality !== "voice" || trial.trialType !== "measured") return true;
  return validation?.voiceTrialValidity === "valid";
}

function getLogsForTrial(interactionLogs, trial) {
  return interactionLogs.filter((log) => {
    if (trial.id && log.metadata?.taskTrialId) return log.metadata.taskTrialId === trial.id;
    if (trial.sessionId && log.sessionId !== trial.sessionId) return false;
    if (trial.conditionId && log.conditionId && log.conditionId !== trial.conditionId) return false;
    if (trial.taskId && log.taskId !== trial.taskId) return false;
    if (trial.trialType && log.trialType && log.trialType !== trial.trialType) return false;
    return true;
  });
}

function getTrialRequiredActions(data, trial, explicitTask = null) {
  if (Array.isArray(trial.requiredActions) && trial.requiredActions.length) return trial.requiredActions;
  if (Array.isArray(explicitTask?.requiredActions) && explicitTask.requiredActions.length) return explicitTask.requiredActions;
  const session = (data.sessions || []).find((item) => item.id === trial.sessionId);
  const task = (session?.conditions || [])
    .flatMap((condition) => condition.tasks || [])
    .find((item) => item.id === trial.taskId || item.taskId === trial.taskId);
  return Array.isArray(task?.requiredActions) ? task.requiredActions : [];
}

function isRequiredActionMet(trialLogs, action, trial = {}) {
  switch (action) {
    case "tutorial_search_target":
      return trialLogs.some((log) => doesLogMatchRequiredAction(log, action, trial));
    case "step_jump_target":
      return trialLogs.some((log) => doesLogMatchRequiredAction(log, action, trial));
    case "return_target_step":
      return hasReturnedToTargetStep(trialLogs, trial);
    case "scroll_down_after_target":
      return hasScrolledDownAfterTarget(trialLogs, trial);
    default:
      return trialLogs.some((log) => doesLogMatchRequiredAction(log, action, trial));
  }
}

function doesLogMatchRequiredAction(log, action, trial = {}) {
  if (log.modality === "voice" && log.commandSuccess !== true) return false;

  const eventType = normalizeLogValue(log.eventType);
  const matchedIntent = normalizeLogValue(log.matchedIntent);
  const metadataAction = normalizeLogValue(log.metadata?.action || log.metadata?.scrollAction);

  switch (action) {
    case "materials_open":
      return includesAny(eventType, ["materials_open", "show_materials"]) ||
        matchedIntent === "show_materials";
    case "step_next":
      return includesAny(eventType, ["step_next", "next_step"]) ||
        matchedIntent === "next_step";
    case "repeat_instruction":
      return includesAny(eventType, ["repeat_instruction", "repeat"]) ||
        matchedIntent === "repeat_instruction";
    case "tutorial_search":
      return includesAny(eventType, ["tutorial_search", "search"]) ||
        matchedIntent === "search" ||
        !!log.query;
    case "tutorial_search_target":
      return (includesAny(eventType, ["tutorial_search", "search"]) || matchedIntent === "search" || !!getLogQuery(log)) &&
        isTargetKeywordQuery(getLogQuery(log), trial.targetKeyword);
    case "step_jump":
      return includesAny(eventType, ["step_jump", "overview_step_jump", "search_result_jump", "go_to_step"]) ||
        matchedIntent === "go_to_step" ||
        (log.stepNumber !== null && log.stepNumber !== undefined && Number.isFinite(Number(log.stepNumber)));
    case "step_jump_target":
      return (
        includesAny(eventType, ["step_jump", "overview_step_jump", "search_result_jump", "go_to_step"]) ||
        matchedIntent === "go_to_step" ||
        (log.stepNumber !== null && log.stepNumber !== undefined && Number.isFinite(Number(log.stepNumber)))
      ) && isAtTargetStep(log, trial.targetStep);
    case "step_previous":
      return includesAny(eventType, ["step_previous", "previous_step"]) ||
        matchedIntent === "previous_step";
    case "scroll_down":
      return includesAny(eventType, ["scroll_down", "page_down"]) ||
        includesAny(metadataAction, ["scroll_down", "page_down"]) ||
        matchedIntent === "scroll_down" ||
        matchedIntent === "page_down";
    case "scroll_up":
      return includesAny(eventType, ["scroll_up", "page_up"]) ||
        includesAny(metadataAction, ["scroll_up", "page_up"]) ||
        matchedIntent === "scroll_up" ||
        matchedIntent === "page_up";
    default:
      return eventType === normalizeLogValue(action) || matchedIntent === normalizeLogValue(action);
  }
}

function hasReturnedToTargetStep(trialLogs, trial = {}) {
  const targetStep = Number(trial.targetStep);
  if (!Number.isFinite(targetStep)) return false;

  const previousIndex = trialLogs.findIndex((log) => doesLogMatchRequiredAction(log, "step_previous", trial));
  if (previousIndex < 0) return false;

  return trialLogs.slice(previousIndex + 1).some((log) => isAtTargetStep(log, targetStep));
}

function hasScrolledDownAfterTarget(trialLogs, trial = {}) {
  const targetIndex = trialLogs.findIndex((log) =>
    isAtTargetStep(log, trial.targetStep) ||
    doesLogMatchRequiredAction(log, "tutorial_search_target", trial) ||
    doesLogMatchRequiredAction(log, "step_jump_target", trial)
  );
  if (targetIndex < 0) return false;

  return trialLogs.slice(targetIndex + 1).some((log) => doesLogMatchRequiredAction(log, "scroll_down", trial));
}

function isTargetKeywordQuery(query, targetKeyword) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTarget = normalizeSearchText(targetKeyword);
  if (!normalizedTarget) return Boolean(normalizedQuery);
  return normalizedQuery.includes(normalizedTarget);
}

function getLogQuery(log = {}) {
  return log.query || log.metadata?.query || "";
}

function isAtTargetStep(log = {}, targetStep) {
  const expectedStep = Number(targetStep);
  if (!Number.isFinite(expectedStep)) return false;

  const stepNumber = Number(log.stepNumber ?? log.metadata?.stepNumber);
  if (Number.isFinite(stepNumber) && stepNumber === expectedStep) return true;

  const stepIndexAfter = Number(log.stepIndexAfter);
  return Number.isFinite(stepIndexAfter) && stepIndexAfter + 1 === expectedStep;
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getVoiceTrialValidity({
  trial,
  voiceCommandSuccessCount,
  voiceRecognitionErrorCount,
  fallbackTouchActionCount,
}) {
  if (trial.modality !== "voice" || trial.trialType !== "measured") {
    return {
      voiceTrialValidity: "not_applicable",
      exclusionReason: "",
    };
  }

  const effectiveActionCount = voiceCommandSuccessCount + fallbackTouchActionCount;
  const fallbackRatio = effectiveActionCount ? fallbackTouchActionCount / effectiveActionCount : 0;

  if (voiceRecognitionErrorCount >= VOICE_RECOGNITION_ERROR_THRESHOLD) {
    return {
      voiceTrialValidity: "technical_issue",
      exclusionReason: "repeated_voice_recognition_errors",
    };
  }

  if (fallbackTouchActionCount > 0 && (voiceCommandSuccessCount === 0 || fallbackRatio >= FALLBACK_COMPLETED_RATIO)) {
    return {
      voiceTrialValidity: "fallback_completed",
      exclusionReason: "completed_mostly_with_touch_fallback",
    };
  }

  if (voiceCommandSuccessCount === 0) {
    return {
      voiceTrialValidity: "technical_issue",
      exclusionReason: "zero_successful_voice_commands",
    };
  }

  return {
    voiceTrialValidity: "valid",
    exclusionReason: "",
  };
}

function summarizeTechnicalNotes(technicalNotes) {
  const grouped = technicalNotes.reduce((groups, note) => {
    const key = note.note || "";
    if (!key) return groups;
    groups[key] = groups[key] || { note: key, count: 0 };
    groups[key].count += 1;
    return groups;
  }, {});

  return Object.values(grouped).sort((a, b) => b.count - a.count || a.note.localeCompare(b.note));
}

function getTrialKey(trial) {
  if (trial.id) return `id:${trial.id}`;
  return [
    "trial",
    trial.sessionId || "",
    trial.conditionId || "",
    trial.taskId || "",
    trial.trialType || "",
    trial.startedAt || "",
  ].join(":");
}

function includesAny(value, candidates) {
  return candidates.some((candidate) => value.includes(candidate));
}

function normalizeLogValue(value) {
  return String(value || "").trim().toLowerCase();
}

function compareLogsByTime(a = {}, b = {}) {
  return getLogSortTime(a) - getLogSortTime(b);
}

function getLogSortTime(log = {}) {
  const elapsed = Number(log.elapsedMsFromTaskStart);
  if (Number.isFinite(elapsed)) return elapsed;
  const created = new Date(log.createdAt || log.timestamp || log.clientTimestamp || 0).getTime();
  return Number.isFinite(created) ? created : 0;
}

function isFallbackAfterVoiceFailure(log = {}, candidateLogs = []) {
  if (log.modality !== "touch" || !log.fallbackUsed) return false;

  const touchUseContext = normalizeLogValue(log.touchUseContext || log.metadata?.touchUseContext);
  if (touchUseContext === TOUCH_USE_CONTEXTS.fallbackAfterVoiceFailure) return true;
  if (touchUseContext === TOUCH_USE_CONTEXTS.voiceConditionTouchUse) return false;

  const logTime = getLogSortTime(log);
  return candidateLogs.some((candidate) => {
    if (candidate.modality !== "voice" || !isVoiceFailureLog(candidate)) return false;
    const candidateTime = getLogSortTime(candidate);
    return candidateTime <= logTime && logTime - candidateTime <= FALLBACK_TOUCH_WINDOW_MS;
  });
}

function getRelatedLogsForLog(logs = [], targetLog = {}) {
  return logs.filter((log) =>
    (!targetLog.sessionId || log.sessionId === targetLog.sessionId) &&
    (!targetLog.conditionId || log.conditionId === targetLog.conditionId) &&
    (!targetLog.taskId || log.taskId === targetLog.taskId) &&
    (!targetLog.trialType || log.trialType === targetLog.trialType)
  );
}

function isVoiceFailureLog(log = {}) {
  return log.commandSuccess === false ||
    log.eventType === "voice_no_match" ||
    log.eventType === "voice_recognition_error" ||
    log.eventType === "voice_unsupported" ||
    Boolean(log.recognitionErrorCode);
}

function isVoiceCommandLog(log = {}) {
  if (log.modality !== "voice") return false;
  if (SYSTEM_VOICE_EVENTS.has(log.eventType)) return false;
  return Boolean(
    log.rawTranscript ||
      log.normalizedTranscript ||
      log.matchedIntent ||
      log.recognitionErrorCode ||
      String(log.eventType || "").startsWith("voice_") ||
      (log.commandSuccess !== null && log.commandSuccess !== undefined) ||
      (log.recognized !== null && log.recognized !== undefined)
  );
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
  const uniqueRecords = getLatestUniqueSusResponses(records);

  return Object.fromEntries(
    Object.entries(groupBy(uniqueRecords, "modality")).map(([modality, items]) => {
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

function getLatestUniqueSusResponses(records = []) {
  const latestByKey = new Map();

  records.forEach((record) => {
    const key = getSusResponseKey(record);
    const current = latestByKey.get(key);
    if (!current || getSusResponseTime(record) >= getSusResponseTime(current)) {
      latestByKey.set(key, record);
    }
  });

  return Array.from(latestByKey.values());
}

function getSusResponseKey(record = {}) {
  const sessionKey = record.sessionId || record.participantId || record.participantCode || "unknown-session";
  const conditionKey = record.conditionId || record.conditionOrder || "unknown-condition";
  return [sessionKey, conditionKey, record.modality || "unknown-modality"].join("|");
}

function getSusResponseTime(record = {}) {
  const value = new Date(record.timestamp || record.createdAt || 0).getTime();
  return Number.isFinite(value) ? value : 0;
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

function summarizeRecoveryEffort(voiceLogs, fallbackTouchLogs = []) {
  const recoveryLogs = voiceLogs.filter((log) =>
    log.recoveryType ||
    log.isRecoveryAttempt ||
    log.fallbackUsed ||
    log.commandSuccess === false ||
    log.eventType === "voice_no_match"
  );
  return {
    totalCount: recoveryLogs.length + fallbackTouchLogs.length,
    byRecoveryType: countBy(recoveryLogs, "recoveryType"),
    repeatedCommandCount: voiceLogs.filter((log) => log.recoveryAttemptType === "repeated_command").length,
    rephrasedCommandCount: voiceLogs.filter((log) => log.recoveryAttemptType === "rephrased_command").length,
    fallbackTouchCount: voiceLogs.filter((log) => log.fallbackUsed).length + fallbackTouchLogs.length,
    fallbackTouchAfterFailureCount: fallbackTouchLogs.length,
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
  const contentfulResponses = debriefResponses.filter(hasContentfulDebriefResponse);
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
    summary[field] = debriefResponses.filter((response) =>
      String(response.responses?.[field] || "").trim().length > 0
    ).length;
    return summary;
  }, {
    responseCount: contentfulResponses.length,
    submittedCount: debriefResponses.length,
    contentfulResponseCount: contentfulResponses.length,
  });
}

function hasContentfulDebriefResponse(response = {}) {
  const responses = response.responses || {};
  return REQUIRED_DEBRIEF_NARRATIVE_FIELDS.every((field) =>
    String(responses[field] || "").trim().length > 0
  );
}

function getTechnicalNotes(sessions) {
  return sessions.flatMap((session) =>
    (session.technicalNotes || [])
      .filter(isMeaningfulTechnicalNote)
      .map((note) => ({
        ...note,
        sessionId: session.id,
        participantId: session.participantId,
      }))
  );
}

function isMeaningfulTechnicalNote(note) {
  const value = normalizeLogValue(note?.note);
  return Boolean(value) && !NON_ISSUE_TECHNICAL_NOTES.has(value);
}

function buildEnvironmentWarnings(sessions = []) {
  return sessions.flatMap((session) => {
    const environment = session.environment || {};
    const browserInfo = session.browserInfo || {};
    const userAgent = String(browserInfo.userAgent || "").toLowerCase();
    const manualDevice = normalizeLogValue(environment.deviceType);
    const manualBrowser = normalizeLogValue(environment.browserName);
    const detectedBrowser = normalizeLogValue(browserInfo.detectedBrowserName);
    const warnings = [];
    const isMobile = /mobile|android|iphone|ipod/.test(userAgent);
    const isTablet = /ipad|tablet/.test(userAgent) || (/android/.test(userAgent) && !/mobile/.test(userAgent));
    const isDesktopLike = userAgent && !isMobile && !isTablet;

    if (manualDevice === "laptop" && (isMobile || isTablet)) {
      warnings.push({
        field: "deviceType",
        expected: environment.deviceType,
        detected: browserInfo.userAgent || browserInfo.platform || "",
        message: "Manual device type is Laptop, but detected browser looks mobile/tablet.",
      });
    }

    if (manualDevice === "smartphone" && isDesktopLike) {
      warnings.push({
        field: "deviceType",
        expected: environment.deviceType,
        detected: browserInfo.userAgent || browserInfo.platform || "",
        message: "Manual device type is Smartphone, but detected browser does not look mobile.",
      });
    }

    if (manualBrowser.includes("desktop") && isMobile) {
      warnings.push({
        field: "browserName",
        expected: environment.browserName,
        detected: browserInfo.userAgent || detectedBrowser,
        message: "Manual browser says desktop, but detected browser looks mobile.",
      });
    }

    if (manualBrowser.includes("mobile") && isDesktopLike) {
      warnings.push({
        field: "browserName",
        expected: environment.browserName,
        detected: browserInfo.userAgent || detectedBrowser,
        message: "Manual browser says mobile, but detected browser looks desktop.",
      });
    }

    return warnings.map((warning) => ({
      sessionId: session.id || "",
      participantId: session.participantId || "",
      participantCode: session.participantCode || "",
      ...warning,
    }));
  });
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
    standardDeviation: standardDeviation(values),
    standardError: standardError(values),
    confidenceInterval95: confidenceInterval95(values),
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

function standardDeviation(values) {
  if (values.length < 2) return null;
  const mean = average(values);
  const variance = values.reduce((total, value) => total + ((value - mean) ** 2), 0) / (values.length - 1);
  return Number(Math.sqrt(variance).toFixed(2));
}

function standardError(values) {
  const sd = standardDeviation(values);
  if (sd === null) return null;
  return Number((sd / Math.sqrt(values.length)).toFixed(2));
}

function confidenceInterval95(values) {
  const se = standardError(values);
  const mean = average(values);
  if (se === null || mean === null) return null;
  const margin = 1.96 * se;
  return {
    lower: Number((mean - margin).toFixed(2)),
    upper: Number((mean + margin).toFixed(2)),
  };
}

function ratio(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function completionStatusToNumber(status) {
  if (status === "successful") return 1;
  if (status === "partially_successful") return 0.5;
  if (status === "unsuccessful") return 0;
  return "";
}
