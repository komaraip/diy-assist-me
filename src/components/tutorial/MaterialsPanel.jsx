import { ClipboardList, X } from "lucide-react";

export function MaterialsPanel({ materials, isOpen, onToggle }) {
  const panelId = "materials-panel";

  return (
    <section className="materials-shell">
      <button
        type="button"
        className="button secondary-action"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <ClipboardList aria-hidden="true" />
        {isOpen ? "Hide materials" : "Show materials"}
      </button>

      {isOpen && (
        <div id={panelId} className="materials-panel compact-panel-scroll">
          <div className="panel-heading-row">
            <h2>Materials</h2>
            <button type="button" className="icon-button" onClick={onToggle} aria-label="Close materials panel">
              <X aria-hidden="true" />
            </button>
          </div>
          {materials.length ? (
            <ul className="materials-list">
              {materials.map((material) => (
                <li key={material.name}>
                  <span>{material.name}</span>
                  {material.quantity || material.unit || material.notes ? (
                    <small>
                      {[material.quantity, material.unit, material.notes].filter(Boolean).join(" ")}
                    </small>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>No materials listed for this tutorial.</p>
          )}
        </div>
      )}
    </section>
  );
}
