import { BarChart3 } from "lucide-react";
import { calculateChapter4Metrics } from "../../utils/chapter4Metrics.js";

export function MetricsSummary({ adminData }) {
  const metrics = calculateChapter4Metrics(adminData);
  const rq1 = metrics.researchQuestions.RQ1.metrics;
  const rq2 = metrics.researchQuestions.RQ2.metrics;
  const rq3 = metrics.researchQuestions.RQ3.metrics;
  const dataQuality = metrics.dataQuality;

  return (
    <section className="admin-panel analysis-panel metrics-summary-panel" aria-labelledby="metrics-summary-heading">
      <div className="admin-panel-heading">
        <div>
          <h2 id="metrics-summary-heading">Metrics</h2>
        </div>
        <BarChart3 aria-hidden="true" />
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="RQ1 valid paired rows"
          value={rq1.pairedDifferences.validPairCount}
          detail={`${rq1.pairedDifferences.invalidPairCount} invalid or incomplete pairs`}
          tone={rq1.pairedDifferences.invalidPairCount ? "warning" : "ok"}
        />
        <MetricCard
          label="RQ1 SUS responses"
          value={Object.values(rq1.susByModality).reduce((total, summary) => total + summary.count, 0)}
          detail={formatSusDetail(rq1.susByModality)}
          tone="neutral"
        />
        <MetricCard
          label="RQ2 voice command logs"
          value={rq2.commandSuccessRate.count}
          detail={`Success rate: ${formatPercent(rq2.commandSuccessRate.rate)}`}
          tone="neutral"
        />
        <MetricCard
          label="RQ3 usability evidence"
          value={rq3.observerNoteCategories.count + rq3.debriefThemes.responseCount}
          detail={`${rq3.observerNoteCategories.count} observer note(s), ${rq3.debriefThemes.responseCount} core-complete debrief; ${rq3.failedCommandExamples.length} failed command example(s) are diagnostic`}
          tone={rq3.observerNoteCategories.count + rq3.debriefThemes.responseCount ? "ok" : "warning"}
        />
        <MetricCard
          label="Data validity warnings"
          value={(dataQuality.validationWarningCount || 0) + (dataQuality.environmentWarningCount || 0)}
          detail={`${formatValidationDetail(dataQuality)}. See issue cards below for location and fix guidance.`}
          tone={(dataQuality.validationWarningCount || 0) + (dataQuality.environmentWarningCount || 0) ? "danger" : "ok"}
        />
      </div>
    </section>
  );
}

function MetricCard({ label, value, detail, tone = "neutral" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-card-topline">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <p>{detail}</p>
    </article>
  );
}

function formatPercent(value) {
  if (value === null || value === undefined) return "n/a";
  return `${Math.round(value * 100)}%`;
}

function formatSusDetail(byModality) {
  const entries = Object.entries(byModality || {});
  if (!entries.length) return "No SUS scores yet";
  return entries.map(([modality, summary]) => `${modality}: ${summary.averageSusScore ?? "n/a"}`).join(", ");
}

function formatValidationDetail(dataQuality) {
  const firstMissingAction = dataQuality.requiredActionWarnings?.[0];
  const firstVoiceWarning = dataQuality.invalidVoiceTrialWarnings?.[0];
  const firstEnvironmentWarning = dataQuality.environmentWarnings?.[0];
  const baseDetail = `${dataQuality.invalidVoiceTrialCount} voice validity, ${dataQuality.requiredActionWarningCount} required-action coverage, ${dataQuality.environmentWarningCount || 0} environment`;

  if (firstMissingAction) {
    return `${baseDetail}; missing ${firstMissingAction.missingRequiredActions.join(", ")} in ${firstMissingAction.taskId}`;
  }

  if (firstVoiceWarning) {
    return `${baseDetail}; ${firstVoiceWarning.taskId} is ${firstVoiceWarning.voiceTrialValidity}`;
  }

  if (firstEnvironmentWarning) {
    return `${baseDetail}; ${firstEnvironmentWarning.message}`;
  }

  return baseDetail;
}
