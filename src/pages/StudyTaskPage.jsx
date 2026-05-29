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
import { formatStudyMode, getStudyCopy, normalizeStudyLanguage } from "../i18n/studyCopy.js";

export function StudyTaskPage() {
  const { sessionId, taskId } = useParams();
  const [session, setSession] = useState(null);
  const [taskTrials, setTaskTrials] = useState([]);
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const language = normalizeStudyLanguage(session?.language);
  const copy = getStudyCopy(language);

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
      conditionOrder: task.conditionOrder,
      sequenceAssignment: session.sequenceAssignment,
      tutorialRotation: session.tutorialRotation,
      taskScript: task.taskScript,
      requiredActions: task.requiredActions,
      targetKeyword: task.targetKeyword,
      targetStep: task.targetStep,
      successCriteria: task.successCriteria,
    });
    setStatusMessage(result.error || copy.taskPage.startedStatus);
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
    setStatusMessage(result.error || copy.taskPage.finishedStatus);
    if (!result.error) {
      setTaskTrials((current) => current.map((trial) => (trial.id === result.data.id ? result.data : trial)));
    }
    setIsCompleting(false);
  }

  if (isLoading) {
    return <p className="page-section status-note">{copy.taskPage.loading}</p>;
  }

  if (resultMeta.error || !session || !task) {
    return (
      <section className="page-section narrow-page">
        <Link className="inline-link" to={`/study/session/${sessionId}`}>
          <ArrowLeft aria-hidden="true" />
          {copy.taskPage.back}
        </Link>
        <div className="detail-shell">
          <h1>{copy.taskPage.unavailableTitle}</h1>
          <p>{resultMeta.error || copy.taskPage.unavailableFallback}</p>
        </div>
      </section>
    );
  }

  const canRenderTutorial = !!activeTrial && !activeTrial.endedAt;

  return (
    <section className="page-section">
      <Link className="inline-link" to={`/study/session/${session.id}`}>
        <ArrowLeft aria-hidden="true" />
        {copy.taskPage.back}
      </Link>

      <div className="page-header">
        <p className="eyebrow">{formatTaskType(task.trialType, copy)}</p>
        <h1>{copy.taskPage.title}</h1>
        <p>{copy.taskPage.description(formatModality(task.modality, language))}</p>
        {resultMeta.error ? <p className="data-source-note error">{copy.taskPage.loadError}</p> : null}
      </div>

      <GuidedProgress
        steps={buildTaskProgress(activeTrial, copy)}
        currentStepId="task"
        title={copy.taskPage.progressTitle}
        eyebrow={copy.shared.progressEyebrow}
      />

      <section className="study-panel what-next-panel" aria-labelledby="what-next-heading">
        <h2 id="what-next-heading">{copy.taskPage.whatNextTitle}</h2>
        <ol className="plain-list">
          {copy.taskPage.whatNextItems(getModeHelper(task.modality, copy)).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="study-panel" aria-labelledby="task-script-heading">
        <h2 id="task-script-heading">{task.trialType === "measured" ? copy.taskPage.measuredScriptHeading : copy.taskPage.practiceScriptHeading}</h2>
        <p className="study-context-line">{task.taskGoal}</p>
        <ol className="plain-list">
          {(task.taskScript || []).map((scriptItem) => (
            <li key={scriptItem}>{scriptItem}</li>
          ))}
        </ol>
        {task.trialType === "measured" ? (
          <p className="status-note">
            {copy.taskPage.measuredMeta({
              targetKeyword: task.targetKeyword,
              targetStep: task.targetStep,
              successCriteria: task.successCriteria,
            })}
          </p>
        ) : null}
      </section>

      <details className="facilitator-notes-panel">
        <summary>🔒 Researcher Console (Controls & Notes)</summary>
        <div className="facilitator-console-content">
          <TaskTrialControls
            task={task}
            taskTrial={activeTrial}
            isStarting={isStarting}
            isCompleting={isCompleting}
            onStart={handleStartTrial}
            onComplete={handleCompleteTrial}
            language={language}
          />
          {statusMessage ? <p className="status-note" role="status" style={{ marginTop: "0.5rem" }}>{statusMessage}</p> : null}
          <div style={{ marginTop: "1.25rem", borderTop: "1px dashed var(--border)", paddingTop: "1.25rem" }}>
            <ObserverNotesPanel session={session} task={task} taskTrial={activeTrial} language={language} />
          </div>
        </div>
      </details>

      {canRenderTutorial ? (
        <TutorialDetailPage
          tutorialIdOverride={task.tutorialId}
          studyContext={studyContext}
          allowedModality={task.modality}
          backLink={`/study/session/${session.id}`}
          backLabel={copy.taskPage.embeddedBackLabel}
          language={language}
          embedded
        />
      ) : (
        <section className="study-panel">
          <h2>{activeTrial?.endedAt ? copy.taskPage.completedTitle : copy.taskPage.startTutorialTitle}</h2>
          <p className="study-context-line">{copy.taskPage.startTutorialDescription}</p>
        </section>
      )}
    </section>
  );
}

function formatModality(modality, language) {
  return formatStudyMode(modality, language, "lower");
}

function formatTaskType(trialType, copy) {
  return copy.sessionPage.taskType(trialType);
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

function buildTaskProgress(taskTrial, copy) {
  return [
    { id: "start", label: copy.taskPage.progress.startLabel, status: taskTrial ? copy.taskPage.progress.complete : copy.taskPage.progress.startPending },
    {
      id: "task",
      label: copy.taskPage.progress.taskLabel,
      status: taskTrial?.endedAt ? copy.taskPage.progress.complete : taskTrial ? copy.taskPage.progress.inProgress : copy.taskPage.progress.waiting,
    },
    { id: "finish", label: copy.taskPage.progress.finishLabel, status: taskTrial?.endedAt ? copy.taskPage.progress.complete : copy.taskPage.progress.finishStatus },
  ];
}

function findLatestTrial(taskTrials, taskId) {
  return [...taskTrials]
    .filter((trial) => trial.taskId === taskId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0] || null;
}
