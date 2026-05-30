import { BarChart3, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { AdminDataToolbar } from "../components/admin/AdminDataToolbar.jsx";
import { AdminTabs } from "../components/admin/AdminTabs.jsx";
import { EvidenceChecklist } from "../components/admin/EvidenceChecklist.jsx";
import { ExportControls } from "../components/admin/ExportControls.jsx";
import { MetricsSummary } from "../components/admin/MetricsSummary.jsx";
import { loadAdminData } from "../services/adminDataService.js";

const tabs = [
  { id: "overview", label: "Metrics & Evidence", icon: BarChart3 },
  { id: "exports", label: "Exports", icon: Download },
];

export function AdminThesisPage() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") || "overview";
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : "overview";

  if (requestedTab !== activeTab) {
    return <Navigate to={`/admin/thesis?tab=${activeTab}`} replace />;
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Thesis analysis</p>
        <p>Review Chapter 4 metrics, evidence readiness, and export files.</p>
      </div>

      <ThesisDashboard activeTab={activeTab} />
    </section>
  );
}

function ThesisDashboard({ activeTab }) {
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
    return <p className="status-note">Loading thesis data...</p>;
  }

  if (resultMeta.error || !adminData) {
    return <p className="status-note error-note">{resultMeta.error || "Thesis data could not be loaded."}</p>;
  }

  return (
    <div className="admin-dashboard">
      <AdminDataToolbar source={resultMeta.source} warning={resultMeta.warning} onRefresh={loadData} refreshLabel="Refresh data" />
      <AdminTabs tabs={tabs} activeTab={activeTab} basePath="/admin/thesis" />
      {activeTab === "overview" ? (
        <div className="admin-thesis-overview-grid">
          <MetricsSummary adminData={adminData} />
          <EvidenceChecklist adminData={adminData} />
        </div>
      ) : null}
      {activeTab === "exports" ? <ExportControls /> : null}
    </div>
  );
}
