import { ListChecks } from "lucide-react";

export function StepOverview({ steps, activeStepIndex, onJumpToStep, isOpen, onToggle, copy }) {
  const panelId = "step-overview-panel";
  const overviewCopy = copy?.overview || {
    aria: "Tutorial step overview",
    show: "Show overview",
    hide: "Hide overview",
    heading: "Overview",
    note: "Open the overview to jump between steps.",
    stepLabel: (step) => `Step ${step}`,
  };

  return (
    <section className="step-overview-shell" aria-label={overviewCopy.aria}>
      <button
        type="button"
        className="button secondary-action tool-toggle-button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <ListChecks aria-hidden="true" />
        {isOpen ? overviewCopy.hide : overviewCopy.show}
      </button>

      {isOpen ? (
        <div id={panelId} className="step-overview compact-panel-scroll">
          <h2>{overviewCopy.heading}</h2>
          <ol>
            {steps.map((step, index) => (
              <li key={step.stepNumber}>
                <button
                  type="button"
                  className={activeStepIndex === index ? "overview-step active" : "overview-step"}
                  aria-current={activeStepIndex === index ? "step" : undefined}
                  onClick={() => onJumpToStep(index)}
                >
                  <span>{overviewCopy.stepLabel(step.stepNumber)}</span>
                  <span>{step.instruction}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="tool-section-note">{overviewCopy.note}</p>
      )}
    </section>
  );
}
