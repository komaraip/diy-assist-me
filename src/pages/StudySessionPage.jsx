import { ArrowLeft, ClipboardList, FileText, MessageSquareText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GuidedProgress } from "../components/study/GuidedProgress.jsx";
import { listTaskTrialsBySession } from "../services/taskTrialService.js";
import { getStudySession } from "../services/studyService.js";
import { getAllStudyTasks } from "../utils/studyAssignments.js";
import { getStudyCopy, normalizeStudyLanguage, formatStudyMode } from "../i18n/studyCopy.js";

export function StudySessionPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [taskTrials, setTaskTrials] = useState([]);
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [isLoading, setIsLoading] = useState(true);
  const language = normalizeStudyLanguage(session?.language);
  const copy = getStudyCopy(language);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      setIsLoading(true);
      const [sessionResult, trialsResult] = await Promise.all([
        getStudySession(sessionId),
        listTaskTrialsBySession(sessionId),
      ]);
      if (!isMounted) return;
      setSession(sessionResult.data);
      setTaskTrials(trialsResult.data || []);
      setResultMeta({
        source: sessionResult.source,
        warning: [sessionResult.warning, trialsResult.warning].filter(Boolean).join(" ") || null,
        error: sessionResult.error,
      });
      setIsLoading(false);
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

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

      <div className="page-header">
        <p className="eyebrow">{copy.sessionPage.eyebrow}</p>
        <h1>{copy.sessionPage.title}</h1>
        <p>{copy.sessionPage.description}</p>
        <p className="session-code">{copy.shared.sessionCode}: {session.participantCode || copy.shared.notRecorded}</p>
        {resultMeta.error ? <p className="data-source-note error">{copy.sessionPage.loadError}</p> : null}
      </div>

      <GuidedProgress
        steps={buildSessionProgress(session, taskTrials, copy)}
        currentStepId="tasks"
        title={copy.sessionPage.progressTitle}
        eyebrow={copy.shared.progressEyebrow}
      />

      <div className="condition-grid">
        {(session.conditions || []).length ? (session.conditions || []).map((condition) => (
          <section className="study-panel mode-card" key={condition.id} aria-labelledby={`${condition.id}-heading`}>
            <div className="study-panel-heading">
              <div>
                <p className="eyebrow">{copy.sessionPage.modeLabel(condition.conditionOrder)}</p>
                <h2 id={`${condition.id}-heading`}>{formatModality(condition.modality, language)}</h2>
                <p className="study-context-line">{getModeHelper(condition.modality, copy)}</p>
              </div>
              <ClipboardList aria-hidden="true" />
            </div>

            <ol className="task-list">
              {(condition.tasks || []).map((task) => {
                const latestTrial = findLatestTrial(taskTrials, task.id);
                return (
                  <li key={task.id}>
                    <div>
                      <strong>{task.label}</strong>
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

            <Link className="button primary-button" to={`/study/session/${session.id}/sus/${condition.id}`}>
              <FileText aria-hidden="true" />
              {copy.sessionPage.questionnaireButton}
            </Link>
          </section>
        )) : (
          <section className="study-panel">
            <h2>{copy.sessionPage.noTasksTitle}</h2>
            <p className="study-context-line">{copy.sessionPage.noTasksDescription}</p>
          </section>
        )}
      </div>

      <div className="workflow-actions">
        <Link className="button complete-button" to={`/study/session/${session.id}/debrief`}>
          <MessageSquareText aria-hidden="true" />
          {copy.sessionPage.finalFeedbackButton}
        </Link>
      </div>

      <section className="study-panel">
        <h2>{copy.sessionPage.whatNextTitle}</h2>
        <p className="study-context-line">{copy.sessionPage.whatNextDescription(tasks.length)}</p>
      </section>
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
