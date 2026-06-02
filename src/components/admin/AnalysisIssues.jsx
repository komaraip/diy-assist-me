import { ChevronDown, TriangleAlert } from "lucide-react";
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
    <section className="admin-panel analysis-panel analysis-issues-panel" aria-labelledby="analysis-issues-heading">
      <div className="admin-panel-heading">
        <div>
          <h2 id="analysis-issues-heading">Issues</h2>
        </div>
        <TriangleAlert aria-hidden="true" />
      </div>

      <div className="analysis-issue-grid analysis-accordion-list">
        {cards.map((card) => (
          <details key={card.id} className={`analysis-issue-card analysis-accordion-card ${card.severity}`} open={card.count > 0}>
            <summary className="analysis-accordion-summary">
              <span className="analysis-summary-text">
                <small className="analysis-issue-eyebrow">{humanizeAnalysisText(card.eyebrow)}</small>
                <strong>{humanizeAnalysisText(card.title)}</strong>
                <em>{formatAnalysisLabel(card.severity)}</em>
              </span>
              <strong aria-label={`${card.count} issue count`} className="analysis-count-pill">{card.count}</strong>
              <ChevronDown aria-hidden="true" />
            </summary>

            <div className="analysis-issue-section">
              <span>Summary</span>
              <ul className="analysis-bullet-list">
                {splitAnalysisDetail(card.summary).map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>

            <div className="analysis-issue-section">
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
            </div>

            <div className="analysis-issue-action">
              <span>Recommended action</span>
              <ul className="analysis-bullet-list">
                {splitAnalysisDetail(card.action).map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
