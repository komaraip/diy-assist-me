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
  copy,
}) {
  const touchCopy = copy?.touchControls || {
    aria: "Touch tutorial controls",
    previous: "Previous",
    repeat: "Repeat",
    overview: "Overview",
    hideOverview: "Hide overview",
    next: "Next",
    complete: "Complete",
  };

  return (
    <div className="touch-controls" aria-label={touchCopy.aria}>
      <button type="button" className="button secondary-action" onClick={onPrevious} disabled={isFirstStep}>
        <ChevronLeft aria-hidden="true" />
        {touchCopy.previous}
      </button>
      <button type="button" className="button secondary-action" onClick={onRepeat}>
        <RotateCcw aria-hidden="true" />
        {touchCopy.repeat}
      </button>
      <button
        type="button"
        className="button secondary-action"
        onClick={onToggleOverview}
        aria-expanded={isOverviewOpen}
      >
        <Eye aria-hidden="true" />
        {isOverviewOpen ? touchCopy.hideOverview : touchCopy.overview}
      </button>
      <button type="button" className="button primary-button" onClick={onNext} disabled={isLastStep || isCompleted}>
        {touchCopy.next}
        <ChevronRight aria-hidden="true" />
      </button>
      <button type="button" className="button complete-button" onClick={onComplete} disabled={isCompleted}>
        <CheckCircle2 aria-hidden="true" />
        {touchCopy.complete}
      </button>
    </div>
  );
}
