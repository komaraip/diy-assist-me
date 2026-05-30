import packageJson from "../../package.json";
import { loadAdminData, buildSessionBundles } from "./adminDataService.js";
import { toCsv } from "../utils/csvExport.js";
import { buildAnalysisReadyRows, buildTaskTrialValidation, calculateChapter4Metrics } from "../utils/chapter4Metrics.js";
import { buildExportMetadata, toPrettyJson } from "../utils/jsonExport.js";
import { serviceSuccess } from "../utils/serviceResult.js";

export const EXPORT_FILENAMES = {
  taskTrials: "task_trials_export.csv",
  susResponses: "sus_responses_export.csv",
  voiceLogs: "voice_logs_export.csv",
  touchLogs: "touch_logs_export.csv",
  observerNotes: "observer_notes_export.csv",
  debriefResponses: "debrief_responses_export.csv",
  fullSessions: "identifiable_full_sessions_admin_export.json",
  chapter4Metrics: "chapter4_summary_metrics.json",
  analysisReadyDataset: "chapter4_analysis_ready_dataset.csv",
};

export async function generateExportFiles() {
  const dataResult = await loadAdminData();
  const rawData = dataResult.data || {};

  // Collect IDs of sessions the researcher has flagged to exclude
  const excludedIds = new Set(
    (rawData.sessions || [])
      .filter((session) => session.excludeFromExport === true)
      .map((session) => session.id)
  );

  // Build a filtered view: drop excluded sessions and all their child records
  function filterExcluded(records) {
    return records.filter((record) => !excludedIds.has(record.sessionId));
  }

  const data = excludedIds.size > 0
    ? {
        ...rawData,
        sessions: (rawData.sessions || []).filter((s) => !excludedIds.has(s.id)),
        taskTrials: filterExcluded(rawData.taskTrials || []),
        interactionLogs: filterExcluded(rawData.interactionLogs || []),
        susResponses: filterExcluded(rawData.susResponses || []),
        debriefResponses: filterExcluded(rawData.debriefResponses || []),
        observerNotes: filterExcluded(rawData.observerNotes || []),
        participants: rawData.participants || [],
      }
    : rawData;

  const metadata = buildExportMetadata({
    exportSource: dataResult.source,
    appVersion: packageJson.version,
    excludedSessionCount: excludedIds.size,
  });
  const metrics = calculateChapter4Metrics(data);
  const taskTrialValidations = buildTaskTrialValidation(data);
  const researchSummary = {
    exportedAt: metadata.exportedAt,
    appVersion: metadata.appVersion,
    source: metadata.source,
    exportSource: metadata.exportSource,
    excludedSessionCount: excludedIds.size,
    researchQuestions: metrics.researchQuestions,
    dataQuality: metrics.dataQuality,
  };
  const sessionLinkedLogs = (data.interactionLogs || []).filter((log) => log.sessionId);

  const files = [
    {
      fileName: EXPORT_FILENAMES.taskTrials,
      mimeType: "text/csv;charset=utf-8",
      content: buildTaskTrialsCsv(data),
    },
    {
      fileName: EXPORT_FILENAMES.susResponses,
      mimeType: "text/csv;charset=utf-8",
      content: buildSusResponsesCsv(data),
    },
    {
      fileName: EXPORT_FILENAMES.voiceLogs,
      mimeType: "text/csv;charset=utf-8",
      content: buildVoiceLogsCsv(data, sessionLinkedLogs.filter((log) => log.modality === "voice")),
    },
    {
      fileName: EXPORT_FILENAMES.touchLogs,
      mimeType: "text/csv;charset=utf-8",
      content: buildTouchLogsCsv(data, sessionLinkedLogs.filter((log) => log.modality === "touch")),
    },
    {
      fileName: EXPORT_FILENAMES.observerNotes,
      mimeType: "text/csv;charset=utf-8",
      content: buildObserverNotesCsv(data),
    },
    {
      fileName: EXPORT_FILENAMES.debriefResponses,
      mimeType: "text/csv;charset=utf-8",
      content: buildDebriefResponsesCsv(data),
    },
    {
      fileName: EXPORT_FILENAMES.fullSessions,
      mimeType: "application/json;charset=utf-8",
      content: toPrettyJson({
        metadata,
        recordCounts: getRecordCounts(data),
        researchQuestions: metrics.researchQuestions,
        dataQuality: metrics.dataQuality,
        taskTrialValidations,
        privacyNotice: "This admin JSON may include participant names and emails. Use anonymized CSV files for thesis analysis.",
        sessions: buildSessionBundles(data),
      }),
    },
    {
      fileName: EXPORT_FILENAMES.chapter4Metrics,
      mimeType: "application/json;charset=utf-8",
      content: toPrettyJson(researchSummary),
    },
    {
      fileName: EXPORT_FILENAMES.analysisReadyDataset,
      mimeType: "text/csv;charset=utf-8",
      content: buildAnalysisReadyCsv(data),
    },
  ];

  return serviceSuccess(
    {
      metadata,
      recordCounts: getRecordCounts(data),
      excludedSessionCount: excludedIds.size,
      files,
    },
    dataResult.source,
    dataResult.warning
  );
}

export function downloadTextFile({ fileName, content, mimeType }) {
  const blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildTaskTrialsCsv(data) {
  const context = buildSessionContext(data);
  const validationContext = buildValidationContext(data);
  return toCsv(data.taskTrials || [], [
    { header: "participantCode", value: (row) => row.participantCode || context.getSession(row)?.participantCode || "" },
    { header: "participantId", key: "participantId" },
    ...participantProfileColumns(context),
    { header: "sessionId", key: "sessionId" },
    { header: "sequenceAssignment", value: (row) => row.sequenceAssignment || context.getSession(row)?.sequenceAssignment || "" },
    { header: "tutorialRotation", value: (row) => row.tutorialRotation || context.getSession(row)?.tutorialRotation || "" },
    { header: "conditionId", key: "conditionId" },
    { header: "conditionOrder", value: (row) => row.conditionOrder ?? context.getCondition(row)?.conditionOrder ?? "" },
    { header: "modality", key: "modality" },
    { header: "trialType", key: "trialType" },
    { header: "taskId", key: "taskId" },
    { header: "tutorialId", key: "tutorialId" },
    { header: "startedAt", key: "startedAt" },
    { header: "endedAt", key: "endedAt" },
    { header: "durationSeconds", key: "durationSeconds" },
    { header: "completionStatus", key: "completionStatus" },
    { header: "invalidTrial", key: "invalidTrial" },
    { header: "invalidTrialReason", key: "invalidTrialReason" },
    { header: "participantTaskNote", value: (row) => row.participantTaskNote || row.researcherNote || "" },
    { header: "taskScript", value: (row) => stringifyList(row.taskScript || context.getTask(row)?.taskScript) },
    { header: "requiredActions", value: (row) => stringifyList(row.requiredActions || context.getTask(row)?.requiredActions) },
    { header: "requiredActionsMet", value: (row) => validationContext.getValidation(row)?.requiredActionsMet ?? "" },
    { header: "missingRequiredActions", value: (row) => stringifyList(validationContext.getValidation(row)?.missingRequiredActions) },
    { header: "requiredActionCompletionRate", value: (row) => validationContext.getValidation(row)?.requiredActionCompletionRate ?? "" },
    { header: "targetKeyword", value: (row) => row.targetKeyword || context.getTask(row)?.targetKeyword || "" },
    { header: "targetStep", value: (row) => row.targetStep ?? context.getTask(row)?.targetStep ?? "" },
    { header: "successCriteria", value: (row) => row.successCriteria || context.getTask(row)?.successCriteria || "" },
    { header: "browserName", value: (row) => context.getSession(row)?.environment?.browserName || "" },
    { header: "detectedBrowserName", value: (row) => context.getSession(row)?.browserInfo?.detectedBrowserName || "" },
    { header: "detectedBrowserVersion", value: (row) => context.getSession(row)?.browserInfo?.detectedBrowserVersion || "" },
    { header: "speechRecognitionSupported", value: (row) => context.getSession(row)?.browserInfo?.speechRecognitionSupported ?? "" },
    { header: "isSecureContext", value: (row) => context.getSession(row)?.browserInfo?.isSecureContext ?? "" },
    { header: "userAgent", value: (row) => context.getSession(row)?.browserInfo?.userAgent || "" },
    { header: "viewportWidth", value: (row) => context.getSession(row)?.browserInfo?.viewportWidth ?? "" },
    { header: "viewportHeight", value: (row) => context.getSession(row)?.browserInfo?.viewportHeight ?? "" },
    { header: "screenWidth", value: (row) => context.getSession(row)?.browserInfo?.screenWidth ?? "" },
    { header: "screenHeight", value: (row) => context.getSession(row)?.browserInfo?.screenHeight ?? "" },
    { header: "orientation", value: (row) => context.getSession(row)?.browserInfo?.orientation || "" },
    { header: "deviceType", value: (row) => context.getSession(row)?.environment?.deviceType || "" },
    { header: "roomNoiseLevelNote", value: (row) => context.getSession(row)?.environment?.roomNoiseLevelNote || "" },
    { header: "internetConnectionNote", value: (row) => context.getSession(row)?.environment?.internetConnectionNote || "" },
    { header: "voiceCommandSuccessCount", value: (row) => validationContext.getValidation(row)?.voiceCommandSuccessCount ?? "" },
    { header: "voiceRecognitionErrorCount", value: (row) => validationContext.getValidation(row)?.voiceRecognitionErrorCount ?? "" },
    { header: "fallbackTouchActionCount", value: (row) => validationContext.getValidation(row)?.fallbackTouchActionCount ?? "" },
    { header: "voiceTrialValidity", value: (row) => validationContext.getValidation(row)?.voiceTrialValidity || "" },
    { header: "exclusionReason", value: (row) => validationContext.getValidation(row)?.exclusionReason || "" },
  ]);
}

function buildSusResponsesCsv(data) {
  const context = buildSessionContext(data);
  return toCsv(data.susResponses || [], [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
    ...participantProfileColumns(context),
    { header: "sessionId", key: "sessionId" },
    { header: "conditionId", key: "conditionId" },
    { header: "conditionOrder", key: "conditionOrder" },
    { header: "modality", key: "modality" },
    ...Array.from({ length: 10 }, (_, index) => ({
      header: `sus_item_${index + 1}`,
      value: (row) => row.itemResponses?.[`item${index + 1}`] ?? "",
    })),
    { header: "sus_score", key: "susScore" },
    { header: "createdAt", value: (row) => row.createdAt || row.timestamp || "" },
  ]);
}

function buildVoiceLogsCsv(data, voiceLogs) {
  const context = buildSessionContext(data);
  return toCsv(voiceLogs, [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
    ...participantProfileColumns(context),
    { header: "sessionId", key: "sessionId" },
    { header: "conditionId", key: "conditionId" },
    { header: "conditionOrder", key: "conditionOrder" },
    { header: "taskId", key: "taskId" },
    { header: "trialType", key: "trialType" },
    { header: "tutorialId", key: "tutorialId" },
    { header: "eventType", key: "eventType" },
    { header: "rawTranscript", key: "rawTranscript" },
    { header: "normalizedTranscript", key: "normalizedTranscript" },
    { header: "recognized", key: "recognized" },
    { header: "recognitionErrorCode", key: "recognitionErrorCode" },
    { header: "matchedIntent", key: "matchedIntent" },
    { header: "confidenceType", key: "confidenceType" },
    { header: "commandSuccess", key: "commandSuccess" },
    { header: "failureReason", key: "failureReason" },
    { header: "recoveryType", key: "recoveryType" },
    { header: "isRecoveryAttempt", key: "isRecoveryAttempt" },
    { header: "recoveryAttemptType", key: "recoveryAttemptType" },
    { header: "fallbackUsed", key: "fallbackUsed" },
    { header: "touchUseContext", value: (row) => row.touchUseContext || row.metadata?.touchUseContext || "" },
    { header: "previousVoiceFailureEventId", value: (row) => row.previousVoiceFailureEventId || row.metadata?.previousVoiceFailureEventId || "" },
    { header: "stepIndexBefore", key: "stepIndexBefore" },
    { header: "stepIndexAfter", key: "stepIndexAfter" },
    { header: "elapsedMsFromTaskStart", key: "elapsedMsFromTaskStart" },
    { header: "speechConfidence", key: "speechConfidence" },
    { header: "matchedPhrase", key: "matchedPhrase" },
    { header: "query", key: "query" },
    { header: "stepNumber", key: "stepNumber" },
    { header: "createdAt", value: (row) => row.createdAt || row.timestamp || "" },
  ]);
}

function buildTouchLogsCsv(data, touchLogs) {
  const context = buildSessionContext(data);
  return toCsv(touchLogs, [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
    ...participantProfileColumns(context),
    { header: "sessionId", key: "sessionId" },
    { header: "conditionId", key: "conditionId" },
    { header: "conditionOrder", key: "conditionOrder" },
    { header: "taskId", key: "taskId" },
    { header: "trialType", key: "trialType" },
    { header: "tutorialId", key: "tutorialId" },
    { header: "eventType", key: "eventType" },
    { header: "fallbackUsed", key: "fallbackUsed" },
    { header: "touchUseContext", value: (row) => row.touchUseContext || row.metadata?.touchUseContext || "" },
    { header: "previousVoiceFailureEventId", value: (row) => row.previousVoiceFailureEventId || row.metadata?.previousVoiceFailureEventId || "" },
    { header: "stepIndexBefore", key: "stepIndexBefore" },
    { header: "stepIndexAfter", key: "stepIndexAfter" },
    { header: "elapsedMsFromTaskStart", key: "elapsedMsFromTaskStart" },
    { header: "metadata", key: "metadata" },
    { header: "createdAt", value: (row) => row.createdAt || row.timestamp || "" },
  ]);
}

function buildObserverNotesCsv(data) {
  const context = buildSessionContext(data);
  return toCsv(data.observerNotes || [], [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
    ...participantProfileColumns(context),
    { header: "sessionId", key: "sessionId" },
    { header: "conditionId", key: "conditionId" },
    { header: "taskId", key: "taskId" },
    { header: "taskTrialId", key: "taskTrialId" },
    { header: "severity", key: "severity" },
    { header: "tags", value: (row) => stringifyList(row.tags) },
    { header: "note", key: "note" },
    { header: "createdAt", value: (row) => row.createdAt || row.timestamp || "" },
  ]);
}

function buildDebriefResponsesCsv(data) {
  const context = buildSessionContext(data);
  return toCsv(data.debriefResponses || [], [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
    ...participantProfileColumns(context),
    { header: "sessionId", key: "sessionId" },
    { header: "preferredModality", value: (row) => row.responses?.preferredModality || "" },
    { header: "easiestPart", value: (row) => row.responses?.easiestPart || "" },
    { header: "hardestPart", value: (row) => row.responses?.hardestPart || "" },
    { header: "voiceProblems", value: (row) => row.responses?.voiceProblems || "" },
    { header: "touchProblems", value: (row) => row.responses?.touchProblems || "" },
    { header: "commandClarity", value: (row) => row.responses?.commandClarity || "" },
    { header: "recoveryEffort", value: (row) => row.responses?.recoveryEffort || "" },
    { header: "fallbackComments", value: (row) => row.responses?.fallbackComments || "" },
    { header: "designImplications", value: (row) => row.responses?.designImplications || "" },
    { header: "suggestions", value: (row) => row.responses?.suggestions || "" },
    { header: "createdAt", value: (row) => row.createdAt || row.timestamp || "" },
  ]);
}

function buildAnalysisReadyCsv(data) {
  const context = buildSessionContext(data);
  return toCsv(buildAnalysisReadyRows(data), [
    { header: "participantCode", key: "participantCode" },
    ...participantProfileColumns(context),
    { header: "sequenceAssignment", key: "sequenceAssignment" },
    { header: "tutorialRotation", key: "tutorialRotation" },
    { header: "touch_task_duration_seconds", key: "touch_task_duration_seconds" },
    { header: "voice_task_duration_seconds", key: "voice_task_duration_seconds" },
    { header: "duration_difference_voice_minus_touch", key: "duration_difference_voice_minus_touch" },
    { header: "touch_task_success", key: "touch_task_success" },
    { header: "voice_task_success", key: "voice_task_success" },
    { header: "touch_task_success_numeric", key: "touch_task_success_numeric" },
    { header: "voice_task_success_numeric", key: "voice_task_success_numeric" },
    { header: "touch_sus_score", key: "touch_sus_score" },
    { header: "voice_sus_score", key: "voice_sus_score" },
    { header: "sus_difference_voice_minus_touch", key: "sus_difference_voice_minus_touch" },
    { header: "voice_total_commands", key: "voice_total_commands" },
    { header: "voice_recognized_count", key: "voice_recognized_count" },
    { header: "voice_command_success_count", key: "voice_command_success_count" },
    { header: "voice_command_success_rate", key: "voice_command_success_rate" },
    { header: "voice_recognition_accuracy", key: "voice_recognition_accuracy" },
    { header: "voice_recovery_effort", key: "voice_recovery_effort" },
    { header: "voice_repeated_command_count", key: "voice_repeated_command_count" },
    { header: "voice_rephrased_command_count", key: "voice_rephrased_command_count" },
    { header: "voice_fallback_count", key: "voice_fallback_count" },
    { header: "voice_touch_use_count", key: "voice_touch_use_count" },
    { header: "voice_no_match_count", key: "voice_no_match_count" },
    { header: "voice_command_failed_count", key: "voice_command_failed_count" },
    { header: "voice_trial_validity", key: "voice_trial_validity" },
    { header: "voice_trial_exclusion_reason", key: "voice_trial_exclusion_reason" },
    { header: "voiceCommandSuccessCount", key: "voiceCommandSuccessCount" },
    { header: "voiceRecognitionErrorCount", key: "voiceRecognitionErrorCount" },
    { header: "fallbackTouchActionCount", key: "fallbackTouchActionCount" },
    { header: "fallbackTouchUseCount", key: "fallbackTouchUseCount" },
    { header: "touch_requiredActionsMet", key: "touch_requiredActionsMet" },
    { header: "touch_missingRequiredActions", key: "touch_missingRequiredActions" },
    { header: "touch_requiredActionCompletionRate", key: "touch_requiredActionCompletionRate" },
    { header: "voice_requiredActionsMet", key: "voice_requiredActionsMet" },
    { header: "voice_missingRequiredActions", key: "voice_missingRequiredActions" },
    { header: "voice_requiredActionCompletionRate", key: "voice_requiredActionCompletionRate" },
    { header: "invalid_pair", key: "invalid_pair" },
    { header: "exclusion_reason", key: "exclusion_reason" },
  ]);
}

function getRecordCounts(data) {
  return {
    participants: (data.participants || []).length,
    sessions: (data.sessions || []).length,
    taskTrials: (data.taskTrials || []).length,
    interactionLogs: (data.interactionLogs || []).length,
    susResponses: (data.susResponses || []).length,
    debriefResponses: (data.debriefResponses || []).length,
    observerNotes: (data.observerNotes || []).length,
  };
}

function buildSessionContext(data) {
  const participants = data.participants || [];
  const sessions = data.sessions || [];
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const participantByCode = new Map(participants.map((participant) => [participant.participantCode, participant]));
  const sessionById = new Map(sessions.map((session) => [session.id, session]));

  function getSession(row) {
    return sessionById.get(row.sessionId) || null;
  }

  function getParticipant(row) {
    const session = getSession(row);
    return (
      participantById.get(row.participantId || session?.participantId) ||
      participantByCode.get(row.participantCode || session?.participantCode) ||
      null
    );
  }

  function getParticipantProfile(row) {
    const session = getSession(row);
    const participant = getParticipant(row);
    return normalizeParticipantProfile(session?.participantProfile || participant?.participantProfile || {});
  }

  function getCondition(row) {
    return (getSession(row)?.conditions || []).find((condition) => condition.id === row.conditionId) || null;
  }

  function getTask(row) {
    return (getCondition(row)?.tasks || []).find((task) => task.id === row.taskId || task.taskId === row.taskId) || null;
  }

  return {
    getSession,
    getParticipant,
    getParticipantProfile,
    getCondition,
    getTask,
  };
}

function participantProfileColumns(context) {
  return [
    { header: "ageRange", value: (row) => context.getParticipantProfile(row).ageRange },
    { header: "englishAbility", value: (row) => context.getParticipantProfile(row).englishAbility },
    { header: "tutorialAppUsage", value: (row) => context.getParticipantProfile(row).tutorialAppUsage },
  ];
}

function normalizeParticipantProfile(participantProfile = {}) {
  return {
    fullName: participantProfile.fullName || "",
    email: participantProfile.email || "",
    ageRange: participantProfile.ageRange || "",
    englishAbility: participantProfile.englishAbility || "",
    tutorialAppUsage: participantProfile.tutorialAppUsage || "",
  };
}

function buildValidationContext(data) {
  const validations = buildTaskTrialValidation(data);
  const validationById = new Map(validations.filter((validation) => validation.trialId).map((validation) => [validation.trialId, validation]));
  const validationByTask = new Map(validations.map((validation) => [getValidationTaskKey(validation), validation]));

  function getValidation(row) {
    return validationById.get(row.id) || validationByTask.get(getValidationTaskKey(row)) || null;
  }

  return {
    getValidation,
  };
}

function getValidationTaskKey(row) {
  return [
    row.sessionId || "",
    row.conditionId || "",
    row.taskId || "",
    row.trialType || "",
  ].join("|");
}

function stringifyList(value) {
  if (!Array.isArray(value)) return value || "";
  return value.join(" | ");
}
