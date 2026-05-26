import { BarChart3 } from "lucide-react";
import { calculateChapter4Metrics } from "../../utils/chapter4Metrics.js";

export function MetricsSummary({ adminData }) {
  const metrics = calculateChapter4Metrics(adminData);
  const rq1 = metrics.researchQuestions.RQ1.metrics;
  const rq2 = metrics.researchQuestions.RQ2.metrics;
  const rq3 = metrics.researchQuestions.RQ3.metrics;

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
          label="RQ1 valid paired rows"
          value={rq1.pairedDifferences.validPairCount}
          detail={`${rq1.pairedDifferences.invalidPairCount} invalid or incomplete pairs`}
        />
        <MetricCard
          label="RQ1 SUS responses"
          value={Object.values(rq1.susByModality).reduce((total, summary) => total + summary.count, 0)}
          detail={formatSusDetail(rq1.susByModality)}
        />
        <MetricCard
          label="RQ2 voice command logs"
          value={rq2.commandSuccessRate.count}
          detail={`Success rate: ${formatPercent(rq2.commandSuccessRate.rate)}`}
        />
        <MetricCard
          label="RQ3 usability evidence"
          value={rq3.observerNoteCategories.count + rq3.debriefThemes.responseCount}
          detail={`${rq3.failedCommandExamples.length} failed command examples, ${rq3.fallbackUseCount} fallbacks`}
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
