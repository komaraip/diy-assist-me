import { BarChart3 } from "lucide-react";
import { calculateChapter4Metrics } from "../../utils/chapter4Metrics.js";

export function MetricsSummary({ adminData }) {
  const metrics = calculateChapter4Metrics(adminData);

  return (
    <section className="admin-panel" aria-labelledby="metrics-summary-heading">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Chapter 4 metrics</p>
          <h2 id="metrics-summary-heading">Summary metrics</h2>
        </div>
        <BarChart3 aria-hidden="true" />
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="RQ1 valid measured trials"
          value={metrics.rq1TaskCompletionTime.validMeasuredTrialCount}
          detail={`${metrics.rq1TaskCompletionTime.invalidTrialCount} invalid trials`}
        />
        <MetricCard
          label="RQ2 SUS responses"
          value={metrics.rq2SusUsability.responseCount}
          detail={formatSusDetail(metrics.rq2SusUsability.byModality)}
        />
        <MetricCard
          label="RQ3 voice logs"
          value={metrics.rq3VoiceReliability.voiceLogCount}
          detail={`Success rate: ${formatPercent(metrics.rq3VoiceReliability.successRate)}`}
        />
        <MetricCard
          label="RQ4 usability evidence"
          value={metrics.rq4UsabilityProblems.observerNoteCount + metrics.rq4UsabilityProblems.debriefResponseCount}
          detail={`${metrics.rq4UsabilityProblems.failedCommandCount} failed commands, ${metrics.rq4UsabilityProblems.fallbackUseCount} fallbacks`}
        />
      </div>
    </section>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
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
