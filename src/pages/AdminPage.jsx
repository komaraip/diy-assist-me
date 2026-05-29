import { ClipboardCheck, FileText, MessageSquareText, Mic, RefreshCcw, TableProperties, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EvidenceChecklist } from "../components/admin/EvidenceChecklist.jsx";
import { InteractionLogViewer } from "../components/admin/InteractionLogViewer.jsx";
import { MetricsSummary } from "../components/admin/MetricsSummary.jsx";
import { SessionReview } from "../components/admin/SessionReview.jsx";
import { loadAdminData, purgeAllStudyData } from "../services/adminDataService.js";

export function AdminPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Researcher admin</p>
        <h1>Dashboard</h1>
        <p>
          Review guided sessions, task activity, SUS responses, voice and touch logs, observer notes,
          and export readiness for RQ1, RQ2, and RQ3.
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
          <PurgeButton onPurged={loadData} />
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

function PurgeButton({ onPurged }) {
  const [step, setStep] = useState("idle"); // idle | confirm | purging | done | error
  const [confirmText, setConfirmText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deletedCount, setDeletedCount] = useState(null);

  async function handlePurge() {
    if (confirmText !== "PURGE") return;
    setStep("purging");
    const result = await purgeAllStudyData();
    if (result.error) {
      setErrorMsg(result.error);
      setStep("error");
      return;
    }
    setDeletedCount(result.data?.deleted ?? "?");
    setStep("done");
    setConfirmText("");
    onPurged();
  }

  if (step === "idle") {
    return (
      <button type="button" className="button danger-button" onClick={() => setStep("confirm")}>
        <Trash2 size={14} aria-hidden="true" />
        Purge all data
      </button>
    );
  }

  if (step === "confirm") {
    return (
      <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="purge-confirm-title">
        <div className="admin-confirm-dialog">
          <h3 id="purge-confirm-title">⚠️ Purge ALL Firestore data?</h3>
          <p>
            This will permanently delete <strong>every document</strong> in all study collections:
            participants, sessions, taskTrials, interactionLogs, susResponses, debriefResponses, and observerNotes.
            This cannot be undone.
          </p>
          <p>Type <strong>PURGE</strong> to confirm:</p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type PURGE"
            autoFocus
            style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #fca5a5", marginBottom: "1rem", width: "100%", fontSize: "0.9rem" }}
          />
          <div className="admin-confirm-actions">
            <button type="button" className="button secondary-action" onClick={() => { setStep("idle"); setConfirmText(""); }}>
              Cancel
            </button>
            <button
              type="button"
              className="button danger-button"
              onClick={handlePurge}
              disabled={confirmText !== "PURGE"}
            >
              Yes, purge everything
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "purging") {
    return <button type="button" className="button danger-button" disabled>Purging…</button>;
  }

  if (step === "done") {
    return (
      <button type="button" className="button secondary-action" onClick={() => setStep("idle")}>
        ✓ Purged {deletedCount} docs — dismiss
      </button>
    );
  }

  if (step === "error") {
    return (
      <button type="button" className="button danger-button" onClick={() => setStep("idle")} title={errorMsg}>
        Purge failed — dismiss
      </button>
    );
  }

  return null;
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
