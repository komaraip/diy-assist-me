import { Clock, Flag, PlayCircle, CheckCircle2, Circle, Mic } from "lucide-react";
import { useEffect, useState } from "react";
import { formatStudyMode, getStudyCopy, normalizeStudyLanguage } from "../../config/guidedSessionContent.js";
import { Link } from "react-router-dom";

export function TaskTrialControls({
  mode = "display",
  task,
  taskTrial,
  isStarting,
  isCompleting,
  onStart,
  onComplete,
  requiredActionStatus = null,
  language = "en",
  taskScript = [],
  backLink = "",
  voiceTranscript = "",
  voiceState = "",
  isVoiceOn = false,
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
  const requiredActions = requiredActionStatus?.requiredActions || [];
  const requiredActionRows = Math.ceil(requiredActions.length / 2);
  const shouldSplitRequiredActions = requiredActions.length > 4;
  const hasMissingRequiredActions = missingRequiredActions.length > 0;
  const canComplete = !!taskTrial && !isCompleted && completionStatus && (!invalidTrial || invalidTrialReason.trim());

  // Form validator to check validation state before showing modal
  function handleFormSubmit(event) {
    event.preventDefault();
    if (canComplete && !isCompleting) {
      setShowFinishModal(true);
    }
  }

  if (mode === "display") {
    const modeHelper = getModeHelper(task.modality, copy);
    const whatNextItems = copy.taskPage.whatNextItems(modeHelper);
    const isStarted = !!taskTrial;

    return (
      <>
        <section className="study-panel" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "1.1rem", padding: "1.25rem" }} aria-labelledby="task-guide-heading">
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", margin: 0 }}>
            <h2 id="task-guide-heading" style={{ fontSize: "0.95rem", fontWeight: "800", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--foreground)" }}>
              {isStarted ? (taskTrial?.endedAt ? "Task Completed" : "Task Active") : "Task Setup"}
            </h2>
            
            {isStarted ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div className="timer-pill" aria-live="polite" style={{ margin: 0, padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(0, 122, 255, 0.08)", border: "1px solid rgba(0, 122, 255, 0.15)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Clock size={12} style={{ color: "var(--primary-dark)" }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--primary-dark)", fontVariantNumeric: "tabular-nums" }}>
                    {taskTrial?.endedAt ? copy.taskTrial.recorded(taskTrial.durationSeconds) : copy.taskTrial.elapsed(elapsedSeconds)}
                  </span>
                </div>
                
                {requiredActions.length ? (
                  <span className={hasMissingRequiredActions ? "status-badge warning" : "status-badge"} style={{ padding: "0.2rem 0.5rem", fontSize: "0.78rem", borderRadius: "4px", margin: 0 }}>
                    {requiredActionStatus.metRequiredActions.length}/{requiredActions.length} Actions
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="status-badge" style={{ padding: "0.2rem 0.5rem", fontSize: "0.78rem", borderRadius: "4px", background: "var(--surface-soft)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                Not Started
              </span>
            )}
          </div>

          {/* 1. Instruction Steps / What to do next */}
          {!isStarted ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", background: "var(--surface-soft)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "0.82rem", fontWeight: "700", margin: 0, color: "var(--foreground)" }}>
                How to complete this task:
              </h3>
              <ol style={{ paddingLeft: "1.1rem", margin: 0, display: "grid", gap: "0.4rem" }}>
                {whatNextItems.map((item, idx) => (
                  <li key={idx} style={{ fontSize: "0.8rem", lineHeight: 1.3, color: "var(--muted)" }}>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            null
          )}

          {/* 2. Task Script */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <h3 style={{ fontSize: "0.82rem", fontWeight: "700", margin: 0, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              {task.trialType === "measured" ? "Task Script" : "Task Script"}
            </h3>
            <ol style={{ paddingLeft: "1.1rem", margin: 0, display: "grid", gap: "0.45rem" }}>
              {taskScript.map((scriptItem, idx) => (
                <li key={idx} style={{ fontSize: "0.82rem", lineHeight: 1.35, color: "var(--foreground)", fontWeight: "500" }}>
                  {scriptItem}
                </li>
              ))}
            </ol>
          </div>



          {/* 4. Required Actions Checklist */}
          {isStarted && requiredActions.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", borderTop: "1px dashed var(--border)", paddingTop: "0.9rem" }}>
              <h3 style={{ fontSize: "0.82rem", fontWeight: "700", margin: 0, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Required Actions Checklist
              </h3>
              <ul
                style={{
                  display: "grid",
                  gap: "0.45rem",
                  padding: 0,
                  margin: 0,
                  listStyle: "none",
                  ...(shouldSplitRequiredActions
                    ? {
                        gridAutoFlow: "column",
                        gridTemplateRows: `repeat(${requiredActionRows}, auto)`,
                        columnGap: "1rem",
                      }
                    : null),
                }}
              >
                {requiredActions.map((action) => {
                  const isMet = requiredActionStatus.metRequiredActions.includes(action);
                  return (
                    <li key={action} style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: isMet ? "var(--muted)" : "var(--foreground)", lineHeight: 1.25, fontSize: "0.8rem" }}>
                      {isMet ? (
                        <CheckCircle2 size={14} style={{ color: "var(--primary-dark)", flexShrink: 0 }} />
                      ) : (
                        <Circle size={14} style={{ color: "var(--border)", opacity: 0.8, flexShrink: 0 }} />
                      )}
                      <span style={{ textDecoration: isMet ? "line-through" : "none", opacity: isMet ? 0.75 : 1 }}>
                        {formatRequiredAction(action)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {/* 5. Control buttons (Start, Finish, Back) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {!taskTrial ? (
              <button
                type="button"
                className="button primary-button"
                onClick={() => setShowStartModal(true)}
                disabled={isStarting}
                style={{ width: "100%", justifyContent: "center", margin: 0, height: "40px", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <PlayCircle aria-hidden="true" size={16} />
                {isStarting ? copy.taskTrial.starting : copy.taskTrial.start}
              </button>
            ) : !taskTrial.endedAt ? (
              <button
                type="button"
                className="button complete-button"
                onClick={() => setShowFinishModal(true)}
                disabled={isCompleting}
                style={{ width: "100%", justifyContent: "center", margin: 0, height: "40px", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Flag aria-hidden="true" size={16} />
                {copy.taskTrial.finish}
              </button>
            ) : backLink ? (
              <Link
                to={backLink}
                className="button primary-button"
                style={{ width: "100%", justifyContent: "center", margin: 0, height: "40px", textDecoration: "none", boxSizing: "border-box", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                {copy.taskPage.back || "Back to Guided Session"}
              </Link>
            ) : null}
          </div>
        </section>

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
          <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="finish-task-title" style={{ zIndex: 100 }}>
            <div className="admin-confirm-dialog" style={{ maxWidth: "500px", width: "90%" }}>
              <h3 id="finish-task-title" style={{ margin: "0 0 1rem 0" }}>Confirm Task Completion</h3>
              
              {hasMissingRequiredActions ? (
                <div className="status-badge warning" style={{ display: "flex", gap: "0.4rem", padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.84rem", whiteSpace: "normal", marginBottom: "1rem", lineHeight: 1.3, alignItems: "flex-start" }}>
                  <span style={{ fontWeight: "700" }}>⚠️ Warning:</span>
                  <span>
                    {copy.taskTrial.finishMissingActionsWarning(formatRequiredActionList(missingRequiredActions))}
                  </span>
                </div>
              ) : (
                <p style={{ fontSize: "0.88rem", color: "var(--muted)", margin: "0 0 1rem 0", lineHeight: 1.45 }}>
                  Please fill out this completion report to finish the task.
                </p>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canComplete && !isCompleting) {
                    setShowFinishModal(false);
                    onComplete({
                      completionStatus,
                      invalidTrial,
                      invalidTrialReason,
                      participantTaskNote: taskNote,
                    });
                  }
                }}
                style={{ display: "grid", gap: "0.85rem", textAlign: "left" }}
              >
                <label className="field-label" style={{ marginTop: 0, display: "grid", gap: "0.35rem", fontSize: "0.88rem", fontWeight: "600" }}>
                  {copy.taskTrial.outcomeLabel}
                  <select
                    value={completionStatus}
                    onChange={(event) => setCompletionStatus(event.target.value)}
                    required
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "0.86rem" }}
                  >
                    <option value="" disabled>{copy.taskTrial.outcomePlaceholder}</option>
                    <option value="successful">{copy.taskTrial.outcomes.successful}</option>
                    <option value="partially_successful">{copy.taskTrial.outcomes.partially_successful}</option>
                    <option value="unsuccessful">{copy.taskTrial.outcomes.unsuccessful}</option>
                  </select>
                </label>

                <label className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.86rem", cursor: "pointer", marginTop: "0.25rem" }}>
                  <input
                    type="checkbox"
                    checked={invalidTrial}
                    onChange={(event) => setInvalidTrial(event.target.checked)}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span>{copy.taskTrial.invalidLabel}</span>
                </label>

                {invalidTrial && (
                  <label className="field-label" style={{ display: "grid", gap: "0.35rem", fontSize: "0.88rem", fontWeight: "600" }}>
                    {copy.taskTrial.invalidReason}
                    <textarea
                      value={invalidTrialReason}
                      onChange={(event) => setInvalidTrialReason(event.target.value)}
                      rows="2"
                      required
                      style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "0.86rem", resize: "vertical" }}
                    />
                  </label>
                )}

                <label className="field-label" style={{ display: "grid", gap: "0.35rem", fontSize: "0.88rem", fontWeight: "600" }}>
                  {copy.taskTrial.taskNote}
                  <textarea
                    value={taskNote}
                    onChange={(event) => setTaskNote(event.target.value)}
                    rows="2"
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "0.86rem", resize: "vertical" }}
                  />
                </label>

                <div className="admin-confirm-actions" style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="button secondary-action"
                    onClick={() => setShowFinishModal(false)}
                    style={{ padding: "0.5rem 1rem", fontSize: "0.88rem" }}
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="button primary-button"
                    disabled={!canComplete || isCompleting}
                    style={{ padding: "0.5rem 1.25rem", fontSize: "0.88rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <Flag size={14} />
                    {isCompleting ? copy.taskTrial.finishing : "Yes, Finish"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  // mode === "actions"
  if (taskTrial?.endedAt) {
    return (
      <div style={{ height: "40px", borderRadius: "6px", background: "rgba(111, 144, 125, 0.08)", border: "1px solid rgba(111, 144, 125, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--primary-dark)", width: "100%", boxSizing: "border-box" }}>
        <CheckCircle2 size={16} />
        <span style={{ fontWeight: "700", fontSize: "0.82rem" }}>Task Completed</span>
      </div>
    );
  }

  if (!taskTrial) {
    return (
      <div style={{ height: "40px", borderRadius: "6px", background: "var(--surface-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--muted)", width: "100%", boxSizing: "border-box" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: "600" }}>Waiting for task to start...</span>
      </div>
    );
  }

  if (task.modality === "voice") {
    const isListening = voiceState === "listening";
    const isProcessing = voiceState === "processing";
    
    let statusText = "Voice ready";
    if (isListening) statusText = "Listening";
    else if (isProcessing) statusText = "Processing";
    else if (isVoiceOn) statusText = "Voice active";
    else statusText = "Voice off";

    return (
      <div style={{
        border: "1px solid var(--border)",
        borderRadius: "6px",
        background: "var(--surface)",
        padding: "0.5rem 0.65rem",
        minHeight: "44px",
        display: "flex",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
      }}>
        {voiceTranscript ? (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--foreground)", fontWeight: "600", lineHeight: "1.3", wordBreak: "break-word" }}>
            "{voiceTranscript}"
          </p>
        ) : (
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontStyle: "italic", lineHeight: "1.3" }}>
            {isListening ? "Say a command (e.g., 'next step', 'show materials')..." : "Voice recognition inactive. Click mic icon to start."}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: "40px", borderRadius: "6px", background: "rgba(0, 122, 255, 0.05)", border: "1px solid rgba(0, 122, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--primary-dark)", width: "100%", boxSizing: "border-box" }}>
      <span style={{ fontWeight: "700", fontSize: "0.82rem" }}>Touch Mode Active</span>
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

function getModeHelper(modality, copy) {
  if (modality === "voice") {
    return copy.taskPage.voiceHelper;
  }
  if (modality === "touch") {
    return copy.taskPage.touchHelper;
  }
  return copy.taskPage.tutorialHelper;
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
