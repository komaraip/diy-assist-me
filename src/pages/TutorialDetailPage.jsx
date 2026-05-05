import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LiveFeedback } from "../components/tutorial/LiveFeedback.jsx";
import { MaterialsPanel } from "../components/tutorial/MaterialsPanel.jsx";
import { StepCard } from "../components/tutorial/StepCard.jsx";
import { StepOverview } from "../components/tutorial/StepOverview.jsx";
import { TouchControls } from "../components/tutorial/TouchControls.jsx";
import { TutorialSearch } from "../components/tutorial/TutorialSearch.jsx";
import { VoiceControlPanel } from "../components/tutorial/VoiceControlPanel.jsx";
import { useVoiceCommands } from "../hooks/useVoiceCommands.js";
import { logTouchInteraction } from "../services/logService.js";
import { getTutorialById } from "../services/tutorialService.js";
import { getElapsedMsFromStartedAt } from "../utils/studyContext.js";
import { VOICE_INTENTS } from "../utils/voiceIntents.js";

const SCROLL_AMOUNT_RATIO = 0.6;
const PAGE_AMOUNT_RATIO = 0.9;

export function TutorialDetailPage({
  tutorialIdOverride = null,
  studyContext = null,
  allowedModality = "all",
  backLink = "/tutorials",
  backLabel = "Back to tutorials",
  embedded = false,
}) {
  const { tutorialId: routeTutorialId } = useParams();
  const tutorialId = tutorialIdOverride || routeTutorialId;
  const [tutorial, setTutorial] = useState(null);
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [isLoading, setIsLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [tutorialSearchQuery, setTutorialSearchQuery] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const tutorialShellRef = useRef(null);
  const tutorialMainRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTutorial() {
      setIsLoading(true);
      const result = await getTutorialById(tutorialId);
      if (!isMounted) return;
      setTutorial(result.data);
      setResultMeta({ source: result.source, warning: result.warning, error: result.error });
      setIsLoading(false);
    }

    loadTutorial();

    return () => {
      isMounted = false;
    };
  }, [tutorialId]);

  const steps = tutorial?.steps || [];
  const currentStep = steps[activeStepIndex] || null;
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === steps.length - 1;
  const isStudyMode = !!studyContext?.sessionId;
  const isVoiceCondition = studyContext?.modality === "voice";
  const voiceControlsEnabled = allowedModality !== "touch";
  const progressValue = steps.length ? ((activeStepIndex + 1) / steps.length) * 100 : 0;
  const searchResults = useMemo(() => {
    if (!tutorialSearchQuery.trim()) return [];
    const query = tutorialSearchQuery.trim().toLowerCase();
    return steps.filter((step) => {
      const text = [step.title, step.instruction, ...(step.keywords || [])].join(" ").toLowerCase();
      return text.includes(query);
    });
  }, [steps, tutorialSearchQuery]);

  function logTutorialTouch(eventType, details = {}) {
    void logTouchInteraction({
      participantId: studyContext?.participantId || null,
      sessionId: studyContext?.sessionId || null,
      conditionId: studyContext?.conditionId || null,
      taskId: studyContext?.taskId || null,
      trialType: studyContext?.trialType || null,
      tutorialId: tutorial?.id || tutorialId,
      eventType,
      elapsedMsFromTaskStart: getElapsedMsFromStartedAt(studyContext?.startedAt),
      stepIndexBefore: details.stepIndexBefore ?? activeStepIndex,
      stepIndexAfter: details.stepIndexAfter ?? activeStepIndex,
      fallbackUsed: isVoiceCondition,
      metadata: {
        taskTrialId: studyContext?.taskTrialId || null,
        allowedModality,
        ...(details.metadata || {}),
      },
    });
  }

  function goToStep(nextIndex, eventType = "step_jump", metadata = {}, options = {}) {
    if (!steps.length) {
      return {
        success: false,
        stepIndexBefore: activeStepIndex,
        stepIndexAfter: activeStepIndex,
        message: "No steps are available.",
      };
    }
    const clampedIndex = Math.max(0, Math.min(nextIndex, steps.length - 1));
    const previousIndex = activeStepIndex;
    setActiveStepIndex(clampedIndex);
    setIsCompleted(false);
    setFeedbackMessage(options.message || `Moved to step ${clampedIndex + 1} of ${steps.length}.`);
    if (options.logTouch !== false) {
      logTutorialTouch(eventType, {
        stepIndexBefore: previousIndex,
        stepIndexAfter: clampedIndex,
        metadata,
      });
    }

    return {
      success: true,
      stepIndexBefore: previousIndex,
      stepIndexAfter: clampedIndex,
      message: options.message || `Moved to step ${clampedIndex + 1} of ${steps.length}.`,
    };
  }

  function handlePrevious() {
    goToStep(activeStepIndex - 1, "step_previous");
  }

  function handleNext() {
    goToStep(activeStepIndex + 1, "step_next");
  }

  function handleRepeat() {
    if (!currentStep) return;
    const message = `Repeat step ${currentStep.stepNumber}: ${currentStep.instruction}`;
    setFeedbackMessage(message);
    logTutorialTouch("repeat_instruction", {
      metadata: { instruction: currentStep.instruction },
    });
  }

  function handleToggleMaterials() {
    const nextValue = !isMaterialsOpen;
    setIsMaterialsOpen(nextValue);
    setFeedbackMessage(nextValue ? "Materials shown." : "Materials hidden.");
    logTutorialTouch(nextValue ? "materials_open" : "materials_close");
  }

  function handleToggleOverview() {
    const nextValue = !isOverviewOpen;
    setIsOverviewOpen(nextValue);
    setFeedbackMessage(nextValue ? "Tutorial overview shown." : "Tutorial overview hidden.");
    logTutorialTouch(nextValue ? "overview_open" : "overview_close");
  }

  function handleTutorialSearchChange(value) {
    setTutorialSearchQuery(value);
    logTutorialTouch("tutorial_search", {
      metadata: { query: value },
    });
  }

  function handleSearchJump(index) {
    goToStep(index, "search_result_jump", { query: tutorialSearchQuery });
  }

  function handleComplete() {
    setIsCompleted(true);
    setFeedbackMessage(`Tutorial complete. You reviewed ${steps.length} steps.`);
    logTutorialTouch("tutorial_complete", {
      stepIndexBefore: activeStepIndex,
      stepIndexAfter: activeStepIndex,
      metadata: {
        totalSteps: steps.length,
        completedAtStep: activeStepIndex + 1,
      },
    });
  }

  function getScrollableTutorialTarget() {
    const target = tutorialMainRef.current;
    if (!target) return null;
    return target.scrollHeight > target.clientHeight + 8 ? target : null;
  }

  function getScrollAmount(ratio) {
    if (typeof window === "undefined") return 480;
    return Math.round(window.innerHeight * ratio);
  }

  function scrollByAmount(amount) {
    const target = getScrollableTutorialTarget();
    if (target) {
      target.scrollBy({ top: amount, behavior: "smooth" });
      return "tutorial_content";
    }

    if (typeof window !== "undefined") {
      window.scrollBy({ top: amount, behavior: "smooth" });
    }
    return "window";
  }

  function scrollToPosition(position) {
    const target = getScrollableTutorialTarget();
    if (target) {
      target.scrollTo({ top: position === "top" ? 0 : target.scrollHeight, behavior: "smooth" });
      return "tutorial_content";
    }

    if (typeof window !== "undefined") {
      const shell = tutorialShellRef.current;
      const currentY = window.scrollY || document.documentElement.scrollTop || 0;
      const targetY = shell
        ? shell.getBoundingClientRect()[position === "top" ? "top" : "bottom"] + currentY
        : position === "top"
          ? 0
          : document.documentElement.scrollHeight;
      const top = position === "top" ? targetY : targetY - window.innerHeight;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
    return "window";
  }

  function performScrollCommand(intent, stepIndexBefore) {
    const downward = intent === VOICE_INTENTS.SCROLL_DOWN || intent === VOICE_INTENTS.PAGE_DOWN;
    const pageSized = intent === VOICE_INTENTS.PAGE_DOWN || intent === VOICE_INTENTS.PAGE_UP;

    if (intent === VOICE_INTENTS.SCROLL_TOP) {
      const scrollTarget = scrollToPosition("top");
      const message = "Moved to the top.";
      setFeedbackMessage(message);
      return {
        message,
        stepIndexBefore,
        stepIndexAfter: stepIndexBefore,
        metadata: { scrollTarget, scrollAction: intent },
      };
    }

    if (intent === VOICE_INTENTS.SCROLL_BOTTOM) {
      const scrollTarget = scrollToPosition("bottom");
      const message = "Moved to the bottom.";
      setFeedbackMessage(message);
      return {
        message,
        stepIndexBefore,
        stepIndexAfter: stepIndexBefore,
        metadata: { scrollTarget, scrollAction: intent },
      };
    }

    const amount = getScrollAmount(pageSized ? PAGE_AMOUNT_RATIO : SCROLL_AMOUNT_RATIO);
    const scrollTarget = scrollByAmount(downward ? amount : -amount);
    const message = downward ? "Scrolled down." : "Scrolled up.";
    setFeedbackMessage(message);
    return {
      message,
      stepIndexBefore,
      stepIndexAfter: stepIndexBefore,
      metadata: { scrollTarget, scrollAction: intent, amount: downward ? amount : -amount },
    };
  }

  function executeVoiceCommand(parsed) {
    const stepIndexBefore = activeStepIndex;

    switch (parsed.intent) {
      case VOICE_INTENTS.NEXT_STEP: {
        if (isLastStep || isCompleted) {
          return voiceFailure("You are already at the last available step.", "last_step_reached", stepIndexBefore);
        }
        const moveResult = goToStep(activeStepIndex + 1, "voice_step_next", {}, {
          logTouch: false,
          message: `Moved to step ${activeStepIndex + 2}.`,
        });
        return voiceSuccess("voice_command", moveResult.message, moveResult);
      }
      case VOICE_INTENTS.PREVIOUS_STEP: {
        if (isFirstStep) {
          return voiceFailure("You are already at the first step.", "first_step_reached", stepIndexBefore);
        }
        const moveResult = goToStep(activeStepIndex - 1, "voice_step_previous", {}, {
          logTouch: false,
          message: `Moved to step ${activeStepIndex}.`,
        });
        return voiceSuccess("voice_command", moveResult.message, moveResult);
      }
      case VOICE_INTENTS.REPEAT_INSTRUCTION: {
        if (!currentStep) return voiceFailure("No current instruction is available.", "missing_current_step", stepIndexBefore);
        const message = `Repeat step ${currentStep.stepNumber}: ${currentStep.instruction}`;
        setFeedbackMessage(message);
        return voiceSuccess("voice_command", message, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
          metadata: { instruction: currentStep.instruction },
        });
      }
      case VOICE_INTENTS.SHOW_MATERIALS: {
        setIsMaterialsOpen(true);
        setFeedbackMessage("Materials shown.");
        return voiceSuccess("voice_command", "Materials panel opened.", {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.CLOSE_MATERIALS: {
        setIsMaterialsOpen(false);
        setFeedbackMessage("Materials hidden.");
        return voiceSuccess("voice_command", "Materials panel closed.", {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.SHOW_OVERVIEW: {
        setIsOverviewOpen(true);
        setFeedbackMessage("Tutorial overview shown.");
        return voiceSuccess("voice_command", "Tutorial overview shown.", {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.SEARCH: {
        if (!parsed.query) return voiceFailure("Please include a search term.", "missing_search_query", stepIndexBefore);
        setTutorialSearchQuery(parsed.query);
        setFeedbackMessage(`Searching this tutorial for "${parsed.query}".`);
        return voiceSuccess("voice_command", `Searching for "${parsed.query}".`, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
          metadata: { query: parsed.query },
        });
      }
      case VOICE_INTENTS.HELP: {
        const message = "Showing voice command examples.";
        setFeedbackMessage(message);
        return voiceSuccess("voice_command", message, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
          showHelp: true,
        });
      }
      case VOICE_INTENTS.STOP_LISTENING: {
        const message = "Voice listening stopped. You can still use the buttons.";
        setFeedbackMessage(message);
        return voiceSuccess("voice_stop_listening", message, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.GO_TO_STEP: {
        const targetIndex = parsed.stepNumber - 1;
        if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= steps.length) {
          return voiceFailure(
            `That step does not exist. Try a number between 1 and ${steps.length}.`,
            "step_out_of_range",
            stepIndexBefore
          );
        }
        const moveResult = goToStep(targetIndex, "voice_go_to_step", { stepNumber: parsed.stepNumber }, {
          logTouch: false,
          message: `Moved to step ${parsed.stepNumber}.`,
        });
        return voiceSuccess("voice_command", moveResult.message, moveResult);
      }
      case VOICE_INTENTS.SCROLL_DOWN:
      case VOICE_INTENTS.SCROLL_UP:
      case VOICE_INTENTS.PAGE_DOWN:
      case VOICE_INTENTS.PAGE_UP:
      case VOICE_INTENTS.SCROLL_TOP:
      case VOICE_INTENTS.SCROLL_BOTTOM: {
        const scrollResult = performScrollCommand(parsed.intent, stepIndexBefore);
        return voiceSuccess("voice_command", scrollResult.message, scrollResult);
      }
      default:
        return voiceFailure("I do not recognize that command yet.", "unsupported_intent", stepIndexBefore);
    }
  }

  function voiceSuccess(eventType, message, details = {}) {
    return {
      success: true,
      eventType,
      message,
      stepIndexBefore: details.stepIndexBefore ?? activeStepIndex,
      stepIndexAfter: details.stepIndexAfter ?? activeStepIndex,
      metadata: details.metadata || {},
      showHelp: details.showHelp || false,
    };
  }

  function voiceFailure(message, failureReason, stepIndexBefore) {
    setFeedbackMessage(message);
    return {
      success: false,
      eventType: "voice_command_failed",
      message,
      failureReason,
      recoveryType: "repeat_or_touch_fallback",
      stepIndexBefore,
      stepIndexAfter: activeStepIndex,
    };
  }

  const voiceCommands = useVoiceCommands({
    tutorialId: tutorial?.id || tutorialId,
    participantId: studyContext?.participantId || null,
    sessionId: studyContext?.sessionId || null,
    conditionId: studyContext?.conditionId || null,
    taskId: studyContext?.taskId || null,
    trialType: studyContext?.trialType || null,
    enabled: voiceControlsEnabled,
    getStepIndex: () => activeStepIndex,
    onCommand: executeVoiceCommand,
  });
  const TutorialHeading = embedded ? "h2" : "h1";

  return (
    <section className={embedded ? "study-tutorial-embed" : "page-section tutorial-page-section"}>
      {!embedded ? (
        <Link className="inline-link" to={backLink}>
          <ArrowLeft aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}
      <div className="detail-shell tutorial-detail-shell" ref={tutorialShellRef}>
        <div className="tutorial-runner-header">
          <div>
            <p className="eyebrow">{isStudyMode ? "Guided tutorial" : "Tutorial"}</p>
            {isLoading ? (
              <p className="status-note">Loading tutorial...</p>
            ) : resultMeta.error ? (
              <>
                <TutorialHeading>Tutorial unavailable</TutorialHeading>
                <p>We could not load this tutorial. Please try another one.</p>
              </>
            ) : (
              <>
                <TutorialHeading>{tutorial.title}</TutorialHeading>
                <p>{tutorial.description}</p>
              </>
            )}
          </div>

          {tutorial && currentStep ? (
            <div className="tutorial-meta-row">
              <span>{tutorial.category}</span>
              <span>{tutorial.estimatedMinutes} min</span>
              <span>{steps.length} steps</span>
              {isStudyMode ? <span>{formatModeLabel(studyContext.conditionId)}</span> : null}
              {isStudyMode ? <span>{formatTaskType(studyContext.trialType)}</span> : null}
              {isStudyMode ? <span>{formatModality(studyContext.modality)}</span> : null}
            </div>
          ) : null}
        </div>

        {tutorial && currentStep ? (
          <div className="tutorial-task-layout">
            <section className="tutorial-main-column" aria-label="Current tutorial step" ref={tutorialMainRef}>
              <div className="progress-shell" aria-label={`Step ${activeStepIndex + 1} of ${steps.length}`}>
                <span style={{ width: `${progressValue}%` }} />
              </div>

              <LiveFeedback message={feedbackMessage} />

              {isCompleted ? (
                <section className="completion-summary" aria-live="polite">
                  <CheckCircle2 aria-hidden="true" />
                  <div>
                    <h2>Tutorial complete</h2>
                    <p>
                      {isStudyMode
                        ? "Nice work. You can review steps, search this tutorial, or continue the guided session when ready."
                        : "Nice work. You can review steps, search this tutorial, or return to the catalog when ready."}
                    </p>
                  </div>
                </section>
              ) : null}

              <StepCard
                step={currentStep}
                stepIndex={activeStepIndex}
                totalSteps={steps.length}
                isCurrent
              />

              <TouchControls
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isOverviewOpen={isOverviewOpen}
                isCompleted={isCompleted}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onRepeat={handleRepeat}
                onToggleOverview={handleToggleOverview}
                onComplete={handleComplete}
              />
            </section>

            <aside className="tutorial-side-column" aria-label="Tutorial tools">
              {voiceControlsEnabled ? (
                <VoiceControlPanel
                  voiceState={voiceCommands.voiceState}
                  isVoiceEnabled={voiceCommands.isVoiceEnabled}
                  isRestarting={voiceCommands.isRestarting}
                  browserSupported={voiceCommands.browserSupported}
                  transcript={voiceCommands.transcript}
                  errorMessage={voiceCommands.errorMessage}
                  voiceFeedback={voiceCommands.voiceFeedback}
                  lastParse={voiceCommands.lastParse}
                  commandHints={voiceCommands.commandHints}
                  showCommandHints={voiceCommands.showCommandHints}
                  onToggleHints={() => voiceCommands.setShowCommandHints((current) => !current)}
                  onStartListening={voiceCommands.startListening}
                  onStopListening={voiceCommands.stopListening}
                />
              ) : (
                <p className="status-note" role="status">
                  Voice commands are off in touch mode. Use the buttons below.
                </p>
              )}

              <MaterialsPanel
                materials={tutorial.materials || []}
                isOpen={isMaterialsOpen}
                onToggle={handleToggleMaterials}
              />

              {/* <TutorialSearch
                query={tutorialSearchQuery}
                onQueryChange={handleTutorialSearchChange}
                results={searchResults}
                onJumpToStep={handleSearchJump}
              /> */}

              <StepOverview
                steps={steps}
                activeStepIndex={activeStepIndex}
                onJumpToStep={(index) => goToStep(index, "overview_step_jump")}
                isOpen={isOverviewOpen}
              />
            </aside>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function formatModeLabel(conditionId) {
  if (conditionId === "condition_1") return "Mode 1";
  if (conditionId === "condition_2") return "Mode 2";
  return "Guided mode";
}

function formatTaskType(trialType) {
  return trialType === "practice" ? "Practice" : "Task";
}

function formatModality(modality) {
  if (modality === "voice") return "Voice mode";
  if (modality === "touch") return "Touch mode";
  return "Tutorial mode";
}
