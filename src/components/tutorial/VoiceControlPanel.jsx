import { AlertTriangle, HelpCircle, Mic, MicOff, Square } from "lucide-react";
import { VOICE_STATES } from "../../utils/voiceIntents.js";

export function VoiceControlPanel({
  voiceState,
  isVoiceEnabled,
  isRestarting,
  browserSupported,
  transcript,
  errorMessage,
  voiceFeedback,
  lastParse,
  commandHints,
  showCommandHints,
  onToggleHints,
  onStartListening,
  onStopListening,
}) {
  const isVoiceOn =
    isVoiceEnabled ||
    isRestarting ||
    voiceState === VOICE_STATES.LISTENING ||
    voiceState === VOICE_STATES.PROCESSING;
  const statusLabel = getStatusLabel(voiceState, browserSupported, isVoiceEnabled, isRestarting);
  const liveMessage = getLiveMessage({
    browserSupported,
    errorMessage,
    isRestarting,
    isVoiceEnabled,
    voiceFeedback,
  });

  return (
    <section className={`voice-panel ${voiceState}`} aria-label="Voice navigation controls">
      <div className="voice-panel-heading">
        <div>
          <p className="eyebrow">Voice navigation</p>
          <h2>{statusLabel}</h2>
        </div>
        <div className="voice-actions">
          <button
            type="button"
            className="button secondary-action"
            onClick={onToggleHints}
            aria-expanded={showCommandHints}
          >
            <HelpCircle aria-hidden="true" />
            Commands
          </button>
          {isVoiceOn ? (
            <button type="button" className="button complete-button" onClick={onStopListening}>
              <Square aria-hidden="true" />
              Stop voice
            </button>
          ) : (
            <button
              type="button"
              className="button primary-button"
              onClick={onStartListening}
              disabled={!browserSupported}
            >
              {browserSupported ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}
              Start voice
            </button>
          )}
        </div>
      </div>

      {isVoiceOn ? (
        <p className="status-note">Say "stop listening" or press Stop voice to turn it off.</p>
      ) : null}

      {!browserSupported ? (
        <div className="voice-warning" role="status">
          <AlertTriangle aria-hidden="true" />
          <p>Voice commands are not available in this browser. You can still use the buttons.</p>
        </div>
      ) : null}

      <div className="voice-status-grid">
        <div>
          <span>Heard</span>
          <p>{transcript || "No transcript yet."}</p>
        </div>
        <div>
          <span>Command</span>
          <p>{lastParse?.intent || "None"}</p>
        </div>
      </div>

      <div className="voice-live-region" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      {showCommandHints ? (
        <div className="voice-hints compact-panel-scroll">
          <h3>Try saying</h3>
          <ul>
            {commandHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function getStatusLabel(voiceState, browserSupported, isVoiceEnabled, isRestarting) {
  if (!browserSupported || voiceState === VOICE_STATES.UNSUPPORTED) return "Unsupported browser";
  if (isRestarting) return "Listening again";
  if (voiceState === VOICE_STATES.LISTENING) return "Listening";
  if (voiceState === VOICE_STATES.PROCESSING) return "Processing command";
  if (isVoiceEnabled && voiceState === VOICE_STATES.SUCCESS) return "Voice commands are on";
  if (voiceState === VOICE_STATES.ERROR) return "Voice needs attention";
  if (isVoiceEnabled) return "Voice commands are on";
  return "Ready";
}

function getLiveMessage({ browserSupported, errorMessage, isRestarting, isVoiceEnabled, voiceFeedback }) {
  if (!browserSupported) return "Voice commands are not available in this browser. You can still use the buttons.";
  if (isRestarting) return "Listening again...";
  if (errorMessage) return errorMessage;
  if (voiceFeedback) return voiceFeedback;
  if (isVoiceEnabled) return "Voice commands are on. Say a command anytime.";
  return "Tap Start voice and try saying: next step, repeat, or show materials.";
}
