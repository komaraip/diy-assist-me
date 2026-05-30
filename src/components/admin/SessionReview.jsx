import { ClipboardList, Pencil, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { buildSessionBundles, deleteSessionBundle, updateSessionMeta } from "../../services/adminDataService.js";

export function SessionReview({ adminData, dataSource = "" }) {
  const initialBundles = useMemo(() => buildSessionBundles(adminData), [adminData]);
  // Keep local mutable copy so edits/deletes reflect instantly without a full reload
  const [sessions, setSessions] = useState(initialBundles);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0] || null;

  // ── Delete ──────────────────────────────────────────────────────────────────
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    setDeleteError(null);

    // Find the session so we can also pass its participantId
    const targetSession = sessions.find((s) => s.id === deleteTargetId);
    const participantId = targetSession?.participantId || null;

    const result = await deleteSessionBundle(deleteTargetId, participantId);
    setIsDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== deleteTargetId);
      // Auto-select next session, or clear selection
      if (selectedSessionId === deleteTargetId) {
        setSelectedSessionId(remaining[0]?.id || "");
      }
      return remaining;
    });
    setDeleteTargetId(null);
  }

  // ── Exclude toggle ───────────────────────────────────────────────────────────
  async function handleToggleExclude(sessionId, currentValue) {
    const newValue = !currentValue;
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, excludeFromExport: newValue } : s))
    );
    const result = await updateSessionMeta(sessionId, { excludeFromExport: newValue });
    if (result.error) {
      // Revert on failure
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, excludeFromExport: currentValue } : s))
      );
    }
  }

  // ── Edit callback (called from SessionDetail's inline form) ──────────────────
  const handleSaveEdit = useCallback((sessionId, patch) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...patch } : s))
    );
  }, []);

  return (
    <section className="admin-panel" aria-labelledby="session-review-heading">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Session review</p>
          <h2 id="session-review-heading">Guided sessions</h2>
          <p>Select a session to review, edit metadata, or delete it from Firestore.</p>
        </div>
        <ClipboardList aria-hidden="true" />
      </div>

      {/* Delete confirmation dialog */}
      {deleteTargetId && (
        <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
          <div className="admin-confirm-dialog">
            <h3 id="delete-confirm-title">Delete session?</h3>
            <p>
              This will permanently delete the session and <strong>all linked records</strong> (task trials, SUS
              responses, interaction logs, debrief responses, observer notes) from Firestore. This cannot be undone.
            </p>
            {deleteError && <p className="status-note error-note">{deleteError}</p>}
            <div className="admin-confirm-actions">
              <button
                type="button"
                className="button secondary-action"
                onClick={() => { setDeleteTargetId(null); setDeleteError(null); }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button danger-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sessions.length ? (
        <div className="admin-review-grid">
          <div className="session-list" aria-label="Guided sessions">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={[
                  "session-list-item-wrap",
                  session.excludeFromExport ? "session-excluded" : "",
                ].join(" ").trim()}
              >
                <button
                  type="button"
                  className={selectedSession?.id === session.id ? "session-list-item active" : "session-list-item"}
                  onClick={() => setSelectedSessionId(session.id)}
                  aria-current={selectedSession?.id === session.id}
                >
                  <span className="session-list-topline">
                    <strong>{getParticipantDisplayName(session)}</strong>
                    <span className="status-badge">{getSessionStatus(session)}</span>
                  </span>
                  <span>Code: {session.participantCode || session.participantId || "Not recorded"}</span>
                  <span>Sequence: {session.sequenceAssignment || "Not recorded"}</span>
                  <span>Started: {formatDate(session.startedAt || session.createdAt)}</span>
                  {session.excludeFromExport && (
                    <span className="exclude-badge">Excluded from export</span>
                  )}
                  <small>Source: {session.source || dataSource || "Not recorded"}</small>
                </button>

                <div className="session-list-actions">
                  <label className="exclude-toggle-label" title="Toggle exclusion from exports">
                    <input
                      type="checkbox"
                      checked={!!session.excludeFromExport}
                      onChange={() => handleToggleExclude(session.id, !!session.excludeFromExport)}
                      aria-label={`Exclude ${getParticipantDisplayName(session)} from exports`}
                    />
                    <span>Exclude</span>
                  </label>
                  <button
                    type="button"
                    className="button icon-button danger-icon-button"
                    title="Delete session permanently"
                    onClick={() => setDeleteTargetId(session.id)}
                    aria-label={`Delete session for ${getParticipantDisplayName(session)}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedSession ? (
            <SessionDetail
              session={selectedSession}
              dataSource={dataSource}
              onSaveEdit={handleSaveEdit}
            />
          ) : null}
        </div>
      ) : (
        <p className="empty-state">No guided sessions are available yet.</p>
      )}
    </section>
  );
}

// ── Session Detail ─────────────────────────────────────────────────────────────

function SessionDetail({ session, dataSource, onSaveEdit }) {
  const participantProfile = getParticipantProfile(session);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <article className="session-detail">
      <div className="session-detail-header">
        <div>
          <p className="eyebrow">Selected session</p>
          <h3>{getParticipantDisplayName(session)}</h3>
        </div>
        <div className="session-detail-header-actions">
          <span className="status-badge">{getSessionStatus(session)}</span>
          {session.excludeFromExport && (
            <span className="exclude-badge">Excluded from export</span>
          )}
          <button
            type="button"
            className="button secondary-action"
            onClick={() => setIsEditing((v) => !v)}
            aria-expanded={isEditing}
          >
            {isEditing ? <><X size={14} aria-hidden="true" /> Cancel</> : <><Pencil size={14} aria-hidden="true" /> Edit</>}
          </button>
        </div>
      </div>

      {isEditing && (
        <SessionEditForm
          session={session}
          onSave={(patch) => { onSaveEdit(session.id, patch); setIsEditing(false); }}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {session.researcherNote && (
        <div className="researcher-note-banner">
          <strong>Researcher note:</strong> {session.researcherNote}
        </div>
      )}

      <DetailSection title="Session overview">
        <dl className="detail-list">
          <DetailItem label="Session ID" value={session.id} />
          <DetailItem label="User code" value={session.participantCode || session.participantId} />
          <DetailItem label="Participant name" value={participantProfile.fullName} />
          <DetailItem label="Email" value={participantProfile.email} />
          <DetailItem
            label="Age range"
            value={
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <span>{participantProfile.ageRange || "Not recorded"}</span>
                {participantProfile.ageRange &&
                  participantProfile.ageRange !== "18-24" &&
                  participantProfile.ageRange !== "25-35" && (
                    <span
                      className="screening-warning"
                      style={{
                        marginLeft: "0.5rem",
                        color: "#dc2626",
                        background: "#fee2e2",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "0.25rem",
                        border: "1px solid #fca5a5",
                        whiteSpace: "nowrap"
                      }}
                    >
                      Out of target (18-35)
                    </span>
                  )}
              </span>
            }
          />
          <DetailItem
            label="English ability"
            value={
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <span>{formatLabel(participantProfile.englishAbility)}</span>
                {!["can_understand", "comfortable_commands"].includes(participantProfile.englishAbility) && (
                  <span
                    className="screening-warning"
                    style={{
                      marginLeft: "0.5rem",
                      color: "#dc2626",
                      background: "#fee2e2",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "0.25rem",
                      border: "1px solid #fca5a5",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Inadequate for English commands
                  </span>
                )}
              </span>
            }
          />
          <DetailItem label="Tutorial app usage" value={formatLabel(participantProfile.tutorialAppUsage)} />
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

      <DetailSection title="Eligibility screening">
        {Object.keys(session.eligibility || session.participant?.eligibility || {}).length ? (
          <dl className="detail-list">
            {Object.entries(session.eligibility || session.participant?.eligibility || {}).map(([key, value]) => (
              <DetailItem key={key} label={formatLabel(key)} value={value ? "Confirmed" : "Not confirmed"} />
            ))}
          </dl>
        ) : (
          <EmptyState>No eligibility screening recorded.</EmptyState>
        )}
      </DetailSection>

      <DetailSection title="Detected browser and screen">
        {Object.keys(session.browserInfo || {}).length ? (
          <dl className="detail-list">
            {Object.entries(session.browserInfo || {}).map(([key, value]) => (
              <DetailItem key={key} label={formatLabel(key)} value={String(value ?? "")} />
            ))}
          </dl>
        ) : (
          <EmptyState>No browser metadata recorded.</EmptyState>
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

// ── Inline Edit Form ───────────────────────────────────────────────────────────

function SessionEditForm({ session, onSave, onCancel }) {
  const profile = getParticipantProfile(session);
  const [participantCode, setParticipantCode] = useState(session.participantCode || "");
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [email, setEmail] = useState(profile.email || "");
  const [researcherNote, setResearcherNote] = useState(session.researcherNote || "");
  const [excludeFromExport, setExcludeFromExport] = useState(!!session.excludeFromExport);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const patch = {
      participantCode,
      participantProfile: {
        ...(session.participantProfile || {}),
        fullName,
        email,
      },
      researcherNote,
      excludeFromExport,
    };

    const result = await updateSessionMeta(session.id, patch);
    setIsSaving(false);

    if (result.error) {
      setSaveError(result.error);
      return;
    }

    onSave(patch);
  }

  return (
    <form className="session-edit-form" onSubmit={handleSubmit} aria-label="Edit session metadata">
      <h4>Edit session metadata</h4>

      <div className="form-row">
        <label htmlFor={`edit-code-${session.id}`}>Participant code</label>
        <input
          id={`edit-code-${session.id}`}
          type="text"
          value={participantCode}
          onChange={(e) => setParticipantCode(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label htmlFor={`edit-name-${session.id}`}>Full name</label>
        <input
          id={`edit-name-${session.id}`}
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label htmlFor={`edit-email-${session.id}`}>Email</label>
        <input
          id={`edit-email-${session.id}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label htmlFor={`edit-note-${session.id}`}>Researcher note</label>
        <textarea
          id={`edit-note-${session.id}`}
          value={researcherNote}
          onChange={(e) => setResearcherNote(e.target.value)}
          rows={2}
          placeholder="e.g. test run, consent withdrawn..."
        />
      </div>

      <div className="form-row form-row-checkbox">
        <label>
          <input
            type="checkbox"
            checked={excludeFromExport}
            onChange={(e) => setExcludeFromExport(e.target.checked)}
          />
          Exclude this session from all exports
        </label>
      </div>

      {saveError && <p className="status-note error-note">{saveError}</p>}

      <div className="admin-confirm-actions">
        <button type="button" className="button secondary-action" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="button primary-button" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

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

function getParticipantProfile(session = {}) {
  return {
    fullName: session.participantProfile?.fullName || session.participant?.participantProfile?.fullName || "",
    email: session.participantProfile?.email || session.participant?.participantProfile?.email || "",
    ageRange: session.participantProfile?.ageRange || session.participant?.participantProfile?.ageRange || "",
    englishAbility: session.participantProfile?.englishAbility || session.participant?.participantProfile?.englishAbility || "",
    tutorialAppUsage: session.participantProfile?.tutorialAppUsage || session.participant?.participantProfile?.tutorialAppUsage || "",
  };
}

function getParticipantDisplayName(session = {}) {
  const profile = getParticipantProfile(session);
  return profile.fullName || session.participantCode || session.participantId || "Unknown user";
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
