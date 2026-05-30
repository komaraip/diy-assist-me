import { Info, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export function InfoPopover({ title, description, className = "" }) {
  const generatedId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const shellRef = useRef(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const popoverId = `info-popover-${generatedId.replace(/:/g, "")}`;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const shellElement = shellRef.current;

      if (shellElement && !shellElement.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPopoverPosition(null);
      return undefined;
    }

    const updatePopoverPosition = () => {
      const buttonElement = buttonRef.current;
      const popoverElement = popoverRef.current;
      const isMobile = window.matchMedia("(max-width: 720px)").matches;

      if (!buttonElement || !popoverElement || !isMobile) {
        setPopoverPosition(null);
        return;
      }

      const viewportPadding = 16;
      const gap = 8;
      const width = Math.min(320, window.innerWidth - viewportPadding * 2);
      const buttonRect = buttonElement.getBoundingClientRect();
      const popoverRect = popoverElement.getBoundingClientRect();
      const maxHeight = Math.min(window.innerHeight * 0.55, 360);
      const visibleHeight = Math.min(popoverRect.height || maxHeight, maxHeight);
      const maxLeft = window.innerWidth - width - viewportPadding;
      const left = Math.min(Math.max(buttonRect.left, viewportPadding), maxLeft);
      let top = buttonRect.bottom + gap;

      if (top + visibleHeight + viewportPadding > window.innerHeight) {
        top = Math.max(viewportPadding, buttonRect.top - visibleHeight - gap);
      }

      setPopoverPosition({ top, left, width });
    };

    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isOpen]);

  return (
    <span ref={shellRef} className={["info-popover-shell", className].filter(Boolean).join(" ")}>
      <button
        ref={buttonRef}
        type="button"
        className="info-popover-button"
        aria-label={`View details for ${title}`}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        title="View details"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
      >
        <Info aria-hidden="true" />
      </button>
      {isOpen ? (
        <span
          ref={popoverRef}
          className="info-popover"
          id={popoverId}
          role="note"
          style={
            popoverPosition
              ? {
                  "--info-popover-left": `${popoverPosition.left}px`,
                  "--info-popover-top": `${popoverPosition.top}px`,
                  "--info-popover-width": `${popoverPosition.width}px`,
                }
              : undefined
          }
        >
          <span>{description}</span>
          <button
            type="button"
            className="info-popover-close"
            aria-label={`Close details for ${title}`}
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X aria-hidden="true" />
          </button>
        </span>
      ) : null}
    </span>
  );
}
