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
  copy,
  sharedCopy,
  voiceCopy,
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
  children,
}) {
  const handleNextAction = isLastStep ? onComplete : onNext;
  const voiceButtonLabel = getVoiceButtonLabel({
    browserSupported: voicePanelProps.browserSupported,
    isVoiceOn,
    copy,
  });
  const isListening = voicePanelProps.voiceState === VOICE_STATES.LISTENING;
  const commandExamples = getCommandExamples(commandHints, voiceCopy);
  const commandButtonLabel = voiceControlsEnabled ? copy.commandButton : copy.commandUnavailable;

  return (
    <>
      <aside className="tutorial-tools-column" aria-label={copy.toolsAria}>
        <section className="tutorial-tool-card tutorial-navigation-card" aria-labelledby="tutorial-navigation-heading">
          <div className="tutorial-card-heading">
            <h2 id="tutorial-navigation-heading">{copy.toolsTitle}</h2>
          </div>

          <nav className="tutorial-navigation-actions" aria-label={copy.navAria}>
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
              label={copy.previousStep}
              title={copy.previousStep}
              onClick={onPrevious}
              disabled={isFirstStep}
              className="direction-previous"
            >
              <ChevronLeft aria-hidden="true" />
            </TutorialIconButton>

            <TutorialIconButton
              label={copy.repeatInstruction}
              title={copy.repeatInstruction}
              onClick={onRepeat}
              className="repeat-button"
            >
              <RotateCcw aria-hidden="true" />
            </TutorialIconButton>

            <TutorialIconButton
              label={isLastStep ? copy.finishTutorial : copy.nextStep}
              title={isLastStep ? copy.finishTutorial : copy.nextStep}
              onClick={handleNextAction}
              disabled={isLastStep ? isCompleted : false}
              className="direction-next"
            >
              {isLastStep ? <CheckCircle2 aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
            </TutorialIconButton>
          </nav>

          <VoiceControlPanel {...voicePanelProps} copy={voiceCopy} />
        </section>

        <section className="tutorial-tool-card tutorial-materials-card" aria-labelledby="tutorial-materials-heading">
          <div className="tutorial-card-heading">
            <h2 id="tutorial-materials-heading">{copy.materialsTitle}</h2>
            <TutorialIconButton
              label={isMaterialsOpen ? copy.hideMaterials : copy.showMaterials}
              title={isMaterialsOpen ? copy.hideMaterials : copy.showMaterials}
              onClick={onToggleMaterials}
              aria-expanded={isMaterialsOpen}
              aria-controls="desktop-materials-panel"
              isActive={isMaterialsOpen}
            >
              {isMaterialsOpen ? <ChevronDown aria-hidden="true" /> : <ClipboardList aria-hidden="true" />}
            </TutorialIconButton>
          </div>

          {isMaterialsOpen ? (
            <MaterialsPanel materials={materials} variant="content" panelId="desktop-materials-panel" copy={copy} />
          ) : (
            <p className="tool-section-note">
              {materials.length ? sharedCopy.itemSuffix(materials.length) : copy.noMaterials}
            </p>
          )}
        </section>

        {children}
      </aside>

      <TutorialPopover
        id={commandPopoverId}
        title={copy.voiceCommandsTitle}
        isOpen={activeMobilePanel === "commands"}
        onClose={onCloseMobilePanel}
        triggerRef={commandTriggerRef}
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
        onClose={onCloseMobilePanel}
        triggerRef={materialsTriggerRef}
        closeLabel={copy.closePanel(copy.materialsTitle)}
      >
        <MaterialsPanel materials={materials} variant="content" panelId="mobile-materials-panel" copy={copy} />
      </TutorialPopover>
    </>
  );
}

function getVoiceButtonLabel({ browserSupported, isVoiceOn, copy }) {
  if (!browserSupported) return copy.voiceUnavailable;
  return isVoiceOn ? copy.voiceButtonOn : copy.voiceButtonOff;
}

function getCommandExamples(commandHints, voiceCopy) {
  const preferred = voiceCopy.preferredHints;
  const available = preferred.filter((hint) => commandHints.includes(hint));
  return available.length ? available : preferred;
}
