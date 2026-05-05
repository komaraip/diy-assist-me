import { ArrowLeft, ClipboardList, FileText, MessageSquareText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GuidedProgress } from "../components/study/GuidedProgress.jsx";
import { listTaskTrialsBySession } from "../services/taskTrialService.js";
import { getStudySession } from "../services/studyService.js";
import { getAllStudyTasks } from "../utils/studyAssignments.js";

export function StudySessionPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [taskTrials, setTaskTrials] = useState([]);
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [isLoading, setIsLoading] = useState(true);

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
    return <p className="page-section status-note">Loading guided session...</p>;
  }

  if (resultMeta.error || !session) {
    return (
      <section className="page-section narrow-page">
        <Link className="inline-link" to="/study">
          <ArrowLeft aria-hidden="true" />
          Back to guided setup
        </Link>
        <div className="detail-shell">
          <h1>Guided session unavailable</h1>
          <p>{resultMeta.error || "Session not found."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <Link className="inline-link" to="/study">
        <ArrowLeft aria-hidden="true" />
        Back to guided setup
      </Link>

      <div className="page-header">
        <p className="eyebrow">Guided session</p>
        <h1>Your guided session</h1>
        <p>
          Follow the cards below in order. You will try touch mode, voice mode, quick
          questionnaires, and final feedback.
        </p>
        <p className="session-code">Session code: {session.participantCode || "Not recorded"}</p>
        {resultMeta.error ? <p className="data-source-note error">We could not load this guided session.</p> : null}
      </div>

      <GuidedProgress steps={buildSessionProgress(session, taskTrials)} currentStepId="tasks" title="Guided session steps" />

      <div className="condition-grid">
        {(session.conditions || []).length ? (session.conditions || []).map((condition) => (
          <section className="study-panel mode-card" key={condition.id} aria-labelledby={`${condition.id}-heading`}>
            <div className="study-panel-heading">
              <div>
                <p className="eyebrow">Mode {condition.conditionOrder}</p>
                <h2 id={`${condition.id}-heading`}>{formatModality(condition.modality)}</h2>
                <p className="study-context-line">{getModeHelper(condition.modality)}</p>
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
                      <span>{formatTaskType(task.trialType)} for {task.tutorialId}</span>
                      <small>{formatTaskStatus(latestTrial)}</small>
                    </div>
                    <Link className="button secondary-action" to={`/study/session/${session.id}/task/${task.id}`}>
                      {getTaskActionLabel(task, latestTrial)}
                    </Link>
                  </li>
                );
              })}
            </ol>

            <Link className="button primary-button" to={`/study/session/${session.id}/sus/${condition.id}`}>
              <FileText aria-hidden="true" />
              Answer questionnaire
            </Link>
          </section>
        )) : (
          <section className="study-panel">
            <h2>No tasks are available for this session yet.</h2>
            <p className="study-context-line">Go back and start a new guided session if this one looks incomplete.</p>
          </section>
        )}
      </div>

      <div className="workflow-actions">
        <Link className="button complete-button" to={`/study/session/${session.id}/debrief`}>
          <MessageSquareText aria-hidden="true" />
          Finish with final feedback
        </Link>
      </div>

      <section className="study-panel">
        <h2>What happens next?</h2>
        <p className="study-context-line">
          Complete the tasks in each mode, answer the questionnaire for that mode, then finish with final feedback.
          This session includes {tasks.length} tasks.
        </p>
      </section>
    </section>
  );
}

function formatModality(modality) {
  if (modality === "voice") return "Voice mode";
  if (modality === "touch") return "Touch mode";
  return "Tutorial mode";
}

function formatTaskType(trialType) {
  return trialType === "practice" ? "Practice" : "Task";
}

function getModeHelper(modality) {
  if (modality === "voice") return "Use voice commands when you can. The buttons stay available if you need them.";
  if (modality === "touch") return "Use the on-screen buttons to move through the tutorial steps.";
  return "Follow the tutorial instructions at your own pace.";
}

function getTaskActionLabel(task, latestTask) {
  if (!latestTask) return task.trialType === "practice" ? "Start practice" : "Start task";
  if (latestTask.endedAt) return "Review completed task";
  return "Continue task";
}

function formatTaskStatus(latestTask) {
  if (!latestTask) return "Not started";
  if (latestTask.endedAt) return `Completed${latestTask.durationSeconds ? ` in ${latestTask.durationSeconds}s` : ""}`;
  return "In progress";
}

function buildSessionProgress(session, taskTrials) {
  const conditions = session?.conditions || [];
  return [
    { id: "setup", label: "Setup", status: "Complete" },
    {
      id: "tasks",
      label: "Try each mode",
      status: conditions.length
        ? `${countCompletedTasks(conditions, taskTrials)} of ${countTasks(conditions)} tasks complete`
        : "No tasks available",
    },
    { id: "questionnaires", label: "Quick questionnaires", status: "Answer one after each mode" },
    { id: "feedback", label: "Final feedback", status: "Finish after both modes" },
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
