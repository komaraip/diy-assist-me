import { ClipboardList, ListFilter } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { AdminDataToolbar } from "../components/admin/AdminDataToolbar.jsx";
import { AdminTabs } from "../components/admin/AdminTabs.jsx";
import { InteractionLogViewer } from "../components/admin/InteractionLogViewer.jsx";
import { PurgeButton } from "../components/admin/PurgeButton.jsx";
import { SessionReview } from "../components/admin/SessionReview.jsx";
import { loadAdminData } from "../services/adminDataService.js";

const tabs = [
  { id: "sessions", label: "Sessions", icon: ClipboardList },
  { id: "logs", label: "Logs", icon: ListFilter },
];

export function AdminGuidedSessionsPage() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") || "sessions";
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : "sessions";

  if (requestedTab !== activeTab) {
    return <Navigate to={`/admin/guided-sessions?tab=${activeTab}`} replace />;
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Guided sessions</p>
        <p>Review guided session bundles and interaction logs in one focused workspace.</p>
      </div>

      <GuidedSessionsDashboard activeTab={activeTab} />
    </section>
  );
}

function GuidedSessionsDashboard({ activeTab }) {
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
    return <p className="status-note">Loading guided session data...</p>;
  }

  if (resultMeta.error || !adminData) {
    return <p className="status-note error-note">{resultMeta.error || "Guided session data could not be loaded."}</p>;
  }

  return (
    <div className="admin-dashboard">
      <AdminDataToolbar
        source={resultMeta.source}
        warning={resultMeta.warning}
        onRefresh={loadData}
        actions={<PurgeButton onPurged={loadData} />}
      />
      <AdminTabs tabs={tabs} activeTab={activeTab} basePath="/admin/guided-sessions" />
      {activeTab === "sessions" ? (
        <SessionReview adminData={adminData} dataSource={resultMeta.source} />
      ) : (
        <InteractionLogViewer logs={adminData.interactionLogs || []} />
      )}
    </div>
  );
}
