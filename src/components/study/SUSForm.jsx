import { useState } from "react";
import { SUS_ITEMS, hasCompleteSusResponses } from "../../utils/susScoring.js";

const SCALE_LABELS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

export function SUSForm({ condition, isSubmitting, onSubmit }) {
  const [responses, setResponses] = useState(() => buildInitialResponses());
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
        <p className="eyebrow">Quick questionnaire</p>
        <h2>{formatMode(condition.modality)}</h2>
        <p className="study-context-line">
          Choose one answer for each item. Answer all 10 items to submit.
        </p>
      </section>

      {SUS_ITEMS.map((item, index) => {
        const itemNumber = index + 1;
        return (
          <fieldset className="sus-item" key={item}>
            <legend>{itemNumber}. {item}</legend>
            <div className="sus-scale">
              {SCALE_LABELS.map((label, scaleIndex) => {
                const value = scaleIndex + 1;
                const id = `sus-${itemNumber}-${value}`;
                return (
                  <label key={id} htmlFor={id}>
                    <input
                      id={id}
                      type="radio"
                      name={`item${itemNumber}`}
                      value={value}
                      checked={responses[`item${itemNumber}`] === value}
                      onChange={(event) => updateResponse(itemNumber, event.target.value)}
                    />
                    <span>{value}</span>
                    <small>{label}</small>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <button type="submit" className="button primary-button form-action" disabled={!isComplete || isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit questionnaire"}
      </button>
      {!isComplete ? <p className="status-note" role="status">Answer all items to submit.</p> : null}
    </form>
  );
}

function formatMode(modality) {
  if (modality === "voice") return "Voice mode";
  if (modality === "touch") return "Touch mode";
  return "Tutorial mode";
}

function buildInitialResponses() {
  return SUS_ITEMS.reduce((responses, _, index) => {
    responses[`item${index + 1}`] = "";
    return responses;
  }, {});
}
