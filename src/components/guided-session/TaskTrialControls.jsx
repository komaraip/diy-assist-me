import { Clock, Flag, PlayCircle, CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { formatStudyMode, getStudyCopy, normalizeStudyLanguage } from "../../config/guidedSessionContent.js";

export function TaskTrialControls({
  position = "top",
  task,
  taskTrial,
  isStarting,
  isCompleting,
  onStart,
  onComplete,
  requiredActionStatus = null,
  language = "en",
  children,
}) {
  const [completionStatus, setCompletionStatus] = useState("");
  const [invalidTrial, setInvalidTrial] = useState(false);
  const [invalidTrialReason, setInvalidTrialReason] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const normalizedLanguage = normalizeStudyLanguage(language);
  const copy = getStudyCopy(normalizedLanguage);

  useEffect(() => {
    setCompletionStatus(taskTrial?.completionStatus || "");
    setInvalidTrial(taskTrial?.invalidTrial === true);
    setInvalidTrialReason(taskTrial?.invalidTrialReason || "");
    setTaskNote(taskTrial?.participantTaskNote || taskTrial?.researcherNote || "");
    setShowFinishModal(false);
  }, [taskTrial?.id]);

  useEffect(() => {
    if (!taskTrial?.startedAt || taskTrial.endedAt) return undefined;

    function updateElapsed() {
      const started = new Date(taskTrial.startedAt).getTime();
      if (!Number.isFinite(started)) return;
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    }

    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [taskTrial?.endedAt, taskTrial?.startedAt]);

  const isCompleted = !!taskTrial?.endedAt;
  const missingRequiredActions = requiredActionStatus?.missingRequiredActions || [];
  const hasMissingRequiredActions = missingRequiredActions.length > 0;
  const canComplete = !!taskTrial && !isCompleted && completionStatus && (!invalidTrial || invalidTrialReason.trim());

  // Form validator to check validation state before showing modal
  function handleFormSubmit(event) {
    event.preventDefault();
    if (canComplete && !isCompleting) {
      setShowFinishModal(true);
    }
  }

  if (position === "top") {
    return (
      <section className="study-panel top-trial-controls" style={{ margin: 0 }} aria-labelledby="trial-controls-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: taskTrial ? "0.75rem" : 0 }}>
          <h2 id="trial-controls-heading">
            {taskTrial ? "Task active" : "Task setup"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {taskTrial && (
              <div className="timer-pill" aria-live="polite" style={{ margin: 0, padding: "0.25rem 0.55rem", borderRadius: "6px", background: "var(--surface-soft)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Clock size={14} style={{ color: "var(--muted)" }} />
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                  {taskTrial?.endedAt ? copy.taskTrial.recorded(taskTrial.durationSeconds) : copy.taskTrial.elapsed(elapsedSeconds)}
                </span>
              </div>
            )}
            {taskTrial && requiredActionStatus?.requiredActions?.length && (
              <span className={hasMissingRequiredActions ? "status-badge warning" : "status-badge"} style={{ padding: "0.25rem 0.55rem", fontSize: "0.82rem", borderRadius: "6px", margin: 0 }}>
                {requiredActionStatus.metRequiredActions.length}/{requiredActionStatus.requiredActions.length} Actions
              </span>
            )}
          </div>
        </div>

        {!taskTrial ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
            <p className="study-context-line" style={{ margin: 0 }}>
              {copy.taskTrial.modeLine(formatMode(task.modality, normalizedLanguage), task.tutorialId)}
            </p>
            <button type="button" className="button primary-button" onClick={() => setShowStartModal(true)} disabled={isStarting} style={{ alignSelf: "flex-start" }}>
              <PlayCircle aria-hidden="true" />
              {isStarting ? copy.taskTrial.starting : copy.taskTrial.start}
            </button>
          </div>
        ) : null}

        {taskTrial && requiredActionStatus?.requiredActions?.length ? (
          <div style={{ marginTop: "1rem" }}>
            <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem", padding: 0, margin: 0, listStyle: "none" }}>
              {requiredActionStatus.requiredActions.map((action) => {
                const isMet = requiredActionStatus.metRequiredActions.includes(action);
                return (
                  <li key={action} style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: isMet ? "var(--muted)" : "var(--foreground)", lineHeight: 1.3 }}>
                    {isMet ? (
                      <CheckCircle2 size={18} style={{ color: "var(--primary-dark)", flexShrink: 0 }} />
                    ) : (
                      <Circle size={18} style={{ color: "var(--border)", opacity: 0.8, flexShrink: 0 }} />
                    )}
                    <span style={{ textDecoration: isMet ? "line-through" : "none", opacity: isMet ? 0.7 : 1 }}>
                      {formatRequiredAction(action)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {showStartModal ? (
          <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="start-task-title">
            <div className="admin-confirm-dialog">
              <h3 id="start-task-title">Important: Task Instructions</h3>
              <p>
                Please read and follow the task script instructions on the screen carefully. 
                To ensure complete research data, you must try all the controls listed in the script (opening materials, search, going next/previous, and jumping steps).
              </p>
              <p>
                Click <strong>Start Task</strong> when you are ready to begin the task and start the timer.
              </p>
              <div className="admin-confirm-actions">
                <button type="button" className="button secondary-action" onClick={() => setShowStartModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="button primary-button"
                  onClick={() => {
                    setShowStartModal(false);
                    onStart();
                  }}
                >
                  Start Task
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  // position === "bottom"
  if (!taskTrial) return null;

  return (
    <div className="bottom-trial-controls" style={{ display: "grid", gap: "1.25rem" }}>
      <form id="completion-form" onSubmit={handleFormSubmit}>
        <details className="debrief-accordion" style={{ margin: 0 }}>
          <summary>
            <span>{copy.taskTrial.completionSummary}</span>
            {isCompleted ? (
              <span style={{ marginLeft: "auto", marginRight: "0.85rem", color: "var(--primary-dark)", fontSize: "0.82rem", fontWeight: "800" }}>
                ✓ Completed
              </span>
            ) : !canComplete ? (
              <span style={{ marginLeft: "auto", marginRight: "0.85rem", color: "#ef4444", fontSize: "0.82rem", fontWeight: "700" }}>
                ⚠️ Incomplete
              </span>
            ) : null}
          </summary>
          <div className="accordion-content" style={{ background: "var(--surface-soft)" }}>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <p className="study-context-line" style={{ margin: 0 }}>
                {copy.taskTrial.completionDescription}
              </p>
              <label className="field-label" style={{ marginTop: 0 }}>
                {copy.taskTrial.outcomeLabel}
                <select
                  value={completionStatus}
                  onChange={(event) => setCompletionStatus(event.target.value)}
                  disabled={isCompleted}
                  required
                >
                  <option value="" disabled>{copy.taskTrial.outcomePlaceholder}</option>
                  <option value="successful">{copy.taskTrial.outcomes.successful}</option>
                  <option value="partially_successful">{copy.taskTrial.outcomes.partially_successful}</option>
                  <option value="unsuccessful">{copy.taskTrial.outcomes.unsuccessful}</option>
                </select>
              </label>
            </div>

            <label className="checkbox-row" style={{ marginTop: "0.5rem" }}>
              <input
                type="checkbox"
                checked={invalidTrial}
                onChange={(event) => setInvalidTrial(event.target.checked)}
                disabled={isCompleted}
              />
              <span>{copy.taskTrial.invalidLabel}</span>
            </label>

            {invalidTrial ? (
              <label className="field-label" style={{ marginTop: "0.5rem" }}>
                {copy.taskTrial.invalidReason}
                <textarea
                  value={invalidTrialReason}
                  onChange={(event) => setInvalidTrialReason(event.target.value)}
                  rows="2"
                  required
                  disabled={isCompleted}
                />
              </label>
            ) : null}

            <label className="field-label" style={{ marginTop: "0.5rem" }}>
              {copy.taskTrial.taskNote}
              <textarea
                value={taskNote}
                onChange={(event) => setTaskNote(event.target.value)}
                rows="2"
                disabled={isCompleted}
              />
            </label>
          </div>
        </details>
      </form>

      {/* Render ObserverNotesPanel */}
      {children}

      {!isCompleted ? (
        <button
          type="submit"
          form="completion-form"
          className="button complete-button"
          disabled={!canComplete || isCompleting}
          style={{ width: "100%" }}
        >
          <Flag aria-hidden="true" />
          {isCompleting ? copy.taskTrial.finishing : copy.taskTrial.finish}
        </button>
      ) : null}

      {showFinishModal ? (
        <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="finish-task-title">
          <div className="admin-confirm-dialog">
            <h3 id="finish-task-title">Confirm Task Completion</h3>
            <p>
              Have you followed all the instructions in the task script? 
              Please ensure you have tried all the controls listed in the script before finishing.
            </p>
            {hasMissingRequiredActions ? (
              <p className="status-note error-note" role="alert">
                {copy.taskTrial.finishMissingActionsWarning(formatRequiredActionList(missingRequiredActions))}
              </p>
            ) : null}
            <p>
              Click <strong>Yes, Finish</strong> to complete the task, or <strong>Go Back</strong> to continue trying the controls.
            </p>
            <div className="admin-confirm-actions">
              <button type="button" className="button secondary-action" onClick={() => setShowFinishModal(false)}>
                Go Back
              </button>
              <button
                type="button"
                className="button primary-button"
                onClick={() => {
                  setShowFinishModal(false);
                  onComplete({
                    completionStatus,
                    invalidTrial,
                    invalidTrialReason,
                    participantTaskNote: taskNote,
                  });
                }}
              >
                Yes, Finish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatTime(value, copy) {
  if (!value) return copy.taskTrial.notRecorded;
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatMode(modality, language) {
  return formatStudyMode(modality, language);
}

function formatRequiredAction(action) {
  const labels = {
    materials_open: "Open materials",
    step_next: "Go to next step",
    repeat_instruction: "Repeat instruction",
    tutorial_search: "Search tutorial",
    tutorial_search_target: "Search target keyword",
    step_jump: "Jump to a step",
    step_jump_target: "Jump to target step",
    step_previous: "Go to previous step",
    return_target_step: "Return to target step",
    scroll_down: "Scroll down",
    scroll_down_after_target: "Scroll down after target step",
  };
  return labels[action] || action.replace(/_/g, " ");
}

function formatRequiredActionList(actions) {
  return actions.map(formatRequiredAction).join(", ");
}
