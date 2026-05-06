import { forwardRef } from "react";

export const TutorialIconButton = forwardRef(function TutorialIconButton({
  label,
  title = label,
  children,
  className = "",
  isActive = false,
  variant = "neutral",
  type = "button",
  ...buttonProps
}, ref) {
  return (
    <button
      type={type}
      ref={ref}
      className={[
        "tutorial-icon-button",
        `tutorial-icon-button-${variant}`,
        isActive ? "is-active" : "",
        className,
      ].filter(Boolean).join(" ")}
      aria-label={label}
      title={title}
      {...buttonProps}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
});
