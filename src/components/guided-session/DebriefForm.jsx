import { useState } from "react";
import { getStudyCopy, normalizeStudyLanguage } from "../../config/guidedSessionContent.js";
import { InfoPopover } from "./InfoPopover.jsx";

const initialResponses = {
  preferredModality: "",
  easiestPart: "",
  hardestPart: "",
  voiceProblems: "",
  touchProblems: "",
  fallbackComments: "",
  commandClarity: "",
  recoveryEffort: "",
  designImplications: "",
  suggestions: "",
};

const REQUIRED_NARRATIVE_FIELDS = ["easiestPart", "hardestPart", "suggestions"];

export function DebriefForm({ isSubmitting, onSubmit, language = "en" }) {
  const [responses, setResponses] = useState(initialResponses);
  const copy = getStudyCopy(normalizeStudyLanguage(language)).debriefForm;
  const hasRequiredNarrativeResponses = REQUIRED_NARRATIVE_FIELDS.every((field) => responses[field].trim());
  const canSubmit = responses.preferredModality && hasRequiredNarrativeResponses;

  function updateResponse(field, value) {
    setResponses((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(responses);
  }

  return (
    <form className="study-form" onSubmit={handleSubmit}>
      <section className="study-panel">
        <p className="eyebrow">{copy.eyebrow}</p>
        <div className="compact-heading-row">
          <h2>{copy.title}</h2>
          <InfoPopover title={copy.title} description={copy.description} />
        </div>
      </section>

      <label className="field-label">
        {copy.preferredMode}
        <select
          value={responses.preferredModality}
          onChange={(event) => updateResponse("preferredModality", event.target.value)}
          required
        >
          <option value="">{copy.selectOne}</option>
          <option value="touch">{copy.touch}</option>
          <option value="voice">{copy.voice}</option>
          <option value="no_preference">{copy.noPreference}</option>
        </select>
      </label>

      <section className="study-panel">
        <h3>{copy.requiredResponsesTitle}</h3>
        <p className="study-context-line">{copy.requiredResponsesDescription}</p>
        <Textarea required label={copy.fields.easiestPart} value={responses.easiestPart} onChange={(value) => updateResponse("easiestPart", value)} />
        <Textarea required label={copy.fields.hardestPart} value={responses.hardestPart} onChange={(value) => updateResponse("hardestPart", value)} />
        <Textarea required label={copy.fields.suggestions} value={responses.suggestions} onChange={(value) => updateResponse("suggestions", value)} />
      </section>

      <details className="debrief-accordion">
        <summary>Usability & Modality Problems (Optional)</summary>
        <div className="accordion-content">
          <Textarea label={copy.fields.voiceProblems} value={responses.voiceProblems} onChange={(value) => updateResponse("voiceProblems", value)} />
          <Textarea label={copy.fields.touchProblems} value={responses.touchProblems} onChange={(value) => updateResponse("touchProblems", value)} />
          <Textarea label={copy.fields.commandClarity} value={responses.commandClarity} onChange={(value) => updateResponse("commandClarity", value)} />
          <Textarea label={copy.fields.recoveryEffort} value={responses.recoveryEffort} onChange={(value) => updateResponse("recoveryEffort", value)} />
        </div>
      </details>

      <details className="debrief-accordion">
        <summary>Additional Design Feedback (Optional)</summary>
        <div className="accordion-content">
          <Textarea label={copy.fields.designImplications} value={responses.designImplications} onChange={(value) => updateResponse("designImplications", value)} />
          <Textarea label={copy.fields.fallbackComments} value={responses.fallbackComments} onChange={(value) => updateResponse("fallbackComments", value)} />
        </div>
      </details>

      {!hasRequiredNarrativeResponses ? (
        <p className="status-note" role="status">
          {copy.requiredResponsesWarning}
        </p>
      ) : null}

      <button type="submit" className="button primary-button form-action" disabled={isSubmitting || !canSubmit}>
        {isSubmitting ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}

function Textarea({ label, value, onChange, required = false }) {
  return (
    <label className="field-label">
      {label}{required ? " *" : ""}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="3" required={required} />
    </label>
  );
}
