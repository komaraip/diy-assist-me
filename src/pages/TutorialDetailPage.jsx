import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StepCard } from "../components/tutorial/StepCard.jsx";
import { TutorialBottomBar } from "../components/tutorial/TutorialBottomBar.jsx";
import { TutorialToolsSheet } from "../components/tutorial/TutorialToolsSheet.jsx";
import { useVoiceCommands } from "../hooks/useVoiceCommands.js";
import { logTouchInteraction } from "../services/logService.js";
import { getTutorialById } from "../services/tutorialService.js";
import { getElapsedMsFromStartedAt } from "../utils/studyContext.js";
import { VOICE_INTENTS, VOICE_STATES } from "../utils/voiceIntents.js";

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
  const [activeMobilePanel, setActiveMobilePanel] = useState(null);
  const [activePanelTrigger, setActivePanelTrigger] = useState(null);
  const [tutorialSearchQuery, setTutorialSearchQuery] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const tutorialShellRef = useRef(null);
  const tutorialMainRef = useRef(null);
  const commandsButtonRef = useRef(null);
  const materialsButtonRef = useRef(null);
  const desktopCommandsButtonRef = useRef(null);

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
  const isVoiceCondition = studyContext?.modality === "voice";
  const voiceControlsEnabled = allowedModality !== "touch";
  const progressValue = steps.length ? ((activeStepIndex + 1) / steps.length) * 100 : 0;
  function logTutorialTouch(eventType, details = {}) {
    void logTouchInteraction({
      participantId: studyContext?.participantId || null,
      participantCode: studyContext?.participantCode || "",
      sessionId: studyContext?.sessionId || null,
      conditionId: studyContext?.conditionId || null,
      conditionOrder: studyContext?.conditionOrder ?? null,
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

  function setMaterialsVisibility(nextValue, { logTouch = true } = {}) {
    if (isMaterialsOpen === nextValue) return;
    setIsMaterialsOpen(nextValue);
    setFeedbackMessage(nextValue ? "Materials shown." : "Materials hidden.");
    if (logTouch) {
      logTutorialTouch(nextValue ? "materials_open" : "materials_close");
    }
  }

  function handleToggleMaterials() {
    setMaterialsVisibility(!isMaterialsOpen);
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

  function handleOverviewJump(index) {
    goToStep(index, "overview_step_jump");
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

  function handleOpenCommandsPanel(trigger = null) {
    setActivePanelTrigger(trigger);
    setActiveMobilePanel("commands");
  }

  function handleOpenMaterialsPanel(trigger = null) {
    setMaterialsVisibility(true);
    setActivePanelTrigger(trigger);
    setActiveMobilePanel("materials");
  }

  function handleCloseMobilePanel() {
    if (activeMobilePanel === "materials") {
      setMaterialsVisibility(false);
    }
    setActivePanelTrigger(null);
    setActiveMobilePanel(null);
  }

  function openMobilePanelIfCompact(panel) {
    if (isCompactTutorialViewport()) {
      setActivePanelTrigger(null);
      setActiveMobilePanel(panel);
    }
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
        setMaterialsVisibility(true, { logTouch: false });
        openMobilePanelIfCompact("materials");
        setFeedbackMessage("Materials shown.");
        return voiceSuccess("voice_command", "Materials panel opened.", {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.CLOSE_MATERIALS: {
        setMaterialsVisibility(false, { logTouch: false });
        if (activeMobilePanel === "materials") {
          setActiveMobilePanel(null);
        }
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
        setActivePanelTrigger(null);
        setActiveMobilePanel("commands");
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
    participantCode: studyContext?.participantCode || "",
    sessionId: studyContext?.sessionId || null,
    conditionId: studyContext?.conditionId || null,
    conditionOrder: studyContext?.conditionOrder ?? null,
    taskId: studyContext?.taskId || null,
    trialType: studyContext?.trialType || null,
    taskStartedAt: studyContext?.startedAt || null,
    enabled: voiceControlsEnabled,
    getStepIndex: () => activeStepIndex,
    onCommand: executeVoiceCommand,
  });
  const isVoiceOn =
    voiceCommands.isVoiceEnabled ||
    voiceCommands.isRestarting ||
    voiceCommands.voiceState === VOICE_STATES.LISTENING ||
    voiceCommands.voiceState === VOICE_STATES.PROCESSING;
  const isVoiceListening = voiceCommands.voiceState === VOICE_STATES.LISTENING;
  const commandPopoverId = "tutorial-command-popover";
  const materialsPopoverId = "tutorial-materials-popover";
  const commandTriggerRef =
    activePanelTrigger === "desktopCommands"
      ? desktopCommandsButtonRef
      : activePanelTrigger === "mobileCommands"
        ? commandsButtonRef
        : null;
  const materialsTriggerRef = activePanelTrigger === "mobileMaterials" ? materialsButtonRef : null;
  const TutorialHeading = embedded ? "h2" : "h1";

  function handleToggleVoice() {
    if (!voiceControlsEnabled || !voiceCommands.browserSupported) return;
    if (isVoiceOn) {
      voiceCommands.stopListening();
    } else {
      voiceCommands.startListening();
    }
  }

  return (
    <section className={embedded ? "study-tutorial-embed" : "page-section tutorial-page-section"}>
      {!embedded ? (
        <Link className="inline-link" to={backLink}>
          <ArrowLeft aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}
      <div className="detail-shell tutorial-detail-shell tutorial-runner" ref={tutorialShellRef}>
        {isLoading ? (
          <section className="tutorial-content-card tutorial-loading-card">
            <p className="status-note">Loading tutorial...</p>
          </section>
        ) : null}

        {!isLoading && resultMeta.error ? (
          <section className="tutorial-content-card tutorial-loading-card">
            <TutorialHeading>Tutorial unavailable</TutorialHeading>
            <p>We could not load this tutorial. Please try another one.</p>
          </section>
        ) : null}

        {tutorial && currentStep ? (
          <>
            <div className="tutorial-task-layout">
              <section
                className="tutorial-main-column tutorial-content-card"
                aria-label="Current tutorial step"
                ref={tutorialMainRef}
              >
                <div className="tutorial-runner-header">
                  <div className="tutorial-header-topline">
                    <p className="eyebrow">Tutorial</p>

                    <div className="tutorial-meta-row">
                      <span>{tutorial.category}</span>
                      {tutorial.estimatedMinutes ? <span>{tutorial.estimatedMinutes} min</span> : null}
                      <span>{steps.length} steps</span>
                    </div>
                  </div>

                  <div>
                    <TutorialHeading>{tutorial.title}</TutorialHeading>
                  </div>
                </div>

                <div className="tutorial-progress-block">
                  <span className="tutorial-progress-label">
                    Step {activeStepIndex + 1} of {steps.length}
                  </span>
                  <div
                    className="progress-shell"
                    aria-label={`Step ${activeStepIndex + 1} of ${steps.length}`}
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={steps.length}
                    aria-valuenow={activeStepIndex + 1}
                  >
                    <span style={{ width: `${progressValue}%` }} />
                  </div>
                </div>

                <StepCard step={currentStep} isCurrent />
              </section>

              <TutorialToolsSheet
                commandPopoverId={commandPopoverId}
                materialsPopoverId={materialsPopoverId}
                activeMobilePanel={activeMobilePanel}
                onCloseMobilePanel={handleCloseMobilePanel}
                commandTriggerRef={commandTriggerRef}
                materialsTriggerRef={materialsTriggerRef}
                desktopCommandTriggerRef={desktopCommandsButtonRef}
                voiceControlsEnabled={voiceControlsEnabled}
                voicePanelProps={{
                  voiceState: voiceCommands.voiceState,
                  isVoiceEnabled: voiceCommands.isVoiceEnabled,
                  isRestarting: voiceCommands.isRestarting,
                  browserSupported: voiceCommands.browserSupported,
                  transcript: voiceCommands.transcript,
                  errorMessage: voiceCommands.errorMessage,
                  voiceFeedback: voiceCommands.voiceFeedback,
                }}
                isVoiceOn={isVoiceOn}
                onToggleVoice={handleToggleVoice}
                onOpenCommandsPanel={handleOpenCommandsPanel}
                commandHints={voiceCommands.commandHints}
                materials={tutorial.materials || []}
                isMaterialsOpen={isMaterialsOpen}
                onToggleMaterials={handleToggleMaterials}
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isCompleted={isCompleted}
                onPrevious={handlePrevious}
                onRepeat={handleRepeat}
                onNext={handleNext}
                onComplete={handleComplete}
              />
            </div>

            <TutorialBottomBar
              showVoiceControl={voiceControlsEnabled}
              isVoiceOn={isVoiceOn}
              browserSupported={voiceCommands.browserSupported}
              onToggleVoice={handleToggleVoice}
              isListening={isVoiceListening}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              isCompleted={isCompleted}
              onPrevious={handlePrevious}
              onRepeat={handleRepeat}
              onNext={handleNext}
              onComplete={handleComplete}
              onOpenCommands={() => handleOpenCommandsPanel("mobileCommands")}
              onOpenMaterials={() => handleOpenMaterialsPanel("mobileMaterials")}
              isCommandsOpen={activeMobilePanel === "commands"}
              isMaterialsOpen={activeMobilePanel === "materials"}
              commandsPanelId={commandPopoverId}
              materialsPanelId={materialsPopoverId}
              commandsButtonRef={commandsButtonRef}
              materialsButtonRef={materialsButtonRef}
            />

            <div className="tutorial-mobile-safe-space" aria-hidden="true" />
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {feedbackMessage || `Current step ${activeStepIndex + 1} of ${steps.length}.`}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function isCompactTutorialViewport() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(max-width: 900px)").matches;
}
