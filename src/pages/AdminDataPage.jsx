import { ClipboardList, Database, Download, ListFilter, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { AdminDataToolbar } from "../components/admin/AdminDataToolbar.jsx";
import { AdminTabs } from "../components/admin/AdminTabs.jsx";
import { AnalysisIssues } from "../components/admin/AnalysisIssues.jsx";
import { EvidenceChecklist } from "../components/admin/EvidenceChecklist.jsx";
import { ExportControls } from "../components/admin/ExportControls.jsx";
import { InteractionLogViewer } from "../components/admin/InteractionLogViewer.jsx";
import { MetricsSummary } from "../components/admin/MetricsSummary.jsx";
import { PurgeButton } from "../components/admin/PurgeButton.jsx";
import { SessionReview } from "../components/admin/SessionReview.jsx";
import {
  buildExportEligibleAdminData,
  getExportEligibilitySummary,
  loadAdminData,
} from "../services/adminDataService.js";

const tabs = [
  { id: "sessions", label: "Sessions", icon: ClipboardList },
  { id: "logs", label: "Logs", icon: ListFilter },
  { id: "analysis", label: "Analysis", icon: TrendingUp },
  { id: "exports", label: "Exports", icon: Download },
];

export function AdminDataPage() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") || "sessions";
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : "sessions";

  if (requestedTab !== activeTab) {
    return <Navigate to={`/admin/data?tab=${activeTab}`} replace />;
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Database & Metrics</p>
        <p>Manage study records, inspect interaction logs, review statistical metrics, and download CSV/JSON exports.</p>
      </div>

      <DataDashboard activeTab={activeTab} />
    </section>
  );
}

function DataDashboard({ activeTab }) {
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
    return <p className="status-note">Loading study data...</p>;
  }

  if (resultMeta.error || !adminData) {
    return <p className="status-note error-note">{resultMeta.error || "Study data could not be loaded."}</p>;
  }

  const exportEligibleAdminData = buildExportEligibleAdminData(adminData);
  const eligibilitySummary = getExportEligibilitySummary(adminData);

  return (
    <div className="admin-dashboard">
      <AdminDataToolbar
        source={resultMeta.source}
        warning={resultMeta.warning}
        onRefresh={loadData}
        refreshLabel="Refresh data"
        actions={
          (activeTab === "sessions" || activeTab === "logs") ? (
            <PurgeButton onPurged={loadData} />
          ) : null
        }
      />
      
      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        basePath="/admin/data"
        endContent={
          activeTab === "analysis" && eligibilitySummary.excludedSessionCount ? (
            <span className="exclude-notice analysis-exclude-badge" role="status">
              {eligibilitySummary.excludedSessionCount} session
              {eligibilitySummary.excludedSessionCount === 1 ? "" : "s"} excluded from
              analysis/export metrics.
            </span>
          ) : null
        }
      />
      
      {activeTab === "sessions" && (
        <SessionReview adminData={adminData} dataSource={resultMeta.source} />
      )}
      
      {activeTab === "logs" && (
        <InteractionLogViewer logs={adminData.interactionLogs || []} />
      )}
      
      {activeTab === "analysis" && (
        <div className="admin-thesis-overview-grid">
          <MetricsSummary adminData={exportEligibleAdminData} />
          <EvidenceChecklist adminData={exportEligibleAdminData} />
          <AnalysisIssues adminData={exportEligibleAdminData} />
        </div>
      )}
      
      {activeTab === "exports" && (
        <ExportControls />
      )}
    </div>
  );
}
