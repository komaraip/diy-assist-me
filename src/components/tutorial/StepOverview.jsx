export function StepOverview({ steps, activeStepIndex, onJumpToStep, isOpen }) {
  if (!isOpen) return null;

  return (
    <section className="step-overview compact-panel-scroll" aria-label="Tutorial step overview">
      <h2>Step overview</h2>
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
    </section>
  );
}
