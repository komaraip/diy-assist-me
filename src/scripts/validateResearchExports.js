/**
 * Research Export Validation Script
 * Validates 9 export files against research paper methodology requirements
 * 
 * Based on: docs/research_paper.txt
 * Research Design: Within-subject, AB/BA counterbalanced, 24 participants
 * 
 * Usage:
 *   node src/scripts/validateResearchExports.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Research paper requirements
const RESEARCH_REQUIREMENTS = {
  targetParticipants: 24,
  counterbalancing: ['AB', 'BA'],
  modalities: ['touch', 'voice'],
  trialTypes: ['practice', 'measured'],
  susItems: 10,
  susScoreRange: [0, 100],
  ageRange: [18, 35],
  requiredMetrics: {
    taskCompletionTime: true,
    taskSuccess: true,
    sus: true,
    recognitionAccuracy: true,
    commandSuccessRate: true,
    recoveryEffort: true
  }
};

// Export file definitions
const EXPORT_FILES = {
  chapter4_analysis_ready_dataset: {
    path: 'docs/export/chapter4_analysis_ready_dataset.csv',
    type: 'csv',
    required: true,
    description: 'Analysis-ready dataset for Chapter 4 statistical tests'
  },
  chapter4_summary_metrics: {
    path: 'docs/export/chapter4_summary_metrics.json',
    type: 'json',
    required: true,
    description: 'Summary metrics for RQ1, RQ2, RQ3'
  },
  debrief_responses: {
    path: 'docs/export/debrief_responses_export.csv',
    type: 'csv',
    required: true,
    description: 'Debrief responses for qualitative analysis'
  },
  identifiable_full_sessions: {
    path: 'docs/export/identifiable_full_sessions_admin_export.json',
    type: 'json',
    required: true,
    description: 'Complete session data with identifiable information'
  },
  observer_notes: {
    path: 'docs/export/observer_notes_export.csv',
    type: 'csv',
    required: true,
    description: 'Observer notes for RQ3 usability problems'
  },
  sus_responses: {
    path: 'docs/export/sus_responses_export.csv',
    type: 'csv',
    required: true,
    description: 'SUS responses for perceived usability (RQ1)'
  },
  task_trials: {
    path: 'docs/export/task_trials_export.csv',
    type: 'csv',
    required: true,
    description: 'Task trial data for performance metrics (RQ1)'
  },
  touch_logs: {
    path: 'docs/export/touch_logs_export.csv',
    type: 'csv',
    required: true,
    description: 'Touch interaction logs'
  },
  voice_logs: {
    path: 'docs/export/voice_logs_export.csv',
    type: 'csv',
    required: true,
    description: 'Voice interaction logs for RQ2 reliability metrics'
  }
};

const validationReport = {
  timestamp: new Date().toISOString(),
  researchPaperCompliance: true,
  files: {},
  researchDesign: {},
  metrics: {},
  issues: [],
  warnings: [],
  summary: {}
};

/**
 * Check if file exists
 */
function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

/**
 * Read CSV file
 */
function readCSV(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    return row;
  });
  
  return { headers, rows };
}

/**
 * Read JSON file
 */
function readJSON(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Validate file existence
 */
function validateFileExistence() {
  console.log('\n=== Validating File Existence ===\n');
  
  let allFilesExist = true;
  
  for (const [key, fileInfo] of Object.entries(EXPORT_FILES)) {
    const exists = checkFileExists(fileInfo.path);
    
    validationReport.files[key] = {
      path: fileInfo.path,
      exists,
      type: fileInfo.type,
      description: fileInfo.description,
      required: fileInfo.required
    };
    
    if (!exists && fileInfo.required) {
      allFilesExist = false;
      validationReport.issues.push({
        severity: 'critical',
        file: key,
        message: `Required file missing: ${fileInfo.path}`
      });
      console.log(`❌ ${key}: MISSING`);
    } else if (exists) {
      console.log(`✓ ${key}: Found`);
    }
  }
  
  return allFilesExist;
}

/**
 * Validate research design compliance
 */
function validateResearchDesign() {
  console.log('\n=== Validating Research Design Compliance ===\n');
  
  try {
    // Read sessions data
    const sessionsData = readJSON(EXPORT_FILES.identifiable_full_sessions.path);
    const sessions = sessionsData.sessions || [];
    
    // Check participant count
    const participantCount = sessions.length;
    validationReport.researchDesign.participantCount = participantCount;
    validationReport.researchDesign.targetParticipants = RESEARCH_REQUIREMENTS.targetParticipants;
    
    if (participantCount < RESEARCH_REQUIREMENTS.targetParticipants) {
      validationReport.warnings.push({
        severity: 'warning',
        category: 'research_design',
        message: `Only ${participantCount} of ${RESEARCH_REQUIREMENTS.targetParticipants} target participants collected`
      });
      console.log(`⚠️  Participant count: ${participantCount}/${RESEARCH_REQUIREMENTS.targetParticipants}`);
    } else {
      console.log(`✓ Participant count: ${participantCount}/${RESEARCH_REQUIREMENTS.targetParticipants}`);
    }
    
    // Check counterbalancing
    const sequences = sessions.map(s => s.sequenceAssignment).filter(Boolean);
    const abCount = sequences.filter(s => s === 'AB').length;
    const baCount = sequences.filter(s => s === 'BA').length;
    
    validationReport.researchDesign.counterbalancing = {
      AB: abCount,
      BA: baCount,
      balanced: Math.abs(abCount - baCount) <= 1
    };
    
    if (Math.abs(abCount - baCount) > 1) {
      validationReport.warnings.push({
        severity: 'warning',
        category: 'counterbalancing',
        message: `Unbalanced counterbalancing: AB=${abCount}, BA=${baCount}`
      });
      console.log(`⚠️  Counterbalancing: AB=${abCount}, BA=${baCount} (unbalanced)`);
    } else {
      console.log(`✓ Counterbalancing: AB=${abCount}, BA=${baCount} (balanced)`);
    }
    
    // Check modalities
    const { rows: taskTrials } = readCSV(EXPORT_FILES.task_trials.path);
    const modalities = [...new Set(taskTrials.map(t => t.modality))];
    const hasTouch = modalities.includes('touch');
    const hasVoice = modalities.includes('voice');
    
    validationReport.researchDesign.modalities = {
      found: modalities,
      hasTouch,
      hasVoice,
      complete: hasTouch && hasVoice
    };
    
    if (!hasTouch || !hasVoice) {
      validationReport.issues.push({
        severity: 'critical',
        category: 'modalities',
        message: `Missing modality data: touch=${hasTouch}, voice=${hasVoice}`
      });
      console.log(`❌ Modalities: touch=${hasTouch}, voice=${hasVoice}`);
    } else {
      console.log(`✓ Modalities: Both touch and voice present`);
    }
    
    // Check age range
    const ages = sessions.map(s => parseInt(s.age)).filter(a => !isNaN(a));
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    
    validationReport.researchDesign.ageRange = {
      min: minAge,
      max: maxAge,
      target: RESEARCH_REQUIREMENTS.ageRange,
      compliant: minAge >= RESEARCH_REQUIREMENTS.ageRange[0] && maxAge <= RESEARCH_REQUIREMENTS.ageRange[1]
    };
    
    if (minAge < RESEARCH_REQUIREMENTS.ageRange[0] || maxAge > RESEARCH_REQUIREMENTS.ageRange[1]) {
      validationReport.warnings.push({
        severity: 'warning',
        category: 'age_range',
        message: `Age range ${minAge}-${maxAge} outside target ${RESEARCH_REQUIREMENTS.ageRange[0]}-${RESEARCH_REQUIREMENTS.ageRange[1]}`
      });
      console.log(`⚠️  Age range: ${minAge}-${maxAge} (outside target)`);
    } else {
      console.log(`✓ Age range: ${minAge}-${maxAge} (within target)`);
    }
    
  } catch (error) {
    validationReport.issues.push({
      severity: 'critical',
      category: 'research_design',
      message: `Error validating research design: ${error.message}`
    });
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Validate RQ1 metrics (Task Performance and Perceived Usability)
 */
function validateRQ1Metrics() {
  console.log('\n=== Validating RQ1 Metrics ===\n');
  
  try {
    const { rows: taskTrials } = readCSV(EXPORT_FILES.task_trials.path);
    const { rows: susResponses } = readCSV(EXPORT_FILES.sus_responses.path);
    
    // Task completion time
    const timesWithValues = taskTrials.filter(t => t.durationSeconds && !isNaN(parseFloat(t.durationSeconds)));
    const hasTaskTime = timesWithValues.length > 0;
    
    // Task success
    const successWithValues = taskTrials.filter(t => t.completionStatus);
    const hasTaskSuccess = successWithValues.length > 0;
    
    // SUS scores
    const susWithScores = susResponses.filter(s => s.sus_score && !isNaN(parseFloat(s.sus_score)));
    const hasSUS = susWithScores.length > 0;
    
    // Check SUS score range
    const susScores = susWithScores.map(s => parseFloat(s.sus_score));
    const minSUS = Math.min(...susScores);
    const maxSUS = Math.max(...susScores);
    const susInRange = minSUS >= RESEARCH_REQUIREMENTS.susScoreRange[0] && 
                       maxSUS <= RESEARCH_REQUIREMENTS.susScoreRange[1];
    
    validationReport.metrics.RQ1 = {
      taskCompletionTime: {
        present: hasTaskTime,
        count: timesWithValues.length,
        required: true
      },
      taskSuccess: {
        present: hasTaskSuccess,
        count: successWithValues.length,
        required: true
      },
      sus: {
        present: hasSUS,
        count: susWithScores.length,
        scoreRange: [minSUS, maxSUS],
        validRange: susInRange,
        required: true
      }
    };
    
    console.log(`${hasTaskTime ? '✓' : '❌'} Task completion time: ${timesWithValues.length} records`);
    console.log(`${hasTaskSuccess ? '✓' : '❌'} Task success: ${successWithValues.length} records`);
    console.log(`${hasSUS ? '✓' : '❌'} SUS scores: ${susWithScores.length} records`);
    console.log(`${susInRange ? '✓' : '⚠️ '} SUS range: ${minSUS}-${maxSUS} (target: 0-100)`);
    
    if (!hasTaskTime || !hasTaskSuccess || !hasSUS) {
      validationReport.issues.push({
        severity: 'critical',
        category: 'RQ1',
        message: 'Missing required RQ1 metrics'
      });
    }
    
  } catch (error) {
    validationReport.issues.push({
      severity: 'critical',
      category: 'RQ1',
      message: `Error validating RQ1 metrics: ${error.message}`
    });
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Validate RQ2 metrics (Voice Reliability)
 */
function validateRQ2Metrics() {
  console.log('\n=== Validating RQ2 Metrics ===\n');
  
  try {
    const { rows: voiceLogs } = readCSV(EXPORT_FILES.voice_logs.path);
    
    // Recognition accuracy
    const logsWithRecognition = voiceLogs.filter(log => log.recognized !== undefined);
    const hasRecognitionData = logsWithRecognition.length > 0;
    
    // Command success rate
    const logsWithSuccess = voiceLogs.filter(log => log.commandSuccess !== undefined);
    const hasCommandSuccess = logsWithSuccess.length > 0;
    
    // Recovery effort (fallback actions, repeated commands)
    const logsWithFallback = voiceLogs.filter(log => log.fallbackAction !== undefined);
    const hasRecoveryData = logsWithFallback.length > 0;
    
    validationReport.metrics.RQ2 = {
      recognitionAccuracy: {
        present: hasRecognitionData,
        count: logsWithRecognition.length,
        required: true
      },
      commandSuccessRate: {
        present: hasCommandSuccess,
        count: logsWithSuccess.length,
        required: true
      },
      recoveryEffort: {
        present: hasRecoveryData,
        count: logsWithFallback.length,
        required: true
      }
    };
    
    console.log(`${hasRecognitionData ? '✓' : '❌'} Recognition accuracy: ${logsWithRecognition.length} records`);
    console.log(`${hasCommandSuccess ? '✓' : '❌'} Command success rate: ${logsWithSuccess.length} records`);
    console.log(`${hasRecoveryData ? '✓' : '⚠️ '} Recovery effort: ${logsWithFallback.length} records`);
    
    if (!hasRecognitionData || !hasCommandSuccess) {
      validationReport.issues.push({
        severity: 'critical',
        category: 'RQ2',
        message: 'Missing required RQ2 voice reliability metrics'
      });
    }
    
  } catch (error) {
    validationReport.issues.push({
      severity: 'critical',
      category: 'RQ2',
      message: `Error validating RQ2 metrics: ${error.message}`
    });
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Validate RQ3 data (Usability Problems)
 */
function validateRQ3Data() {
  console.log('\n=== Validating RQ3 Data ===\n');
  
  try {
    const { rows: observerNotes } = readCSV(EXPORT_FILES.observer_notes.path);
    const { rows: debriefResponses } = readCSV(EXPORT_FILES.debrief_responses.path);
    
    const hasObserverNotes = observerNotes.length > 0;
    const hasDebriefResponses = debriefResponses.length > 0;
    
    validationReport.metrics.RQ3 = {
      observerNotes: {
        present: hasObserverNotes,
        count: observerNotes.length,
        required: true
      },
      debriefResponses: {
        present: hasDebriefResponses,
        count: debriefResponses.length,
        required: true
      }
    };
    
    console.log(`${hasObserverNotes ? '✓' : '❌'} Observer notes: ${observerNotes.length} records`);
    console.log(`${hasDebriefResponses ? '✓' : '❌'} Debrief responses: ${debriefResponses.length} records`);
    
    if (!hasObserverNotes || !hasDebriefResponses) {
      validationReport.issues.push({
        severity: 'critical',
        category: 'RQ3',
        message: 'Missing required RQ3 qualitative data'
      });
    }
    
  } catch (error) {
    validationReport.issues.push({
      severity: 'critical',
      category: 'RQ3',
      message: `Error validating RQ3 data: ${error.message}`
    });
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Validate Chapter 4 analysis readiness
 */
function validateChapter4Readiness() {
  console.log('\n=== Validating Chapter 4 Analysis Readiness ===\n');
  
  try {
    const analysisDataset = readCSV(EXPORT_FILES.chapter4_analysis_ready_dataset.path);
    const summaryMetrics = readJSON(EXPORT_FILES.chapter4_summary_metrics.path);
    
    // Check required columns for paired analysis
    const requiredColumns = [
      'participantCode',
      'sequenceAssignment',
      'touch_task_duration_seconds',
      'voice_task_duration_seconds',
      'touch_sus_score',
      'voice_sus_score'
    ];
    
    const missingColumns = requiredColumns.filter(col => !analysisDataset.headers.includes(col));
    
    validationReport.metrics.chapter4 = {
      analysisDatasetPresent: true,
      rowCount: analysisDataset.rows.length,
      requiredColumns: requiredColumns,
      missingColumns: missingColumns,
      summaryMetricsPresent: !!summaryMetrics,
      readyForAnalysis: missingColumns.length === 0
    };
    
    if (missingColumns.length > 0) {
      validationReport.issues.push({
        severity: 'critical',
        category: 'chapter4',
        message: `Missing required columns for paired analysis: ${missingColumns.join(', ')}`
      });
      console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
    } else {
      console.log(`✓ All required columns present`);
    }
    
    console.log(`✓ Analysis dataset: ${analysisDataset.rows.length} rows`);
    console.log(`✓ Summary metrics: Present`);
    
  } catch (error) {
    validationReport.issues.push({
      severity: 'critical',
      category: 'chapter4',
      message: `Error validating Chapter 4 readiness: ${error.message}`
    });
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Generate summary
 */
function generateSummary() {
  const criticalIssues = validationReport.issues.filter(i => i.severity === 'critical').length;
  const warnings = validationReport.warnings.length;
  
  validationReport.summary = {
    totalFiles: Object.keys(EXPORT_FILES).length,
    filesPresent: Object.values(validationReport.files).filter(f => f.exists).length,
    criticalIssues,
    warnings,
    researchPaperCompliant: criticalIssues === 0,
    readyForChapter4: criticalIssues === 0 && validationReport.metrics.chapter4?.readyForAnalysis
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files present: ${validationReport.summary.filesPresent}/${validationReport.summary.totalFiles}`);
  console.log(`Critical issues: ${criticalIssues}`);
  console.log(`Warnings: ${warnings}`);
  console.log(`Research paper compliant: ${validationReport.summary.researchPaperCompliant ? 'YES' : 'NO'}`);
  console.log(`Ready for Chapter 4: ${validationReport.summary.readyForChapter4 ? 'YES' : 'NO'}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Save validation report
 */
function saveReport() {
  const reportPath = path.join(process.cwd(), 'docs/export/validation_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2));
  console.log(`✓ Validation report saved: ${reportPath}\n`);
}

/**
 * Main validation function
 */
function main() {
  console.log('\n' + '='.repeat(60));
  console.log('RESEARCH EXPORT VALIDATION');
  console.log('Based on: docs/research_paper.txt');
  console.log('='.repeat(60));
  
  validateFileExistence();
  validateResearchDesign();
  validateRQ1Metrics();
  validateRQ2Metrics();
  validateRQ3Data();
  validateChapter4Readiness();
  generateSummary();
  saveReport();
  
  // Exit with error code if critical issues found
  if (validationReport.summary.criticalIssues > 0) {
    process.exit(1);
  }
}

main();

// Made with Bob
