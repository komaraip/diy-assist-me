import { RefreshCcw } from "lucide-react";

export function AdminDataToolbar({ source, warning, onRefresh, refreshLabel = "Refresh", actions = null }) {
  return (
    <div className="admin-toolbar">
      <p className="data-source-note">
        Data source: {source}
        {warning ? `. ${warning}` : ""}
      </p>
      <div className="admin-toolbar-actions">
        {onRefresh ? (
          <button type="button" className="button secondary-action" onClick={onRefresh}>
            <RefreshCcw aria-hidden="true" />
            {refreshLabel}
          </button>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
