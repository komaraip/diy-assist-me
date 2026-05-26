import { RefreshCcw, TableProperties } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EvidenceChecklist } from "../components/admin/EvidenceChecklist.jsx";
import { ExportControls } from "../components/admin/ExportControls.jsx";
import { loadAdminData } from "../services/adminDataService.js";

export function ExportsPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Researcher exports</p>
        <h1>Data Exports</h1>
        <p>
          Download task, SUS, voice, touch, observer, debrief, full-session, summary, and paired analysis files for RQ1, RQ2, and RQ3.
        </p>
      </div>

      <ExportsDashboard />
    </section>
  );
}

function ExportsDashboard() {
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
    return <p className="status-note">Loading export data...</p>;
  }

  if (resultMeta.error || !adminData) {
    return <p className="status-note error-note">{resultMeta.error || "Export data could not be loaded."}</p>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-toolbar">
        <p className="data-source-note">
          Data source: {resultMeta.source}
          {resultMeta.warning ? `. ${resultMeta.warning}` : ""}
        </p>
        <button type="button" className="button secondary-action" onClick={loadData}>
          <RefreshCcw aria-hidden="true" />
          Refresh data
        </button>
        <Link className="button primary-button" to="/admin">
          <TableProperties aria-hidden="true" />
          Open dashboard
        </Link>
      </div>

      <ExportControls />
      <EvidenceChecklist adminData={adminData} />
    </div>
  );
}
