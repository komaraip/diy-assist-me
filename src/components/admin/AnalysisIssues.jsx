import { CheckCircle2, ChevronDown, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { buildAnalysisIssueCards } from "../../utils/chapter4Metrics.js";
import {
  formatAnalysisLabel,
  formatAnalysisList,
  humanizeAnalysisText,
  splitAnalysisDetail,
} from "../../utils/analysisDisplay.js";

export function AnalysisIssues({ adminData }) {
  const cards = buildAnalysisIssueCards(adminData);

  return (
    <details className="admin-panel analysis-panel analysis-panel-dropdown analysis-issues-panel" aria-labelledby="analysis-issues-heading">
      <summary className="admin-panel-heading analysis-panel-summary">
        <div>
          <h2 id="analysis-issues-heading"><TriangleAlert aria-hidden="true" /> Issues</h2>
        </div>
        <ChevronDown className="analysis-panel-chevron" aria-hidden="true" />
      </summary>

      <div className="analysis-issue-grid analysis-accordion-list">
        {cards.map((card) => (
          <details key={card.id} className={`analysis-issue-card analysis-accordion-card ${card.severity}`}>
            <summary className="analysis-accordion-summary">
              <span className="evidence-icon" aria-hidden="true">
                {getIssueIcon(card.severity)}
              </span>
              <span className="analysis-summary-text issue-summary-text">
                <small>{humanizeAnalysisText(card.eyebrow)}: {humanizeAnalysisText(card.title)}</small>
                <em>{formatAnalysisLabel(card.severity)}</em>
              </span>
              <strong aria-label={`${card.count} issue count`} className="analysis-count-pill">{card.count}</strong>
              <ChevronDown className="analysis-chevron" aria-hidden="true" />
            </summary>

            <div className="analysis-detail-content">
              <section className="analysis-detail-section">
                <span>Summary</span>
                <ul className="analysis-bullet-list">
                  {splitAnalysisDetail(card.summary).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </section>

              <section className="analysis-detail-section">
                <span>Where it happens</span>
                {card.details.length ? (
                  <ul className="analysis-bullet-list analysis-trace-list">
                    {formatAnalysisList(card.details).map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="analysis-issue-clear">No current issue in this category.</p>
                )}
              </section>

              <section className="analysis-detail-section">
                <span>Recommended action</span>
                <ul className="analysis-bullet-list">
                  {splitAnalysisDetail(card.action).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </section>
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}

function getIssueIcon(severity) {
  if (severity === "ok") return <CheckCircle2 />;
  if (severity === "info") return <Info />;
  return <CircleAlert />;
}
