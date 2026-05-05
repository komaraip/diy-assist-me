import { CheckCircle2, ChevronLeft, ChevronRight, Eye, RotateCcw } from "lucide-react";

export function TouchControls({
  isFirstStep,
  isLastStep,
  isOverviewOpen,
  isCompleted,
  onPrevious,
  onNext,
  onRepeat,
  onToggleOverview,
  onComplete,
}) {
  return (
    <div className="touch-controls" aria-label="Touch tutorial controls">
      <button type="button" className="button secondary-action" onClick={onPrevious} disabled={isFirstStep}>
        <ChevronLeft aria-hidden="true" />
        Previous
      </button>
      <button type="button" className="button secondary-action" onClick={onRepeat}>
        <RotateCcw aria-hidden="true" />
        Repeat
      </button>
      <button
        type="button"
        className="button secondary-action"
        onClick={onToggleOverview}
        aria-expanded={isOverviewOpen}
      >
        <Eye aria-hidden="true" />
        {isOverviewOpen ? "Hide overview" : "Overview"}
      </button>
      <button type="button" className="button primary-button" onClick={onNext} disabled={isLastStep || isCompleted}>
        Next
        <ChevronRight aria-hidden="true" />
      </button>
      <button type="button" className="button complete-button" onClick={onComplete} disabled={isCompleted}>
        <CheckCircle2 aria-hidden="true" />
        Complete
      </button>
    </div>
  );
}
