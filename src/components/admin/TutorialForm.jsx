import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";
import { TutorialPreview } from "./TutorialPreview.jsx";

export function TutorialForm({
  draft,
  errors,
  isCreate,
  isSaving,
  statusMessage,
  onChange,
  onCancel,
  onSubmit,
}) {
  function updateField(field, value) {
    onChange({ ...draft, [field]: value });
  }

  function updateArrayItem(field, index, patch) {
    const items = [...(draft[field] || [])];
    items[index] = { ...items[index], ...patch };
    updateField(field, items);
  }

  function updateStringArrayItem(field, index, value) {
    const items = [...(draft[field] || [])];
    items[index] = value;
    updateField(field, items);
  }

  function addItem(field, item) {
    updateField(field, [...(draft[field] || []), item]);
  }

  function removeItem(field, index) {
    const items = [...(draft[field] || [])];
    items.splice(index, 1);
    updateField(field, items.length ? items : getFallbackItem(field));
  }

  function moveStep(index, direction) {
    const steps = [...(draft.steps || [])];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= steps.length) return;
    [steps[index], steps[nextIndex]] = [steps[nextIndex], steps[index]];
    updateField("steps", steps.map((step, stepIndex) => ({ ...step, step_index: stepIndex + 1 })));
  }

  return (
    <form className="tutorial-admin-form" onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}>
      <section className="admin-form-section" aria-labelledby="tutorial-basic-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Tutorial content</p>
            <h2 id="tutorial-basic-heading">Basic information</h2>
          </div>
        </div>

        <div className="form-grid">
          <label className="field-label">
            Tutorial ID
            <input
              value={draft.id}
              onChange={(event) => updateField("id", event.target.value)}
              disabled={!isCreate}
              required
            />
            {errors.id ? <span className="field-error">{errors.id}</span> : null}
          </label>
          <label className="field-label">
            Title
            <input value={draft.title} onChange={(event) => updateField("title", event.target.value)} required />
            {errors.title ? <span className="field-error">{errors.title}</span> : null}
          </label>
          <label className="field-label">
            Category
            <input value={draft.category} onChange={(event) => updateField("category", event.target.value)} required />
            {errors.category ? <span className="field-error">{errors.category}</span> : null}
          </label>
          <label className="field-label">
            Difficulty
            <input value={draft.difficulty} onChange={(event) => updateField("difficulty", event.target.value)} />
          </label>
          <label className="field-label">
            Estimated minutes
            <input
              type="number"
              min="1"
              value={draft.estimated_minutes}
              onChange={(event) => updateField("estimated_minutes", event.target.value)}
            />
          </label>
          <label className="field-label checkbox-field">
            <input
              type="checkbox"
              checked={draft.active !== false}
              onChange={(event) => updateField("active", event.target.checked)}
            />
            Active tutorial
          </label>
        </div>

        <label className="field-label">
          Summary
          <textarea value={draft.summary} onChange={(event) => updateField("summary", event.target.value)} rows={3} />
        </label>
      </section>

      <section className="admin-form-section" aria-labelledby="tutorial-source-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Traceability</p>
            <h2 id="tutorial-source-heading">Source information</h2>
          </div>
        </div>
        <div className="form-grid">
          <label className="field-label">
            Source
            <input value={draft.source} onChange={(event) => updateField("source", event.target.value)} />
          </label>
          <label className="field-label">
            Source URL
            <input
              type="url"
              value={draft.source_url}
              onChange={(event) => updateField("source_url", event.target.value)}
              required
            />
            {errors.source_url ? <span className="field-error">{errors.source_url}</span> : null}
          </label>
          <label className="field-label">
            Verification level
            <input
              value={draft.verification_level}
              onChange={(event) => updateField("verification_level", event.target.value)}
            />
          </label>
          <label className="field-label">
            Risk level
            <input value={draft.risk_level} onChange={(event) => updateField("risk_level", event.target.value)} />
          </label>
        </div>
      </section>

      <RepeatableStrings
        title="Tags"
        label="Tag"
        values={draft.tags || [""]}
        onAdd={() => addItem("tags", "")}
        onRemove={(index) => removeItem("tags", index)}
        onChange={(index, value) => updateStringArrayItem("tags", index, value)}
      />

      <section className="admin-form-section" aria-labelledby="tutorial-materials-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Checklist</p>
            <h2 id="tutorial-materials-heading">Materials</h2>
          </div>
          <button
            type="button"
            className="button secondary-action"
            onClick={() => addItem("materials", { name: "", quantity: "", unit: "", notes: "" })}
          >
            <Plus aria-hidden="true" />
            Add material
          </button>
        </div>

        <div className="repeatable-list">
          {(draft.materials || []).map((material, index) => (
            <div className="repeatable-card" key={`material-${index}`}>
              <div className="form-grid">
                <label className="field-label">
                  Name
                  <input
                    value={material.name}
                    onChange={(event) => updateArrayItem("materials", index, { name: event.target.value })}
                  />
                  {errors[`materials.${index}.name`] ? (
                    <span className="field-error">{errors[`materials.${index}.name`]}</span>
                  ) : null}
                </label>
                <label className="field-label">
                  Quantity
                  <input
                    value={material.quantity}
                    onChange={(event) => updateArrayItem("materials", index, { quantity: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Unit
                  <input value={material.unit} onChange={(event) => updateArrayItem("materials", index, { unit: event.target.value })} />
                </label>
                <label className="field-label">
                  Notes
                  <input
                    value={material.notes}
                    onChange={(event) => updateArrayItem("materials", index, { notes: event.target.value })}
                  />
                </label>
              </div>
              <button type="button" className="button secondary-action danger-action" onClick={() => removeItem("materials", index)}>
                <Trash2 aria-hidden="true" />
                Remove material
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-form-section" aria-labelledby="tutorial-steps-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Instructions</p>
            <h2 id="tutorial-steps-heading">Steps</h2>
          </div>
          <button
            type="button"
            className="button secondary-action"
            onClick={() => addItem("steps", { step_index: (draft.steps || []).length + 1, step_text: "", imageUrl: "", imageAlt: "", keywords: [] })}
          >
            <Plus aria-hidden="true" />
            Add step
          </button>
        </div>

        {errors.steps ? <p className="status-note error-note">{errors.steps}</p> : null}

        <div className="repeatable-list">
          {(draft.steps || []).map((step, index) => (
            <div className="repeatable-card" key={`step-${index}`}>
              <div className="repeatable-card-header">
                <strong>Step {index + 1}</strong>
                <div className="admin-table-actions">
                  <button type="button" className="icon-button" onClick={() => moveStep(index, -1)} aria-label={`Move step ${index + 1} up`} disabled={index === 0}>
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-button" onClick={() => moveStep(index, 1)} aria-label={`Move step ${index + 1} down`} disabled={index === (draft.steps || []).length - 1}>
                    <ArrowDown aria-hidden="true" />
                  </button>
                </div>
              </div>
              <label className="field-label">
                Step instruction
                <textarea
                  value={step.step_text}
                  onChange={(event) => updateArrayItem("steps", index, { step_text: event.target.value })}
                  rows={3}
                />
                {errors[`steps.${index}.step_text`] ? (
                  <span className="field-error">{errors[`steps.${index}.step_text`]}</span>
                ) : null}
              </label>
              <div className="form-grid">
                <label className="field-label">
                  Image URL
                  <input value={step.imageUrl} onChange={(event) => updateArrayItem("steps", index, { imageUrl: event.target.value })} />
                </label>
                <label className="field-label">
                  Image alt text
                  <input value={step.imageAlt} onChange={(event) => updateArrayItem("steps", index, { imageAlt: event.target.value })} />
                </label>
                <label className="field-label">
                  Keywords
                  <input
                    value={(step.keywords || []).join(", ")}
                    onChange={(event) => updateArrayItem("steps", index, { keywords: parseCsv(event.target.value) })}
                    placeholder="keyword, another keyword"
                  />
                </label>
              </div>
              <button type="button" className="button secondary-action danger-action" onClick={() => removeItem("steps", index)}>
                <Trash2 aria-hidden="true" />
                Remove step
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-form-section" aria-labelledby="tutorial-images-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Optional metadata</p>
            <h2 id="tutorial-images-heading">Optional images</h2>
          </div>
          <button type="button" className="button secondary-action" onClick={() => addItem("optional_images", { url: "", alt: "" })}>
            <Plus aria-hidden="true" />
            Add image
          </button>
        </div>
        <div className="repeatable-list">
          {(draft.optional_images || []).map((image, index) => (
            <div className="repeatable-card" key={`optional-image-${index}`}>
              <div className="form-grid">
                <label className="field-label">
                  Image URL
                  <input value={image.url} onChange={(event) => updateArrayItem("optional_images", index, { url: event.target.value })} />
                </label>
                <label className="field-label">
                  Alt text
                  <input value={image.alt} onChange={(event) => updateArrayItem("optional_images", index, { alt: event.target.value })} />
                </label>
              </div>
              <button type="button" className="button secondary-action danger-action" onClick={() => removeItem("optional_images", index)}>
                <Trash2 aria-hidden="true" />
                Remove image
              </button>
            </div>
          ))}
        </div>
      </section>

      <TutorialPreview draft={draft} />

      <div className="admin-form-actions">
        <button type="button" className="button secondary-action" onClick={onCancel}>
          <X aria-hidden="true" />
          Cancel
        </button>
        <button type="submit" className="button primary-button" disabled={isSaving}>
          <Save aria-hidden="true" />
          {isSaving ? "Saving..." : "Save tutorial"}
        </button>
      </div>
      {statusMessage ? <p className="status-note" role="status">{statusMessage}</p> : null}
    </form>
  );
}

function RepeatableStrings({ title, label, values, onAdd, onRemove, onChange }) {
  return (
    <section className="admin-form-section" aria-labelledby={`${title.toLowerCase()}-heading`}>
      <div className="admin-panel-heading">
        <h2 id={`${title.toLowerCase()}-heading`}>{title}</h2>
        <button type="button" className="button secondary-action" onClick={onAdd}>
          <Plus aria-hidden="true" />
          Add {label.toLowerCase()}
        </button>
      </div>
      <div className="repeatable-list compact-repeatable-list">
        {values.map((value, index) => (
          <div className="repeatable-row" key={`${label}-${index}`}>
            <label className="field-label">
              {label}
              <input value={value} onChange={(event) => onChange(index, event.target.value)} />
            </label>
            <button type="button" className="icon-button" onClick={() => onRemove(index)} aria-label={`Remove ${label.toLowerCase()}`}>
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function getFallbackItem(field) {
  if (field === "materials") return [{ name: "", quantity: "", unit: "", notes: "" }];
  if (field === "steps") return [{ step_index: 1, step_text: "", imageUrl: "", imageAlt: "", keywords: [] }];
  if (field === "optional_images") return [{ url: "", alt: "" }];
  return [""];
}

function parseCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
