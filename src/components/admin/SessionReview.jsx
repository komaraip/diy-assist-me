import { Check, ClipboardList, Eye, Pencil, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { buildSessionBundles, createAdminRecord, deleteSessionBundle, updateAdminRecord, updateSessionMeta } from "../../services/adminDataService.js";

const SESSION_PAGE_SIZE = 10;

export function SessionReview({ adminData, dataSource = "" }) {
  const initialBundles = useMemo(() => buildSessionBundles(adminData), [adminData]);
  // Keep local mutable copy so edits/deletes reflect instantly without a full reload
  const [sessions, setSessions] = useState(initialBundles);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aTime = new Date(a.startedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.startedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [sessions]);
  const selectedSession = sortedSessions.find((s) => s.id === selectedSessionId) || sortedSessions[0] || null;

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
        <div className="session-review-workspace">
          <div className="session-review-browser">
            <div className="table-wrap session-table-wrap">
              <table className="admin-table session-review-table">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Records</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSessions.map((session) => (
                    <tr
                      key={session.id}
                      className={selectedSession?.id === session.id ? "selected-row" : ""}
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <td>
                        <div className="table-link-button">
                          <span className="session-code-line">
                            <strong>{session.participantCode || "-"}</strong>
                          </span>
                          <span>{getParticipantDisplayName(session)}</span>
                        </div>
                      </td>
                      <td>
                        <span className="session-record-lines">
                          <span>{`${session.taskTrials?.length || 0} trials · ${session.susResponses?.length || 0} SUS`}</span>
                          <span>{`${session.debriefResponses?.length || 0} debrief · ${session.observerNotes?.length || 0} notes`}</span>
                        </span>
                      </td>
                      <td>
                        <div className="session-row-actions">
                          <div className="session-action-icons">
                            <button
                              type="button"
                              className="button icon-button danger-icon-button"
                              title="Delete session permanently"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetId(session.id);
                              }}
                              aria-label={`Delete session for ${getParticipantDisplayName(session)}`}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          </div>
                          <label
                            className="exclude-toggle-label compact"
                            title="Toggle exclusion from exports"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={!!session.excludeFromExport}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleExclude(session.id, !!session.excludeFromExport);
                              }}
                              aria-label={`Exclude ${getParticipantDisplayName(session)} from exports`}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      <DetailSection title="Session overview" defaultOpen={true}>
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
              <DetailItem
                key={key}
                label={formatLabel(key)}
                value={typeof value === "boolean" ? (value ? "Confirmed" : "Not confirmed") : value}
              />
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
  const [participantId, setParticipantId] = useState(session.participantId || "");
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [email, setEmail] = useState(profile.email || "");
  const [ageRange, setAgeRange] = useState(profile.ageRange || "");
  const [englishAbility, setEnglishAbility] = useState(profile.englishAbility || "");
  const [tutorialAppUsage, setTutorialAppUsage] = useState(profile.tutorialAppUsage || "");
  const [sequenceAssignment, setSequenceAssignment] = useState(session.sequenceAssignment || "");
  const [tutorialRotation, setTutorialRotation] = useState(session.tutorialRotation || "");
  const [status, setStatus] = useState(session.status || "");
  const [source, setSource] = useState(session.source || "");
  const [startedAt, setStartedAt] = useState(session.startedAt || "");
  const [createdAt, setCreatedAt] = useState(session.createdAt || "");
  const [endedAt, setEndedAt] = useState(session.endedAt || "");
  const [completedAt, setCompletedAt] = useState(session.completedAt || "");
  const [environment, setEnvironment] = useState(() => ({
    ...DEFAULT_ENVIRONMENT_FIELDS,
    ...(session.environment || {}),
  }));
  const [eligibility, setEligibility] = useState(() => ({
    ...DEFAULT_ELIGIBILITY_FIELDS,
    ...(session.eligibility || session.participant?.eligibility || {}),
  }));
  const [browserInfoDraft, setBrowserInfoDraft] = useState(() => stringifyJson(session.browserInfo || {}));
  const [technicalNotesDraft, setTechnicalNotesDraft] = useState(() => stringifyJson(session.technicalNotes || []));
  const [childDrafts, setChildDrafts] = useState(() => ({
    taskTrials: stringifyJson(session.taskTrials || []),
    susResponses: stringifyJson(session.susResponses || []),
    debriefResponses: stringifyJson(session.debriefResponses || []),
    observerNotes: stringifyJson(session.observerNotes || []),
    interactionLogs: stringifyJson(session.interactionLogs || []),
  }));
  const [excludeFromExport, setExcludeFromExport] = useState(!!session.excludeFromExport);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  function updateEnvironment(field, value) {
    setEnvironment((current) => ({ ...current, [field]: value }));
  }

  function updateEligibility(field, value) {
    setEligibility((current) => ({ ...current, [field]: value }));
  }

  function addDebriefTemplate() {
    const currentDebriefs = parseJsonArray(childDrafts.debriefResponses, "Debrief responses");
    if (currentDebriefs.error) {
      setSaveError(currentDebriefs.error);
      return;
    }

    const timestamp = new Date().toISOString();
    const nextRecord = {
      id: `new_debrief_${Date.now()}`,
      participantId,
      participantCode,
      schemaVersion: "chapter4-rq1-rq3-v1",
      sessionId: session.id,
      responses: {
        preferredModality: "",
        easiestPart: "",
        hardestPart: "",
        voiceProblems: "",
        touchProblems: "",
        fallbackComments: "",
        commandClarity: "",
        recoveryEffort: "",
        designImplications: "",
        suggestions: "",
      },
      timestamp,
      createdAt: timestamp,
    };

    setChildDrafts((current) => ({
      ...current,
      debriefResponses: stringifyJson([...currentDebriefs.value, nextRecord]),
    }));
    setSaveError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const parsedBrowserInfo = parseJsonObject(browserInfoDraft, "Detected browser and screen");
    const parsedTechnicalNotes = parseJsonArray(technicalNotesDraft, "Technical notes");
    const parsedChildDrafts = {};

    for (const collectionName of EDITABLE_CHILD_COLLECTIONS) {
      const parsed = parseJsonArray(childDrafts[collectionName], formatLabel(collectionName));
      if (parsed.error) {
        setSaveError(parsed.error);
        setIsSaving(false);
        return;
      }
      parsedChildDrafts[collectionName] = parsed.value;
    }

    if (parsedBrowserInfo.error || parsedTechnicalNotes.error) {
      setSaveError(parsedBrowserInfo.error || parsedTechnicalNotes.error);
      setIsSaving(false);
      return;
    }

    const patch = {
      browserInfo: parsedBrowserInfo.value,
      completedAt,
      createdAt,
      eligibility,
      endedAt,
      environment,
      excludeFromExport,
      participantId,
      participantCode,
      participantProfile: {
        ...(session.participantProfile || {}),
        fullName,
        email,
        ageRange,
        englishAbility,
        tutorialAppUsage,
      },
      sequenceAssignment,
      source,
      startedAt,
      status,
      technicalNotes: parsedTechnicalNotes.value,
      tutorialRotation,
    };

    const result = await updateSessionMeta(session.id, patch);
    if (result.error) {
      setIsSaving(false);
      setSaveError(result.error);
      return;
    }

    for (const collectionName of EDITABLE_CHILD_COLLECTIONS) {
      const existingIds = new Set((session[collectionName] || []).map((record) => record.id).filter(Boolean));
      const draftIds = new Set(parsedChildDrafts[collectionName].map((record) => record?.id).filter(Boolean));
      for (const existingId of existingIds) {
        if (!draftIds.has(existingId)) {
          setIsSaving(false);
          setSaveError(`${formatLabel(collectionName)} cannot remove existing records from this form. Missing id: ${existingId}`);
          return;
        }
      }
      for (const record of parsedChildDrafts[collectionName]) {
        if (!record?.id) {
          setIsSaving(false);
          setSaveError(`${formatLabel(collectionName)} contains a record without id.`);
          return;
        }
        if (!existingIds.has(record.id)) {
          if (!String(record.id).startsWith("new_")) {
            setIsSaving(false);
            setSaveError(`${formatLabel(collectionName)} new records must use a new_ id marker. Check id: ${record.id}`);
            return;
          }

          const { id, ...createPayload } = record;
          const createResult = await createAdminRecord(collectionName, createPayload);
          if (createResult.error) {
            setIsSaving(false);
            setSaveError(createResult.error);
            return;
          }
          record.id = createResult.data.id;
          continue;
        }

        const { id, ...recordPatch } = record;
        const childResult = await updateAdminRecord(collectionName, id, recordPatch);
        if (childResult.error) {
          setIsSaving(false);
          setSaveError(childResult.error);
          return;
        }
      }
    }

    setIsSaving(false);
    onSave({ ...patch, ...parsedChildDrafts });
  }

  return (
    <form className="session-edit-form" onSubmit={handleSubmit} aria-label="Edit session metadata">
      <div className="session-edit-heading">
        <h4>Edit selected session</h4>
        <p>Correct documented admin data only. Existing linked records are updated by id; this form does not create or delete records.</p>
        <label className="session-edit-inline-check">
          <input
            type="checkbox"
            checked={excludeFromExport}
            onChange={(e) => setExcludeFromExport(e.target.checked)}
          />
          Exclude this session from all exports
        </label>
      </div>

      <details className="session-edit-section" open>
        <summary>Session overview</summary>
        <div className="session-edit-grid">
          <TextField id={`edit-participant-id-${session.id}`} label="Participant ID" value={participantId} onChange={setParticipantId} />
          <TextField id={`edit-code-${session.id}`} label="Participant code" value={participantCode} onChange={setParticipantCode} />
          <TextField id={`edit-name-${session.id}`} label="Full name" value={fullName} onChange={setFullName} />
          <TextField id={`edit-email-${session.id}`} label="Email" type="email" value={email} onChange={setEmail} />
          <SelectField
            id={`edit-age-${session.id}`}
            label="Age range"
            value={ageRange}
            onChange={setAgeRange}
            options={PARTICIPANT_PROFILE_OPTIONS.ageRange}
          />
          <SelectField
            id={`edit-english-${session.id}`}
            label="English ability"
            value={englishAbility}
            onChange={setEnglishAbility}
            options={PARTICIPANT_PROFILE_OPTIONS.englishAbility}
          />
          <SelectField
            id={`edit-usage-${session.id}`}
            label="Tutorial app usage"
            value={tutorialAppUsage}
            onChange={setTutorialAppUsage}
            options={PARTICIPANT_PROFILE_OPTIONS.tutorialAppUsage}
          />
          <TextField id={`edit-sequence-${session.id}`} label="Sequence" value={sequenceAssignment} onChange={setSequenceAssignment} />
          <TextField id={`edit-rotation-${session.id}`} label="Tutorial rotation" value={tutorialRotation} onChange={setTutorialRotation} />
          <TextField id={`edit-status-${session.id}`} label="Status" value={status} onChange={setStatus} />
          <TextField id={`edit-started-${session.id}`} label="Started at" value={startedAt} onChange={setStartedAt} />
          <TextField id={`edit-created-${session.id}`} label="Created at" value={createdAt} onChange={setCreatedAt} />
          <TextField id={`edit-ended-${session.id}`} label="Ended at" value={endedAt} onChange={setEndedAt} />
          <TextField id={`edit-completed-${session.id}`} label="Completed at" value={completedAt} onChange={setCompletedAt} />
          <TextField id={`edit-source-${session.id}`} label="Source" value={source} onChange={setSource} />
        </div>
      </details>

      <details className="session-edit-section" open>
        <summary>Setup and environment</summary>
        <div className="session-edit-grid">
          {ENVIRONMENT_SELECT_FIELDS.map((field) => (
            <SelectField
              key={field.name}
              id={`edit-${field.name}-${session.id}`}
              label={field.label}
              value={environment[field.name] || ""}
              onChange={(value) => updateEnvironment(field.name, value)}
              options={field.options}
            />
          ))}
          {ENVIRONMENT_TEXT_FIELDS.map((field) => (
            <TextField
              key={field.name}
              id={`edit-${field.name}-${session.id}`}
              label={field.label}
              value={environment[field.name] || ""}
              onChange={(value) => updateEnvironment(field.name, value)}
            />
          ))}
        </div>
        <div className="checkbox-stack session-edit-checklist">
          {ENVIRONMENT_BOOLEAN_FIELDS.map((field) => (
            <label className="checkbox-row" key={field.name}>
              <input
                type="checkbox"
                checked={environment[field.name] === true}
                onChange={(event) => updateEnvironment(field.name, event.target.checked)}
              />
              <span>{field.label}</span>
            </label>
          ))}
        </div>
      </details>

      <details className="session-edit-section">
        <summary>Eligibility screening</summary>
        <div className="checkbox-stack session-edit-checklist">
          {ELIGIBILITY_FIELDS.map((field) => (
            <label className="checkbox-row" key={field.name}>
              <input
                type="checkbox"
                checked={eligibility[field.name] === true}
                onChange={(event) => updateEligibility(field.name, event.target.checked)}
              />
              <span>{field.label}</span>
            </label>
          ))}
        </div>
      </details>

      <JsonEditSection
        title="Detected browser and screen"
        value={browserInfoDraft}
        onChange={setBrowserInfoDraft}
        rows={8}
      />

      <JsonEditSection
        title="Technical notes"
        value={technicalNotesDraft}
        onChange={setTechnicalNotesDraft}
        rows={7}
      />

      {EDITABLE_CHILD_COLLECTIONS.map((collectionName) => (
        <JsonEditSection
          key={collectionName}
          title={formatLabel(collectionName)}
          value={childDrafts[collectionName]}
          onChange={(value) => setChildDrafts((current) => ({ ...current, [collectionName]: value }))}
          rows={collectionName === "interactionLogs" ? 10 : 8}
          action={collectionName === "debriefResponses" ? {
            label: "Add missing final feedback",
            onClick: addDebriefTemplate,
          } : null}
        />
      ))}

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

function TextField({ id, label, value, onChange, type = "text" }) {
  return (
    <div className="form-row">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({ id, label, value, onChange, options }) {
  return (
    <div className="form-row">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Not recorded</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function JsonEditSection({ title, value, onChange, rows = 6, action = null }) {
  return (
    <details className="session-edit-section">
      <summary>
        <span>{title}</span>
        {action ? (
          <button
            type="button"
            className="button secondary-action session-edit-summary-action"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              action.onClick();
            }}
          >
            {action.label}
          </button>
        ) : null}
      </summary>
      <div className="form-row">
        <label>{title} JSON</label>
        <textarea
          className="json-edit-area"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          spellCheck={false}
        />
      </div>
    </details>
  );
}

const EDITABLE_CHILD_COLLECTIONS = [
  "taskTrials",
  "susResponses",
  "debriefResponses",
  "observerNotes",
  "interactionLogs",
];

const PARTICIPANT_PROFILE_OPTIONS = {
  ageRange: [
    { value: "18-24", label: "18-24" },
    { value: "25-35", label: "25-35" },
  ],
  englishAbility: [
    { value: "can_understand", label: "Can understand English" },
    { value: "comfortable_commands", label: "Comfortable using simple English commands" },
  ],
  tutorialAppUsage: [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "rarely_never", label: "Rarely or never" },
  ],
};

const DEFAULT_ENVIRONMENT_FIELDS = {
  deviceType: "",
  browserName: "",
  microphonePermissionStatus: "",
  roomNoiseLevelNote: "",
  internetConnectionNote: "",
  taskEnvironmentNote: "",
  participantSetupNote: "",
  researcherObservationNote: "",
  sameDeviceConfirmed: false,
  cacheResetConfirmed: false,
  microphoneCheckConfirmed: false,
};

const ENVIRONMENT_SELECT_FIELDS = [
  {
    name: "deviceType",
    label: "Device type",
    options: ["Laptop", "Tablet", "Smartphone"].map((value) => ({ value, label: value })),
  },
  {
    name: "browserName",
    label: "Browser name",
    options: [
      "Google Chrome desktop",
      "Google Chrome mobile",
      "Microsoft Edge desktop",
      "Safari mobile",
      "Other browser",
    ].map((value) => ({ value, label: value })),
  },
  {
    name: "microphonePermissionStatus",
    label: "Microphone permission status",
    options: ["Allowed"].map((value) => ({ value, label: value })),
  },
  {
    name: "roomNoiseLevelNote",
    label: "Room noise level",
    options: ["Quiet room", "Low background noise"].map((value) => ({ value, label: value })),
  },
  {
    name: "internetConnectionNote",
    label: "Internet connection",
    options: ["Stable connection"].map((value) => ({ value, label: value })),
  },
];

const ENVIRONMENT_TEXT_FIELDS = [
  { name: "taskEnvironmentNote", label: "Task environment note" },
  { name: "participantSetupNote", label: "Participant setup note" },
  { name: "researcherObservationNote", label: "Researcher observation note" },
];

const ENVIRONMENT_BOOLEAN_FIELDS = [
  { name: "sameDeviceConfirmed", label: "Same device/browser/screen/microphone/internet confirmed" },
  { name: "cacheResetConfirmed", label: "Cache or prototype state reset confirmed" },
  { name: "microphoneCheckConfirmed", label: "Microphone recognition check confirmed" },
];

const DEFAULT_ELIGIBILITY_FIELDS = {
  familiarWithWebTutorials: false,
  canPerformSimulatedDiy: false,
  notPrototypeDeveloper: false,
  notExpertInSelectedTasks: false,
  noTemporaryVoiceCondition: false,
  noUncorrectedHearingVisualLimit: false,
};

const ELIGIBILITY_FIELDS = [
  { name: "familiarWithWebTutorials", label: "Participant is familiar with web tutorials" },
  { name: "canPerformSimulatedDiy", label: "Participant can perform simple simulated DIY tasks" },
  { name: "notPrototypeDeveloper", label: "Participant was not involved in prototype development" },
  { name: "notExpertInSelectedTasks", label: "Participant is not an expert in the selected tutorial tasks" },
  { name: "noTemporaryVoiceCondition", label: "Participant has no temporary voice condition affecting recognition" },
  { name: "noUncorrectedHearingVisualLimit", label: "Participant has no uncorrected hearing or visual limitation" },
];

function stringifyJson(value) {
  return JSON.stringify(value ?? null, null, 2);
}

function parseJsonObject(value, label) {
  try {
    const parsed = JSON.parse(value || "{}");
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      return { error: `${label} must be a JSON object.` };
    }
    return { value: parsed };
  } catch (error) {
    return { error: `${label} has invalid JSON: ${error.message}` };
  }
}

function parseJsonArray(value, label) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) {
      return { error: `${label} must be a JSON array.` };
    }
    return { value: parsed };
  } catch (error) {
    return { error: `${label} has invalid JSON: ${error.message}` };
  }
}

function DetailSection({ title, defaultOpen = false, children }) {
  return (
    <details className="debrief-accordion session-detail-section" style={{ marginTop: "1rem" }} open={defaultOpen}>
      <summary style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{title}</span>
      </summary>
      <div className="accordion-content" style={{ background: "var(--surface)" }}>
        {children}
      </div>
    </details>
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
