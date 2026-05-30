import { useState } from "react";
import { Lock } from "lucide-react";
import { hasCompleteSusResponses } from "../../utils/susScoring.js";
import { formatStudyMode, getStudyCopy, normalizeStudyLanguage } from "../../config/guidedSessionContent.js";
import { InfoPopover } from "./InfoPopover.jsx";

export function SUSForm({ condition, isSubmitting, onSubmit, language = "en" }) {
  const [responses, setResponses] = useState(() => buildInitialResponses());
  const normalizedLanguage = normalizeStudyLanguage(language);
  const copy = getStudyCopy(normalizedLanguage);
  const items = copy.susForm.items;
  const isComplete = hasCompleteSusResponses(responses);

  function updateResponse(itemNumber, value) {
    setResponses((current) => ({
      ...current,
      [`item${itemNumber}`]: Number(value),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(responses);
  }

  return (
    <form className="study-form" onSubmit={handleSubmit}>
      <section className="study-panel">
        <p className="eyebrow">{copy.susForm.eyebrow}</p>
        <div className="compact-heading-row">
          <h2>{formatMode(condition.modality, normalizedLanguage)}</h2>
          <InfoPopover title={formatMode(condition.modality, normalizedLanguage)} description={copy.susForm.description} />
        </div>
      </section>

      {items.map((item, index) => {
        const itemNumber = index + 1;
        return (
          <div className="sus-item" key={item}>
            <h3 className="sus-question-text">{itemNumber}. {item}</h3>
            <div className="sus-scale">
              {copy.susForm.scaleLabels.map((label, scaleIndex) => {
                const value = scaleIndex + 1;
                const id = `sus-${itemNumber}-${value}`;
                const isSelected = responses[`item${itemNumber}`] === value;
                return (
                  <label key={id} htmlFor={id} className={isSelected ? "selected" : ""}>
                    <input
                      id={id}
                      type="radio"
                      name={`item${itemNumber}`}
                      value={value}
                      checked={isSelected}
                      onChange={(event) => updateResponse(itemNumber, event.target.value)}
                    />
                    <span>{value}</span>
                    <small>{label}</small>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {isComplete ? (
        <button type="submit" className="button primary-button form-action" disabled={isSubmitting}>
          {isSubmitting ? copy.susForm.submitting : copy.susForm.submit}
        </button>
      ) : (
        <button
          type="button"
          className="button primary-button form-action"
          disabled
          style={{ cursor: "not-allowed", opacity: 1, color: "#2d332f" }}
        >
          <Lock aria-hidden="true" />
          {copy.susForm.submit}
        </button>
      )}
    </form>
  );
}

function formatMode(modality, language) {
  return formatStudyMode(modality, language);
}

function buildInitialResponses() {
  return Array.from({ length: 10 }).reduce((responses, _, index) => {
    responses[`item${index + 1}`] = "";
    return responses;
  }, {});
}
