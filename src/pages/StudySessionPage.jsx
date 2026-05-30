import { ArrowLeft, ClipboardList, FileText, Lock, MessageSquareText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GuidedProgress } from "../components/study/GuidedProgress.jsx";
import { InfoPopover } from "../components/study/InfoPopover.jsx";
import { listTaskTrialsBySession } from "../services/taskTrialService.js";
import { getStudySession } from "../services/studyService.js";
import { listSusResponsesBySession } from "../services/susService.js";
import { getAllStudyTasks } from "../utils/studyAssignments.js";
import { getStudyCopy, normalizeStudyLanguage, formatStudyMode } from "../i18n/studyCopy.js";

export function StudySessionPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [taskTrials, setTaskTrials] = useState([]);
  const [susResponses, setSusResponses] = useState([]);
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedConditionId, setExpandedConditionId] = useState(null);

  const language = normalizeStudyLanguage(session?.language);
  const copy = getStudyCopy(language);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      setIsLoading(true);
      const [sessionResult, trialsResult, susResult] = await Promise.all([
        getStudySession(sessionId),
        listTaskTrialsBySession(sessionId),
        listSusResponsesBySession(sessionId),
      ]);
      if (!isMounted) return;
      setSession(sessionResult.data);
      setTaskTrials(trialsResult.data || []);
      setSusResponses(susResult.data || []);
      setResultMeta({
        source: sessionResult.source,
        warning: [sessionResult.warning, trialsResult.warning, susResult.warning].filter(Boolean).join(" ") || null,
        error: sessionResult.error,
      });
      setIsLoading(false);
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  function isConditionComplete(condition) {
    const condTasks = condition.tasks || [];
    if (condTasks.length === 0) return false;
    const allTasksDone = condTasks.every((task) => {
      const latest = findLatestTrial(taskTrials, task.id);
      return latest && latest.endedAt;
    });
    const susDone = susResponses.some((res) => res.conditionId === condition.id);
    return allTasksDone && susDone;
  }

  useEffect(() => {
    if (session?.conditions?.length) {
      const activeCond = session.conditions.find((cond) => !isConditionComplete(cond));
      if (activeCond) {
        setExpandedConditionId(activeCond.id);
      } else {
        setExpandedConditionId(null);
      }
    }
  }, [session, taskTrials, susResponses]);

  function toggleConditionExpand(conditionId) {
    setExpandedConditionId((current) => (current === conditionId ? null : conditionId));
  }

  const tasks = useMemo(() => getAllStudyTasks(session), [session]);

  if (isLoading) {
    return <p className="page-section status-note">{copy.sessionPage.loading}</p>;
  }

  if (resultMeta.error || !session) {
    return (
      <section className="page-section narrow-page">
        <Link className="inline-link" to="/study">
          <ArrowLeft aria-hidden="true" />
          {copy.sessionPage.back}
        </Link>
        <div className="detail-shell">
          <h1>{copy.sessionPage.unavailableTitle}</h1>
          <p>{resultMeta.error || copy.sessionPage.unavailableFallback}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <Link className="inline-link" to="/study">
        <ArrowLeft aria-hidden="true" />
        {copy.sessionPage.back}
      </Link>

      <div className="page-header compact-header">
        <h1>{copy.sessionPage.title}</h1>
        <span className="session-code">
          {copy.shared.sessionCode}: {session.participantCode || copy.shared.notRecorded}
        </span>
        {resultMeta.error ? <p className="data-source-note error" style={{ width: "100%", margin: "0.5rem 0 0" }}>{copy.sessionPage.loadError}</p> : null}
      </div>

      <div className="progress-header-grid" style={{ marginBottom: "1.25rem" }}>
        <GuidedProgress
          steps={buildSessionProgress(session, taskTrials, copy)}
          currentStepId="tasks"
          title={copy.sessionPage.progressTitle}
          eyebrow={copy.shared.progressEyebrow}
        />
        <section className="study-panel" style={{ margin: 0 }}>
          <div className="compact-heading-row">
            <h2>{copy.sessionPage.whatNextTitle}</h2>
            <InfoPopover title={copy.sessionPage.whatNextTitle} description={copy.sessionPage.whatNextDescription(tasks.length)} />
          </div>
        </section>
      </div>

      <div className="condition-grid">
        {(session.conditions || []).length ? (session.conditions || []).map((condition) => {
          const isComplete = isConditionComplete(condition);
          const isFirstCondition = condition.conditionOrder === 1;
          const previousCondition = session.conditions.find(c => c.conditionOrder === condition.conditionOrder - 1);
          const isLocked = !isFirstCondition && previousCondition && !isConditionComplete(previousCondition);
          const isExpanded = expandedConditionId === condition.id;

          if (isLocked) {
            return (
              <section className="study-panel mode-card collapsed locked" key={condition.id}>
                <div className="study-panel-heading" style={{ margin: 0 }}>
                  <div>
                    <p className="eyebrow" style={{ color: "var(--muted)" }}>{copy.sessionPage.modeLabel(condition.conditionOrder)}</p>
                    <h3 style={{ margin: 0, opacity: 0.6, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {formatModality(condition.modality, language)}
                      <span className="status-badge" style={{ background: "rgba(51, 56, 54, 0.08)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                        <Lock aria-hidden="true" size={13} /> Locked
                      </span>
                    </h3>
                  </div>
                </div>
              </section>
            );
          }

          if (isComplete) {
            const allTasksForConditionDone = condition.tasks.every(t => findLatestTrial(taskTrials, t.id)?.endedAt);
            const conditionSusDone = susResponses.some(res => res.conditionId === condition.id);

            return (
              <section
                className={`study-panel mode-card completed ${isExpanded ? "expanded" : "collapsed"}`}
                key={condition.id}
                style={{
                  background: "transparent",
                  border: "2px solid var(--primary-dark)",
                  cursor: !isExpanded ? "pointer" : "default"
                }}
                onClick={!isExpanded ? () => toggleConditionExpand(condition.id) : undefined}
              >
                {/* Collapsed centered view (only visible when collapsed) */}
                <div 
                  className="completed-card-collapsed-content" 
                  style={{ display: isExpanded ? "none" : "flex" }}
                >
                  <div className="status-badge-container">
                    <span className="status-badge" style={{ background: "rgba(111, 144, 125, 0.12)", color: "var(--primary-dark)", borderColor: "rgba(111, 144, 125, 0.3)" }}>
                      {copy.sessionPage.modeLabel(condition.conditionOrder)}
                    </span>
                  </div>
                  <h3 className="completed-mode-title" style={{ margin: "0.25rem 0 0.5rem 0", fontSize: "1.3rem" }}>
                    {formatModality(condition.modality, language)}
                  </h3>
                  <button
                    type="button"
                    className="button transparent-button"
                    style={{ margin: 0 }}
                  >
                    Show Details
                  </button>
                </div>

                {/* Expanded view (always in DOM, visible when expanded) */}
                <div style={{ display: isExpanded ? "block" : "none", width: "100%" }}>
                  <div className="study-panel-heading" style={{ flexWrap: "wrap", gap: "1rem" }}>
                    <div className="completed-header-flex" style={{ width: "100%" }}>
                      <div className="completed-header-title">
                        <p className="eyebrow">{copy.sessionPage.modeLabel(condition.conditionOrder)}</p>
                        <h2 id={`${condition.id}-heading`} style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "inherit" }}>
                          <ClipboardList aria-hidden="true" size={20} style={{ flexShrink: 0 }} />
                          {formatModality(condition.modality, language)}
                        </h2>
                      </div>
                      <div className="completed-header-action">
                        <button
                          type="button"
                          className="button transparent-button"
                          style={{ margin: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleConditionExpand(condition.id);
                          }}
                        >
                          Hide Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {isComplete ? (
                    <InfoPopover
                      title={formatModality(condition.modality, language)}
                      description={getModeHelper(condition.modality, copy)}
                      className="mode-info-popover"
                    />
                  ) : null}

                  <ol className="task-list">
                    {(condition.tasks || []).map((task) => {
                      const latestTrial = findLatestTrial(taskTrials, task.id);
                      return (
                        <li key={task.id}>
                          <div>
                            <strong>{task.trialType === "measured" ? copy.tasks.measuredLabel : copy.tasks.practiceLabel}</strong>
                            <span>{copy.sessionPage.taskMeta(task.trialType, task.tutorialId)}</span>
                            <small>{formatTaskStatus(latestTrial, copy)}</small>
                          </div>
                          <Link className="button secondary-action" to={`/study/session/${session.id}/task/${task.id}`}>
                            {getTaskActionLabel(task, latestTrial, copy)}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                    {allTasksForConditionDone ? (
                      conditionSusDone ? (
                        <button
                          type="button"
                          className="button secondary-action"
                          disabled
                          style={{ width: "100%", justifyContent: "center", display: "flex", gap: "0.5rem", cursor: "not-allowed" }}
                        >
                          <FileText aria-hidden="true" />
                          Questionnaire Submitted
                        </button>
                      ) : (
                        <Link
                          className="button primary-button"
                          to={`/study/session/${session.id}/sus/${condition.id}`}
                          style={{ width: "100%", justifyContent: "center", display: "flex", gap: "0.5rem" }}
                        >
                          <FileText aria-hidden="true" />
                          {copy.sessionPage.questionnaireButton}
                        </Link>
                      )
                    ) : (
                      <button
                        type="button"
                        className="button primary-button"
                        disabled
                        style={{ width: "100%", justifyContent: "center", display: "flex", gap: "0.5rem", cursor: "not-allowed", opacity: 1, color: "#2d332f" }}
                      >
                        <Lock aria-hidden="true" />
                        {copy.sessionPage.questionnaireButton}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          const allTasksForConditionDone = condition.tasks.every(t => findLatestTrial(taskTrials, t.id)?.endedAt);
          const conditionSusDone = susResponses.some(res => res.conditionId === condition.id);

          return (
            <section className="study-panel mode-card" key={condition.id} aria-labelledby={`${condition.id}-heading`}>
              <div className="study-panel-heading">
                <div>
                  <p className="eyebrow">{copy.sessionPage.modeLabel(condition.conditionOrder)}</p>
                  <h2 id={`${condition.id}-heading`}>
                    {formatModality(condition.modality, language)}
                  </h2>
                  <InfoPopover
                    title={formatModality(condition.modality, language)}
                    description={getModeHelper(condition.modality, copy)}
                    className="mode-info-popover"
                  />
                </div>
                <ClipboardList aria-hidden="true" />
              </div>

              <ol className="task-list">
                {(condition.tasks || []).map((task) => {
                  const latestTrial = findLatestTrial(taskTrials, task.id);
                  return (
                    <li key={task.id}>
                      <div>
                        <strong>{task.trialType === "measured" ? copy.tasks.measuredLabel : copy.tasks.practiceLabel}</strong>
                        <span>{copy.sessionPage.taskMeta(task.trialType, task.tutorialId)}</span>
                        <small>{formatTaskStatus(latestTrial, copy)}</small>
                      </div>
                      <Link className="button secondary-action" to={`/study/session/${session.id}/task/${task.id}`}>
                        {getTaskActionLabel(task, latestTrial, copy)}
                      </Link>
                    </li>
                  );
                })}
              </ol>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                {allTasksForConditionDone ? (
                  conditionSusDone ? (
                    <button
                      type="button"
                      className="button secondary-action"
                      disabled
                      style={{ width: "100%", justifyContent: "center", display: "flex", gap: "0.5rem", cursor: "not-allowed" }}
                    >
                      <FileText aria-hidden="true" />
                      Questionnaire Submitted
                    </button>
                  ) : (
                    <Link
                      className="button primary-button"
                      to={`/study/session/${session.id}/sus/${condition.id}`}
                      style={{ width: "100%", justifyContent: "center", display: "flex", gap: "0.5rem" }}
                    >
                      <FileText aria-hidden="true" />
                      {copy.sessionPage.questionnaireButton}
                    </Link>
                  )
                ) : (
                  <button
                    type="button"
                    className="button primary-button"
                    disabled
                    style={{ width: "100%", justifyContent: "center", display: "flex", gap: "0.5rem", cursor: "not-allowed", opacity: 1, color: "#2d332f" }}
                  >
                    <Lock aria-hidden="true" />
                    {copy.sessionPage.questionnaireButton}
                  </button>
                )}
              </div>
            </section>
          );
        }) : (
          <section className="study-panel">
            <h2>{copy.sessionPage.noTasksTitle}</h2>
            <p className="study-context-line">{copy.sessionPage.noTasksDescription}</p>
          </section>
        )}
      </div>

      <div className="workflow-actions" style={{ flexDirection: "column", alignItems: "stretch" }}>
        {(() => {
          const allConditionsComplete = (session.conditions || []).every(cond => isConditionComplete(cond));
          return (
            <>
              {allConditionsComplete ? (
                <Link
                  className="button complete-button"
                  to={`/study/session/${session.id}/debrief`}
                  style={{ width: "100%", justifyContent: "center", display: "flex", gap: "0.5rem" }}
                >
                  <MessageSquareText aria-hidden="true" />
                  {copy.sessionPage.finalFeedbackButton}
                </Link>
              ) : (
                <button
                  type="button"
                  className="button complete-button"
                  disabled
                  style={{ width: "100%", justifyContent: "center", display: "flex", gap: "0.5rem", cursor: "not-allowed", opacity: 1, color: "white" }}
                >
                  <Lock aria-hidden="true" />
                  {copy.sessionPage.finalFeedbackButton}
                </button>
              )}
            </>
          );
        })()}
      </div>

    </section>
  );
}

function formatModality(modality, language) {
  return formatStudyMode(modality, language);
}

function getModeHelper(modality, copy) {
  if (modality === "voice") return copy.sessionPage.voiceHelper;
  if (modality === "touch") return copy.sessionPage.touchHelper;
  return copy.sessionPage.tutorialHelper;
}

function getTaskActionLabel(task, latestTask, copy) {
  if (!latestTask) return task.trialType === "practice" ? copy.sessionPage.startPractice : copy.sessionPage.startTask;
  if (latestTask.endedAt) return copy.sessionPage.reviewTask;
  return copy.sessionPage.continueTask;
}

function formatTaskStatus(latestTask, copy) {
  if (!latestTask) return copy.sessionPage.notStarted;
  if (latestTask.endedAt) return copy.sessionPage.completedIn(latestTask.durationSeconds);
  return copy.sessionPage.inProgress;
}

function buildSessionProgress(session, taskTrials, copy) {
  const conditions = session?.conditions || [];
  return [
    { id: "setup", label: copy.sessionPage.progress.setupLabel, status: copy.sessionPage.progress.setupStatus },
    {
      id: "tasks",
      label: copy.sessionPage.progress.tasksLabel,
      status: conditions.length
        ? copy.sessionPage.progress.tasksStatus(countCompletedTasks(conditions, taskTrials), countTasks(conditions))
        : copy.sessionPage.progress.noTasks,
    },
    { id: "questionnaires", label: copy.sessionPage.progress.questionnairesLabel, status: copy.sessionPage.progress.questionnairesStatus },
    { id: "feedback", label: copy.sessionPage.progress.feedbackLabel, status: copy.sessionPage.progress.feedbackStatus },
  ];
}

function countTasks(conditions) {
  return conditions.reduce((total, condition) => total + (condition.tasks || []).length, 0);
}

function countCompletedTasks(conditions, taskTrials) {
  return conditions
    .flatMap((condition) => condition.tasks || [])
    .filter((task) => findLatestTrial(taskTrials, task.id)?.endedAt).length;
}

function findLatestTrial(taskTrials, taskId) {
  return [...taskTrials]
    .filter((trial) => trial.taskId === taskId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0] || null;
}
