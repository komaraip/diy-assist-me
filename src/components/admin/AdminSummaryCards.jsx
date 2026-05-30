import { ClipboardCheck, FileText, ListFilter, MessageSquareText, Mic, TableProperties, Users } from "lucide-react";

export function AdminSummaryCards({ adminData }) {
  const cards = [
    {
      label: "Total sessions",
      value: (adminData.sessions || []).length,
      icon: Users,
    },
    {
      label: "AB / BA balance",
      value: `${countSessions(adminData, "sequenceAssignment", "AB")} / ${countSessions(adminData, "sequenceAssignment", "BA")}`,
      icon: TableProperties,
    },
    {
      label: "Rotation A / B",
      value: `${countSessions(adminData, "tutorialRotation", "rotation_a")} / ${countSessions(adminData, "tutorialRotation", "rotation_b")}`,
      icon: ClipboardCheck,
    },
    {
      label: "Task trials",
      value: (adminData.taskTrials || []).length,
      icon: ClipboardCheck,
    },
    {
      label: "Interaction logs",
      value: (adminData.interactionLogs || []).length,
      icon: ListFilter,
    },
    {
      label: "Voice logs",
      value: (adminData.interactionLogs || []).filter((log) => log.modality === "voice").length,
      icon: Mic,
    },
    {
      label: "SUS responses",
      value: (adminData.susResponses || []).length,
      icon: FileText,
    },
    {
      label: "Debrief responses",
      value: (adminData.debriefResponses || []).length,
      icon: MessageSquareText,
    },
  ];

  return (
    <section className="admin-summary-grid" aria-label="Admin data summary">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className="admin-summary-card" key={card.label}>
            <span className="admin-summary-icon">
              <Icon aria-hidden="true" />
            </span>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function countSessions(adminData, field, value) {
  return (adminData.sessions || []).filter((session) => session.excludeFromExport !== true && session[field] === value).length;
}
