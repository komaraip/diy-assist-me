import { CheckCircle2, ChevronDown, CircleAlert, Info, Lightbulb } from "lucide-react";
import { buildAnalysisIssueCards, calculateChapter4Metrics } from "../../utils/chapter4Metrics.js";
import { humanizeAnalysisText } from "../../utils/analysisDisplay.js";

export function AnalysisInterpretation({ adminData }) {
  const metrics = calculateChapter4Metrics(adminData);
  const issueCards = buildAnalysisIssueCards(adminData);
  const rq1 = metrics.researchQuestions.RQ1.metrics;
  const rq2 = metrics.researchQuestions.RQ2.metrics;
  const rq3 = metrics.researchQuestions.RQ3.metrics;
  const warningCount = issueCards.reduce((total, issue) => total + (issue.severity === "ok" ? 0 : issue.count || 0), 0);

  const items = [
    {
      label: "RQ1: Touch vs voice comparison",
      status: rq1.pairedDifferences.validPairCount ? "Ready to interpret" : "Needs paired data",
      tone: rq1.pairedDifferences.validPairCount ? "ok" : "warning",
      details: [
        `${rq1.pairedDifferences.validPairCount} valid paired row(s) are available for touch versus voice comparison.`,
        `${rq1.pairedDifferences.invalidPairCount} invalid or incomplete pair(s) should stay out of the main comparison.`,
        "Use SUS and task duration together, not as separate claims.",
      ],
    },
    {
      label: "RQ2: Voice reliability",
      status: rq2.commandSuccessRate.count ? "Diagnostic evidence available" : "Needs voice logs",
      tone: rq2.commandSuccessRate.count ? "ok" : "warning",
      details: [
        `${rq2.commandSuccessRate.count} voice command log(s) are available.`,
        `${Math.round((rq2.commandSuccessRate.rate || 0) * 100)}% command success rate can support reliability discussion.`,
        "Touch actions in voice mode should only be called recovery fallback when tied to a prior voice failure.",
      ],
    },
    {
      label: "RQ3: Usability interpretation",
      status: rq3.observerNoteCategories.count + rq3.debriefThemes.responseCount ? "Qualitative support available" : "Needs direct evidence",
      tone: rq3.observerNoteCategories.count + rq3.debriefThemes.responseCount ? "ok" : "warning",
      details: [
        `${rq3.observerNoteCategories.count} observer note(s) and ${rq3.debriefThemes.responseCount} debrief response(s) are available.`,
        `${rq3.failedCommandExamples.length} failed command example(s) can support command clarity discussion.`,
        "Use direct feedback first, then use failed commands as diagnostic examples.",
      ],
    },
    {
      label: "Data caution",
      status: warningCount ? "Review before writing" : "No major caution",
      tone: warningCount ? "info" : "ok",
      details: [
        `${warningCount} non-ok issue signal(s) are currently listed in the Issues panel.`,
        "Excluded sessions are already removed from analysis and export metrics.",
        "Keep admin corrections documented through notes or matching timestamps when they replace missed participant steps.",
      ],
    },
  ];

  return (
    <details className="admin-panel analysis-panel analysis-panel-dropdown analysis-interpretation-panel" aria-labelledby="analysis-interpretation-heading">
      <summary className="admin-panel-heading analysis-panel-summary">
        <div>
          <h2 id="analysis-interpretation-heading"><Lightbulb aria-hidden="true" /> Interpretation</h2>
        </div>
        <ChevronDown className="analysis-panel-chevron" aria-hidden="true" />
      </summary>

      <div className="analysis-accordion-list">
        {items.map((item) => (
          <details key={item.label} className={`analysis-accordion-card ${item.tone}`}>
            <summary className="analysis-accordion-summary interpretation-summary">
              <span className="evidence-icon" aria-hidden="true">
                {getInterpretationIcon(item.tone)}
              </span>
              <span className="analysis-summary-text">
                <small>{humanizeAnalysisText(item.label)}</small>
                <em>{humanizeAnalysisText(item.status)}</em>
              </span>
              <ChevronDown className="analysis-chevron" aria-hidden="true" />
            </summary>
            <div className="analysis-detail-content">
              <ul className="analysis-bullet-list">
                {item.details.map((detail) => (
                  <li key={detail}>{humanizeAnalysisText(detail)}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}

function getInterpretationIcon(tone) {
  if (tone === "ok") return <CheckCircle2 />;
  if (tone === "warning" || tone === "danger") return <CircleAlert />;
  return <Info />;
}
