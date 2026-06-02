import { CheckCircle2, ChevronDown, CircleAlert, ClipboardCheck } from "lucide-react";
import { buildEvidenceChecklist } from "../../utils/chapter4Metrics.js";
import { humanizeAnalysisText, splitAnalysisDetail } from "../../utils/analysisDisplay.js";

export function EvidenceChecklist({ adminData }) {
  const items = buildEvidenceChecklist(adminData);

  return (
    <section className="admin-panel analysis-panel evidence-checklist-panel" aria-labelledby="evidence-checklist-heading">
      <div className="admin-panel-heading">
        <div>
          <h2 id="evidence-checklist-heading">Evidence</h2>
        </div>
        <ClipboardCheck aria-hidden="true" />
      </div>

      <div className="evidence-list analysis-accordion-list">
        {items.map((item) => (
          <details key={item.id} className={item.complete ? "analysis-evidence-card complete" : "analysis-evidence-card missing"} open>
            <summary className="analysis-accordion-summary">
              <span className="evidence-icon" aria-hidden="true">
                {item.complete ? <CheckCircle2 /> : <CircleAlert />}
              </span>
              <span className="analysis-summary-text">
                <small>{item.id}: {humanizeAnalysisText(item.label)}</small>
                <em>{humanizeAnalysisText(item.statusLabel || (item.complete ? "Evidence available" : "Evidence missing or incomplete"))}</em>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <ul className="analysis-bullet-list">
              {splitAnalysisDetail(item.detail).map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
