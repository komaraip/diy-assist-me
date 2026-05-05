import { ListFilter } from "lucide-react";
import { useMemo, useState } from "react";

const INITIAL_FILTERS = {
  sessionId: "all",
  participantId: "all",
  conditionId: "all",
  taskId: "all",
  modality: "all",
  eventType: "all",
  commandSuccess: "all",
};

export function InteractionLogViewer({ logs = [] }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const filteredLogs = useMemo(() => filterLogs(logs, filters), [filters, logs]);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <section className="admin-panel" aria-labelledby="interaction-log-heading">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Interaction logs</p>
          <h2 id="interaction-log-heading">Log viewer</h2>
        </div>
        <ListFilter aria-hidden="true" />
      </div>

      <div className="log-filter-grid">
        <FilterSelect label="Session" value={filters.sessionId} values={uniqueValues(logs, "sessionId")} onChange={(value) => updateFilter("sessionId", value)} />
        <FilterSelect label="Participant" value={filters.participantId} values={uniqueValues(logs, "participantId")} onChange={(value) => updateFilter("participantId", value)} />
        <FilterSelect label="Condition" value={filters.conditionId} values={uniqueValues(logs, "conditionId")} onChange={(value) => updateFilter("conditionId", value)} />
        <FilterSelect label="Task" value={filters.taskId} values={uniqueValues(logs, "taskId")} onChange={(value) => updateFilter("taskId", value)} />
        <FilterSelect label="Modality" value={filters.modality} values={uniqueValues(logs, "modality")} onChange={(value) => updateFilter("modality", value)} />
        <FilterSelect label="Event type" value={filters.eventType} values={uniqueValues(logs, "eventType")} onChange={(value) => updateFilter("eventType", value)} />
        <label className="field-label">
          Command success
          <select value={filters.commandSuccess} onChange={(event) => updateFilter("commandSuccess", event.target.value)}>
            <option value="all">All</option>
            <option value="true">Successful</option>
            <option value="false">Failed</option>
            <option value="unset">Not command-specific</option>
          </select>
        </label>
      </div>

      <p className="result-count">{filteredLogs.length} logs shown from {logs.length} total.</p>

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
              <th>Intent</th>
              <th>Success</th>
              <th>Transcript</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.slice(0, 100).map((log) => (
              <tr key={log.id || `${log.timestamp}-${log.eventType}`}>
                <td>{formatDate(log.timestamp)}</td>
                <td>{log.participantId || "-"}</td>
                <td>{log.conditionId || "-"}</td>
                <td>{log.taskId || "-"}</td>
                <td>{log.modality || "-"}</td>
                <td>{log.eventType || "-"}</td>
                <td>{log.matchedIntent || "-"}</td>
                <td>{formatCommandSuccess(log.commandSuccess)}</td>
                <td>{log.rawTranscript || log.normalizedTranscript || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilterSelect({ label, value, values, onChange }) {
  return (
    <label className="field-label">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">All</option>
        {values.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function filterLogs(logs, filters) {
  return logs.filter((log) => {
    const matchesFields = ["sessionId", "participantId", "conditionId", "taskId", "modality", "eventType"].every((field) =>
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

function formatCommandSuccess(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "-";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}
