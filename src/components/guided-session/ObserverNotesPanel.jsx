import { ClipboardPenLine, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, isFirebaseEnabled } from "../../services/firebase.js";
import { listLocalRecords } from "../../services/localStore.js";
import { createObserverNote } from "../../services/observerNoteService.js";
import { appendTechnicalNote, getSessionById } from "../../services/sessionService.js";
import { getStudyCopy, normalizeStudyLanguage } from "../../i18n/studyCopy.js";

export function ObserverNotesPanel({ session, task, taskTrial, language = "en" }) {
  const [observerNote, setObserverNote] = useState("");
  const [severity, setSeverity] = useState("note");
  const [tags, setTags] = useState("");
  const [technicalNote, setTechnicalNote] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // States to track the last saved values
  const [lastSavedObserverNote, setLastSavedObserverNote] = useState("");
  const [lastSavedSeverity, setLastSavedSeverity] = useState("note");
  const [lastSavedTags, setLastSavedTags] = useState("");
  const [lastSavedTechnicalNote, setLastSavedTechnicalNote] = useState("");

  const copy = getStudyCopy(normalizeStudyLanguage(language)).observerNotes;
  const recommendedTags = copy.recommendedTags || [];

  useEffect(() => {
    let isMounted = true;
    setStatusMessage("");

    async function loadSavedData() {
      if (!session?.id) return;

      // 1. Fetch latest technical note for the session
      try {
        const sessionRes = await getSessionById(session.id);
        if (isMounted && sessionRes.data) {
          const notes = sessionRes.data.technicalNotes || [];
          const latestNote = notes[notes.length - 1]?.note || "";
          setTechnicalNote(latestNote);
          setLastSavedTechnicalNote(latestNote);
        }
      } catch (e) {
        console.error("Failed to load technical notes:", e);
      }

      // 2. Fetch latest observer note for this session + task
      if (!task?.id) return;
      let notes = [];
      if (!isFirebaseEnabled || !db) {
        const localResult = listLocalRecords("observerNotes");
        notes = (localResult.data || []).filter(
          (item) => item.sessionId === session.id && item.taskId === task.id
        );
      } else {
        try {
          const q = query(
            collection(db, "observerNotes"),
            where("sessionId", "==", session.id),
            where("taskId", "==", task.id)
          );
          const snapshot = await getDocs(q);
          notes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          console.error("Failed to load observer notes:", e);
          const localResult = listLocalRecords("observerNotes");
          notes = (localResult.data || []).filter(
            (item) => item.sessionId === session.id && item.taskId === task.id
          );
        }
      }

      if (!isMounted) return;
      if (notes.length > 0) {
        notes.sort((a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime());
        const latest = notes[0];
        const latestNote = latest.note || "";
        const latestSeverity = latest.severity || "note";
        const latestTags = Array.isArray(latest.tags) ? latest.tags.join(", ") : latest.tags || "";

        setObserverNote(latestNote);
        setSeverity(latestSeverity);
        setTags(latestTags);

        setLastSavedObserverNote(latestNote);
        setLastSavedSeverity(latestSeverity);
        setLastSavedTags(latestTags);
      } else {
        setObserverNote("");
        setSeverity("note");
        setTags("");

        setLastSavedObserverNote("");
        setLastSavedSeverity("note");
        setLastSavedTags("");
      }
    }

    loadSavedData();

    return () => {
      isMounted = false;
    };
  }, [session?.id, task?.id]);

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
      setLastSavedObserverNote(observerNote);
      setLastSavedSeverity(severity);
      setLastSavedTags(tags);
    }
    setIsSaving(false);
  }

  async function handleSaveTechnicalNote(event) {
    event.preventDefault();
    setIsSaving(true);
    const result = await appendTechnicalNote(session.id, technicalNote);
    setStatusMessage(result.error || copy.setupSaved);
    if (!result.error) {
      setLastSavedTechnicalNote(technicalNote);
    }
    setIsSaving(false);
  }

  const isObserverNoteUnchanged =
    observerNote.trim() === lastSavedObserverNote.trim() &&
    severity === lastSavedSeverity &&
    tags.trim() === lastSavedTags.trim();

  const isTechnicalNoteUnchanged = technicalNote.trim() === lastSavedTechnicalNote.trim();

  return (
    <div className="observer-notes-panel-flat">
      <p className="study-context-line" style={{ marginTop: 0, marginBottom: "1rem" }}>
        {copy.description} {copy.rq3Reminder}
      </p>

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
              list="observer-note-tag-options"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder={copy.tagsPlaceholder}
            />
            <datalist id="observer-note-tag-options">
              {recommendedTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
            <span className="field-hint">{copy.tagHint}</span>
          </label>
          <button type="submit" className="button secondary-action" disabled={isSaving || !observerNote.trim() || isObserverNoteUnchanged}>
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
          <button type="submit" className="button secondary-action" disabled={isSaving || !technicalNote.trim() || isTechnicalNoteUnchanged}>
            {copy.saveSetup}
          </button>
        </form>
      </div>

      {statusMessage ? <p className="status-note" role="status">{statusMessage}</p> : null}
    </div>
  );
}


