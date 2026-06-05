/**
 * Data Validation Script
 * Run this script to validate research data integrity
 * 
 * Usage:
 *   node src/scripts/validateData.js
 *   node src/scripts/validateData.js --export report.json
 */

import { validateDataset, generateValidationSummary } from "../utils/dataValidation.js";
import { listLocalRecords } from "../services/localStore.js";
import { getDocs, collection } from "firebase/firestore";
import { db, isFirebaseEnabled } from "../services/firebase.js";
import fs from "fs";
import path from "path";

async function loadDataFromFirebase() {
  console.log("Loading data from Firebase...");
  const data = {};

  const collections = [
    "sessions",
    "taskTrials",
    "interactionLogs",
    "susResponses",
    "observerNotes",
    "debriefResponses",
  ];

  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      data[collectionName] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log(`  ✓ Loaded ${data[collectionName].length} records from ${collectionName}`);
    } catch (error) {
      console.error(`  ✗ Error loading ${collectionName}:`, error.message);
      data[collectionName] = [];
    }
  }

  return data;
}

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

  for (const collectionName of collections) {
    const result = listLocalRecords(collectionName);
    data[collectionName] = result.data || [];
    console.log(`  ✓ Loaded ${data[collectionName].length} records from ${collectionName}`);
  }

  return data;
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("DATA VALIDATION SCRIPT");
  console.log("=".repeat(60) + "\n");

  // Determine data source
  const useFirebase = isFirebaseEnabled && db;
  console.log(`Data Source: ${useFirebase ? "Firebase" : "Local Storage"}\n`);

  // Load data
  let data;
  try {
    data = useFirebase ? await loadDataFromFirebase() : loadDataFromLocal();
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { main as validateData };

// Made with Bob
