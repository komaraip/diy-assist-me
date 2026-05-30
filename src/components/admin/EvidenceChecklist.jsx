import { CheckCircle2, CircleAlert, ClipboardCheck } from "lucide-react";
import { buildEvidenceChecklist } from "../../utils/chapter4Metrics.js";

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

      <ul className="evidence-list">
        {items.map((item) => (
          <li key={item.id} className={item.complete ? "complete" : "missing"}>
            <span className="evidence-icon" aria-hidden="true">
              {item.complete ? <CheckCircle2 /> : <CircleAlert />}
            </span>
            <div className="evidence-content">
              <div className="evidence-title-row">
                <strong>{item.id}: {item.label}</strong>
                <span>{item.statusLabel || (item.complete ? "Evidence available" : "Evidence missing or incomplete")}</span>
              </div>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
