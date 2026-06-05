/**
 * Validate Firebase Export Data
 * Validates data exported from admin panel or Firebase
 * 
 * Usage:
 *   node src/scripts/validateFirebaseExport.js <file.json>
 *   node src/scripts/validateFirebaseExport.js firebase-data.json --export=report.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import validation functions from dataValidation utility
// Since we can't import from browser-specific modules, we'll duplicate the logic

const SCHEMA_VERSION = "chapter4-rq1-rq3-v1";
const UI_VERSION = "2.0";

const REQUIRED_FIELDS = {
  sessions: ["id", "participantId", "participantCode", "schemaVersion", "sequenceAssignment", "tutorialRotation", "createdAt"],
  taskTrials: ["id", "participantId", "sessionId", "conditionId", "taskId", "tutorialId", "modality", "trialType", "startedAt", "schemaVersion"],
  interactionLogs: ["id", "participantId", "sessionId", "modality", "eventType", "timestamp", "schemaVersion"],
  susResponses: ["id", "participantId", "sessionId", "conditionId", "modality", "itemResponses", "susScore", "schemaVersion"],
  observerNotes: ["id", "participantId", "sessionId", "note", "timestamp", "schemaVersion"],
  debriefResponses: ["id", "participantId", "sessionId", "responses", "timestamp", "schemaVersion"],
};

const FIELD_VALIDATORS = {
  timestamp: (value) => {
    if (!value) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  },
  duration: (value) => typeof value === "number" && value >= 0,
  susScore: (value) => typeof value === "number" && value >= 0 && value <= 100,
  modality: (value) => ["touch", "voice"].includes(value),
  trialType: (value) => ["practice", "measured"].includes(value),
  completionStatus: (value) => ["successful", "partially_successful", "unsuccessful", ""].includes(value),
  schemaVersion: (value) => value === SCHEMA_VERSION,
};

function validateRecord(record, collectionName) {
  const errors = [];
  const warnings = [];
  const requiredFields = REQUIRED_FIELDS[collectionName] || [];

  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (record.schemaVersion && record.schemaVersion !== SCHEMA_VERSION) {
    warnings.push(`Schema version mismatch: expected ${SCHEMA_VERSION}, got ${record.schemaVersion}`);
  }

  if (collectionName === "sessions" && !record.uiVersion) {
    warnings.push("Missing uiVersion field - recommend adding for tracking");
  }

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

  return { valid: errors.length === 0, errors, warnings };
}

function validateDataset(data) {
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
    criticalErrors: [],
    warnings: [],
  };

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

      if (validation.errors.length > 0) {
        report.criticalErrors.push(
          ...validation.errors.map((e) => `${collectionName}/${record.id}: ${e}`)
        );
      }

      if (validation.warnings.length > 0) {
        report.warnings.push(
          ...validation.warnings.map((w) => `${collectionName}/${record.id}: ${w}`)
        );
      }
    }

    report.collections[collectionName] = collectionReport;
  }

  report.summary.validationScore =
    report.summary.totalRecords > 0
      ? Math.round((report.summary.validRecords / report.summary.totalRecords) * 100)
      : 100;

  report.summary.hasCriticalErrors = report.criticalErrors.length > 0;
  report.summary.isProductionReady = report.criticalErrors.length === 0 && report.summary.validationScore >= 95;

  return report;
}

function generateValidationSummary(report) {
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
    report.criticalErrors.slice(0, 20).forEach((error, i) => {
      lines.push(`${i + 1}. ${error}`);
    });
    if (report.criticalErrors.length > 20) {
      lines.push(`... and ${report.criticalErrors.length - 20} more errors`);
    }
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

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("FIREBASE EXPORT VALIDATION");
  console.log("=".repeat(60) + "\n");

  // Get filename from arguments
  const args = process.argv.slice(2);
  const fileArg = args.find((arg) => !arg.startsWith("--"));
  
  if (!fileArg) {
    console.error("❌ Error: No file specified");
    console.log("\nUsage:");
    console.log("  node src/scripts/validateFirebaseExport.js <file.json>");
    console.log("  node src/scripts/validateFirebaseExport.js firebase-data.json --export=report.json");
    console.log("\nExample:");
    console.log("  node src/scripts/validateFirebaseExport.js identifiable_full_sessions_admin_export.json");
    process.exit(1);
  }

  const filepath = path.resolve(process.cwd(), fileArg);

  // Check if file exists
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Error: File not found: ${filepath}`);
    console.log("\nMake sure you:");
    console.log("1. Exported data from admin panel (/admin/data)");
    console.log("2. Saved the file in the project root");
    console.log("3. Specified the correct filename");
    process.exit(1);
  }

  console.log(`Reading file: ${filepath}\n`);

  // Load and parse JSON
  let data;
  try {
    const fileContent = fs.readFileSync(filepath, "utf8");
    const parsed = JSON.parse(fileContent);
    
    // Handle different export formats
    if (parsed.data) {
      // Admin export format: { data: { sessions: [], taskTrials: [], ... } }
      data = parsed.data;
      console.log("✓ Detected admin export format");
    } else if (parsed.sessions || parsed.taskTrials) {
      // Direct format: { sessions: [], taskTrials: [], ... }
      data = parsed;
      console.log("✓ Detected direct export format");
    } else {
      console.error("❌ Error: Unrecognized data format");
      console.log("\nExpected format:");
      console.log("{ data: { sessions: [], taskTrials: [], ... } }");
      console.log("or");
      console.log("{ sessions: [], taskTrials: [], ... }");
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    process.exit(1);
  }

  console.log("\nValidating data...\n");

  // Run validation
  const report = validateDataset(data);

  // Generate summary
  const summary = generateValidationSummary(report);
  console.log(summary);

  // Check for export flag
  const exportArg = args.find((arg) => arg.startsWith("--export"));
  if (exportArg) {
    const filename = exportArg.split("=")[1] || "validation-report.json";
    const exportPath = path.resolve(process.cwd(), filename);
    
    try {
      fs.writeFileSync(exportPath, JSON.stringify(report, null, 2));
      console.log(`\n✓ Full report exported to: ${exportPath}`);
    } catch (error) {
      console.error(`\n✗ Error exporting report:`, error.message);
    }
  }

  // Exit with appropriate code
  if (report.summary.hasCriticalErrors) {
    console.log("\n❌ VALIDATION FAILED - Critical errors found");
    process.exit(1);
  } else if (report.summary.validationScore < 95) {
    console.log("\n⚠️  VALIDATION WARNING - Score below 95%");
    process.exit(0);
  } else {
    console.log("\n✅ VALIDATION PASSED - Data is production ready");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

// Made with Bob
