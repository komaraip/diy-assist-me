import { ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { buildSessionBundles } from "../../services/adminDataService.js";

export function SessionReview({ adminData, dataSource = "" }) {
  const sessions = useMemo(() => buildSessionBundles(adminData), [adminData]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) || sessions[0] || null;

  return (
    <section className="admin-panel" aria-labelledby="session-review-heading">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Session review</p>
          <h2 id="session-review-heading">Guided sessions</h2>
          <p>Review session context, task activity, questionnaire responses, notes, and logs.</p>
        </div>
        <ClipboardList aria-hidden="true" />
      </div>

      {sessions.length ? (
        <div className="admin-review-grid">
          <div className="session-list" aria-label="Guided sessions">
            {sessions.map((session) => (
              <button
                type="button"
                key={session.id}
                className={selectedSession?.id === session.id ? "session-list-item active" : "session-list-item"}
                onClick={() => setSelectedSessionId(session.id)}
                aria-current={selectedSession?.id === session.id}
              >
                <span className="session-list-topline">
                  <strong>{session.participantCode || session.participantId || "Unknown user"}</strong>
                  <span className="status-badge">{getSessionStatus(session)}</span>
                </span>
                <span>Sequence: {session.sequenceAssignment || "Not recorded"}</span>
                <span>Started: {formatDate(session.startedAt || session.createdAt)}</span>
                <small>Source: {session.source || dataSource || "Not recorded"}</small>
              </button>
            ))}
          </div>

          {selectedSession ? <SessionDetail session={selectedSession} dataSource={dataSource} /> : null}
        </div>
      ) : (
        <p className="empty-state">No guided sessions are available yet.</p>
      )}
    </section>
  );
}

function SessionDetail({ session, dataSource }) {
  return (
    <article className="session-detail">
      <div className="session-detail-header">
        <div>
          <p className="eyebrow">Selected session</p>
          <h3>{session.participantCode || "Session detail"}</h3>
        </div>
        <span className="status-badge">{getSessionStatus(session)}</span>
      </div>

      <DetailSection title="Session overview">
        <dl className="detail-list">
          <DetailItem label="Session ID" value={session.id} />
          <DetailItem label="User code" value={session.participantCode || session.participantId} />
          <DetailItem label="Sequence" value={session.sequenceAssignment} />
          <DetailItem label="Tutorial rotation" value={session.tutorialRotation} />
          <DetailItem label="Started" value={formatDate(session.startedAt || session.createdAt)} />
          <DetailItem label="Source" value={session.source || dataSource} />
        </dl>
      </DetailSection>

      <DetailSection title="Setup and environment">
        {Object.keys(session.environment || {}).length ? (
          <dl className="detail-list">
            {Object.entries(session.environment || {}).map(([key, value]) => (
              <DetailItem key={key} label={formatLabel(key)} value={value} />
            ))}
          </dl>
        ) : (
          <EmptyState>No setup notes recorded.</EmptyState>
        )}
      </DetailSection>

      <DetailSection title="Task trials">
        {session.taskTrials.length ? (
          <div className="table-wrap compact-table-wrap">
            <table className="admin-table compact-admin-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Mode</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Invalid</th>
                </tr>
              </thead>
              <tbody>
                {session.taskTrials.map((trial) => (
                  <tr key={trial.id || `${trial.taskId}-${trial.startedAt}`}>
                    <td>{trial.taskId || "-"}</td>
                    <td>{trial.modality || "-"}</td>
                    <td>{trial.trialType || "-"}</td>
                    <td>{trial.completionStatus || trial.status || "Not completed"}</td>
                    <td>{formatDuration(trial.durationSeconds)}</td>
                    <td>{trial.invalidTrial ? trial.invalidTrialReason || "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No task trials recorded.</EmptyState>
        )}
      </DetailSection>

      <DetailSection title="SUS responses">
        {session.susResponses.length ? (
          <ul className="admin-record-list">
            {session.susResponses.map((response) => (
              <li key={response.id || `${response.conditionId}-${response.timestamp}`}>
                <strong>{response.modality || response.conditionId || "Response"}</strong>
                <span>SUS score: {response.susScore ?? "Not calculated"}</span>
                <small>{formatDate(response.timestamp || response.createdAt)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No SUS responses recorded.</EmptyState>
        )}
      </DetailSection>

      <DetailSection title="Debrief responses">
        {session.debriefResponses.length ? (
          <ul className="admin-record-list">
            {session.debriefResponses.map((debrief) => (
              <li key={debrief.id || debrief.timestamp}>
                <strong>{formatDate(debrief.timestamp || debrief.createdAt)}</strong>
                <span>{summarizeDebrief(debrief.responses)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No debrief responses recorded.</EmptyState>
        )}
      </DetailSection>

      <DetailSection title="Observer notes">
        {session.observerNotes.length ? (
          <ul className="admin-record-list">
            {session.observerNotes.map((note) => (
              <li key={note.id || note.createdAt}>
                <strong>{note.severity || "note"}</strong>
                <span>{note.note}</span>
                <small>{formatDate(note.createdAt || note.timestamp)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No observer notes recorded.</EmptyState>
        )}
      </DetailSection>

      <DetailSection title="Technical notes">
        {(session.technicalNotes || []).length ? (
          <ul className="admin-record-list">
            {session.technicalNotes.map((note) => (
              <li key={note.id || note.createdAt || note.note}>
                <strong>{note.type || "Technical note"}</strong>
                <span>{note.note}</span>
                <small>{formatDate(note.createdAt || note.timestamp)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No technical notes recorded.</EmptyState>
        )}
      </DetailSection>

      <DetailSection title="Interaction logs">
        {session.interactionLogs.length ? (
          <ul className="admin-record-list">
            {session.interactionLogs.slice(0, 8).map((log) => (
              <li key={log.id || `${log.timestamp}-${log.eventType}`}>
                <strong>{log.eventType || "Interaction"}</strong>
                <span>{log.modality || "unknown"}{log.matchedIntent ? ` / ${log.matchedIntent}` : ""}</span>
                <small>{formatDate(log.timestamp || log.createdAt)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No interaction logs recorded.</EmptyState>
        )}
        {session.interactionLogs.length > 8 ? (
          <p className="status-note">Showing 8 of {session.interactionLogs.length} logs. Use the log viewer below for filters.</p>
        ) : null}
      </DetailSection>
    </article>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="session-detail-section" aria-label={title}>
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not recorded"}</dd>
    </div>
  );
}

function EmptyState({ children }) {
  return <p className="empty-state">{children}</p>;
}

function getSessionStatus(session) {
  if (session.status) return formatLabel(session.status);
  if (session.completedAt || session.endedAt || session.debriefResponses?.length) return "Completed";
  return "In progress";
}

function summarizeDebrief(responses = {}) {
  const preferred = responses.preferredModality ? `Preferred: ${responses.preferredModality}` : "";
  const hardest = responses.hardestPart ? `Hardest: ${responses.hardestPart}` : "";
  return [preferred, hardest].filter(Boolean).join(" | ") || "Response recorded";
}

function formatDuration(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${value}s`;
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function formatLabel(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
