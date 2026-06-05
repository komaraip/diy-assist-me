/**
 * Data Validation Utilities
 * Validates research data integrity and completeness
 * Schema Version: chapter4-rq1-rq3-v1
 */

const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";
const UI_VERSION = "2.0";

// Required fields for each collection
const REQUIRED_FIELDS = {
  sessions: [
    "id",
    "participantId",
    "participantCode",
    "schemaVersion",
    "sequenceAssignment",
    "tutorialRotation",
    "createdAt",
  ],
  taskTrials: [
    "id",
    "participantId",
    "sessionId",
    "conditionId",
    "taskId",
    "tutorialId",
    "modality",
    "trialType",
    "startedAt",
    "schemaVersion",
  ],
  interactionLogs: [
    "id",
    "participantId",
    "sessionId",
    "modality",
    "eventType",
    "timestamp",
    "schemaVersion",
  ],
  susResponses: [
    "id",
    "participantId",
    "sessionId",
    "conditionId",
    "modality",
    "itemResponses",
    "susScore",
    "schemaVersion",
  ],
  observerNotes: [
    "id",
    "participantId",
    "sessionId",
    "note",
    "timestamp",
    "schemaVersion",
  ],
  debriefResponses: [
    "id",
    "participantId",
    "sessionId",
    "responses",
    "timestamp",
    "schemaVersion",
  ],
};

// Field type validators
const FIELD_VALIDATORS = {
  timestamp: (value) => {
    if (!value) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  },
  duration: (value) => {
    return typeof value === "number" && value >= 0;
  },
  susScore: (value) => {
    return typeof value === "number" && value >= 0 && value <= 100;
  },
  modality: (value) => {
    return ["touch", "voice"].includes(value);
  },
  trialType: (value) => {
    return ["practice", "measured"].includes(value);
  },
  completionStatus: (value) => {
    return ["successful", "partially_successful", "unsuccessful", ""].includes(value);
  },
  schemaVersion: (value) => {
    return value === SCHEMA_VERSION;
  },
};

/**
 * Validate a single record against required fields
 */
export function validateRecord(record, collectionName) {
  const errors = [];
  const warnings = [];
  const requiredFields = REQUIRED_FIELDS[collectionName] || [];

  // Check required fields
  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check schema version
  if (record.schemaVersion && record.schemaVersion !== SCHEMA_VERSION) {
    warnings.push(`Schema version mismatch: expected ${SCHEMA_VERSION}, got ${record.schemaVersion}`);
  }

  // Check UI version (if applicable)
  if (collectionName === "sessions" && !record.uiVersion) {
    warnings.push("Missing uiVersion field - recommend adding for tracking");
  }

  // Validate specific fields
  if (record.timestamp && !FIELD_VALIDATORS.timestamp(record.timestamp)) {
    errors.push("Invalid timestamp format");
  }

  if (record.durationSeconds !== undefined && !FIELD_VALIDATORS.duration(record.durationSeconds)) {
    errors.push("Invalid duration value");
  }

  if (record.susScore !== undefined && !FIELD_VALIDATORS.susScore(record.susScore)) {
    errors.push("Invalid SUS score (must be 0-100)");
  }

  if (record.modality && !FIELD_VALIDATORS.modality(record.modality)) {
    errors.push(`Invalid modality: ${record.modality}`);
  }

  if (record.trialType && !FIELD_VALIDATORS.trialType(record.trialType)) {
    errors.push(`Invalid trial type: ${record.trialType}`);
  }

  if (record.completionStatus && !FIELD_VALIDATORS.completionStatus(record.completionStatus)) {
    errors.push(`Invalid completion status: ${record.completionStatus}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate timestamp sequence for a task trial
 */
export function validateTimestampSequence(taskTrial, interactionLogs) {
  const errors = [];
  const warnings = [];

  if (!taskTrial.startedAt) {
    errors.push("Task trial missing startedAt timestamp");
    return { valid: false, errors, warnings };
  }

  const startTime = new Date(taskTrial.startedAt).getTime();

  // Check endedAt is after startedAt
  if (taskTrial.endedAt) {
    const endTime = new Date(taskTrial.endedAt).getTime();
    if (endTime < startTime) {
      errors.push("Task endedAt is before startedAt");
    }

    // Validate duration calculation
    const calculatedDuration = Math.round((endTime - startTime) / 1000);
    if (taskTrial.durationSeconds !== null && Math.abs(calculatedDuration - taskTrial.durationSeconds) > 1) {
      warnings.push(`Duration mismatch: calculated ${calculatedDuration}s, stored ${taskTrial.durationSeconds}s`);
    }
  }

  // Check interaction logs are within trial timeframe
  const trialLogs = interactionLogs.filter(
    (log) => log.sessionId === taskTrial.sessionId && log.taskId === taskTrial.taskId
  );

  for (const log of trialLogs) {
    const logTime = new Date(log.timestamp).getTime();
    if (logTime < startTime) {
      warnings.push(`Interaction log timestamp (${log.id}) is before task start`);
    }
    if (taskTrial.endedAt) {
      const endTime = new Date(taskTrial.endedAt).getTime();
      if (logTime > endTime) {
        warnings.push(`Interaction log timestamp (${log.id}) is after task end`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate data consistency across a session
 */
export function validateSessionConsistency(session, taskTrials, susResponses, interactionLogs) {
  const errors = [];
  const warnings = [];

  // Check task trials belong to session
  const sessionTrials = taskTrials.filter((trial) => trial.sessionId === session.id);
  if (sessionTrials.length === 0) {
    warnings.push("Session has no task trials");
  }

  // Check SUS responses match conditions
  const sessionSUS = susResponses.filter((sus) => sus.sessionId === session.id);
  const expectedConditions = new Set(sessionTrials.map((t) => t.conditionId));
  const susConditions = new Set(sessionSUS.map((s) => s.conditionId));

  for (const conditionId of expectedConditions) {
    if (!susConditions.has(conditionId)) {
      warnings.push(`Missing SUS response for condition: ${conditionId}`);
    }
  }

  // Check interaction logs
  const sessionLogs = interactionLogs.filter((log) => log.sessionId === session.id);
  if (sessionLogs.length === 0) {
    warnings.push("Session has no interaction logs");
  }

  // Check participant ID consistency
  const participantIds = new Set([
    session.participantId,
    ...sessionTrials.map((t) => t.participantId),
    ...sessionSUS.map((s) => s.participantId),
    ...sessionLogs.map((l) => l.participantId),
  ]);

  if (participantIds.size > 1) {
    errors.push(`Participant ID mismatch across session data: ${Array.from(participantIds).join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate complete dataset
 */
export function validateDataset(data) {
  const report = {
    timestamp: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    uiVersion: UI_VERSION,
    summary: {
      totalRecords: 0,
      validRecords: 0,
      recordsWithErrors: 0,
      recordsWithWarnings: 0,
    },
    collections: {},
    sessions: [],
    criticalErrors: [],
    warnings: [],
  };

  // Validate each collection
  for (const [collectionName, records] of Object.entries(data)) {
    if (!Array.isArray(records)) continue;

    const collectionReport = {
      total: records.length,
      valid: 0,
      errors: 0,
      warnings: 0,
      records: [],
    };

    for (const record of records) {
      const validation = validateRecord(record, collectionName);
      collectionReport.records.push({
        id: record.id,
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      });

      if (validation.valid) {
        collectionReport.valid++;
      } else {
        collectionReport.errors++;
      }

      if (validation.warnings.length > 0) {
        collectionReport.warnings++;
      }

      report.summary.totalRecords++;
      if (validation.valid) report.summary.validRecords++;
      if (validation.errors.length > 0) report.summary.recordsWithErrors++;
      if (validation.warnings.length > 0) report.summary.recordsWithWarnings++;
    }

    report.collections[collectionName] = collectionReport;
  }

  // Validate session consistency
  const sessions = data.sessions || [];
  const taskTrials = data.taskTrials || [];
  const susResponses = data.susResponses || [];
  const interactionLogs = data.interactionLogs || [];

  for (const session of sessions) {
    const sessionValidation = validateSessionConsistency(session, taskTrials, susResponses, interactionLogs);
    report.sessions.push({
      sessionId: session.id,
      participantCode: session.participantCode,
      valid: sessionValidation.valid,
      errors: sessionValidation.errors,
      warnings: sessionValidation.warnings,
    });

    if (sessionValidation.errors.length > 0) {
      report.criticalErrors.push(...sessionValidation.errors.map((e) => `Session ${session.participantCode}: ${e}`));
    }
    if (sessionValidation.warnings.length > 0) {
      report.warnings.push(...sessionValidation.warnings.map((w) => `Session ${session.participantCode}: ${w}`));
    }
  }

  // Validate timestamp sequences for completed trials
  const completedTrials = taskTrials.filter((t) => t.endedAt);
  for (const trial of completedTrials) {
    const sequenceValidation = validateTimestampSequence(trial, interactionLogs);
    if (sequenceValidation.errors.length > 0) {
      report.criticalErrors.push(
        ...sequenceValidation.errors.map((e) => `Trial ${trial.id}: ${e}`)
      );
    }
    if (sequenceValidation.warnings.length > 0) {
      report.warnings.push(...sequenceValidation.warnings.map((w) => `Trial ${trial.id}: ${w}`));
    }
  }

  // Calculate validation score
  report.summary.validationScore =
    report.summary.totalRecords > 0
      ? Math.round((report.summary.validRecords / report.summary.totalRecords) * 100)
      : 0;

  report.summary.hasCriticalErrors = report.criticalErrors.length > 0;
  report.summary.isProductionReady = report.criticalErrors.length === 0 && report.summary.validationScore >= 95;

  return report;
}

/**
 * Generate validation report summary
 */
export function generateValidationSummary(report) {
  const lines = [];
  lines.push("=".repeat(60));
  lines.push("DATA VALIDATION REPORT");
  lines.push("=".repeat(60));
  lines.push(`Generated: ${report.timestamp}`);
  lines.push(`Schema Version: ${report.schemaVersion}`);
  lines.push(`UI Version: ${report.uiVersion}`);
  lines.push("");

  lines.push("SUMMARY");
  lines.push("-".repeat(60));
  lines.push(`Total Records: ${report.summary.totalRecords}`);
  lines.push(`Valid Records: ${report.summary.validRecords}`);
  lines.push(`Records with Errors: ${report.summary.recordsWithErrors}`);
  lines.push(`Records with Warnings: ${report.summary.recordsWithWarnings}`);
  lines.push(`Validation Score: ${report.summary.validationScore}%`);
  lines.push(`Production Ready: ${report.summary.isProductionReady ? "YES ✅" : "NO ❌"}`);
  lines.push("");

  if (report.criticalErrors.length > 0) {
    lines.push("CRITICAL ERRORS");
    lines.push("-".repeat(60));
    report.criticalErrors.forEach((error, i) => {
      lines.push(`${i + 1}. ${error}`);
    });
    lines.push("");
  }

  if (report.warnings.length > 0) {
    lines.push(`WARNINGS (${report.warnings.length})`);
    lines.push("-".repeat(60));
    report.warnings.slice(0, 10).forEach((warning, i) => {
      lines.push(`${i + 1}. ${warning}`);
    });
    if (report.warnings.length > 10) {
      lines.push(`... and ${report.warnings.length - 10} more warnings`);
    }
    lines.push("");
  }

  lines.push("COLLECTIONS");
  lines.push("-".repeat(60));
  for (const [name, stats] of Object.entries(report.collections)) {
    lines.push(`${name}: ${stats.valid}/${stats.total} valid (${stats.errors} errors, ${stats.warnings} warnings)`);
  }
  lines.push("");

  lines.push("=".repeat(60));

  return lines.join("\n");
}

// Made with Bob
