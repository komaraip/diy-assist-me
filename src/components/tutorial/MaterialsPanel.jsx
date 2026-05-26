import { ClipboardList, X } from "lucide-react";

export function MaterialsPanel({ materials, isOpen = true, onToggle, variant = "toggle", panelId = "materials-panel", copy }) {
  if (variant === "content") {
    return (
      <div id={panelId} className="materials-panel compact-panel-scroll">
        <MaterialList materials={materials} copy={copy} />
      </div>
    );
  }

  return (
    <section className="materials-shell" aria-label={copy?.materialsTitle || "Tutorial materials"}>
      <button
        type="button"
        className="button secondary-action tool-toggle-button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <ClipboardList aria-hidden="true" />
        {isOpen ? copy?.hideMaterials || "Hide materials" : copy?.showMaterials || "Show materials"}
      </button>

      {isOpen && (
        <div id={panelId} className="materials-panel compact-panel-scroll">
          <div className="panel-heading-row">
            <h2>{copy?.materialsTitle || "Materials"}</h2>
            <button type="button" className="icon-button" onClick={onToggle} aria-label={copy?.closePanel?.(copy.materialsTitle) || "Close materials panel"}>
              <X aria-hidden="true" />
            </button>
          </div>
          {materials.length ? (
            <MaterialList materials={materials} copy={copy} />
          ) : (
            <p>{copy?.noMaterialsLong || "No materials listed for this tutorial."}</p>
          )}
        </div>
      )}
    </section>
  );
}

function MaterialList({ materials, copy }) {
  if (!materials.length) {
    return <p>{copy?.noMaterialsLong || "No materials listed for this tutorial."}</p>;
  }

  return (
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
  );
}
