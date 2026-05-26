import { useState } from "react";

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

export function DebriefForm({ isSubmitting, onSubmit }) {
  const [responses, setResponses] = useState(initialResponses);

  function updateResponse(field, value) {
    setResponses((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(responses);
  }

  return (
    <form className="study-form" onSubmit={handleSubmit}>
      <section className="study-panel">
        <p className="eyebrow">Final feedback</p>
        <h2>Tell us about your experience</h2>
        <p className="study-context-line">
          Short answers are fine. Share anything that made the tutorial easier or harder to follow.
        </p>
      </section>

      <label className="field-label">
        Preferred mode
        <select
          value={responses.preferredModality}
          onChange={(event) => updateResponse("preferredModality", event.target.value)}
          required
        >
          <option value="">Select one</option>
          <option value="touch">Touch</option>
          <option value="voice">Voice</option>
          <option value="no_preference">No preference</option>
        </select>
      </label>

      <Textarea label="What was easiest?" value={responses.easiestPart} onChange={(value) => updateResponse("easiestPart", value)} />
      <Textarea label="What was hardest?" value={responses.hardestPart} onChange={(value) => updateResponse("hardestPart", value)} />
      <Textarea label="What usability problems appeared in voice mode?" value={responses.voiceProblems} onChange={(value) => updateResponse("voiceProblems", value)} />
      <Textarea label="What usability problems appeared in touch mode?" value={responses.touchProblems} onChange={(value) => updateResponse("touchProblems", value)} />
      <Textarea label="Were the voice commands clear?" value={responses.commandClarity} onChange={(value) => updateResponse("commandClarity", value)} />
      <Textarea label="How much effort was needed to recover from voice errors?" value={responses.recoveryEffort} onChange={(value) => updateResponse("recoveryEffort", value)} />
      <Textarea label="How did the fallback buttons work for you?" value={responses.fallbackComments} onChange={(value) => updateResponse("fallbackComments", value)} />
      <Textarea label="What design implications should be considered?" value={responses.designImplications} onChange={(value) => updateResponse("designImplications", value)} />
      <Textarea label="What would make this better?" value={responses.suggestions} onChange={(value) => updateResponse("suggestions", value)} />

      <button type="submit" className="button primary-button form-action" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="field-label">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="3" />
    </label>
  );
}
