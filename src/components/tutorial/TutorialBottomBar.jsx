import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, HelpCircle, Mic, MicOff, RotateCcw } from "lucide-react";
import { TutorialIconButton } from "./TutorialIconButton.jsx";

export function TutorialBottomBar({
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
  const voiceLabel = getVoiceLabel({ browserSupported, isVoiceOn });
  const commandsLabel = showVoiceControl ? "Show voice commands" : "Voice commands unavailable for this task";
  const handleNextAction = isLastStep ? onComplete : onNext;

  return (
    <nav className="tutorial-bottom-bar" aria-label="Primary tutorial controls">
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
          label="Go to previous step"
          title="Go to previous step"
          className="tutorial-bar-button direction-previous"
          onClick={onPrevious}
          disabled={isFirstStep}
        >
          <ChevronLeft aria-hidden="true" />
        </TutorialIconButton>

        <TutorialIconButton
          label="Repeat current instruction"
          title="Repeat current instruction"
          className="tutorial-bar-button repeat-button"
          onClick={onRepeat}
        >
          <RotateCcw aria-hidden="true" />
        </TutorialIconButton>

        <TutorialIconButton
          label={isLastStep ? "Finish tutorial" : "Go to next step"}
          title={isLastStep ? "Finish tutorial" : "Go to next step"}
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
          label="Show materials"
          title="Show materials"
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

function getVoiceLabel({ browserSupported, isVoiceOn }) {
  if (!browserSupported) return "Voice navigation unavailable";
  return isVoiceOn ? "Stop voice navigation" : "Start voice navigation";
}
