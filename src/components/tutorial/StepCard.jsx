import { ImageWithFallback } from "../common/ImageWithFallback.jsx";

export function StepCard({ step, isCurrent, instructionLabel = "Instruction" }) {
  const title = step.title && !/^Step \d+$/i.test(step.title) && !/^Langkah \d+$/i.test(step.title)
    ? step.title
    : instructionLabel;

  return (
    <article className="step-card" aria-current={isCurrent ? "step" : undefined}>
      <div className={step.imageUrl ? "step-card-content" : "step-card-content no-image"}>
        {step.imageUrl ? (
          <div className="step-image-wrap">
            <ImageWithFallback src={step.imageUrl} alt={step.imageAlt} className="step-image" />
          </div>
        ) : null}
        <div className="step-copy">
          <h2>{title}</h2>
          <p className="step-instruction">{step.instruction}</p>
        </div>
      </div>
    </article>
  );
}
