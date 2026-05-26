import packageJson from "../../package.json";
import { loadAdminData, buildSessionBundles } from "./adminDataService.js";
import { toCsv } from "../utils/csvExport.js";
import { buildAnalysisReadyRows, calculateChapter4Metrics } from "../utils/chapter4Metrics.js";
import { buildExportMetadata, toPrettyJson } from "../utils/jsonExport.js";
import { serviceSuccess } from "../utils/serviceResult.js";

export const EXPORT_FILENAMES = {
  taskTrials: "task_trials_export.csv",
  susResponses: "sus_responses_export.csv",
  voiceLogs: "voice_logs_export.csv",
  touchLogs: "touch_logs_export.csv",
  observerNotes: "observer_notes_export.csv",
  debriefResponses: "debrief_responses_export.csv",
  fullSessions: "full_sessions_export.json",
  chapter4Metrics: "chapter4_summary_metrics.json",
  analysisReadyDataset: "chapter4_analysis_ready_dataset.csv",
};

export async function generateExportFiles() {
  const dataResult = await loadAdminData();
  const data = dataResult.data || {};
  const metadata = buildExportMetadata({
    exportSource: dataResult.source,
    appVersion: packageJson.version,
  });
  const metrics = calculateChapter4Metrics(data);
  const researchSummary = {
    exportedAt: metadata.exportedAt,
    appVersion: metadata.appVersion,
    source: metadata.source,
    exportSource: metadata.exportSource,
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
      content: buildSusResponsesCsv(data.susResponses || []),
    },
    {
      fileName: EXPORT_FILENAMES.voiceLogs,
      mimeType: "text/csv;charset=utf-8",
      content: buildVoiceLogsCsv(sessionLinkedLogs.filter((log) => log.modality === "voice")),
    },
    {
      fileName: EXPORT_FILENAMES.touchLogs,
      mimeType: "text/csv;charset=utf-8",
      content: buildTouchLogsCsv(sessionLinkedLogs.filter((log) => log.modality === "touch")),
    },
    {
      fileName: EXPORT_FILENAMES.observerNotes,
      mimeType: "text/csv;charset=utf-8",
      content: buildObserverNotesCsv(data.observerNotes || []),
    },
    {
      fileName: EXPORT_FILENAMES.debriefResponses,
      mimeType: "text/csv;charset=utf-8",
      content: buildDebriefResponsesCsv(data.debriefResponses || []),
    },
    {
      fileName: EXPORT_FILENAMES.fullSessions,
      mimeType: "application/json;charset=utf-8",
      content: toPrettyJson({
        metadata,
        recordCounts: getRecordCounts(data),
        researchQuestions: metrics.researchQuestions,
        dataQuality: metrics.dataQuality,
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
  return toCsv(data.taskTrials || [], [
    { header: "participantCode", value: (row) => row.participantCode || context.getSession(row)?.participantCode || "" },
    { header: "participantId", key: "participantId" },
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
    { header: "researcherNote", key: "researcherNote" },
    { header: "taskScript", value: (row) => stringifyList(row.taskScript || context.getTask(row)?.taskScript) },
    { header: "requiredActions", value: (row) => stringifyList(row.requiredActions || context.getTask(row)?.requiredActions) },
    { header: "targetKeyword", value: (row) => row.targetKeyword || context.getTask(row)?.targetKeyword || "" },
    { header: "targetStep", value: (row) => row.targetStep ?? context.getTask(row)?.targetStep ?? "" },
    { header: "successCriteria", value: (row) => row.successCriteria || context.getTask(row)?.successCriteria || "" },
    { header: "browserName", value: (row) => context.getSession(row)?.environment?.browserName || "" },
    { header: "deviceType", value: (row) => context.getSession(row)?.environment?.deviceType || "" },
    { header: "roomNoiseLevelNote", value: (row) => context.getSession(row)?.environment?.roomNoiseLevelNote || "" },
    { header: "internetConnectionNote", value: (row) => context.getSession(row)?.environment?.internetConnectionNote || "" },
  ]);
}

function buildSusResponsesCsv(susResponses) {
  return toCsv(susResponses, [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
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

function buildVoiceLogsCsv(voiceLogs) {
  return toCsv(voiceLogs, [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
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
    { header: "fallbackUsed", key: "fallbackUsed" },
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

function buildTouchLogsCsv(touchLogs) {
  return toCsv(touchLogs, [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
    { header: "sessionId", key: "sessionId" },
    { header: "conditionId", key: "conditionId" },
    { header: "conditionOrder", key: "conditionOrder" },
    { header: "taskId", key: "taskId" },
    { header: "trialType", key: "trialType" },
    { header: "tutorialId", key: "tutorialId" },
    { header: "eventType", key: "eventType" },
    { header: "fallbackUsed", key: "fallbackUsed" },
    { header: "stepIndexBefore", key: "stepIndexBefore" },
    { header: "stepIndexAfter", key: "stepIndexAfter" },
    { header: "elapsedMsFromTaskStart", key: "elapsedMsFromTaskStart" },
    { header: "metadata", key: "metadata" },
    { header: "createdAt", value: (row) => row.createdAt || row.timestamp || "" },
  ]);
}

function buildObserverNotesCsv(observerNotes) {
  return toCsv(observerNotes, [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
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

function buildDebriefResponsesCsv(debriefResponses) {
  return toCsv(debriefResponses, [
    { header: "participantCode", key: "participantCode" },
    { header: "participantId", key: "participantId" },
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
  return toCsv(buildAnalysisReadyRows(data), [
    { header: "participantCode", key: "participantCode" },
    { header: "sequenceAssignment", key: "sequenceAssignment" },
    { header: "tutorialRotation", key: "tutorialRotation" },
    { header: "touch_task_duration_seconds", key: "touch_task_duration_seconds" },
    { header: "voice_task_duration_seconds", key: "voice_task_duration_seconds" },
    { header: "touch_task_success", key: "touch_task_success" },
    { header: "voice_task_success", key: "voice_task_success" },
    { header: "touch_sus_score", key: "touch_sus_score" },
    { header: "voice_sus_score", key: "voice_sus_score" },
    { header: "voice_total_commands", key: "voice_total_commands" },
    { header: "voice_recognized_count", key: "voice_recognized_count" },
    { header: "voice_command_success_count", key: "voice_command_success_count" },
    { header: "voice_command_success_rate", key: "voice_command_success_rate" },
    { header: "voice_recognition_accuracy", key: "voice_recognition_accuracy" },
    { header: "voice_recovery_effort", key: "voice_recovery_effort" },
    { header: "voice_fallback_count", key: "voice_fallback_count" },
    { header: "voice_no_match_count", key: "voice_no_match_count" },
    { header: "voice_command_failed_count", key: "voice_command_failed_count" },
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
  const sessions = data.sessions || [];
  const sessionById = new Map(sessions.map((session) => [session.id, session]));

  function getSession(row) {
    return sessionById.get(row.sessionId) || null;
  }

  function getCondition(row) {
    return (getSession(row)?.conditions || []).find((condition) => condition.id === row.conditionId) || null;
  }

  function getTask(row) {
    return (getCondition(row)?.tasks || []).find((task) => task.id === row.taskId || task.taskId === row.taskId) || null;
  }

  return {
    getSession,
    getCondition,
    getTask,
  };
}

function stringifyList(value) {
  if (!Array.isArray(value)) return value || "";
  return value.join(" | ");
}
