import { AlertTriangle } from "lucide-react";
import { VOICE_STATES } from "../../utils/voiceIntents.js";

export function VoiceControlPanel({
  voiceState,
  isVoiceEnabled,
  isRestarting,
  browserSupported,
  transcript,
  errorMessage,
  voiceFeedback,
  copy,
  showTranscript = true,
  showLiveMessage = true,
  showWarning = true,
}) {
  const liveMessage = getLiveMessage({
    browserSupported,
    copy,
    errorMessage,
    isRestarting,
    isVoiceEnabled,
    voiceFeedback,
    voiceState,
  });
  const shouldShowLiveMessage = showLiveMessage && shouldRenderLiveMessage({
    browserSupported,
    errorMessage,
    isRestarting,
    voiceFeedback,
    voiceState,
  });
  const shouldShowWarning = showWarning && !browserSupported;
  const shouldShowTranscript = showTranscript && transcript;

  if (!shouldShowWarning && !shouldShowTranscript && !showLiveMessage) {
    return null;
  }

  return (
    <section className={`voice-panel ${voiceState}`} aria-label={copy.feedbackAria}>
      {shouldShowWarning ? (
        <div className="voice-warning" role="status">
          <AlertTriangle aria-hidden="true" />
          <p>{copy.unavailableBrowser}</p>
        </div>
      ) : null}

      {shouldShowTranscript ? (
        <p className="voice-heard-line">
          <span>{copy.heard}</span> {transcript}
        </p>
      ) : null}

      {showLiveMessage ? (
        <div
          className={shouldShowLiveMessage ? "voice-live-region" : "voice-live-region sr-only"}
          aria-live="polite"
          aria-atomic="true"
        >
          {liveMessage}
        </div>
      ) : null}
    </section>
  );
}

function getLiveMessage({ browserSupported, copy, errorMessage, isRestarting, isVoiceEnabled, voiceFeedback, voiceState }) {
  if (!browserSupported) return copy.unavailableLong;
  if (isRestarting) return copy.listeningAgain;
  if (errorMessage) return errorMessage;
  if (voiceFeedback) return voiceFeedback;
  if (voiceState === VOICE_STATES.LISTENING) return copy.listening;
  if (voiceState === VOICE_STATES.PROCESSING) return copy.processing;
  if (isVoiceEnabled) return copy.voiceOn;
  return copy.voiceOff;
}

function shouldRenderLiveMessage({ browserSupported, errorMessage, isRestarting, voiceFeedback, voiceState }) {
  if (!browserSupported || errorMessage || isRestarting) return true;
  if (voiceState === VOICE_STATES.LISTENING || voiceState === VOICE_STATES.PROCESSING) return true;
  if (!voiceFeedback) return false;
  return !/voice (commands )?(are|is)?\s*off/i.test(voiceFeedback);
}
