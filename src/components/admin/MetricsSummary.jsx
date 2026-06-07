import { BarChart3, CheckCircle2, ChevronDown, CircleAlert, Info } from "lucide-react";
import { calculateChapter4Metrics } from "../../utils/chapter4Metrics.js";
import { formatAnalysisLabel, humanizeAnalysisText } from "../../utils/analysisDisplay.js";

export function MetricsSummary({ adminData }) {
  const metrics = calculateChapter4Metrics(adminData);
  const rq1 = metrics.researchQuestions.RQ1.metrics;
  const rq2 = metrics.researchQuestions.RQ2.metrics;
  const rq3 = metrics.researchQuestions.RQ3.metrics;
  const dataQuality = metrics.dataQuality;
  const cards = [
    {
      label: "RQ1 valid paired rows",
      value: rq1.pairedDifferences.validPairCount,
      status: rq1.pairedDifferences.invalidPairCount ? "Needs review" : "Ready",
      tone: rq1.pairedDifferences.invalidPairCount ? "warning" : "ok",
      details: [
        `Valid paired rows: ${rq1.pairedDifferences.validPairCount}`,
        `Invalid or incomplete pairs: ${rq1.pairedDifferences.invalidPairCount}`,
      ],
    },
    {
      label: "RQ1 unique SUS responses",
      value: Object.values(rq1.susByModality).reduce((total, summary) => total + summary.count, 0),
      status: "Per modality",
      tone: "neutral",
      details: formatSusDetails(rq1.susByModality),
    },
    {
      label: "RQ2 voice command logs",
      value: rq2.commandSuccessRate.count,
      status: `Success rate: ${formatPercent(rq2.commandSuccessRate.rate)}`,
      tone: "neutral",
      details: [
        `Voice command logs: ${rq2.commandSuccessRate.count}`,
        `Successful commands: ${rq2.commandSuccessRate.positiveCount ?? 0}`,
        `Success rate: ${formatPercent(rq2.commandSuccessRate.rate)}`,
      ],
    },
    {
      label: "RQ3 usability evidence",
      value: rq3.observerNoteCategories.count + rq3.debriefThemes.responseCount,
      status: rq3.observerNoteCategories.count + rq3.debriefThemes.responseCount ? "Evidence available" : "Needs evidence",
      tone: rq3.observerNoteCategories.count + rq3.debriefThemes.responseCount ? "ok" : "warning",
      details: [
        `Observer notes: ${rq3.observerNoteCategories.count}`,
        `Core-complete debrief responses: ${rq3.debriefThemes.responseCount}`,
        `Failed command examples: ${rq3.failedCommandExamples.length}`,
      ],
    },
    {
      label: "Data validity warnings",
      value: (dataQuality.validationWarningCount || 0) + (dataQuality.environmentWarningCount || 0),
      status: (dataQuality.validationWarningCount || 0) + (dataQuality.environmentWarningCount || 0) ? "Needs review" : "Ready",
      tone: (dataQuality.validationWarningCount || 0) + (dataQuality.environmentWarningCount || 0) ? "danger" : "ok",
      details: getValidationDetails(dataQuality),
    },
  ];

  return (
    <details className="admin-panel analysis-panel analysis-panel-dropdown metrics-summary-panel" aria-labelledby="metrics-summary-heading">
      <summary className="admin-panel-heading analysis-panel-summary">
        <div>
          <h2 id="metrics-summary-heading"><BarChart3 aria-hidden="true" /> Metrics</h2>
        </div>
        <ChevronDown className="analysis-panel-chevron" aria-hidden="true" />
      </summary>

      <div className="metrics-grid analysis-accordion-grid">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
    </details>
  );
}

function MetricCard({ label, value, status, details, tone = "neutral" }) {
  return (
    <details className={`metric-card analysis-accordion-card ${tone}`}>
      <summary className="analysis-accordion-summary">
        <span className="evidence-icon" aria-hidden="true">
          {getMetricIcon(tone)}
        </span>
        <span className="analysis-summary-text metric-summary-text">
          <small>{label}</small>
          <em>{humanizeAnalysisText(status)}</em>
        </span>
        <strong className="analysis-count-pill">{value}</strong>
        <ChevronDown className="analysis-chevron" aria-hidden="true" />
      </summary>
      <div className="analysis-detail-content">
        <ul className="analysis-bullet-list">
          {(details.length ? details : ["No detail available"]).map((detail) => (
            <li key={detail}>{humanizeAnalysisText(detail)}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function getMetricIcon(tone) {
  if (tone === "ok") return <CheckCircle2 />;
  if (tone === "warning" || tone === "danger") return <CircleAlert />;
  return <Info />;
}

function formatPercent(value) {
  if (value === null || value === undefined) return "n/a";
  return `${Math.round(value * 100)}%`;
}

function formatSusDetails(byModality) {
  const entries = Object.entries(byModality || {});
  if (!entries.length) return ["No SUS scores yet"];
  return entries.map(([modality, summary]) =>
    `${formatAnalysisLabel(modality)}: ${summary.averageSusScore ?? "n/a"} average from ${summary.count} unique response${summary.count === 1 ? "" : "s"}`,
  );
}

function getValidationDetails(dataQuality) {
  const firstMissingAction = dataQuality.requiredActionWarnings?.[0];
  const firstVoiceWarning = dataQuality.invalidVoiceTrialWarnings?.[0];
  const firstEnvironmentWarning = dataQuality.environmentWarnings?.[0];
  const details = [
    `Voice validity warnings: ${dataQuality.invalidVoiceTrialCount}`,
    `Required action coverage warnings: ${dataQuality.requiredActionWarningCount}`,
    `Environment warnings: ${dataQuality.environmentWarningCount || 0}`,
  ];

  if (firstMissingAction) {
    details.push(`First missing action: ${firstMissingAction.missingRequiredActions.map(formatAnalysisLabel).join(" | ")} in ${formatAnalysisLabel(firstMissingAction.taskId)}`);
  }

  if (firstVoiceWarning) {
    details.push(`First voice warning: ${formatAnalysisLabel(firstVoiceWarning.taskId)} is ${formatAnalysisLabel(firstVoiceWarning.voiceTrialValidity)}`);
  }

  if (firstEnvironmentWarning) {
    details.push(`First environment warning: ${humanizeAnalysisText(firstEnvironmentWarning.message)}`);
  }

  details.push("See issue cards below for location and fix guidance.");
  return details;
}
