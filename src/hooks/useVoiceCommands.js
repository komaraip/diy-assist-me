import { useCallback, useEffect, useRef, useState } from "react";
import { logVoiceInteraction } from "../services/logService.js";
import { appendTechnicalNote } from "../services/sessionService.js";
import { getCommandHints } from "../utils/commandDictionary.js";
import { getElapsedMsFromStartedAt } from "../utils/studyContext.js";
import { parseVoiceCommand } from "../utils/parseVoiceCommand.js";
import { VOICE_INTENTS, VOICE_STATES } from "../utils/voiceIntents.js";
import { useSpeechRecognition } from "./useSpeechRecognition.js";
import { getStudyCopy, normalizeStudyLanguage } from "../config/guidedSessionContent.js";

const RECOGNITION_ERROR_NOTE_THRESHOLD = 3;
const RECOGNITION_ERROR_NOTE_INTERVAL = 10;

export function useVoiceCommands({
  tutorialId,
  participantId = null,
  participantCode = "",
  sessionId = null,
  conditionId = null,
  conditionOrder = null,
  taskId = null,
  trialType = null,
  taskStartedAt = null,
  enabled = true,
  language = "en",
  getStepIndex,
  onCommand,
  onVoiceFailure,
  onVoiceSuccess,
}) {
  const normalizedLanguage = normalizeStudyLanguage(language);
  const copy = getStudyCopy(normalizedLanguage).voice;
  const [voiceFeedback, setVoiceFeedback] = useState("");
  const [lastParse, setLastParse] = useState(null);
  const [showCommandHints, setShowCommandHints] = useState(false);
  const onCommandRef = useRef(onCommand);
  const onVoiceFailureRef = useRef(onVoiceFailure);
  const onVoiceSuccessRef = useRef(onVoiceSuccess);
  const getStepIndexRef = useRef(getStepIndex);
  const unsupportedLoggedRef = useRef(false);
  const stopListeningRef = useRef(null);
  const recognitionErrorStatsRef = useRef({});
  const lastFailureRef = useRef(null);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    onVoiceFailureRef.current = onVoiceFailure;
  }, [onVoiceFailure]);

  useEffect(() => {
    onVoiceSuccessRef.current = onVoiceSuccess;
  }, [onVoiceSuccess]);

  useEffect(() => {
    getStepIndexRef.current = getStepIndex;
  }, [getStepIndex]);

  useEffect(() => {
    recognitionErrorStatsRef.current = {};
  }, [sessionId, taskId, trialType]);

  const handleRecognitionError = useCallback(
    async ({ recognitionErrorCode, message }) => {
      if (!enabled) return;

      setVoiceFeedback(message);
      if (sessionId) {
        const technicalNote = getRecognitionErrorTechnicalNote({
          recognitionErrorStats: recognitionErrorStatsRef.current,
          recognitionErrorCode,
          message,
        });
        if (technicalNote) {
          await appendTechnicalNote(sessionId, technicalNote);
        }
      }
      const logResult = await logVoiceInteraction({
        participantId,
        participantCode,
        sessionId,
        conditionId,
        conditionOrder,
        taskId,
        trialType,
        tutorialId,
        eventType: recognitionErrorCode === "unsupported-browser" ? "voice_unsupported" : "voice_recognition_error",
        recognized: false,
        recognitionErrorCode,
        matchedIntent: null,
        confidenceType: "unknown",
        commandSuccess: false,
        failureReason: message,
        recoveryType: "touch_fallback_available",
        isRecoveryAttempt: false,
        recoveryAttemptType: "",
        fallbackUsed: false,
        elapsedMsFromTaskStart: getElapsedMsFromStartedAt(taskStartedAt),
        stepIndexBefore: getStepIndexRef.current?.() ?? null,
        stepIndexAfter: getStepIndexRef.current?.() ?? null,
      });
      onVoiceFailureRef.current?.({
        eventId: logResult.data?.id || "",
        log: logResult.data || null,
        eventType: recognitionErrorCode === "unsupported-browser" ? "voice_unsupported" : "voice_recognition_error",
        timestamp: Date.now(),
        failureReason: message,
      });
      lastFailureRef.current = {
        normalizedTranscript: "",
        matchedIntent: null,
        timestamp: Date.now(),
      };
    },
    [conditionId, conditionOrder, enabled, participantCode, participantId, sessionId, taskId, taskStartedAt, trialType, tutorialId]
  );

  const handleFinalResult = useCallback(
    async ({ rawTranscript, confidence }) => {
      if (!enabled) {
        return { success: false };
      }

      const parsed = parseVoiceCommand(rawTranscript, normalizedLanguage);
      const stepIndexBefore = getStepIndexRef.current?.() ?? null;
      const recoveryAttempt = getRecoveryAttempt({
        previousFailure: lastFailureRef.current,
        parsed,
      });
      setLastParse(parsed);

      if (parsed.intent === VOICE_INTENTS.UNKNOWN) {
        const message = copy.unknownCommand(rawTranscript);
        setVoiceFeedback(message);
        const logResult = await logVoiceInteraction({
          participantId,
          participantCode,
          sessionId,
          conditionId,
          conditionOrder,
          taskId,
          trialType,
          tutorialId,
          eventType: "voice_no_match",
          rawTranscript,
          normalizedTranscript: parsed.normalizedTranscript,
          recognized: false,
          matchedIntent: parsed.intent,
          confidenceType: parsed.confidenceType,
          commandSuccess: false,
          failureReason: "no_matching_intent",
          recoveryType: "repeat_or_touch_fallback",
          isRecoveryAttempt: recoveryAttempt.isRecoveryAttempt,
          recoveryAttemptType: recoveryAttempt.recoveryAttemptType,
          fallbackUsed: false,
          elapsedMsFromTaskStart: getElapsedMsFromStartedAt(taskStartedAt),
          stepIndexBefore,
          stepIndexAfter: getStepIndexRef.current?.() ?? stepIndexBefore,
          speechConfidence: confidence,
          metadata: { speechConfidence: confidence },
        });
        onVoiceFailureRef.current?.({
          eventId: logResult.data?.id || "",
          log: logResult.data || null,
          eventType: "voice_no_match",
          timestamp: Date.now(),
          failureReason: "no_matching_intent",
        });
        lastFailureRef.current = {
          normalizedTranscript: parsed.normalizedTranscript,
          matchedIntent: parsed.intent,
          timestamp: Date.now(),
        };
        return { success: false };
      }

      const dispatchResult = await onCommandRef.current?.(parsed);
      const success = !!dispatchResult?.success;
      const message = dispatchResult?.message || copy.commandCompleted;
      setVoiceFeedback(message);

      if (dispatchResult?.showHelp) {
        setShowCommandHints(true);
      }

      const logResult = await logVoiceInteraction({
        participantId,
        participantCode,
        sessionId,
        conditionId,
        conditionOrder,
        taskId,
        trialType,
        tutorialId,
        eventType: dispatchResult?.eventType || (success ? "voice_command" : "voice_command_failed"),
        rawTranscript,
        normalizedTranscript: parsed.normalizedTranscript,
        recognized: true,
        recognitionErrorCode: null,
        matchedIntent: parsed.intent,
        confidenceType: parsed.confidenceType,
        commandSuccess: success,
        failureReason: dispatchResult?.failureReason || null,
        recoveryType: dispatchResult?.recoveryType || null,
        isRecoveryAttempt: recoveryAttempt.isRecoveryAttempt,
        recoveryAttemptType: recoveryAttempt.recoveryAttemptType,
        fallbackUsed: false,
        elapsedMsFromTaskStart: getElapsedMsFromStartedAt(taskStartedAt),
        stepIndexBefore: dispatchResult?.stepIndexBefore ?? stepIndexBefore,
        stepIndexAfter: dispatchResult?.stepIndexAfter ?? getStepIndexRef.current?.() ?? stepIndexBefore,
        speechConfidence: confidence,
        matchedPhrase: parsed.matchedPhrase,
        query: parsed.query,
        stepNumber: parsed.stepNumber,
        metadata: {
          matchedPhrase: parsed.matchedPhrase,
          query: parsed.query,
          stepNumber: parsed.stepNumber,
          speechConfidence: confidence,
          ...(dispatchResult?.metadata || {}),
        },
      });

      if (success) {
        lastFailureRef.current = null;
        onVoiceSuccessRef.current?.({
          eventId: logResult.data?.id || "",
          log: logResult.data || null,
          eventType: dispatchResult?.eventType || "voice_command",
          timestamp: Date.now(),
        });
      } else {
        lastFailureRef.current = {
          normalizedTranscript: parsed.normalizedTranscript,
          matchedIntent: parsed.intent,
          timestamp: Date.now(),
        };
        onVoiceFailureRef.current?.({
          eventId: logResult.data?.id || "",
          log: logResult.data || null,
          eventType: dispatchResult?.eventType || "voice_command_failed",
          timestamp: Date.now(),
          failureReason: dispatchResult?.failureReason || null,
        });
      }

      if (parsed.intent === VOICE_INTENTS.STOP_LISTENING) {
        stopListeningRef.current?.();
        setVoiceFeedback(copy.commandsOff);
      }

      return { success, stopListening: parsed.intent === VOICE_INTENTS.STOP_LISTENING };
    },
    [conditionId, conditionOrder, copy.commandCompleted, copy.commandsOff, copy.unknownCommand, enabled, normalizedLanguage, participantCode, participantId, sessionId, taskId, taskStartedAt, trialType, tutorialId]
  );

  const speech = useSpeechRecognition({
    onFinalResult: handleFinalResult,
    onRecognitionError: handleRecognitionError,
    language: normalizedLanguage,
  });

  const startVoiceCommands = useCallback(() => {
    setVoiceFeedback(copy.commandsOn);
    speech.startListening();
  }, [copy.commandsOn, speech.startListening]);

  const stopVoiceCommands = useCallback(() => {
    setVoiceFeedback(copy.commandsOff);
    speech.stopListening();
  }, [copy.commandsOff, speech.stopListening]);

  useEffect(() => {
    stopListeningRef.current = stopVoiceCommands;
  }, [stopVoiceCommands]);

  useEffect(() => {
    if (enabled || !speech.isVoiceEnabled) return;
    stopVoiceCommands();
  }, [enabled, speech.isVoiceEnabled, stopVoiceCommands]);

  useEffect(() => {
    if (!enabled || speech.voiceState !== VOICE_STATES.UNSUPPORTED || unsupportedLoggedRef.current) return;
    unsupportedLoggedRef.current = true;
    void handleRecognitionError({
      recognitionErrorCode: "unsupported-browser",
      message: copy.unavailableLong,
    });
  }, [copy.unavailableLong, enabled, handleRecognitionError, speech.voiceState]);

  return {
    ...speech,
    startListening: enabled ? startVoiceCommands : () => {},
    stopListening: enabled ? stopVoiceCommands : () => {},
    voiceFeedback,
    lastParse,
    showCommandHints,
    setShowCommandHints,
    commandHints: getCommandHints(normalizedLanguage),
  };
}

function getRecoveryAttempt({ previousFailure, parsed }) {
  if (!previousFailure || Date.now() - previousFailure.timestamp > 30000) {
    return {
      isRecoveryAttempt: false,
      recoveryAttemptType: "",
    };
  }

  if (previousFailure.normalizedTranscript && previousFailure.normalizedTranscript === parsed.normalizedTranscript) {
    return {
      isRecoveryAttempt: true,
      recoveryAttemptType: "repeated_command",
    };
  }

  if (previousFailure.matchedIntent && previousFailure.matchedIntent === parsed.intent) {
    return {
      isRecoveryAttempt: true,
      recoveryAttemptType: "rephrased_command",
    };
  }

  return {
    isRecoveryAttempt: true,
    recoveryAttemptType: "new_command_after_failure",
  };
}

function getRecognitionErrorTechnicalNote({ recognitionErrorStats, recognitionErrorCode, message }) {
  const errorCode = recognitionErrorCode || "unknown";
  const errorMessage = message || "Voice recognition error.";
  const key = `${errorCode}:${errorMessage}`;
  const stats = recognitionErrorStats[key] || { count: 0 };
  stats.count += 1;
  recognitionErrorStats[key] = stats;

  if (stats.count === 1) {
    return `Voice recognition error (${errorCode}): ${errorMessage}`;
  }

  if (stats.count === RECOGNITION_ERROR_NOTE_THRESHOLD) {
    return `Repeated voice recognition error (${errorCode}) occurred ${stats.count} times. Recommend marking the voice trial as technical_issue if this affects the measured task. Last message: ${errorMessage}`;
  }

  if (stats.count % RECOGNITION_ERROR_NOTE_INTERVAL === 0) {
    return `Repeated voice recognition error (${errorCode}) occurred ${stats.count} times. Latest message: ${errorMessage}`;
  }

  return "";
}
