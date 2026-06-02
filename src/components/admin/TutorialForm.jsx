import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [openSections, setOpenSections] = useState({
    basic: true,
    source: false,
    tags: false,
    materials: false,
    steps: false,
    images: false,
  });

  const sectionErrors = useMemo(() => {
    const keys = Object.keys(errors || {});
    return {
      basic: keys.some((key) =>
        [
          "id",
          "title",
          "category",
          "study_role",
          "thumbnailUrl",
          "estimated_minutes",
        ].includes(key),
      ),
      source: keys.some((key) => key === "source_url"),
      materials: keys.some((key) => key === "materials" || key.startsWith("materials.")),
      steps: keys.some((key) => key === "steps" || key.startsWith("steps.")),
    };
  }, [errors]);

  useEffect(() => {
    setOpenSections((current) => ({
      ...current,
      basic: current.basic || sectionErrors.basic,
      source: current.source || sectionErrors.source,
      materials: current.materials || sectionErrors.materials,
      steps: current.steps || sectionErrors.steps,
    }));
  }, [sectionErrors]);

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
    updateField(
      "steps",
      steps.map((step, stepIndex) => ({ ...step, step_index: stepIndex + 1 })),
    );
  }

  function toggleSection(sectionId) {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  const editorTitle = draft.title?.trim() || "Untitled tutorial";
  const materialCount = (draft.materials || []).filter((material) =>
    Boolean(
      material.name?.trim() ||
        material.quantity?.trim() ||
        material.unit?.trim() ||
        material.notes?.trim(),
    ),
  ).length;
  const stepCount = (draft.steps || []).filter((step) =>
    Boolean(step.step_text?.trim()),
  ).length;

  return (
    <form
      className="tutorial-admin-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="tutorial-editor-header">
        <div>
          <p className="eyebrow">Tutorial content</p>
          <p className="tutorial-editor-mode">
            {isCreate ? "Create tutorial" : "Edit tutorial"}
          </p>
          <h2>{editorTitle}</h2>
          <span>{draft.id}</span>
        </div>
        <button type="button" className="button secondary-action" onClick={onCancel}>
          <ArrowLeft aria-hidden="true" />
          Back to tutorials
        </button>
      </div>

      <AccordionSection
        id="basic"
        eyebrow="Tutorial content"
        title="Basic information"
        summary={`${draft.category || "No category"} / ${draft.estimated_minutes || "-"} min`}
        isOpen={openSections.basic}
        hasError={sectionErrors.basic}
        onToggle={toggleSection}
      >
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
            <input
              value={draft.title}
              onChange={(event) => updateField("title", event.target.value)}
              required
            />
            {errors.title ? <span className="field-error">{errors.title}</span> : null}
          </label>
          <label className="field-label">
            Category
            <input
              value={draft.category}
              onChange={(event) => updateField("category", event.target.value)}
              required
            />
            {errors.category ? <span className="field-error">{errors.category}</span> : null}
          </label>
          <label className="field-label">
            Study role
            <select
              value={draft.study_role || "catalog"}
              onChange={(event) => updateField("study_role", event.target.value)}
            >
              <option value="catalog">Catalog</option>
              <option value="core_practice">Core practice</option>
              <option value="core_measured">Core measured</option>
            </select>
            {errors.study_role ? (
              <span className="field-error">{errors.study_role}</span>
            ) : null}
          </label>
          <label className="field-label">
            Difficulty
            <input
              value={draft.difficulty}
              onChange={(event) => updateField("difficulty", event.target.value)}
            />
          </label>
          <label className="field-label">
            Thumbnail URL
            <input
              type="url"
              value={draft.thumbnailUrl || ""}
              onChange={(event) => updateField("thumbnailUrl", event.target.value)}
              placeholder="https://images.example.com/tutorial.jpg"
            />
            {errors.thumbnailUrl ? (
              <span className="field-error">{errors.thumbnailUrl}</span>
            ) : null}
          </label>
          <label className="field-label">
            Estimated minutes
            <input
              type="number"
              min="1"
              value={draft.estimated_minutes}
              onChange={(event) => updateField("estimated_minutes", event.target.value)}
              required
            />
            {errors.estimated_minutes ? (
              <span className="field-error">{errors.estimated_minutes}</span>
            ) : null}
          </label>
          <label className="field-label checkbox-field">
            <input
              type="checkbox"
              checked={draft.active !== false}
              onChange={(event) => updateField("active", event.target.checked)}
            />
            Active tutorial
          </label>
          <label className="field-label checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(draft.guided_session_priority)}
              onChange={(event) =>
                updateField("guided_session_priority", event.target.checked)
              }
            />
            Guided session priority
          </label>
        </div>

        <label className="field-label">
          Summary
          <textarea
            value={draft.summary}
            onChange={(event) => updateField("summary", event.target.value)}
            rows={3}
          />
        </label>
        <label className="field-label">
          Selection rationale
          <textarea
            value={draft.selection_rationale || ""}
            onChange={(event) =>
              updateField("selection_rationale", event.target.value)
            }
            rows={3}
          />
        </label>
      </AccordionSection>

      <AccordionSection
        id="source"
        eyebrow="Traceability"
        title="Source information"
        summary={draft.source || "Source metadata"}
        isOpen={openSections.source}
        hasError={sectionErrors.source}
        onToggle={toggleSection}
      >
        <div className="form-grid">
          <label className="field-label">
            Source
            <input
              value={draft.source}
              onChange={(event) => updateField("source", event.target.value)}
            />
          </label>
          <label className="field-label">
            Source URL
            <input
              type="url"
              value={draft.source_url}
              onChange={(event) => updateField("source_url", event.target.value)}
              required
            />
            {errors.source_url ? (
              <span className="field-error">{errors.source_url}</span>
            ) : null}
          </label>
          <label className="field-label">
            Verification level
            <input
              value={draft.verification_level}
              onChange={(event) =>
                updateField("verification_level", event.target.value)
              }
            />
          </label>
          <label className="field-label">
            Risk level
            <input
              value={draft.risk_level}
              onChange={(event) => updateField("risk_level", event.target.value)}
              placeholder="low"
            />
          </label>
        </div>
        <p className="status-note">
          Study tutorials should be safe for desk-based simulation and avoid
          hazardous tools, substances, or expert-only skills.
        </p>
      </AccordionSection>

      <AccordionSection
        id="tags"
        title="Tags"
        summary={`${(draft.tags || []).filter(Boolean).length} tags`}
        isOpen={openSections.tags}
        onToggle={toggleSection}
        action={
          <button
            type="button"
            className="button secondary-action"
            onClick={() => addItem("tags", "")}
          >
            <Plus aria-hidden="true" />
            Add tag
          </button>
        }
      >
        <RepeatableStrings
          label="Tag"
          values={draft.tags || [""]}
          onRemove={(index) => removeItem("tags", index)}
          onChange={(index, value) => updateStringArrayItem("tags", index, value)}
        />
      </AccordionSection>

      <AccordionSection
        id="materials"
        eyebrow="Checklist"
        title="Materials"
        summary={`${materialCount} filled materials`}
        isOpen={openSections.materials}
        hasError={sectionErrors.materials}
        onToggle={toggleSection}
        action={
          <button
            type="button"
            className="button secondary-action"
            onClick={() =>
              addItem("materials", { name: "", quantity: "", unit: "", notes: "" })
            }
          >
            <Plus aria-hidden="true" />
            Add material
          </button>
        }
      >
        {errors.materials ? (
          <p className="status-note error-note">{errors.materials}</p>
        ) : null}

        <div className="repeatable-list">
          {(draft.materials || []).map((material, index) => (
            <div className="repeatable-card" key={`material-${index}`}>
              <div className="repeatable-card-header">
                <strong>Material {index + 1}</strong>
                <button
                  type="button"
                  className="icon-button danger-action"
                  onClick={() => removeItem("materials", index)}
                  aria-label={`Remove material ${index + 1}`}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
              <div className="form-grid">
                <label className="field-label">
                  Name
                  <input
                    value={material.name}
                    onChange={(event) =>
                      updateArrayItem("materials", index, {
                        name: event.target.value,
                      })
                    }
                  />
                  {errors[`materials.${index}.name`] ? (
                    <span className="field-error">
                      {errors[`materials.${index}.name`]}
                    </span>
                  ) : null}
                </label>
                <label className="field-label">
                  Quantity
                  <input
                    value={material.quantity}
                    onChange={(event) =>
                      updateArrayItem("materials", index, {
                        quantity: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field-label">
                  Unit
                  <input
                    value={material.unit}
                    onChange={(event) =>
                      updateArrayItem("materials", index, {
                        unit: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field-label">
                  Notes
                  <input
                    value={material.notes}
                    onChange={(event) =>
                      updateArrayItem("materials", index, {
                        notes: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        id="steps"
        eyebrow="Instructions"
        title="Steps"
        summary={`${stepCount} filled steps`}
        isOpen={openSections.steps}
        hasError={sectionErrors.steps}
        onToggle={toggleSection}
        action={
          <button
            type="button"
            className="button secondary-action"
            onClick={() =>
              addItem("steps", {
                step_index: (draft.steps || []).length + 1,
                step_text: "",
                imageUrl: "",
                imageAlt: "",
                keywords: [],
              })
            }
          >
            <Plus aria-hidden="true" />
            Add step
          </button>
        }
      >
        {errors.steps ? <p className="status-note error-note">{errors.steps}</p> : null}

        <div className="repeatable-list">
          {(draft.steps || []).map((step, index) => (
            <div className="repeatable-card" key={`step-${index}`}>
              <div className="repeatable-card-header">
                <strong>Step {index + 1}</strong>
                <div className="admin-table-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => moveStep(index, -1)}
                    aria-label={`Move step ${index + 1} up`}
                    disabled={index === 0}
                  >
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => moveStep(index, 1)}
                    aria-label={`Move step ${index + 1} down`}
                    disabled={index === (draft.steps || []).length - 1}
                  >
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-button danger-action"
                    onClick={() => removeItem("steps", index)}
                    aria-label={`Remove step ${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </div>
              <label className="field-label">
                Step instruction
                <textarea
                  value={step.step_text}
                  onChange={(event) =>
                    updateArrayItem("steps", index, {
                      step_text: event.target.value,
                    })
                  }
                  rows={3}
                />
                {errors[`steps.${index}.step_text`] ? (
                  <span className="field-error">
                    {errors[`steps.${index}.step_text`]}
                  </span>
                ) : null}
              </label>
              <div className="form-grid">
                <label className="field-label">
                  Image URL
                  <input
                    value={step.imageUrl}
                    onChange={(event) =>
                      updateArrayItem("steps", index, {
                        imageUrl: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field-label">
                  Image alt text
                  <input
                    value={step.imageAlt}
                    onChange={(event) =>
                      updateArrayItem("steps", index, {
                        imageAlt: event.target.value,
                      })
                    }
                  />
                  {errors[`steps.${index}.imageAlt`] ? (
                    <span className="field-error">
                      {errors[`steps.${index}.imageAlt`]}
                    </span>
                  ) : null}
                </label>
                <label className="field-label">
                  Keywords
                  <input
                    value={(step.keywords || []).join(", ")}
                    onChange={(event) =>
                      updateArrayItem("steps", index, {
                        keywords: parseCsv(event.target.value),
                      })
                    }
                    placeholder="keyword, another keyword"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        id="images"
        eyebrow="Optional metadata"
        title="Optional images"
        summary={`${(draft.optional_images || []).filter((image) => image.url || image.alt).length} images`}
        isOpen={openSections.images}
        onToggle={toggleSection}
        action={
          <button
            type="button"
            className="button secondary-action"
            onClick={() => addItem("optional_images", { url: "", alt: "" })}
          >
            <Plus aria-hidden="true" />
            Add image
          </button>
        }
      >
        <div className="repeatable-list">
          {(draft.optional_images || []).map((image, index) => (
            <div className="repeatable-card" key={`optional-image-${index}`}>
              <div className="repeatable-card-header">
                <strong>Image {index + 1}</strong>
                <button
                  type="button"
                  className="icon-button danger-action"
                  onClick={() => removeItem("optional_images", index)}
                  aria-label={`Remove optional image ${index + 1}`}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
              <div className="form-grid">
                <label className="field-label">
                  Image URL
                  <input
                    value={image.url}
                    onChange={(event) =>
                      updateArrayItem("optional_images", index, {
                        url: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field-label">
                  Alt text
                  <input
                    value={image.alt}
                    onChange={(event) =>
                      updateArrayItem("optional_images", index, {
                        alt: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      <div className="admin-form-actions tutorial-editor-footer-actions">
        <button type="button" className="button secondary-action" onClick={onCancel}>
          <X aria-hidden="true" />
          Cancel
        </button>
        <button type="submit" className="button primary-button" disabled={isSaving}>
          <Save aria-hidden="true" />
          {isSaving ? "Saving..." : "Save tutorial"}
        </button>
      </div>
      {statusMessage ? (
        <p className="status-note" role="status">
          {statusMessage}
        </p>
      ) : null}
    </form>
  );
}

function AccordionSection({
  id,
  eyebrow,
  title,
  summary,
  isOpen,
  hasError = false,
  action,
  onToggle,
  children,
}) {
  return (
    <section
      className={
        hasError
          ? "admin-form-section tutorial-accordion-section has-error"
          : "admin-form-section tutorial-accordion-section"
      }
    >
      <div className="tutorial-accordion-heading">
        <button
          type="button"
          className="tutorial-accordion-toggle"
          onClick={() => onToggle(id)}
          aria-expanded={isOpen}
        >
          <ChevronDown aria-hidden="true" />
          <span>
            {eyebrow ? <small className="eyebrow">{eyebrow}</small> : null}
            <strong>{title}</strong>
            {summary ? <em>{summary}</em> : null}
          </span>
        </button>
        <div className="tutorial-accordion-actions">
          {hasError ? <span className="tutorial-error-pill">Needs fix</span> : null}
          {action}
        </div>
      </div>
      {isOpen ? <div className="tutorial-accordion-body">{children}</div> : null}
    </section>
  );
}

function RepeatableStrings({ label, values, onRemove, onChange }) {
  return (
    <div className="repeatable-list compact-repeatable-list">
      {values.map((value, index) => (
        <div className="repeatable-row" key={`${label}-${index}`}>
          <label className="field-label">
            {label}
            <input
              value={value}
              onChange={(event) => onChange(index, event.target.value)}
            />
          </label>
          <button
            type="button"
            className="icon-button"
            onClick={() => onRemove(index)}
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
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
