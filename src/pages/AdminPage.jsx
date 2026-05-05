import { ClipboardCheck, FileText, MessageSquareText, Mic, RefreshCcw, TableProperties, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EvidenceChecklist } from "../components/admin/EvidenceChecklist.jsx";
import { InteractionLogViewer } from "../components/admin/InteractionLogViewer.jsx";
import { MetricsSummary } from "../components/admin/MetricsSummary.jsx";
import { SessionReview } from "../components/admin/SessionReview.jsx";
import { loadAdminData } from "../services/adminDataService.js";

export function AdminPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Researcher admin</p>
        <h1>Researcher Dashboard</h1>
        <p>
          Review guided sessions, task activity, questionnaire responses, and interaction logs.
        </p>
      </div>

      <AdminDashboard />
    </section>
  );
}

function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);
    const result = await loadAdminData();
    setAdminData(result.data);
    setResultMeta({ source: result.source, warning: result.warning, error: result.error });
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <p className="status-note">Loading admin data...</p>;
  }

  if (resultMeta.error || !adminData) {
    return <p className="status-note error-note">{resultMeta.error || "Admin data could not be loaded."}</p>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-toolbar">
        <p className="data-source-note">
          Data source: {resultMeta.source}
          {resultMeta.warning ? `. ${resultMeta.warning}` : ""}
        </p>
        <div className="admin-toolbar-actions">
          <button type="button" className="button secondary-action" onClick={loadData}>
            <RefreshCcw aria-hidden="true" />
            Refresh
          </button>
          <Link className="button primary-button" to="/admin/export">
            <TableProperties aria-hidden="true" />
            Open exports
          </Link>
        </div>
      </div>

      <AdminSummaryCards adminData={adminData} />
      <MetricsSummary adminData={adminData} />
      <EvidenceChecklist adminData={adminData} />
      <SessionReview adminData={adminData} dataSource={resultMeta.source} />
      <InteractionLogViewer logs={adminData.interactionLogs || []} />
    </div>
  );
}

function AdminSummaryCards({ adminData }) {
  const cards = [
    {
      label: "Total sessions",
      value: (adminData.sessions || []).length,
      detail: "Guided sessions loaded",
      icon: Users,
    },
    {
      label: "Task trials",
      value: (adminData.taskTrials || []).length,
      detail: "Practice and task records",
      icon: ClipboardCheck,
    },
    {
      label: "Voice logs",
      value: (adminData.interactionLogs || []).filter((log) => log.modality === "voice").length,
      detail: "Voice interaction events",
      icon: Mic,
    },
    {
      label: "SUS responses",
      value: (adminData.susResponses || []).length,
      detail: "Questionnaire responses",
      icon: FileText,
    },
    {
      label: "Debrief responses",
      value: (adminData.debriefResponses || []).length,
      detail: "Post-session feedback",
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
              <p>{card.detail}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
