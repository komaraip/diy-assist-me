import { BookOpenText, ClipboardList, FileText, TableProperties } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminDataToolbar } from "../components/admin/AdminDataToolbar.jsx";
import { AdminSummaryCards } from "../components/admin/AdminSummaryCards.jsx";
import { loadAdminData } from "../services/adminDataService.js";

const quickLinks = [
  {
    to: "/admin/guided-sessions",
    title: "Guided Sessions",
    description: "Review guided session bundles and interaction logs.",
    icon: ClipboardList,
  },
  {
    to: "/admin/thesis",
    title: "Thesis",
    description: "Open Chapter 4 metrics, evidence readiness, and export files.",
    icon: FileText,
  },
  {
    to: "/admin/tutorials",
    title: "Tutorials",
    description: "Manage the tutorial catalog used by public and guided flows.",
    icon: BookOpenText,
  },
];

export function AdminPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Overview</p>
        <p>Monitor study progress and open focused admin workspaces.</p>
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
      <AdminDataToolbar source={resultMeta.source} warning={resultMeta.warning} onRefresh={loadData} />
      <AdminSummaryCards adminData={adminData} />

      <section className="admin-panel" aria-labelledby="admin-quick-links-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Admin workspaces</p>
            <h2 id="admin-quick-links-heading">Open a focused page</h2>
          </div>
          <TableProperties aria-hidden="true" />
        </div>

        <div className="admin-quick-link-grid">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="admin-quick-link-card" to={item.to} key={item.to}>
                <span className="admin-summary-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
