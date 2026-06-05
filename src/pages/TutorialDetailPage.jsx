import { ArrowLeft, ClipboardList, ChevronLeft, ChevronRight, RotateCcw, Mic, MicOff, HelpCircle, CheckCircle2, Clock, Package } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StepCard } from "../components/tutorial/StepCard.jsx";
import { TaskTrialControls } from "../components/guided-session/TaskTrialControls.jsx";
import { StepOverview } from "../components/tutorial/StepOverview.jsx";
import { TutorialBottomBar } from "../components/tutorial/TutorialBottomBar.jsx";
import { TutorialSearch } from "../components/tutorial/TutorialSearch.jsx";
import { TutorialToolsSheet } from "../components/tutorial/TutorialToolsSheet.jsx";
import { useVoiceCommands } from "../hooks/useVoiceCommands.js";
import { logTouchInteraction } from "../services/logService.js";
import { getTutorialById } from "../services/tutorialService.js";
import { getElapsedMsFromStartedAt } from "../utils/studyContext.js";
import { VOICE_INTENTS, VOICE_STATES } from "../utils/voiceIntents.js";
import { getSpeechRecognitionLocale, getStudyCopy, normalizeStudyLanguage } from "../config/guidedSessionContent.js";
import { TutorialPopover } from "../components/tutorial/TutorialPopover.jsx";
import { MaterialsPanel } from "../components/tutorial/MaterialsPanel.jsx";
import { VoiceControlPanel } from "../components/tutorial/VoiceControlPanel.jsx";
import { TutorialIconButton } from "../components/tutorial/TutorialIconButton.jsx";

const SCROLL_AMOUNT_RATIO = 0.6;
const PAGE_AMOUNT_RATIO = 0.9;
const FALLBACK_TOUCH_WINDOW_MS = 30000;

export function TutorialDetailPage({
  tutorialIdOverride = null,
  studyContext = null,
  allowedModality = "all",
  backLink = "/tutorials",
  backLabel = "Back to tutorials",
  embedded = false,
  language = "en",
  task = null,
  taskTrial = null,
  isStarting = false,
  isCompleting = false,
  onStart = null,
  onComplete = null,
  requiredActionStatus = null,
  taskScript = [],
}) {
  const { tutorialId: routeTutorialId } = useParams();
  const tutorialId = tutorialIdOverride || routeTutorialId;
  const normalizedLanguage = normalizeStudyLanguage(language);
  const pageCopy = getStudyCopy(normalizedLanguage);
  const copy = pageCopy.tutorial;
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
  const lastWindowScrollTopRef = useRef(0);
  const lastTutorialScrollTopRef = useRef(0);
  const lastScrollLogAtRef = useRef(0);
  const commandsButtonRef = useRef(null);
  const materialsButtonRef = useRef(null);
  const desktopCommandsButtonRef = useRef(null);
  const lastVoiceFailureRef = useRef(null);
  const repeatSpeechTokenRef = useRef(0);
  const repeatSpeechShouldResumeVoiceRef = useRef(false);

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
  }, [normalizedLanguage, tutorialId]);

  useEffect(() => {
    const speechSynthesis = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!speechSynthesis || typeof speechSynthesis.getVoices !== "function") return undefined;

    const loadVoices = () => {
      speechSynthesis.getVoices();
    };

    loadVoices();
    speechSynthesis.addEventListener?.("voiceschanged", loadVoices);

    return () => {
      speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    if (!studyContext?.taskTrialId) return undefined;

    function handleWindowScroll(event) {
      if (event.target !== document && event.target !== window) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const previousScrollTop = lastWindowScrollTopRef.current;
      const now = Date.now();
      lastWindowScrollTopRef.current = scrollTop;

      if (Math.abs(scrollTop - previousScrollTop) < 24 || now - lastScrollLogAtRef.current < 500) return;

      lastScrollLogAtRef.current = now;
      logTutorialTouch(scrollTop > previousScrollTop ? "scroll_down" : "scroll_up", {
        metadata: {
          scrollTop,
          previousScrollTop,
          scrollTarget: "window",
        },
      });
    }

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [studyContext?.taskTrialId, studyContext?.startedAt, activeStepIndex, logTutorialTouch]);

  const steps = tutorial?.steps || [];
  const currentStep = steps[activeStepIndex] || null;
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === steps.length - 1;
  const isVoiceCondition = studyContext?.modality === "voice";
  const voiceControlsEnabled = allowedModality !== "touch";
  const progressValue = steps.length ? ((activeStepIndex + 1) / steps.length) * 100 : 0;
  const searchResults = useMemo(
    () => getTutorialSearchResults(tutorial, tutorialSearchQuery),
    [tutorial, tutorialSearchQuery]
  );
  function logTutorialTouch(eventType, details = {}) {
    const voiceTouchMetadata = getVoiceConditionTouchMetadata(isVoiceCondition, lastVoiceFailureRef);
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
      touchUseContext: voiceTouchMetadata.touchUseContext,
      previousVoiceFailureEventId: voiceTouchMetadata.previousVoiceFailureEventId,
      metadata: {
        taskTrialId: studyContext?.taskTrialId || null,
        allowedModality,
        ...voiceTouchMetadata,
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
        message: copy.noStepsMessage,
      };
    }
    const clampedIndex = Math.max(0, Math.min(nextIndex, steps.length - 1));
    const previousIndex = activeStepIndex;
    setActiveStepIndex(clampedIndex);
    setIsCompleted(false);
    setFeedbackMessage(options.message || copy.movedToStep(clampedIndex + 1, steps.length));
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
      message: options.message || copy.movedToStep(clampedIndex + 1, steps.length),
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
    const repeatResult = speakRepeatInstruction(currentStep);
    logTutorialTouch("repeat_instruction", {
      metadata: repeatResult.metadata,
    });
  }

  function speakRepeatInstruction(step, { pauseVoiceRecognition = false } = {}) {
    const message = copy.repeatStep(step.stepNumber, step.instruction);
    setFeedbackMessage(message);

    const speechSynthesis = typeof window !== "undefined" ? window.speechSynthesis : null;
    const SpeechSynthesisUtteranceClass =
      typeof window !== "undefined" ? window.SpeechSynthesisUtterance : null;
    const baseMetadata = {
      instruction: step.instruction,
      repeatOutput: "live_feedback_only",
      speechSynthesisSupported: false,
      speechSynthesisStatus: "unsupported",
    };

    if (!speechSynthesis || typeof SpeechSynthesisUtteranceClass !== "function") {
      return { message, metadata: baseMetadata };
    }

    const token = repeatSpeechTokenRef.current + 1;
    cancelRepeatSpeech({ resumeVoice: true });
    repeatSpeechTokenRef.current = token;

    const shouldResumeVoice =
      pauseVoiceRecognition &&
      voiceCommands.isVoiceEnabled &&
      typeof voiceCommands.suspendListeningForAudio === "function" &&
      voiceCommands.suspendListeningForAudio();
    repeatSpeechShouldResumeVoiceRef.current = !!shouldResumeVoice;

    const utterance = new SpeechSynthesisUtteranceClass(step.instruction);
    utterance.lang = getSpeechRecognitionLocale(normalizedLanguage);
    const preferredVoice = getPreferredSpeechVoice(speechSynthesis, utterance.lang);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 0.92;
    utterance.pitch = 1.04;
    utterance.onend = () => finishRepeatSpeech(token);
    utterance.onerror = () => finishRepeatSpeech(token);

    try {
      speechSynthesis.speak(utterance);
      return {
        message,
        metadata: {
          ...baseMetadata,
          repeatOutput: "speech_synthesis",
          speechSynthesisSupported: true,
          speechSynthesisStatus: "started",
          speechSynthesisVoice: preferredVoice?.name || "",
        },
      };
    } catch {
      finishRepeatSpeech(token);
      return {
        message,
        metadata: {
          ...baseMetadata,
          speechSynthesisSupported: true,
          speechSynthesisStatus: "error",
          speechSynthesisVoice: preferredVoice?.name || "",
        },
      };
    }
  }

  function cancelRepeatSpeech({ resumeVoice = false } = {}) {
    repeatSpeechTokenRef.current += 1;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (resumeVoice && repeatSpeechShouldResumeVoiceRef.current) {
      repeatSpeechShouldResumeVoiceRef.current = false;
      voiceCommands.resumeListeningAfterAudio?.();
    } else if (!resumeVoice) {
      repeatSpeechShouldResumeVoiceRef.current = false;
    }
  }

  function finishRepeatSpeech(token) {
    if (repeatSpeechTokenRef.current !== token) return;
    if (!repeatSpeechShouldResumeVoiceRef.current) return;

    repeatSpeechShouldResumeVoiceRef.current = false;
    voiceCommands.resumeListeningAfterAudio?.();
  }

  function setMaterialsVisibility(nextValue, { logTouch = true } = {}) {
    if (isMaterialsOpen === nextValue) return;
    setIsMaterialsOpen(nextValue);
    setFeedbackMessage(nextValue ? copy.materialsShown : copy.materialsHidden);
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
    setFeedbackMessage(nextValue ? copy.overviewShown : copy.overviewHidden);
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
    setFeedbackMessage(copy.completeMessage(steps.length));
    logTutorialTouch("tutorial_complete", {
      stepIndexBefore: activeStepIndex,
      stepIndexAfter: activeStepIndex,
      metadata: {
        totalSteps: steps.length,
        completedAtStep: activeStepIndex + 1,
      },
    });
  }

  function handleTutorialScroll(event) {
    if (!studyContext?.taskTrialId) return;
    const scrollTop = event.currentTarget.scrollTop;
    const previousScrollTop = lastTutorialScrollTopRef.current;
    const now = Date.now();
    lastTutorialScrollTopRef.current = scrollTop;

    if (Math.abs(scrollTop - previousScrollTop) < 24 || now - lastScrollLogAtRef.current < 500) return;

    lastScrollLogAtRef.current = now;
    logTutorialTouch(scrollTop > previousScrollTop ? "scroll_down" : "scroll_up", {
      metadata: {
        scrollTop,
        previousScrollTop,
        scrollTarget: "tutorial_content",
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
    if (embedded || isCompactTutorialViewport()) {
      setActivePanelTrigger(null);
      setActiveMobilePanel(panel);
    }
  }

  function getScrollableTutorialTarget() {
    if (isCompactTutorialViewport()) return null;
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
      const message = copy.topMessage;
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
      const message = copy.bottomMessage;
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
    const message = downward ? copy.scrolledDown : copy.scrolledUp;
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
          return voiceFailure(copy.lastStepError, "last_step_reached", stepIndexBefore);
        }
        const moveResult = goToStep(activeStepIndex + 1, "voice_step_next", {}, {
          logTouch: false,
          message: copy.movedToStepShort(activeStepIndex + 2),
        });
        return voiceSuccess("voice_command", moveResult.message, moveResult);
      }
      case VOICE_INTENTS.PREVIOUS_STEP: {
        if (isFirstStep) {
          return voiceFailure(copy.firstStepError, "first_step_reached", stepIndexBefore);
        }
        const moveResult = goToStep(activeStepIndex - 1, "voice_step_previous", {}, {
          logTouch: false,
          message: copy.movedToStepShort(activeStepIndex),
        });
        return voiceSuccess("voice_command", moveResult.message, moveResult);
      }
      case VOICE_INTENTS.REPEAT_INSTRUCTION: {
        if (!currentStep) return voiceFailure(copy.missingInstructionError, "missing_current_step", stepIndexBefore);
        const repeatResult = speakRepeatInstruction(currentStep, { pauseVoiceRecognition: true });
        return voiceSuccess("voice_command", repeatResult.message, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
          metadata: repeatResult.metadata,
        });
      }
      case VOICE_INTENTS.SHOW_MATERIALS: {
        setMaterialsVisibility(true, { logTouch: false });
        openMobilePanelIfCompact("materials");
        setFeedbackMessage(copy.materialsShown);
        return voiceSuccess("voice_command", copy.materialsOpened, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.CLOSE_MATERIALS: {
        setMaterialsVisibility(false, { logTouch: false });
        if (activeMobilePanel === "materials") {
          setActiveMobilePanel(null);
        }
        setFeedbackMessage(copy.materialsHidden);
        return voiceSuccess("voice_command", copy.materialsClosed, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.SHOW_OVERVIEW: {
        setIsOverviewOpen(true);
        openMobilePanelIfCompact("overview");
        setFeedbackMessage(copy.overviewShown);
        return voiceSuccess("voice_command", copy.overviewShown, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.CLOSE_OVERVIEW: {
        setIsOverviewOpen(false);
        if (activeMobilePanel === "overview") {
          setActiveMobilePanel(null);
        }
        setFeedbackMessage(copy.overviewHidden);
        return voiceSuccess("voice_command", copy.overviewHidden, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.SEARCH: {
        if (!parsed.query) return voiceFailure(copy.missingSearchError, "missing_search_query", stepIndexBefore);
        setTutorialSearchQuery(parsed.query);
        openMobilePanelIfCompact("search");
        setFeedbackMessage(copy.searchingTutorial(parsed.query));
        return voiceSuccess("voice_command", copy.searchingFor(parsed.query), {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
          metadata: { query: parsed.query },
        });
      }
      case VOICE_INTENTS.SHOW_SEARCH: {
        openMobilePanelIfCompact("search");
        const titleText = copy.search?.heading || "Search";
        setFeedbackMessage(titleText);
        return voiceSuccess("voice_command", titleText, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.CLOSE_SEARCH: {
        if (activeMobilePanel === "search") {
          setActiveMobilePanel(null);
        }
        const hiddenText = "Search hidden.";
        setFeedbackMessage(hiddenText);
        return voiceSuccess("voice_command", hiddenText, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.HELP: {
        const message = copy.showingCommands;
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
        const message = copy.listeningStopped;
        setFeedbackMessage(message);
        return voiceSuccess("voice_stop_listening", message, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.START_LISTENING: {
        const message = "I am already listening and ready for your commands.";
        setFeedbackMessage(message);
        return voiceSuccess("voice_command", message, {
          stepIndexBefore,
          stepIndexAfter: stepIndexBefore,
        });
      }
      case VOICE_INTENTS.GO_TO_STEP: {
        const targetIndex = parsed.stepNumber - 1;
        if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= steps.length) {
          return voiceFailure(
            copy.stepOutOfRange(steps.length),
            "step_out_of_range",
            stepIndexBefore
          );
        }
        const moveResult = goToStep(targetIndex, "voice_go_to_step", { stepNumber: parsed.stepNumber }, {
          logTouch: false,
          message: copy.movedToStepShort(parsed.stepNumber),
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
        return voiceFailure(copy.unsupportedCommand, "unsupported_intent", stepIndexBefore);
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
    enabled: voiceControlsEnabled && !!taskTrial && !taskTrial.endedAt,
    language: normalizedLanguage,
    getStepIndex: () => activeStepIndex,
    onCommand: executeVoiceCommand,
    onVoiceFailure: (failure) => {
      lastVoiceFailureRef.current = failure;
    },
    onVoiceSuccess: () => {
      lastVoiceFailureRef.current = null;
    },
  });

  useEffect(() => {
    return () => {
      cancelRepeatSpeech({ resumeVoice: true });
    };
  }, [tutorialId]);

  const isVoiceOn =
    voiceCommands.isVoiceEnabled ||
    voiceCommands.isRestarting ||
    voiceCommands.voiceState === VOICE_STATES.LISTENING ||
    voiceCommands.voiceState === VOICE_STATES.PROCESSING;
  const isVoiceListening = voiceCommands.voiceState === VOICE_STATES.LISTENING;
  const shouldShowVoiceTranscript = voiceControlsEnabled && !!voiceCommands.transcript;
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

  const voiceButtonLabel = !voiceCommands.browserSupported
    ? copy.voiceUnavailable
    : isVoiceOn
      ? copy.voiceButtonOn
      : copy.voiceButtonOff;

  const commandButtonLabel = voiceControlsEnabled ? copy.commandButton : copy.commandUnavailable;

  const commandExamples = (() => {
    const commandHints = voiceCommands.commandHints || [];
    const voiceCopy = pageCopy.voice;
    const preferred = voiceCopy.preferredHints || [];
    const available = preferred.filter((hint) => commandHints.includes(hint));
    return available.length ? available : preferred;
  })();

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
            <p className="status-note">{copy.loading}</p>
          </section>
        ) : null}

        {!isLoading && resultMeta.error ? (
          <section className="tutorial-content-card tutorial-loading-card">
            <TutorialHeading>{copy.unavailableTitle}</TutorialHeading>
            <p>{copy.unavailableDescription}</p>
          </section>
        ) : null}

        {tutorial && currentStep ? (
          <>
            {embedded ? (
              taskTrial?.endedAt ? (
                <section
                  className="tutorial-content-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4rem 2rem",
                    border: "1px dashed var(--border)",
                    background: "var(--surface-soft)",
                    textAlign: "center",
                    minHeight: "240px",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(111, 144, 125, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary-dark)",
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--foreground)" }}>
                    Task Completed
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--muted)", maxWidth: "300px", margin: 0, lineHeight: 1.45 }}>
                    You have successfully completed this task.
                  </p>
                </section>
              ) : (
                <div className="tutorial-embedded-cards" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Card 1: Header/Meta */}
                  <section className="tutorial-content-card" style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "var(--foreground)", flex: "1 1 auto" }}>
                        {tutorial.title}
                      </h2>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                        <span className="status-badge" style={{ textTransform: "capitalize", background: "rgba(111, 144, 125, 0.12)", color: "var(--primary-dark)", borderColor: "rgba(111, 144, 125, 0.3)", margin: 0 }}>
                          {tutorial.category}
                        </span>
                        {tutorial.estimatedMinutes ? (
                          <span className="status-badge" style={{ margin: 0 }}>
                            <Clock size={12} style={{ marginRight: "0.25rem" }} />
                            {tutorial.estimatedMinutes} {pageCopy.shared.minutesSuffix}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.25rem" }}>
                      <div>
                        <span className="status-badge" style={{ display: "inline-block" }}>
                          {copy.stepProgress(activeStepIndex + 1, steps.length)}
                        </span>
                      </div>
                      {/* Step Progress/Loading Bar UI */}
                      <div
                        className="progress-shell"
                        aria-label={copy.stepProgress(activeStepIndex + 1, steps.length)}
                        role="progressbar"
                        aria-valuemin={1}
                        aria-valuemax={steps.length}
                        aria-valuenow={activeStepIndex + 1}
                        style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden", display: "block" }}
                      >
                        <span style={{ width: `${progressValue}%`, display: "block", height: "100%", background: "var(--primary-dark)", borderRadius: "3px", transition: "width 0.25s ease-out" }} />
                      </div>
                    </div>
                  </section>

                  {/* Single Row: Tools Buttons + Start/Finish Controls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Tools toolbar buttons */}
                      <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", flex: "0 0 auto" }}>
                        <TutorialIconButton
                          label={copy.previousStep}
                          title={copy.previousStep}
                          onClick={handlePrevious}
                          disabled={isFirstStep || !taskTrial || !!taskTrial.endedAt}
                        >
                          <ChevronLeft size={18} aria-hidden="true" />
                        </TutorialIconButton>

                        <TutorialIconButton
                          label={copy.repeatInstruction}
                          title={copy.repeatInstruction}
                          onClick={handleRepeat}
                          disabled={!taskTrial || !!taskTrial.endedAt}
                        >
                          <RotateCcw size={18} aria-hidden="true" />
                        </TutorialIconButton>

                        <TutorialIconButton
                          label={isLastStep ? copy.finishTutorial : copy.nextStep}
                          title={isLastStep ? copy.finishTutorial : copy.nextStep}
                          onClick={isLastStep ? handleComplete : handleNext}
                          disabled={(isLastStep ? isCompleted : false) || !taskTrial || !!taskTrial.endedAt}
                        >
                          {isLastStep ? <CheckCircle2 size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
                        </TutorialIconButton>

                        {voiceControlsEnabled && (
                          <TutorialIconButton
                            label={voiceButtonLabel}
                            title={voiceButtonLabel}
                            onClick={handleToggleVoice}
                            disabled={!voiceCommands.browserSupported || !taskTrial || !!taskTrial.endedAt}
                            aria-pressed={voiceCommands.browserSupported ? isVoiceOn : undefined}
                            isActive={isVoiceOn && !!taskTrial && !taskTrial.endedAt}
                            variant="primary"
                            className={isVoiceListening && !!taskTrial && !taskTrial.endedAt ? "is-listening" : ""}
                          >
                            {isVoiceOn && voiceCommands.browserSupported ? <Mic size={18} aria-hidden="true" /> : <MicOff size={18} aria-hidden="true" />}
                          </TutorialIconButton>
                        )}

                        {voiceControlsEnabled && (
                          <TutorialIconButton
                            label={commandButtonLabel}
                            title={commandButtonLabel}
                            onClick={() => setActiveMobilePanel("commands")}
                            isActive={activeMobilePanel === "commands" && !!taskTrial && !taskTrial.endedAt}
                            disabled={!taskTrial || !!taskTrial.endedAt}
                          >
                            <HelpCircle size={18} aria-hidden="true" />
                          </TutorialIconButton>
                        )}

                        <TutorialIconButton
                          label={copy.overview?.heading || "Overview"}
                          title={copy.overview?.heading || "Overview"}
                          onClick={() => setActiveMobilePanel("overview")}
                          isActive={activeMobilePanel === "overview" && !!taskTrial && !taskTrial.endedAt}
                          disabled={!taskTrial || !!taskTrial.endedAt}
                        >
                          <ClipboardList size={18} aria-hidden="true" />
                        </TutorialIconButton>

                        <TutorialIconButton
                          label={copy.search?.heading || "Search"}
                          title={copy.search?.heading || "Search"}
                          onClick={() => setActiveMobilePanel("search")}
                          isActive={activeMobilePanel === "search" && !!taskTrial && !taskTrial.endedAt}
                          disabled={!taskTrial || !!taskTrial.endedAt}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                          </svg>
                        </TutorialIconButton>

                        <TutorialIconButton
                          label={copy.materialsTitle || "Materials"}
                          title={copy.materialsTitle || "Materials"}
                          onClick={() => setActiveMobilePanel("materials")}
                          isActive={activeMobilePanel === "materials" && !!taskTrial && !taskTrial.endedAt}
                          disabled={!taskTrial || !!taskTrial.endedAt}
                        >
                          <Package size={18} aria-hidden="true" />
                        </TutorialIconButton>
                      </div>

                      {/* Voice Transcript Display */}
                      {voiceControlsEnabled && shouldShowVoiceTranscript ? (
                        <div style={{ flex: "1 1 240px", minWidth: "220px" }}>
                          <VoiceControlPanel
                            voiceState={voiceCommands.voiceState}
                            isVoiceEnabled={voiceCommands.isVoiceEnabled}
                            isRestarting={voiceCommands.isRestarting}
                            browserSupported={voiceCommands.browserSupported}
                            transcript={voiceCommands.transcript}
                            errorMessage={voiceCommands.errorMessage}
                            voiceFeedback={voiceCommands.voiceFeedback}
                            copy={pageCopy.voice}
                            showLiveMessage={false}
                            showWarning={false}
                          />
                        </div>
                      ) : null}

                    </div>

                    {voiceControlsEnabled ? (
                      <div>
                        <VoiceControlPanel
                          voiceState={voiceCommands.voiceState}
                          isVoiceEnabled={voiceCommands.isVoiceEnabled}
                          isRestarting={voiceCommands.isRestarting}
                          browserSupported={voiceCommands.browserSupported}
                          transcript={voiceCommands.transcript}
                          errorMessage={voiceCommands.errorMessage}
                          voiceFeedback={voiceCommands.voiceFeedback}
                          copy={pageCopy.voice}
                          showTranscript={false}
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Card 3: Step Content */}
                  <section
                    className="tutorial-content-card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: !taskTrial ? "center" : "stretch",
                      justifyContent: !taskTrial ? "center" : "stretch",
                      padding: !taskTrial ? "3rem 2rem" : "1.25rem",
                      border: !taskTrial ? "1px dashed var(--border)" : "1px solid var(--border)",
                      background: !taskTrial ? "var(--surface-soft)" : "rgba(255, 255, 255, 0.94)",
                      textAlign: !taskTrial ? "center" : "left",
                      minHeight: !taskTrial ? "240px" : "auto",
                      gap: "1rem",
                    }}
                  >
                    {!taskTrial ? (
                      <>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            background: "rgba(111, 144, 125, 0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--primary-dark)",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="10 8 16 12 10 16 10 8" />
                          </svg>
                        </div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--foreground)" }}>
                          Tutorial Locked
                        </h3>
                        <p style={{ fontSize: "0.88rem", color: "var(--muted)", maxWidth: "300px", margin: 0, lineHeight: 1.45 }}>
                          Click the "Start Task" button on the right of the tools card to unlock and start the tutorial steps.
                        </p>
                      </>
                    ) : (
                      <StepCard step={currentStep} isCurrent instructionLabel={copy.instructionTitle} />
                    )}
                  </section>
                </div>
              )
            ) : (
              <div className="tutorial-task-layout">
                <section
                  className="tutorial-main-column tutorial-content-card"
                  aria-label={copy.currentStepLabel}
                  ref={tutorialMainRef}
                  onScroll={handleTutorialScroll}
                >
                  <div className="tutorial-runner-header">
                    <div className="tutorial-header-topline">
                      <p className="eyebrow">{copy.sectionLabel}</p>

                      <div className="tutorial-meta-row">
                        <span>{tutorial.category}</span>
                        {tutorial.estimatedMinutes ? <span>{tutorial.estimatedMinutes} {pageCopy.shared.minutesSuffix}</span> : null}
                        <span>{pageCopy.shared.stepsSuffix(steps.length)}</span>
                      </div>
                    </div>

                    <div>
                      <TutorialHeading>{tutorial.title}</TutorialHeading>
                    </div>
                  </div>

                  <div className="tutorial-progress-block">
                    <span className="tutorial-progress-label">
                      {copy.stepProgress(activeStepIndex + 1, steps.length)}
                    </span>
                    <div
                      className="progress-shell"
                      aria-label={copy.stepProgress(activeStepIndex + 1, steps.length)}
                      role="progressbar"
                      aria-valuemin={1}
                      aria-valuemax={steps.length}
                      aria-valuenow={activeStepIndex + 1}
                    >
                      <span style={{ width: `${progressValue}%` }} />
                    </div>
                  </div>

                  <div className="tutorial-mobile-tools-bar">
                    <button
                      type="button"
                      className="button secondary-action"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", fontSize: "0.88rem", padding: "0.55rem 0.75rem", borderRadius: "8px" }}
                      onClick={() => setActiveMobilePanel("overview")}
                    >
                      <ClipboardList size={16} aria-hidden="true" />
                      {copy.overview?.heading || "Overview"}
                    </button>
                    <button
                      type="button"
                      className="button secondary-action"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", fontSize: "0.88rem", padding: "0.55rem 0.75rem", borderRadius: "8px" }}
                      onClick={() => setActiveMobilePanel("search")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      Search
                    </button>
                  </div>

                  <StepCard step={currentStep} isCurrent instructionLabel={copy.instructionTitle} />
                </section>

                <TutorialToolsSheet
                  copy={copy}
                  sharedCopy={pageCopy.shared}
                  voiceCopy={pageCopy.voice}
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
                >
                  <section className="tutorial-tool-card tutorial-overview-card" aria-labelledby="tutorial-overview-heading">
                    <StepOverview
                      headingId="tutorial-overview-heading"
                      steps={steps}
                      activeStepIndex={activeStepIndex}
                      onJumpToStep={handleOverviewJump}
                      isOpen={isOverviewOpen}
                      onToggle={handleToggleOverview}
                      copy={copy}
                    />
                  </section>

                  <section className="tutorial-tool-card tutorial-search-card">
                    <TutorialSearch
                      query={tutorialSearchQuery}
                      onQueryChange={handleTutorialSearchChange}
                      results={searchResults}
                      onJumpToStep={handleSearchJump}
                      copy={copy}
                    />
                  </section>
                </TutorialToolsSheet>
              </div>
            )}

            {!embedded && (
              <TutorialBottomBar
                copy={copy}
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
            )}

            <TutorialPopover
              id={commandPopoverId}
              title={copy.voiceCommandsTitle}
              isOpen={activeMobilePanel === "commands"}
              onClose={handleCloseMobilePanel}
              triggerRef={null}
              closeLabel={copy.closePanel(copy.voiceCommandsTitle)}
            >
              <ul className="tutorial-command-list">
                {commandExamples.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            </TutorialPopover>

            <TutorialPopover
              id={materialsPopoverId}
              title={copy.materialsTitle}
              isOpen={activeMobilePanel === "materials"}
              onClose={handleCloseMobilePanel}
              triggerRef={null}
              closeLabel={copy.closePanel(copy.materialsTitle)}
            >
              <MaterialsPanel materials={tutorial.materials || []} variant="content" panelId="mobile-materials-panel" copy={copy} />
            </TutorialPopover>

            <TutorialPopover
              id="mobile-overview-popover"
              title={copy.overview?.heading || "Overview"}
              isOpen={activeMobilePanel === "overview"}
              onClose={handleCloseMobilePanel}
              closeLabel={copy.closePanel ? copy.closePanel(copy.overview?.heading || "Overview") : "Close Overview"}
            >
              <div className="mobile-overview-wrapper" style={{ padding: "0.25rem" }}>
                <StepOverview
                  steps={steps}
                  activeStepIndex={activeStepIndex}
                  onJumpToStep={(stepNumber) => {
                    handleCloseMobilePanel();
                    handleOverviewJump(stepNumber);
                  }}
                  isOpen={true}
                  onToggle={handleCloseMobilePanel}
                  copy={copy}
                />
              </div>
            </TutorialPopover>

            <TutorialPopover
              id="mobile-search-popover"
              title={copy.search?.heading || "Search"}
              isOpen={activeMobilePanel === "search"}
              onClose={handleCloseMobilePanel}
              closeLabel={copy.closePanel ? copy.closePanel(copy.search?.heading || "Search") : "Close Search"}
            >
              <div className="mobile-search-wrapper" style={{ padding: "0.25rem" }}>
                <TutorialSearch
                  query={tutorialSearchQuery}
                  onQueryChange={handleTutorialSearchChange}
                  results={searchResults}
                  onJumpToStep={(stepNumber) => {
                    handleCloseMobilePanel();
                    handleSearchJump(stepNumber);
                  }}
                  copy={copy}
                />
              </div>
            </TutorialPopover>

            <div className="tutorial-mobile-safe-space" aria-hidden="true" />
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {feedbackMessage || copy.currentStepLive(activeStepIndex + 1, steps.length)}
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

function getVoiceConditionTouchMetadata(isVoiceCondition, lastVoiceFailureRef) {
  if (!isVoiceCondition) return {};

  const failure = lastVoiceFailureRef.current;
  const isRecentFailure = failure?.timestamp && Date.now() - failure.timestamp <= FALLBACK_TOUCH_WINDOW_MS;
  if (isRecentFailure) {
    lastVoiceFailureRef.current = null;
    return {
      touchUseContext: "fallback_after_voice_failure",
      previousVoiceFailureEventId: failure.eventId || "",
      previousVoiceFailureEventType: failure.eventType || "",
    };
  }

  return {
    touchUseContext: "voice_condition_touch_use",
  };
}

function getPreferredSpeechVoice(speechSynthesis, locale) {
  const voices = typeof speechSynthesis?.getVoices === "function" ? speechSynthesis.getVoices() : [];
  if (!voices.length) return null;

  const normalizedLocale = String(locale || "en-US").toLowerCase();
  const primaryLanguage = normalizedLocale.split("-")[0];
  const matchingVoices = voices.filter((voice) => {
    const voiceLang = String(voice.lang || "").toLowerCase();
    return voiceLang === normalizedLocale || voiceLang.startsWith(`${primaryLanguage}-`);
  });
  const candidates = matchingVoices.length ? matchingVoices : voices;

  return [...candidates].sort((left, right) => {
    return getSpeechVoiceScore(right, normalizedLocale, primaryLanguage) -
      getSpeechVoiceScore(left, normalizedLocale, primaryLanguage);
  })[0] || null;
}

function getSpeechVoiceScore(voice, normalizedLocale, primaryLanguage) {
  const name = String(voice.name || "").toLowerCase();
  const lang = String(voice.lang || "").toLowerCase();
  let score = 0;

  if (lang === normalizedLocale) score += 40;
  else if (lang.startsWith(`${primaryLanguage}-`)) score += 24;
  if (voice.localService === false) score += 10;

  if (includesAny(name, ["natural", "neural", "online", "premium", "enhanced"])) score += 28;
  if (includesAny(name, ["female", "woman"])) score += 24;
  if (includesAny(name, [
    "aria",
    "jenny",
    "zira",
    "samantha",
    "susan",
    "victoria",
    "karen",
    "moira",
    "tessa",
    "ava",
    "serena",
    "shelley",
    "libby",
    "natasha",
    "sonia",
    "olivia",
    "google uk english female",
  ])) {
    score += 18;
  }
  if (name.includes("google")) score += 8;
  if (includesAny(name, ["male", "man", "david", "mark", "george", "daniel", "fred", "thomas", "guy", "ryan", "brian", "james"])) {
    score -= 36;
  }

  return score;
}

function includesAny(value, patterns) {
  return patterns.some((pattern) => value.includes(pattern));
}

function getTutorialSearchResults(tutorial, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!tutorial || !normalizedQuery) return [];

  const tutorialContextText = normalizeSearchText([
    tutorial.title,
    tutorial.description,
    ...(tutorial.tags || []),
  ].join(" "));
  const materialText = normalizeSearchText((tutorial.materials || []).flatMap((material) => [
    material.name,
    material.quantity,
    material.unit,
    material.notes,
  ]).join(" "));

  const stepMatches = (tutorial.steps || []).filter((step) => {
    const stepText = normalizeSearchText([
      step.title,
      step.instruction,
      ...(step.keywords || []),
    ].join(" "));

    return stepText.includes(normalizedQuery);
  });

  if (stepMatches.length) return stepMatches;

  if (!tutorialContextText.includes(normalizedQuery) && !materialText.includes(normalizedQuery)) {
    return [];
  }

  return (tutorial.steps || []).filter((step) => {
    const stepText = normalizeSearchText([
      step.title,
      step.instruction,
      ...(step.keywords || []),
    ].join(" "));
    const queryTokens = normalizedQuery.split(" ").filter((token) => token.length > 2);
    return queryTokens.some((token) => stepText.includes(token));
  });
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
