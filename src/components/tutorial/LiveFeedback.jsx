export function LiveFeedback({ message }) {
  return (
    <div className={message ? "live-feedback" : "live-feedback sr-only"} aria-live="polite" aria-atomic="true">
      {message || "Tutorial controls are ready."}
    </div>
  );
}
