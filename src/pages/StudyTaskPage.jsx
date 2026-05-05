import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GuidedProgress } from "../components/study/GuidedProgress.jsx";
import { ObserverNotesPanel } from "../components/study/ObserverNotesPanel.jsx";
import { TaskTrialControls } from "../components/study/TaskTrialControls.jsx";
import { TutorialDetailPage } from "./TutorialDetailPage.jsx";
import { getStudySession } from "../services/studyService.js";
import { completeTaskTrial, listTaskTrialsBySession, startTaskTrial } from "../services/taskTrialService.js";
import { findStudyTask } from "../utils/studyAssignments.js";
import { buildStudyLogContext } from "../utils/studyContext.js";

export function StudyTaskPage() {
  const { sessionId, taskId } = useParams();
  const [session, setSession] = useState(null);
  const [taskTrials, setTaskTrials] = useState([]);
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTask() {
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

    loadTask();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const task = useMemo(() => findStudyTask(session, taskId), [session, taskId]);
  const latestTrial = useMemo(() => findLatestTrial(taskTrials, taskId), [taskId, taskTrials]);
  const activeTrial = latestTrial?.endedAt ? latestTrial : latestTrial || null;
  const studyContext = useMemo(
    () => buildStudyLogContext({ session, task, taskTrial: activeTrial }),
    [activeTrial, session, task]
  );

  async function handleStartTrial() {
    if (!session || !task) return;
    setIsStarting(true);
    setStatusMessage("");
    const result = await startTaskTrial({
      participantId: session.participantId,
      participantCode: session.participantCode,
      sessionId: session.id,
      conditionId: task.conditionId,
      taskId: task.id,
      tutorialId: task.tutorialId,
      modality: task.modality,
      trialType: task.trialType,
    });
    setStatusMessage(result.error || "Task started. Follow the tutorial below.");
    if (!result.error) {
      setTaskTrials((current) => [...current, result.data]);
    }
    setIsStarting(false);
  }

  async function handleCompleteTrial(payload) {
    if (!activeTrial) return;
    setIsCompleting(true);
    setStatusMessage("");
    const result = await completeTaskTrial(activeTrial, payload);
    setStatusMessage(result.error || "Task finished. You can return to the guided session.");
    if (!result.error) {
      setTaskTrials((current) => current.map((trial) => (trial.id === result.data.id ? result.data : trial)));
    }
    setIsCompleting(false);
  }

  if (isLoading) {
    return <p className="page-section status-note">Loading task...</p>;
  }

  if (resultMeta.error || !session || !task) {
    return (
      <section className="page-section narrow-page">
        <Link className="inline-link" to={`/study/session/${sessionId}`}>
          <ArrowLeft aria-hidden="true" />
          Back to guided session
        </Link>
        <div className="detail-shell">
          <h1>Task unavailable</h1>
          <p>{resultMeta.error || "Task not found in this session."}</p>
        </div>
      </section>
    );
  }

  const canRenderTutorial = !!activeTrial && !activeTrial.endedAt;

  return (
    <section className="page-section">
      <Link className="inline-link" to={`/study/session/${session.id}`}>
        <ArrowLeft aria-hidden="true" />
        Back to guided session
      </Link>

      <div className="page-header">
        <p className="eyebrow">{formatTaskType(task.trialType)}</p>
        <h1>Follow this tutorial task</h1>
        <p>
          This task uses {formatModality(task.modality)}. Start when you are ready, follow the tutorial,
          then finish the task before returning to the guided session.
        </p>
        {resultMeta.error ? <p className="data-source-note error">We could not load this task.</p> : null}
      </div>

      <GuidedProgress steps={buildTaskProgress(activeTrial)} currentStepId="task" title="Task progress" />

      <section className="study-panel what-next-panel" aria-labelledby="what-next-heading">
        <h2 id="what-next-heading">What to do next</h2>
        <ol className="plain-list">
          <li>Start the task when you are ready.</li>
          <li>{getModeHelper(task.modality)}</li>
          <li>Finish the task when the tutorial work is done.</li>
          <li>Return to the guided session for the next step.</li>
        </ol>
      </section>

      <TaskTrialControls
        task={task}
        taskTrial={activeTrial}
        isStarting={isStarting}
        isCompleting={isCompleting}
        onStart={handleStartTrial}
        onComplete={handleCompleteTrial}
      />

      {statusMessage ? <p className="status-note" role="status">{statusMessage}</p> : null}

      {canRenderTutorial ? (
        <TutorialDetailPage
          tutorialIdOverride={task.tutorialId}
          studyContext={studyContext}
          allowedModality={task.modality}
          backLink={`/study/session/${session.id}`}
          backLabel="Back to guided session"
          embedded
        />
      ) : (
        <section className="study-panel">
          <h2>{activeTrial?.endedAt ? "Task completed" : "Start the task to open the tutorial"}</h2>
          <p className="study-context-line">
            The tutorial will appear here after the task starts.
          </p>
        </section>
      )}

      <ObserverNotesPanel session={session} task={task} taskTrial={activeTrial} />
    </section>
  );
}

function formatModality(modality) {
  if (modality === "voice") return "voice mode";
  if (modality === "touch") return "touch mode";
  return "tutorial mode";
}

function formatTaskType(trialType) {
  return trialType === "practice" ? "Practice" : "Task";
}

function getModeHelper(modality) {
  if (modality === "voice") {
    return "Try voice commands such as next step, repeat, and show materials. Buttons are always available.";
  }
  if (modality === "touch") {
    return "Use the on-screen buttons to move through the steps.";
  }
  return "Use the tutorial controls to move through the steps.";
}

function buildTaskProgress(taskTrial) {
  return [
    { id: "start", label: "Start", status: taskTrial ? "Complete" : "Start this task first" },
    {
      id: "task",
      label: "Follow the tutorial",
      status: taskTrial?.endedAt ? "Complete" : taskTrial ? "In progress" : "Waiting to start",
    },
    { id: "finish", label: "Finish", status: taskTrial?.endedAt ? "Complete" : "Finish after the tutorial work" },
  ];
}

function findLatestTrial(taskTrials, taskId) {
  return [...taskTrials]
    .filter((trial) => trial.taskId === taskId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0] || null;
}
