import { ClipboardPenLine, Wrench } from "lucide-react";
import { useState } from "react";
import { createObserverNote } from "../../services/observerNoteService.js";
import { appendTechnicalNote } from "../../services/sessionService.js";
import { getStudyCopy, normalizeStudyLanguage } from "../../i18n/studyCopy.js";

export function ObserverNotesPanel({ session, task, taskTrial, language = "en" }) {
  const [observerNote, setObserverNote] = useState("");
  const [severity, setSeverity] = useState("note");
  const [tags, setTags] = useState("");
  const [technicalNote, setTechnicalNote] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const copy = getStudyCopy(normalizeStudyLanguage(language)).observerNotes;

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
    setStatusMessage(result.error || copy.noteSaved);
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
    setStatusMessage(result.error || copy.setupSaved);
    if (!result.error) {
      setTechnicalNote("");
    }
    setIsSaving(false);
  }

  return (
    <details className="study-panel facilitator-notes-panel">
      <summary>{copy.summary}</summary>
      <p className="study-context-line">{copy.description}</p>

      <div className="two-column-grid">
        <form className="note-form" onSubmit={handleSaveObserverNote}>
          <ClipboardPenLine aria-hidden="true" />
          <label className="field-label">
            {copy.noteLabel}
            <textarea
              value={observerNote}
              onChange={(event) => setObserverNote(event.target.value)}
              rows="4"
              required
            />
          </label>
          <label className="field-label">
            {copy.severityLabel}
            <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
              <option value="note">{copy.severities.note}</option>
              <option value="minor">{copy.severities.minor}</option>
              <option value="major">{copy.severities.major}</option>
              <option value="critical">{copy.severities.critical}</option>
            </select>
          </label>
          <label className="field-label">
            {copy.tagsLabel}
            <input
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder={copy.tagsPlaceholder}
            />
          </label>
          <button type="submit" className="button secondary-action" disabled={isSaving || !observerNote.trim()}>
            {copy.saveNote}
          </button>
        </form>

        <form className="note-form" onSubmit={handleSaveTechnicalNote}>
          <Wrench aria-hidden="true" />
          <label className="field-label">
            {copy.setupLabel}
            <textarea
              value={technicalNote}
              onChange={(event) => setTechnicalNote(event.target.value)}
              rows="4"
              required
            />
          </label>
          <button type="submit" className="button secondary-action" disabled={isSaving || !technicalNote.trim()}>
            {copy.saveSetup}
          </button>
        </form>
      </div>

      {statusMessage ? <p className="status-note" role="status">{statusMessage}</p> : null}
    </details>
  );
}
