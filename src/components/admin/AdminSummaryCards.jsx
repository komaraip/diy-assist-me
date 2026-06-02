import {
  buildExportEligibleAdminData,
  getExportEligibilitySummary,
} from "../../services/adminDataService.js";

export function AdminSummaryCards({ adminData }) {
  const eligibleData = buildExportEligibleAdminData(adminData);
  const eligibilitySummary = getExportEligibilitySummary(adminData);
  const cards = [
    {
      label: "Sessions",
      value: eligibleData.sessions.length,
      description: "Total recorded study sessions",
    },
    {
      label: "Sequence",
      value: `${countSessions(eligibleData, "sequenceAssignment", "AB")} / ${countSessions(eligibleData, "sequenceAssignment", "BA")}`,
      description: "Sequence balance (AB vs BA)",
    },
    {
      label: "Rotation",
      value: `${countSessions(eligibleData, "tutorialRotation", "rotation_a")} / ${countSessions(eligibleData, "tutorialRotation", "rotation_b")}`,
      description: "Rotation balance (A vs B)",
    },
    {
      label: "Trials",
      value: eligibleData.taskTrials.length,
      description: "Completed user task trials",
    },
    {
      label: "Logs",
      value: eligibleData.interactionLogs.length,
      description: "Total interaction events recorded",
    },
    {
      label: "Voice Logs",
      value: (eligibleData.interactionLogs || []).filter((log) => log.modality === "voice").length,
      description: "Total voice commands logged",
    },
    {
      label: "SUS",
      value: eligibleData.susResponses.length,
      description: "Completed SUS usability surveys",
    },
    {
      label: "Debrief",
      value: eligibleData.debriefResponses.length,
      description: "Completed debrief feedback surveys",
    },
    {
      label: "Participants",
      value: eligibilitySummary.eligibleParticipantCount,
      description: "Total unique study participants",
    },
    {
      label: "Notes",
      value: eligibleData.observerNotes.length,
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
  return (adminData.sessions || []).filter((session) => session[field] === value).length;
}
