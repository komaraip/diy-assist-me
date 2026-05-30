export function AdminSummaryCards({ adminData }) {
  const cards = [
    {
      label: "Sessions",
      value: (adminData.sessions || []).length,
      description: "Total recorded study sessions",
    },
    {
      label: "Sequence",
      value: `${countSessions(adminData, "sequenceAssignment", "AB")} / ${countSessions(adminData, "sequenceAssignment", "BA")}`,
      description: "Sequence balance (AB vs BA)",
    },
    {
      label: "Rotation",
      value: `${countSessions(adminData, "tutorialRotation", "rotation_a")} / ${countSessions(adminData, "tutorialRotation", "rotation_b")}`,
      description: "Rotation balance (A vs B)",
    },
    {
      label: "Trials",
      value: (adminData.taskTrials || []).length,
      description: "Completed user task trials",
    },
    {
      label: "Logs",
      value: (adminData.interactionLogs || []).length,
      description: "Total interaction events recorded",
    },
    {
      label: "Voice Logs",
      value: (adminData.interactionLogs || []).filter((log) => log.modality === "voice").length,
      description: "Total voice commands logged",
    },
    {
      label: "SUS",
      value: (adminData.susResponses || []).length,
      description: "Completed SUS usability surveys",
    },
    {
      label: "Debrief",
      value: (adminData.debriefResponses || []).length,
      description: "Completed debrief feedback surveys",
    },
    {
      label: "Participants",
      value: (adminData.participants || []).length,
      description: "Total unique study participants",
    },
    {
      label: "Notes",
      value: (adminData.observerNotes || []).length,
      description: "Total researcher observer notes",
    },
  ];

  return (
    <section className="admin-summary-grid" aria-label="Admin data summary">
      {cards.map((card) => (
        <article className="admin-summary-card" key={card.label}>
          <div>
            <span className="summary-card-badge">{card.label}</span>
            <strong>{card.value}</strong>
            <p className="admin-summary-desc">{card.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function countSessions(adminData, field, value) {
  return (adminData.sessions || []).filter((session) => session.excludeFromExport !== true && session[field] === value).length;
}
