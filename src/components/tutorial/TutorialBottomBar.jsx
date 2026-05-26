import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, HelpCircle, Mic, MicOff, RotateCcw } from "lucide-react";
import { TutorialIconButton } from "./TutorialIconButton.jsx";

export function TutorialBottomBar({
  copy,
  showVoiceControl,
  isVoiceOn,
  browserSupported,
  onToggleVoice,
  isListening,
  isFirstStep,
  isLastStep,
  isCompleted,
  onPrevious,
  onRepeat,
  onNext,
  onComplete,
  onOpenCommands,
  onOpenMaterials,
  isCommandsOpen,
  isMaterialsOpen,
  commandsPanelId,
  materialsPanelId,
  commandsButtonRef,
  materialsButtonRef,
}) {
  const voiceLabel = getVoiceLabel({ browserSupported, isVoiceOn, copy });
  const commandsLabel = showVoiceControl ? copy.commandButton : copy.commandUnavailable;
  const handleNextAction = isLastStep ? onComplete : onNext;

  return (
    <nav className="tutorial-bottom-bar" aria-label={copy.primaryControls}>
      <div className="tutorial-bottom-bar-inner">
        {showVoiceControl ? (
          <TutorialIconButton
            label={voiceLabel}
            title={voiceLabel}
            className={isListening ? "tutorial-bar-button is-listening" : "tutorial-bar-button"}
            onClick={onToggleVoice}
            disabled={!browserSupported}
            aria-pressed={browserSupported ? isVoiceOn : undefined}
            isActive={isVoiceOn}
            variant="primary"
          >
            {isVoiceOn && browserSupported ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}
          </TutorialIconButton>
        ) : null}

        <TutorialIconButton
          label={copy.previousStep}
          title={copy.previousStep}
          className="tutorial-bar-button direction-previous"
          onClick={onPrevious}
          disabled={isFirstStep}
        >
          <ChevronLeft aria-hidden="true" />
        </TutorialIconButton>

        <TutorialIconButton
          label={copy.repeatInstruction}
          title={copy.repeatInstruction}
          className="tutorial-bar-button repeat-button"
          onClick={onRepeat}
        >
          <RotateCcw aria-hidden="true" />
        </TutorialIconButton>

        <TutorialIconButton
          label={isLastStep ? copy.finishTutorial : copy.nextStep}
          title={isLastStep ? copy.finishTutorial : copy.nextStep}
          className="tutorial-bar-button direction-next"
          onClick={handleNextAction}
          disabled={isLastStep ? isCompleted : false}
        >
          {isLastStep ? <CheckCircle2 aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
        </TutorialIconButton>

        <TutorialIconButton
          label={commandsLabel}
          title={commandsLabel}
          className="tutorial-bar-button"
          onClick={onOpenCommands}
          disabled={!showVoiceControl}
          aria-expanded={isCommandsOpen}
          aria-controls={commandsPanelId}
          ref={commandsButtonRef}
        >
          <HelpCircle aria-hidden="true" />
        </TutorialIconButton>

        <TutorialIconButton
          label={copy.showMaterials}
          title={copy.showMaterials}
          className="tutorial-bar-button"
          onClick={onOpenMaterials}
          aria-expanded={isMaterialsOpen}
          aria-controls={materialsPanelId}
          ref={materialsButtonRef}
        >
          <ClipboardList aria-hidden="true" />
        </TutorialIconButton>
      </div>
    </nav>
  );
}

function getVoiceLabel({ browserSupported, isVoiceOn, copy }) {
  if (!browserSupported) return copy.voiceUnavailable;
  return isVoiceOn ? copy.voiceButtonOn : copy.voiceButtonOff;
}
