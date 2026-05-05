import { ImageWithFallback } from "../common/ImageWithFallback.jsx";

export function StepCard({ step, stepIndex, totalSteps, isCurrent }) {
  return (
    <article className="step-card" aria-current={isCurrent ? "step" : undefined}>
      <div className="step-card-header">
        <span className="step-number">Step {step.stepNumber}</span>
        <span className="step-count">
          {stepIndex + 1} of {totalSteps}
        </span>
      </div>

      <div className={step.imageUrl ? "step-card-content" : "step-card-content no-image"}>
        {step.imageUrl ? (
          <div className="step-image-wrap">
            <ImageWithFallback src={step.imageUrl} alt={step.imageAlt} className="step-image" />
          </div>
        ) : null}
        <div className="step-copy">
          <h2>{step.title}</h2>
          <p className="step-instruction">{step.instruction}</p>
        </div>
      </div>
    </article>
  );
}
