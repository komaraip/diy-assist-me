import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { TutorialIconButton } from "./TutorialIconButton.jsx";

export function TutorialPopover({ id, isOpen, title, onClose, triggerRef, children, className = "", closeLabel = `Close ${title}` }) {
  const closeButtonRef = useRef(null);
  const titleId = `${id}-title`;
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCloseRef.current?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const target = triggerRef?.current || previouslyFocused;
      if (target && typeof target.focus === "function") {
        target.focus();
      }
    };
  }, [isOpen, triggerRef]);

  return (
    <>
      <button
        type="button"
        className={isOpen ? "tutorial-popover-backdrop is-open" : "tutorial-popover-backdrop"}
        onClick={onClose}
        aria-label={closeLabel}
        tabIndex={isOpen ? 0 : -1}
      />

      <section
        id={id}
        className={["tutorial-popover", isOpen ? "is-open" : "", className].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
      >
        <div className="tutorial-sheet-handle" aria-hidden="true" />
        <div className="tutorial-popover-heading">
          <h2 id={titleId}>{title}</h2>
          <TutorialIconButton label={closeLabel} ref={closeButtonRef} onClick={onClose}>
            <X aria-hidden="true" />
          </TutorialIconButton>
        </div>
        <div className="tutorial-popover-content">{children}</div>
      </section>
    </>
  );
}
