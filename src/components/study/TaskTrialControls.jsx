import { Clock, Flag, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { formatStudyMode, getStudyCopy, normalizeStudyLanguage } from "../../i18n/studyCopy.js";

export function TaskTrialControls({
  task,
  taskTrial,
  isStarting,
  isCompleting,
  onStart,
  onComplete,
  language = "en",
}) {
  const [completionStatus, setCompletionStatus] = useState("successful");
  const [invalidTrial, setInvalidTrial] = useState(false);
  const [invalidTrialReason, setInvalidTrialReason] = useState("");
  const [researcherNote, setResearcherNote] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const normalizedLanguage = normalizeStudyLanguage(language);
  const copy = getStudyCopy(normalizedLanguage);

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
          <p className="eyebrow">{formatTaskType(task.trialType, copy)}</p>
          <h2 id="trial-controls-heading">{task.label}</h2>
        </div>
        <div className="timer-pill" aria-live="polite">
          <Clock aria-hidden="true" />
          {taskTrial?.endedAt ? copy.taskTrial.recorded(taskTrial.durationSeconds) : copy.taskTrial.elapsed(elapsedSeconds)}
        </div>
      </div>

      <p className="study-context-line">
        {copy.taskTrial.modeLine(formatMode(task.modality, normalizedLanguage), task.tutorialId)}
      </p>

      {!taskTrial ? (
        <button type="button" className="button primary-button" onClick={onStart} disabled={isStarting}>
          <PlayCircle aria-hidden="true" />
          {isStarting ? copy.taskTrial.starting : copy.taskTrial.start}
        </button>
      ) : (
        <form className="trial-completion-form" onSubmit={handleComplete}>
          <p className="status-note">
            {copy.taskTrial.startedAt(formatTime(taskTrial.startedAt, copy), formatTime(taskTrial.endedAt, copy), isCompleted)}
          </p>

          <button
            type="submit"
            className="button complete-button"
            disabled={!canComplete || isCompleting || isCompleted}
          >
            <Flag aria-hidden="true" />
            {isCompleting ? copy.taskTrial.finishing : isCompleted ? copy.taskTrial.finished : copy.taskTrial.finish}
          </button>

          <details className="facilitator-details">
            <summary>{copy.taskTrial.facilitatorSummary}</summary>
            <p className="study-context-line">{copy.taskTrial.facilitatorDescription}</p>

            <label className="field-label">
              {copy.taskTrial.outcomeLabel}
              <select
                value={completionStatus}
                onChange={(event) => setCompletionStatus(event.target.value)}
                disabled={isCompleted}
              >
                <option value="successful">{copy.taskTrial.outcomes.successful}</option>
                <option value="partially_successful">{copy.taskTrial.outcomes.partially_successful}</option>
                <option value="unsuccessful">{copy.taskTrial.outcomes.unsuccessful}</option>
              </select>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={invalidTrial}
                onChange={(event) => setInvalidTrial(event.target.checked)}
                disabled={isCompleted}
              />
              <span>{copy.taskTrial.invalidLabel}</span>
            </label>

            {invalidTrial ? (
              <label className="field-label">
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

            <label className="field-label">
              {copy.taskTrial.taskNote}
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
