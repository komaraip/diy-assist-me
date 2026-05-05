import { ClipboardPenLine, Wrench } from "lucide-react";
import { useState } from "react";
import { createObserverNote } from "../../services/observerNoteService.js";
import { appendTechnicalNote } from "../../services/sessionService.js";

export function ObserverNotesPanel({ session, task, taskTrial }) {
  const [observerNote, setObserverNote] = useState("");
  const [severity, setSeverity] = useState("note");
  const [tags, setTags] = useState("");
  const [technicalNote, setTechnicalNote] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveObserverNote(event) {
    event.preventDefault();
    setIsSaving(true);
    const result = await createObserverNote({
      participantId: session.participantId,
      participantCode: session.participantCode,
      sessionId: session.id,
      conditionId: task.conditionId,
      taskId: task.id,
      taskTrialId: taskTrial?.id || null,
      note: observerNote,
      severity,
      tags,
    });
    setStatusMessage(result.error || "Facilitator note saved.");
    if (!result.error) {
      setObserverNote("");
      setTags("");
    }
    setIsSaving(false);
  }

  async function handleSaveTechnicalNote(event) {
    event.preventDefault();
    setIsSaving(true);
    const result = await appendTechnicalNote(session.id, technicalNote);
    setStatusMessage(result.error || "Setup note saved.");
    if (!result.error) {
      setTechnicalNote("");
    }
    setIsSaving(false);
  }

  return (
    <details className="study-panel facilitator-notes-panel">
      <summary>Facilitator notes</summary>
      <p className="study-context-line">
        Optional facilitator-only notes for issues, setup details, or anything that affected this task.
      </p>

      <div className="two-column-grid">
        <form className="note-form" onSubmit={handleSaveObserverNote}>
          <ClipboardPenLine aria-hidden="true" />
          <label className="field-label">
            Facilitator note
            <textarea
              value={observerNote}
              onChange={(event) => setObserverNote(event.target.value)}
              rows="4"
              required
            />
          </label>
          <label className="field-label">
            Severity
            <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
              <option value="note">Note</option>
              <option value="minor">Minor issue</option>
              <option value="major">Major issue</option>
              <option value="critical">Critical issue</option>
            </select>
          </label>
          <label className="field-label">
            Tags
            <input
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="voice error, fallback, hesitation"
            />
          </label>
          <button type="submit" className="button secondary-action" disabled={isSaving || !observerNote.trim()}>
            Save facilitator note
          </button>
        </form>

        <form className="note-form" onSubmit={handleSaveTechnicalNote}>
          <Wrench aria-hidden="true" />
          <label className="field-label">
            Setup or browser note
            <textarea
              value={technicalNote}
              onChange={(event) => setTechnicalNote(event.target.value)}
              rows="4"
              required
            />
          </label>
          <button type="submit" className="button secondary-action" disabled={isSaving || !technicalNote.trim()}>
            Save setup note
          </button>
        </form>
      </div>

      {statusMessage ? <p className="status-note" role="status">{statusMessage}</p> : null}
    </details>
  );
}
