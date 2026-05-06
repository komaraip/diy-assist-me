import { ListChecks } from "lucide-react";

export function StepOverview({ steps, activeStepIndex, onJumpToStep, isOpen, onToggle }) {
  const panelId = "step-overview-panel";

  return (
    <section className="step-overview-shell" aria-label="Tutorial step overview">
      <button
        type="button"
        className="button secondary-action tool-toggle-button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <ListChecks aria-hidden="true" />
        {isOpen ? "Hide overview" : "Show overview"}
      </button>

      {isOpen ? (
        <div id={panelId} className="step-overview compact-panel-scroll">
          <h2>Overview</h2>
          <ol>
            {steps.map((step, index) => (
              <li key={step.stepNumber}>
                <button
                  type="button"
                  className={activeStepIndex === index ? "overview-step active" : "overview-step"}
                  aria-current={activeStepIndex === index ? "step" : undefined}
                  onClick={() => onJumpToStep(index)}
                >
                  <span>Step {step.stepNumber}</span>
                  <span>{step.instruction}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="tool-section-note">Open the overview to jump between steps.</p>
      )}
    </section>
  );
}
