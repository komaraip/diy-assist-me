import { Clock, Flag, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function TaskTrialControls({
  task,
  taskTrial,
  isStarting,
  isCompleting,
  onStart,
  onComplete,
}) {
  const [completionStatus, setCompletionStatus] = useState("successful");
  const [invalidTrial, setInvalidTrial] = useState(false);
  const [invalidTrialReason, setInvalidTrialReason] = useState("");
  const [researcherNote, setResearcherNote] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!taskTrial) return;
    if (taskTrial.completionStatus) setCompletionStatus(taskTrial.completionStatus);
    if (taskTrial.invalidTrial) setInvalidTrial(true);
    if (taskTrial.invalidTrialReason) setInvalidTrialReason(taskTrial.invalidTrialReason);
    if (taskTrial.researcherNote) setResearcherNote(taskTrial.researcherNote);
  }, [taskTrial]);

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
  const canComplete = !!taskTrial && !isCompleted && (!invalidTrial || invalidTrialReason.trim());

  function handleComplete(event) {
    event.preventDefault();
    onComplete({
      completionStatus,
      invalidTrial,
      invalidTrialReason,
      researcherNote,
    });
  }

  return (
    <section className="study-panel" aria-labelledby="trial-controls-heading">
      <div className="study-panel-heading">
        <div>
          <p className="eyebrow">{formatTaskType(task.trialType)}</p>
          <h2 id="trial-controls-heading">{task.label}</h2>
        </div>
        <div className="timer-pill" aria-live="polite">
          <Clock aria-hidden="true" />
          {taskTrial?.endedAt ? `${taskTrial.durationSeconds ?? 0}s recorded` : `${elapsedSeconds}s`}
        </div>
      </div>

      <p className="study-context-line">
        {formatMode(task.modality)} for tutorial {task.tutorialId}
      </p>

      {!taskTrial ? (
        <button type="button" className="button primary-button" onClick={onStart} disabled={isStarting}>
          <PlayCircle aria-hidden="true" />
          {isStarting ? "Starting task..." : "Start task"}
        </button>
      ) : (
        <form className="trial-completion-form" onSubmit={handleComplete}>
          <p className="status-note">
            Started at {formatTime(taskTrial.startedAt)}
            {isCompleted ? ` and finished at ${formatTime(taskTrial.endedAt)}.` : ". Finish this task when the tutorial work is done."}
          </p>

          <button
            type="submit"
            className="button complete-button"
            disabled={!canComplete || isCompleting || isCompleted}
          >
            <Flag aria-hidden="true" />
            {isCompleting ? "Finishing..." : isCompleted ? "Task finished" : "Finish task"}
          </button>

          <details className="facilitator-details">
            <summary>Facilitator task details</summary>
            <p className="study-context-line">
              Use this section only when task outcome or facilitator notes need to be recorded.
            </p>

            <label className="field-label">
              Task outcome
              <select
                value={completionStatus}
                onChange={(event) => setCompletionStatus(event.target.value)}
                disabled={isCompleted}
              >
                <option value="successful">Successful</option>
                <option value="partially_successful">Partially successful</option>
                <option value="unsuccessful">Unsuccessful</option>
              </select>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={invalidTrial}
                onChange={(event) => setInvalidTrial(event.target.checked)}
                disabled={isCompleted}
              />
              <span>Mark this task as invalid.</span>
            </label>

            {invalidTrial ? (
              <label className="field-label">
                Invalid task reason
                <textarea
                  value={invalidTrialReason}
                  onChange={(event) => setInvalidTrialReason(event.target.value)}
                  rows="2"
                  required
                  disabled={isCompleted}
                />
              </label>
            ) : null}

            <label className="field-label">
              Task note
              <textarea
                value={researcherNote}
                onChange={(event) => setResearcherNote(event.target.value)}
                rows="2"
                disabled={isCompleted}
              />
            </label>
          </details>
        </form>
      )}
    </section>
  );
}

function formatTime(value) {
  if (!value) return "not recorded";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatTaskType(trialType) {
  return trialType === "practice" ? "Practice task" : "Task";
}

function formatMode(modality) {
  if (modality === "voice") return "Voice mode";
  if (modality === "touch") return "Touch mode";
  return "Tutorial mode";
}
