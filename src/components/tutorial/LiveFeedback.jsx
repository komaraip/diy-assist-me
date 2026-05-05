export function LiveFeedback({ message }) {
  return (
    <div className="live-feedback" aria-live="polite" aria-atomic="true">
      {message || "Touch tutorial controls are ready."}
    </div>
  );
}
