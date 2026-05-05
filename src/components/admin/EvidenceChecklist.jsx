import { CheckCircle2, CircleAlert } from "lucide-react";
import { buildEvidenceChecklist } from "../../utils/chapter4Metrics.js";

export function EvidenceChecklist({ adminData }) {
  const items = buildEvidenceChecklist(adminData);

  return (
    <section className="admin-panel" aria-labelledby="evidence-checklist-heading">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Chapter 4 evidence</p>
          <h2 id="evidence-checklist-heading">Evidence checklist</h2>
        </div>
      </div>

      <ul className="evidence-list">
        {items.map((item) => (
          <li key={item.id} className={item.complete ? "complete" : "missing"}>
            {item.complete ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
            <div>
              <strong>{item.id}: {item.label}</strong>
              <span>{item.complete ? "Evidence available" : "Evidence missing or incomplete"}</span>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
