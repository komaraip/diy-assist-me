/**
 * Data Validation Script (Node.js Compatible)
 * Run this script to validate research data integrity without Vite
 * 
 * Usage:
 *   node src/scripts/validateDataNode.js
 *   node src/scripts/validateDataNode.js --export report.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
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

// Field validators
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
 * Load data from localStorage file
 */
function loadDataFromLocal() {
  console.log("Loading data from local storage...");
  const data = {};
  
  const collections = [
    "sessions",
    "taskTrials",
    "interactionLogs",
    "susResponses",
    "observerNotes",
    "debriefResponses",
  ];

  // Try to read from localStorage file (browser localStorage dump)
  const localStoragePath = path.resolve(process.cwd(), "localStorage.json");
  
  if (fs.existsSync(localStoragePath)) {
    try {
      const localStorageData = JSON.parse(fs.readFileSync(localStoragePath, "utf8"));
      
      for (const collectionName of collections) {
        const key = `diy-assist-me:${collectionName}`;
        if (localStorageData[key]) {
          data[collectionName] = JSON.parse(localStorageData[key]);
          console.log(`  ✓ Loaded ${data[collectionName].length} records from ${collectionName}`);
        } else {
          data[collectionName] = [];
          console.log(`  ⚠ No data found for ${collectionName}`);
        }
      }
    } catch (error) {
      console.error("  ✗ Error reading localStorage.json:", error.message);
      for (const collectionName of collections) {
        data[collectionName] = [];
      }
    }
  } else {
    console.log("  ⚠ localStorage.json not found. Using empty dataset.");
    console.log("  ℹ To validate data, export localStorage to localStorage.json first.");
    for (const collectionName of collections) {
      data[collectionName] = [];
    }
  }

  return data;
}

/**
 * Validate a single record
 */
function validateRecord(record, collectionName) {
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
 * Validate complete dataset
 */
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

      // Collect critical errors
      if (validation.errors.length > 0) {
        report.criticalErrors.push(
          ...validation.errors.map((e) => `${collectionName}/${record.id}: ${e}`)
        );
      }

      // Collect warnings
      if (validation.warnings.length > 0) {
        report.warnings.push(
          ...validation.warnings.map((w) => `${collectionName}/${record.id}: ${w}`)
        );
      }
    }

    report.collections[collectionName] = collectionReport;
  }

  // Calculate validation score
  report.summary.validationScore =
    report.summary.totalRecords > 0
      ? Math.round((report.summary.validRecords / report.summary.totalRecords) * 100)
      : 100; // 100% if no records (empty is valid)

  report.summary.hasCriticalErrors = report.criticalErrors.length > 0;
  report.summary.isProductionReady = report.criticalErrors.length === 0 && report.summary.validationScore >= 95;

  return report;
}

/**
 * Generate validation summary
 */
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

/**
 * Main function
 */
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("DATA VALIDATION SCRIPT (Node.js)");
  console.log("=".repeat(60) + "\n");

  console.log("Data Source: Local Storage (localStorage.json)\n");

  // Load data
  let data;
  try {
    data = loadDataFromLocal();
  } catch (error) {
    console.error("Error loading data:", error);
    process.exit(1);
  }

  console.log("\nValidating data...\n");

  // Run validation
  const report = validateDataset(data);

  // Generate summary
  const summary = generateValidationSummary(report);
  console.log(summary);

  // Check for export flag
  const exportArg = process.argv.find((arg) => arg.startsWith("--export"));
  if (exportArg) {
    const filename = exportArg.split("=")[1] || "validation-report.json";
    const filepath = path.resolve(process.cwd(), filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n✓ Full report exported to: ${filepath}`);
    } catch (error) {
      console.error(`\n✗ Error exporting report:`, error.message);
    }
  }

  // Instructions for getting data
  if (report.summary.totalRecords === 0) {
    console.log("\n" + "=".repeat(60));
    console.log("HOW TO VALIDATE YOUR DATA");
    console.log("=".repeat(60));
    console.log("\n1. Open your app in browser");
    console.log("2. Open DevTools Console (F12)");
    console.log("3. Run this command:");
    console.log("\n   const data = {};");
    console.log("   ['sessions', 'taskTrials', 'interactionLogs', 'susResponses', 'observerNotes', 'debriefResponses'].forEach(key => {");
    console.log("     data[`diy-assist-me:${key}`] = localStorage.getItem(`diy-assist-me:${key}`);");
    console.log("   });");
    console.log("   console.log(JSON.stringify(data, null, 2));");
    console.log("\n4. Copy the output and save as localStorage.json");
    console.log("5. Run this script again\n");
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

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

// Made with Bob
