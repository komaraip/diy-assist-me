import { ListFilter } from "lucide-react";
import { useMemo, useState } from "react";

const INITIAL_FILTERS = {
  sessionId: "all",
  participantCode: "all",
  conditionId: "all",
  taskId: "all",
  modality: "all",
  eventType: "all",
  commandSuccess: "all",
};

export function InteractionLogViewer({ logs = [] }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const filteredLogs = useMemo(() => filterLogs(logs, filters), [filters, logs]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((value) => value !== "all").length;
  }, [filters]);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <section className="admin-panel" aria-labelledby="interaction-log-heading">
      <div className="admin-panel-heading log-viewer-header">
        <div>
          <p className="eyebrow">Interaction logs</p>
          <div className="log-viewer-title-row">
            <h2 id="interaction-log-heading">Log viewer</h2>
            <span className="compact-log-badge" title={`${filteredLogs.length} logs matching filters out of ${logs.length} total logs`}>
              <strong>{filteredLogs.length}</strong> / {logs.length} logs
            </span>
          </div>
        </div>
        <div className="log-viewer-actions">
          {activeFiltersCount > 0 && (
            <button 
              type="button" 
              className="compact-clear-btn" 
              onClick={() => setFilters(INITIAL_FILTERS)}
              title="Clear all active filters"
            >
              Clear filters
            </button>
          )}
          <button 
            type="button" 
            className={`compact-filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="log-filters-panel"
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            <ListFilter size={15} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="compact-filter-count">{activeFiltersCount}</span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div id="log-filters-panel" className="compact-filters-container">
          <FilterSelect label="Session" value={filters.sessionId} values={uniqueValues(logs, "sessionId")} onChange={(value) => updateFilter("sessionId", value)} />
          <FilterSelect label="Participant" value={filters.participantCode} values={uniqueValues(logs, "participantCode")} onChange={(value) => updateFilter("participantCode", value)} />
          <FilterSelect label="Condition" value={filters.conditionId} values={uniqueValues(logs, "conditionId")} onChange={(value) => updateFilter("conditionId", value)} formatDisplay={true} />
          <FilterSelect label="Task" value={filters.taskId} values={uniqueValues(logs, "taskId")} onChange={(value) => updateFilter("taskId", value)} formatDisplay={true} />
          <FilterSelect label="Modality" value={filters.modality} values={uniqueValues(logs, "modality")} onChange={(value) => updateFilter("modality", value)} />
          <FilterSelect label="Event type" value={filters.eventType} values={uniqueValues(logs, "eventType")} onChange={(value) => updateFilter("eventType", value)} formatDisplay={true} />
          <div className="compact-filter-field">
            <span className="compact-filter-label">Command success:</span>
            <select 
              className="compact-filter-select"
              value={filters.commandSuccess} 
              onChange={(event) => updateFilter("commandSuccess", event.target.value)}
            >
              <option value="all">All</option>
              <option value="true">Successful</option>
              <option value="false">Failed</option>
              <option value="unset">Not command-specific</option>
            </select>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Participant</th>
              <th>Condition</th>
              <th>Task</th>
              <th>Modality</th>
              <th>Event</th>
              <th>Success</th>
              <th>Transcript</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.slice(0, 100).map((log) => (
              <tr key={log.id || `${log.timestamp}-${log.eventType}`}>
                <td>{formatDate(log.timestamp)}</td>
                <td>{log.participantCode || "-"}</td>
                <td>{formatText(log.conditionId)}</td>
                <td>{formatText(log.taskId)}</td>
                <td>{log.modality || "-"}</td>
                <td>{formatText(log.eventType)}</td>
                <td>{formatCommandSuccess(log.commandSuccess, log.modality)}</td>
                <td>{log.rawTranscript || log.normalizedTranscript || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilterSelect({ label, value, values, onChange, formatDisplay = false }) {
  return (
    <div className="compact-filter-field">
      <span className="compact-filter-label">{label}:</span>
      <select
        className="compact-filter-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">All</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {formatDisplay ? formatText(item) : item}
          </option>
        ))}
      </select>
    </div>
  );
}

function filterLogs(logs, filters) {
  return logs.filter((log) => {
    const matchesFields = ["sessionId", "participantCode", "conditionId", "taskId", "modality", "eventType"].every((field) =>
      filters[field] === "all" || String(log[field] || "") === filters[field]
    );

    if (!matchesFields) return false;
    if (filters.commandSuccess === "all") return true;
    if (filters.commandSuccess === "unset") return log.commandSuccess === null || log.commandSuccess === undefined;
    return String(log.commandSuccess) === filters.commandSuccess;
  });
}

function uniqueValues(logs, field) {
  return Array.from(new Set(logs.map((log) => log[field]).filter(Boolean))).sort();
}

function formatCommandSuccess(value, modality) {
  // Touch interactions are always successful
  if (modality === "touch") return "Yes";
  
  // Voice command success/failure
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "-";
}

function formatText(value) {
  if (!value) return "-";
  return String(value).replace(/_/g, " ");
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}
