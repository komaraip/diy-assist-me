import { useId } from "react";

export function GuidedProgress({ steps = [], currentStepId, title = "Guided session progress", eyebrow = "Progress" }) {
  const headingId = useId();

  return (
    <section className="guided-progress" aria-labelledby={headingId}>
      <div className="guided-progress-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={headingId}>{title}</h2>
      </div>
      <ol className="guided-progress-list">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          return (
            <li key={step.id} className={isCurrent ? "current" : ""} aria-current={isCurrent ? "step" : undefined}>
              <span className="guided-progress-number" aria-hidden="true">{index + 1}</span>
              <div>
                <strong>{step.label}</strong>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
