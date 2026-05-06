import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  Mic,
  MicOff,
  RotateCcw,
} from "lucide-react";
import { MaterialsPanel } from "./MaterialsPanel.jsx";
import { TutorialIconButton } from "./TutorialIconButton.jsx";
import { TutorialPopover } from "./TutorialPopover.jsx";
import { VoiceControlPanel } from "./VoiceControlPanel.jsx";
import { VOICE_STATES } from "../../utils/voiceIntents.js";

export function TutorialToolsSheet({
  commandPopoverId,
  materialsPopoverId,
  activeMobilePanel,
  onCloseMobilePanel,
  commandTriggerRef,
  materialsTriggerRef,
  desktopCommandTriggerRef,
  voiceControlsEnabled,
  voicePanelProps,
  isVoiceOn,
  onToggleVoice,
  onOpenCommandsPanel,
  commandHints,
  materials,
  isMaterialsOpen,
  onToggleMaterials,
  isFirstStep,
  isLastStep,
  isCompleted,
  onPrevious,
  onRepeat,
  onNext,
  onComplete,
}) {
  const handleNextAction = isLastStep ? onComplete : onNext;
  const voiceButtonLabel = getVoiceButtonLabel({
    browserSupported: voicePanelProps.browserSupported,
    isVoiceOn,
  });
  const isListening = voicePanelProps.voiceState === VOICE_STATES.LISTENING;
  const commandExamples = getCommandExamples(commandHints);
  const commandButtonLabel = voiceControlsEnabled ? "Show voice commands" : "Voice commands unavailable for this task";

  return (
    <>
      <aside className="tutorial-tools-column" aria-label="Tutorial actions">
        <section className="tutorial-tool-card tutorial-navigation-card" aria-labelledby="tutorial-navigation-heading">
          <div className="tutorial-card-heading">
            <h2 id="tutorial-navigation-heading">Tools</h2>
          </div>

          <nav className="tutorial-navigation-actions" aria-label="Tutorial navigation controls">
            {voiceControlsEnabled ? (
              <TutorialIconButton
                label={voiceButtonLabel}
                title={voiceButtonLabel}
                onClick={onToggleVoice}
                disabled={!voicePanelProps.browserSupported}
                aria-pressed={voicePanelProps.browserSupported ? isVoiceOn : undefined}
                isActive={isVoiceOn}
                variant="primary"
                className={isListening ? "is-listening voice-toggle-button" : "voice-toggle-button"}
              >
                {isVoiceOn && voicePanelProps.browserSupported ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}
              </TutorialIconButton>
            ) : null}

            <TutorialIconButton
              label={commandButtonLabel}
              title={commandButtonLabel}
              onClick={() => onOpenCommandsPanel("desktopCommands")}
              disabled={!voiceControlsEnabled}
              aria-expanded={activeMobilePanel === "commands"}
              aria-controls={commandPopoverId}
              isActive={activeMobilePanel === "commands"}
              ref={desktopCommandTriggerRef}
            >
              <HelpCircle aria-hidden="true" />
            </TutorialIconButton>

            <TutorialIconButton
              label="Go to previous step"
              title="Go to previous step"
              onClick={onPrevious}
              disabled={isFirstStep}
              className="direction-previous"
            >
              <ChevronLeft aria-hidden="true" />
            </TutorialIconButton>

            <TutorialIconButton
              label="Repeat current instruction"
              title="Repeat current instruction"
              onClick={onRepeat}
              className="repeat-button"
            >
              <RotateCcw aria-hidden="true" />
            </TutorialIconButton>

            <TutorialIconButton
              label={isLastStep ? "Finish tutorial" : "Go to next step"}
              title={isLastStep ? "Finish tutorial" : "Go to next step"}
              onClick={handleNextAction}
              disabled={isLastStep ? isCompleted : false}
              className="direction-next"
            >
              {isLastStep ? <CheckCircle2 aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
            </TutorialIconButton>
          </nav>

          <VoiceControlPanel {...voicePanelProps} />
        </section>

        <section className="tutorial-tool-card tutorial-materials-card" aria-labelledby="tutorial-materials-heading">
          <div className="tutorial-card-heading">
            <h2 id="tutorial-materials-heading">Materials</h2>
            <TutorialIconButton
              label={isMaterialsOpen ? "Hide materials" : "Show materials"}
              title={isMaterialsOpen ? "Hide materials" : "Show materials"}
              onClick={onToggleMaterials}
              aria-expanded={isMaterialsOpen}
              aria-controls="desktop-materials-panel"
              isActive={isMaterialsOpen}
            >
              {isMaterialsOpen ? <ChevronDown aria-hidden="true" /> : <ClipboardList aria-hidden="true" />}
            </TutorialIconButton>
          </div>

          {isMaterialsOpen ? (
            <MaterialsPanel materials={materials} variant="content" panelId="desktop-materials-panel" />
          ) : (
            <p className="tool-section-note">
              {materials.length ? `${materials.length} item${materials.length === 1 ? "" : "s"} listed.` : "No materials listed."}
            </p>
          )}
        </section>
      </aside>

      <TutorialPopover
        id={commandPopoverId}
        title="Voice commands"
        isOpen={activeMobilePanel === "commands"}
        onClose={onCloseMobilePanel}
        triggerRef={commandTriggerRef}
      >
        <ul className="tutorial-command-list">
          {commandExamples.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </TutorialPopover>

      <TutorialPopover
        id={materialsPopoverId}
        title="Materials"
        isOpen={activeMobilePanel === "materials"}
        onClose={onCloseMobilePanel}
        triggerRef={materialsTriggerRef}
      >
        <MaterialsPanel materials={materials} variant="content" panelId="mobile-materials-panel" />
      </TutorialPopover>
    </>
  );
}

function getVoiceButtonLabel({ browserSupported, isVoiceOn }) {
  if (!browserSupported) return "Voice navigation unavailable";
  return isVoiceOn ? "Stop voice navigation" : "Start voice navigation";
}

function getCommandExamples(commandHints) {
  const preferred = [
    "next step",
    "repeat",
    "show materials",
    "go to step 3",
    "scroll down",
    "stop listening",
  ];
  const available = preferred.filter((hint) => commandHints.includes(hint));
  return available.length ? available : preferred;
}
