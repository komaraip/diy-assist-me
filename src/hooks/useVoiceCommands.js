import { useCallback, useEffect, useRef, useState } from "react";
import { logVoiceInteraction } from "../services/logService.js";
import { appendTechnicalNote } from "../services/sessionService.js";
import { COMMAND_HINTS } from "../utils/commandDictionary.js";
import { getElapsedMsFromStartedAt } from "../utils/studyContext.js";
import { parseVoiceCommand } from "../utils/parseVoiceCommand.js";
import { VOICE_INTENTS, VOICE_STATES } from "../utils/voiceIntents.js";
import { useSpeechRecognition } from "./useSpeechRecognition.js";

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
  getStepIndex,
  onCommand,
}) {
  const [voiceFeedback, setVoiceFeedback] = useState("");
  const [lastParse, setLastParse] = useState(null);
  const [showCommandHints, setShowCommandHints] = useState(false);
  const onCommandRef = useRef(onCommand);
  const getStepIndexRef = useRef(getStepIndex);
  const unsupportedLoggedRef = useRef(false);
  const stopListeningRef = useRef(null);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    getStepIndexRef.current = getStepIndex;
  }, [getStepIndex]);

  const handleRecognitionError = useCallback(
    async ({ recognitionErrorCode, message }) => {
      if (!enabled) return;

      setVoiceFeedback(message);
      if (sessionId) {
        await appendTechnicalNote(sessionId, `Voice recognition error (${recognitionErrorCode}): ${message}`);
      }
      await logVoiceInteraction({
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
        fallbackUsed: false,
        elapsedMsFromTaskStart: getElapsedMsFromStartedAt(taskStartedAt),
        stepIndexBefore: getStepIndexRef.current?.() ?? null,
        stepIndexAfter: getStepIndexRef.current?.() ?? null,
      });
    },
    [conditionId, conditionOrder, enabled, participantCode, participantId, sessionId, taskId, taskStartedAt, trialType, tutorialId]
  );

  const handleFinalResult = useCallback(
    async ({ rawTranscript, confidence }) => {
      if (!enabled) {
        return { success: false };
      }

      const parsed = parseVoiceCommand(rawTranscript);
      const stepIndexBefore = getStepIndexRef.current?.() ?? null;
      setLastParse(parsed);

      if (parsed.intent === VOICE_INTENTS.UNKNOWN) {
        const message =
          `I heard "${rawTranscript}", but that is not a supported command. ` +
          "Try next step, back, repeat, show materials, overview, or search for a keyword.";
        setVoiceFeedback(message);
        await logVoiceInteraction({
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
          fallbackUsed: false,
          elapsedMsFromTaskStart: getElapsedMsFromStartedAt(taskStartedAt),
          stepIndexBefore,
          stepIndexAfter: getStepIndexRef.current?.() ?? stepIndexBefore,
          speechConfidence: confidence,
          metadata: { speechConfidence: confidence },
        });
        return { success: false };
      }

      const dispatchResult = await onCommandRef.current?.(parsed);
      const success = !!dispatchResult?.success;
      const message = dispatchResult?.message || "Voice command completed.";
      setVoiceFeedback(message);

      if (dispatchResult?.showHelp) {
        setShowCommandHints(true);
      }

      await logVoiceInteraction({
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

      if (parsed.intent === VOICE_INTENTS.STOP_LISTENING) {
        stopListeningRef.current?.();
        setVoiceFeedback("Voice commands are off.");
      }

      return { success, stopListening: parsed.intent === VOICE_INTENTS.STOP_LISTENING };
    },
    [conditionId, conditionOrder, enabled, participantCode, participantId, sessionId, taskId, taskStartedAt, trialType, tutorialId]
  );

  const speech = useSpeechRecognition({
    onFinalResult: handleFinalResult,
    onRecognitionError: handleRecognitionError,
  });

  const startVoiceCommands = useCallback(() => {
    setVoiceFeedback("Voice commands are on. Say a command anytime.");
    speech.startListening();
  }, [speech.startListening]);

  const stopVoiceCommands = useCallback(() => {
    setVoiceFeedback("Voice commands are off.");
    speech.stopListening();
  }, [speech.stopListening]);

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
      message: "Voice commands are not available in this browser. You can still use the buttons.",
    });
  }, [enabled, handleRecognitionError, speech.voiceState]);

  return {
    ...speech,
    startListening: enabled ? startVoiceCommands : () => {},
    stopListening: enabled ? stopVoiceCommands : () => {},
    voiceFeedback,
    lastParse,
    showCommandHints,
    setShowCommandHints,
    commandHints: COMMAND_HINTS,
  };
}
