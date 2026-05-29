import { normalizeTutorial } from "../../utils/normalizeTutorial.js";
import { prepareTutorialForSave } from "../../utils/validateTutorial.js";

export function TutorialPreview({ draft }) {
  const prepared = prepareTutorialForSave(draft);
  const preview = normalizeTutorial(prepared);

  return (
    <section className="admin-form-section tutorial-preview" aria-labelledby="tutorial-preview-heading">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Preview</p>
          <h2 id="tutorial-preview-heading">Tutorial preview</h2>
        </div>
      </div>
      <div className="tutorial-preview-card">
        {preview.thumbnailUrl ? (
          <img src={preview.thumbnailUrl} alt="" className="tutorial-card-image" />
        ) : null}
        <span>{preview.category}</span>
        <span>{formatStudyRole(preview.studyRole)}{preview.guidedSessionPriority ? " · Guided session priority" : ""}</span>
        <h3>{preview.title}</h3>
        <p>{preview.description}</p>
        {preview.selectionRationale ? <p>{preview.selectionRationale}</p> : null}
        <dl className="tutorial-preview-meta">
          <div>
            <dt>Materials</dt>
            <dd>{preview.materials.length}</dd>
          </div>
          <div>
            <dt>Steps</dt>
            <dd>{preview.steps.length}</dd>
          </div>
          <div>
            <dt>Estimated time</dt>
            <dd>{preview.estimatedMinutes} min</dd>
          </div>
        </dl>
        <ol className="tutorial-preview-steps">
          {preview.steps.slice(0, 5).map((step) => (
            <li key={step.stepNumber}>{step.instruction}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function formatStudyRole(value) {
  if (value === "core_practice") return "Core practice";
  if (value === "core_measured") return "Core measured";
  return "Catalog";
}
