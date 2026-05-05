import packageJson from "../../package.json";
import { loadAdminData, buildSessionBundles } from "./adminDataService.js";
import { toCsv } from "../utils/csvExport.js";
import { calculateChapter4Metrics } from "../utils/chapter4Metrics.js";
import { buildExportMetadata, toPrettyJson } from "../utils/jsonExport.js";
import { serviceSuccess } from "../utils/serviceResult.js";

export const EXPORT_FILENAMES = {
  taskTrials: "task_trials_export.csv",
  susResponses: "sus_responses_export.csv",
  voiceLogs: "voice_logs_export.csv",
  fullSessions: "full_sessions_export.json",
  chapter4Metrics: "chapter4_summary_metrics.json",
};

export async function generateExportFiles() {
  const dataResult = await loadAdminData();
  const data = dataResult.data || {};
  const metadata = buildExportMetadata({
    exportSource: dataResult.source,
    appVersion: packageJson.version,
  });

  const files = [
    {
      fileName: EXPORT_FILENAMES.taskTrials,
      mimeType: "text/csv;charset=utf-8",
      content: buildTaskTrialsCsv(data.taskTrials || []),
    },
    {
      fileName: EXPORT_FILENAMES.susResponses,
      mimeType: "text/csv;charset=utf-8",
      content: buildSusResponsesCsv(data.susResponses || []),
    },
    {
      fileName: EXPORT_FILENAMES.voiceLogs,
      mimeType: "text/csv;charset=utf-8",
      content: buildVoiceLogsCsv((data.interactionLogs || []).filter((log) => log.modality === "voice")),
    },
    {
      fileName: EXPORT_FILENAMES.fullSessions,
      mimeType: "application/json;charset=utf-8",
      content: toPrettyJson({
        metadata,
        recordCounts: getRecordCounts(data),
        sessions: buildSessionBundles(data),
      }),
    },
    {
      fileName: EXPORT_FILENAMES.chapter4Metrics,
      mimeType: "application/json;charset=utf-8",
      content: toPrettyJson({
        metadata,
        metrics: calculateChapter4Metrics(data),
      }),
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

function buildTaskTrialsCsv(taskTrials) {
  return toCsv(taskTrials, [
    { header: "participantId", key: "participantId" },
    { header: "participantCode", key: "participantCode" },
    { header: "sessionId", key: "sessionId" },
    { header: "conditionId", key: "conditionId" },
    { header: "modality", key: "modality" },
    { header: "trialType", key: "trialType" },
    { header: "taskId", key: "taskId" },
    { header: "tutorialId", key: "tutorialId" },
    { header: "startedAt", key: "startedAt" },
    { header: "endedAt", key: "endedAt" },
    { header: "durationSeconds", key: "durationSeconds" },
    { header: "completed", key: "completed" },
    { header: "completionStatus", key: "completionStatus" },
    { header: "invalidTrial", key: "invalidTrial" },
    { header: "invalidTrialReason", key: "invalidTrialReason" },
    { header: "researcherNote", key: "researcherNote" },
  ]);
}

function buildSusResponsesCsv(susResponses) {
  return toCsv(susResponses, [
    { header: "participantId", key: "participantId" },
    { header: "participantCode", key: "participantCode" },
    { header: "sessionId", key: "sessionId" },
    { header: "conditionId", key: "conditionId" },
    { header: "conditionOrder", key: "conditionOrder" },
    { header: "modality", key: "modality" },
    ...Array.from({ length: 10 }, (_, index) => ({
      header: `susItem${index + 1}`,
      value: (row) => row.itemResponses?.[`item${index + 1}`] ?? "",
    })),
    { header: "contributionSum", key: "contributionSum" },
    { header: "susScore", key: "susScore" },
    { header: "timestamp", key: "timestamp" },
  ]);
}

function buildVoiceLogsCsv(voiceLogs) {
  return toCsv(voiceLogs, [
    { header: "participantId", key: "participantId" },
    { header: "sessionId", key: "sessionId" },
    { header: "conditionId", key: "conditionId" },
    { header: "taskId", key: "taskId" },
    { header: "trialType", key: "trialType" },
    { header: "tutorialId", key: "tutorialId" },
    { header: "timestamp", key: "timestamp" },
    { header: "eventType", key: "eventType" },
    { header: "rawTranscript", key: "rawTranscript" },
    { header: "normalizedTranscript", key: "normalizedTranscript" },
    { header: "matchedIntent", key: "matchedIntent" },
    { header: "confidenceType", key: "confidenceType" },
    { header: "commandSuccess", key: "commandSuccess" },
    { header: "failureReason", key: "failureReason" },
    { header: "recoveryType", key: "recoveryType" },
    { header: "fallbackUsed", key: "fallbackUsed" },
    { header: "recognitionErrorCode", key: "recognitionErrorCode" },
    { header: "elapsedMsFromTaskStart", key: "elapsedMsFromTaskStart" },
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
