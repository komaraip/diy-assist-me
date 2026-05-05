import { useCallback, useEffect, useRef, useState } from "react";
import { VOICE_STATES } from "../utils/voiceIntents.js";

const RESTART_DELAY_MS = 350;
const MAX_CONSECUTIVE_NO_SPEECH_ERRORS = 2;
const FATAL_RECOGNITION_ERRORS = new Set([
  "unsupported-browser",
  "not-allowed",
  "service-not-allowed",
  "audio-capture",
  "start-failed",
]);

function getSpeechRecognitionClass() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition({ onFinalResult, onRecognitionError } = {}) {
  const hasSupport = !!getSpeechRecognitionClass();
  const [voiceState, setVoiceState] = useState(hasSupport ? VOICE_STATES.IDLE : VOICE_STATES.UNSUPPORTED);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const startRecognitionRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const fatalErrorRef = useRef(!hasSupport);
  const isStartingRef = useRef(false);
  const isProcessingFinalResultRef = useRef(false);
  const restartAfterProcessingRef = useRef(false);
  const hadErrorThisCycleRef = useRef(false);
  const consecutiveNoSpeechErrorsRef = useRef(0);
  const voiceStateRef = useRef(voiceState);
  const onFinalResultRef = useRef(onFinalResult);
  const onRecognitionErrorRef = useRef(onRecognitionError);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    onRecognitionErrorRef.current = onRecognitionError;
  }, [onRecognitionError]);

  const setKeepListening = useCallback((nextValue) => {
    shouldKeepListeningRef.current = nextValue;
    setIsVoiceEnabled(nextValue);
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const scheduleRestart = useCallback(() => {
    clearRestartTimer();

    if (
      !shouldKeepListeningRef.current ||
      intentionalStopRef.current ||
      fatalErrorRef.current ||
      recognitionRef.current ||
      isStartingRef.current
    ) {
      setIsRestarting(false);
      return;
    }

    setIsRestarting(true);
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;

      if (
        !shouldKeepListeningRef.current ||
        intentionalStopRef.current ||
        fatalErrorRef.current ||
        recognitionRef.current ||
        isStartingRef.current
      ) {
        setIsRestarting(false);
        return;
      }

      startRecognitionRef.current?.();
    }, RESTART_DELAY_MS);
  }, [clearRestartTimer]);

  const stopListening = useCallback(() => {
    intentionalStopRef.current = true;
    restartAfterProcessingRef.current = false;
    setKeepListening(false);
    clearRestartTimer();
    setIsRestarting(false);
    setErrorMessage("");

    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    isStartingRef.current = false;

    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // Browser implementations can throw when recognition has already ended.
      }
    }
    setVoiceState(hasSupport ? VOICE_STATES.IDLE : VOICE_STATES.UNSUPPORTED);
  }, [clearRestartTimer, hasSupport, setKeepListening]);

  const reportError = useCallback((recognitionErrorCode, message) => {
    let nextMessage = message;
    hadErrorThisCycleRef.current = true;

    if (recognitionErrorCode === "no-speech") {
      consecutiveNoSpeechErrorsRef.current += 1;
      if (consecutiveNoSpeechErrorsRef.current > MAX_CONSECUTIVE_NO_SPEECH_ERRORS) {
        nextMessage = "No speech was detected. Voice commands are paused. Press Start voice when you are ready.";
        setKeepListening(false);
        clearRestartTimer();
        setIsRestarting(false);
      }
    } else {
      consecutiveNoSpeechErrorsRef.current = 0;
    }

    if (FATAL_RECOGNITION_ERRORS.has(recognitionErrorCode)) {
      fatalErrorRef.current = true;
      setKeepListening(false);
      clearRestartTimer();
      setIsRestarting(false);
    }

    setErrorMessage(nextMessage);
    setVoiceState(recognitionErrorCode === "unsupported-browser" ? VOICE_STATES.UNSUPPORTED : VOICE_STATES.ERROR);
    onRecognitionErrorRef.current?.({ recognitionErrorCode, message: nextMessage });
  }, [clearRestartTimer, setKeepListening]);

  const startRecognition = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();

    if (!SpeechRecognitionClass) {
      reportError("unsupported-browser", "Voice commands are not available in this browser.");
      setVoiceState(VOICE_STATES.UNSUPPORTED);
      return;
    }

    if (!shouldKeepListeningRef.current || recognitionRef.current || isStartingRef.current) {
      return;
    }

    clearRestartTimer();
    const recognition = new SpeechRecognitionClass();
    hadErrorThisCycleRef.current = false;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isStartingRef.current = false;
      setIsRestarting(false);
      setErrorMessage("");
      setVoiceState(VOICE_STATES.LISTENING);
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      let confidence = 0;

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const candidate = result[0];
        if (result.isFinal) {
          finalTranscript += candidate.transcript;
          confidence = candidate.confidence || 0;
        } else {
          interimTranscript += candidate.transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript.trim()) {
        consecutiveNoSpeechErrorsRef.current = 0;
        isProcessingFinalResultRef.current = true;
        setVoiceState(VOICE_STATES.PROCESSING);
        Promise.resolve(onFinalResultRef.current?.({ rawTranscript: finalTranscript.trim(), confidence }))
          .then((result) => {
            if (result?.stopListening || !shouldKeepListeningRef.current) {
              setVoiceState(hasSupport ? VOICE_STATES.IDLE : VOICE_STATES.UNSUPPORTED);
              return;
            }
            setVoiceState(result?.success ? VOICE_STATES.SUCCESS : VOICE_STATES.ERROR);
          })
          .catch((error) => {
            reportError("dispatch-error", error?.message || "That voice command could not be completed.");
          })
          .finally(() => {
            isProcessingFinalResultRef.current = false;
            if (!restartAfterProcessingRef.current) return;

            restartAfterProcessingRef.current = false;
            if (shouldKeepListeningRef.current && !intentionalStopRef.current && !fatalErrorRef.current) {
              scheduleRestart();
            }
          });
      }
    };

    recognition.onerror = (event) => {
      const recognitionErrorCode = event.error || "unknown";
      if (intentionalStopRef.current && recognitionErrorCode === "aborted") {
        return;
      }
      const message = getRecognitionErrorMessage(recognitionErrorCode);
      reportError(recognitionErrorCode, message);
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      isStartingRef.current = false;

      const shouldRestart =
        shouldKeepListeningRef.current && !intentionalStopRef.current && !fatalErrorRef.current;

      if (!shouldRestart) {
        setIsRestarting(false);
        if (!hadErrorThisCycleRef.current && voiceStateRef.current === VOICE_STATES.LISTENING) {
          setVoiceState(hasSupport ? VOICE_STATES.IDLE : VOICE_STATES.UNSUPPORTED);
        }
        return;
      }

      if (isProcessingFinalResultRef.current) {
        restartAfterProcessingRef.current = true;
        return;
      }

      if (!hadErrorThisCycleRef.current && voiceStateRef.current === VOICE_STATES.LISTENING) {
        setVoiceState(VOICE_STATES.IDLE);
      }
      scheduleRestart();
    };

    recognitionRef.current = recognition;
    isStartingRef.current = true;

    try {
      recognition.start();
    } catch (error) {
      isStartingRef.current = false;
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      reportError("start-failed", error?.message || "Voice recognition could not start.");
    }
  }, [clearRestartTimer, hasSupport, reportError, scheduleRestart]);

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();

    if (!SpeechRecognitionClass) {
      reportError("unsupported-browser", "Voice commands are not available in this browser.");
      setVoiceState(VOICE_STATES.UNSUPPORTED);
      return;
    }

    if (shouldKeepListeningRef.current && (recognitionRef.current || isStartingRef.current || restartTimerRef.current)) {
      return;
    }

    intentionalStopRef.current = false;
    fatalErrorRef.current = false;
    restartAfterProcessingRef.current = false;
    consecutiveNoSpeechErrorsRef.current = 0;
    setKeepListening(true);
    clearRestartTimer();
    setIsRestarting(false);
    setTranscript("");
    setErrorMessage("");
    startRecognition();
  }, [clearRestartTimer, reportError, setKeepListening, startRecognition]);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      shouldKeepListeningRef.current = false;
      clearRestartTimer();

      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      isStartingRef.current = false;

      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // Ignore cleanup errors.
        }
      }
    };
  }, [clearRestartTimer]);

  return {
    voiceState,
    isVoiceEnabled,
    isRestarting,
    browserSupported: hasSupport,
    transcript,
    errorMessage,
    startListening,
    stopListening,
    setVoiceState,
    setTranscript,
  };
}

function getRecognitionErrorMessage(errorCode) {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was blocked. Allow microphone access to use voice commands.";
    case "audio-capture":
      return "No microphone was detected. Check the microphone and try again.";
    case "network":
      return "Voice commands had a network issue. You can still use the buttons.";
    case "no-speech":
      return "No speech was detected. Try again or use the buttons.";
    case "unsupported-browser":
      return "Voice commands are not available in this browser. Google Chrome desktop works best.";
    default:
      return "Voice commands ran into a problem. You can still use the buttons.";
  }
}
