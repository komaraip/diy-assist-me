import { TriangleAlert } from "lucide-react";
import { buildAnalysisIssueCards } from "../../utils/chapter4Metrics.js";

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

      <div className="analysis-issue-grid">
        {cards.map((card) => (
          <article key={card.id} className={`analysis-issue-card ${card.severity}`}>
            <div className="analysis-issue-card-head">
              <div>
                <span className="analysis-issue-eyebrow">{card.eyebrow}</span>
                <h3>{card.title}</h3>
              </div>
              <strong aria-label={`${card.count} issue count`}>{card.count}</strong>
            </div>

            <div className="analysis-issue-section">
              <span>Summary</span>
              <p>{card.summary}</p>
            </div>

            <div className="analysis-issue-section">
              <span>Where it happens</span>
              {card.details.length ? (
                <ul>
                  {card.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : (
                <p className="analysis-issue-clear">No current issue in this category.</p>
              )}
            </div>

            <div className="analysis-issue-action">
              <span>Recommended action</span>
              <p>{card.action}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
