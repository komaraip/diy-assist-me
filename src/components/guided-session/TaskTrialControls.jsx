import { Clock, Flag, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { formatStudyMode, getStudyCopy, normalizeStudyLanguage } from "../../config/guidedSessionContent.js";

export function TaskTrialControls({
  task,
  taskTrial,
  isStarting,
  isCompleting,
  onStart,
  onComplete,
  requiredActionStatus = null,
  language = "en",
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

  function handleFormSubmit(event) {
    event.preventDefault();
    if (canComplete && !isCompleting) {
      setShowFinishModal(true);
    }
  }

  return (
    <form className="trial-completion-form" style={{ display: "grid", gap: "1.25rem" }} onSubmit={handleFormSubmit}>
      <section className="study-panel" style={{ margin: 0 }} aria-labelledby="trial-controls-heading">
        <div className="study-panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 id="trial-controls-heading" style={{ margin: 0, fontSize: "1.1rem" }}>Task Timer</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {taskTrial ? (
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: "normal" }}>
                {isCompleted 
                  ? `Started at ${formatTime(taskTrial.startedAt, copy)} and finished at ${formatTime(taskTrial.endedAt, copy)}`
                  : `Started at ${formatTime(taskTrial.startedAt, copy)}`
                }
              </span>
            ) : null}
            <div className="timer-pill" aria-live="polite" style={{ margin: 0 }}>
              <Clock aria-hidden="true" />
              {taskTrial?.endedAt ? copy.taskTrial.recorded(taskTrial.durationSeconds) : copy.taskTrial.elapsed(elapsedSeconds)}
            </div>
          </div>
        </div>

        <p className="study-context-line">
          {copy.taskTrial.modeLine(formatMode(task.modality, normalizedLanguage), task.tutorialId)}
        </p>

        {!taskTrial ? (
          <button type="button" className="button primary-button" onClick={() => setShowStartModal(true)} disabled={isStarting}>
            <PlayCircle aria-hidden="true" />
            {isStarting ? copy.taskTrial.starting : copy.taskTrial.start}
          </button>
        ) : !isCompleted ? (
          <button
            type="submit"
            className="button complete-button"
            disabled={!canComplete || isCompleting}
          >
            <Flag aria-hidden="true" />
            {isCompleting ? copy.taskTrial.finishing : copy.taskTrial.finish}
          </button>
        ) : null}
      </section>

      {taskTrial ? (
        <details className="debrief-accordion" style={{ margin: 0 }}>
          <summary>
            <span>{copy.taskTrial.completionSummary}</span>
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
      ) : null}

      {requiredActionStatus?.requiredActions?.length ? (
        <section className="study-panel" style={{ margin: 0 }} aria-labelledby="required-action-heading">
          <div className="study-panel-heading" style={{ alignItems: "flex-start" }}>
            <div>
              <h2 id="required-action-heading" style={{ margin: 0, fontSize: "1.05rem" }}>{copy.taskTrial.requiredActionsTitle}</h2>
              <p className="study-context-line" style={{ margin: "0.35rem 0 0" }}>
                {copy.taskTrial.requiredActionsDescription}
              </p>
            </div>
            <span className={hasMissingRequiredActions ? "status-badge warning" : "status-badge"}>
              {requiredActionStatus.metRequiredActions.length}/{requiredActionStatus.requiredActions.length}
            </span>
          </div>
          <ul className="plain-list" style={{ marginTop: "0.85rem" }}>
            {requiredActionStatus.requiredActions.map((action) => {
              const isMet = requiredActionStatus.metRequiredActions.includes(action);
              return (
                <li key={action} style={{ color: isMet ? "var(--primary-dark)" : "var(--muted)" }}>
                  {isMet ? "Done:" : "Missing:"} {formatRequiredAction(action)}
                </li>
              );
            })}
          </ul>
          {hasMissingRequiredActions ? (
            <p className="status-note" role="status" style={{ marginTop: "0.75rem" }}>
              {copy.taskTrial.requiredActionsWarning(formatRequiredActionList(missingRequiredActions))}
            </p>
          ) : null}
        </section>
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
    </form>
  );
}

function formatTime(value, copy) {
  if (!value) return copy.taskTrial.notRecorded;
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatTaskType(trialType, copy) {
  return trialType === "practice" ? copy.taskTrial.practiceEyebrow : copy.taskTrial.measuredEyebrow;
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
