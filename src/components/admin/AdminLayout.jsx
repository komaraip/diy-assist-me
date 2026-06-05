import { BookOpenText, ChevronLeft, ChevronRight, Database, Home, LogOut, Settings, TableProperties } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../services/adminAuthService.js";
import { AdminGate } from "./AdminGate.jsx";
import { useAdminAuth } from "./AdminAuthContext.jsx";

const adminNavItems = [
  { to: "/admin", label: "Overview", icon: TableProperties, end: true },
  { to: "/admin/tutorials", label: "Tutorials", icon: BookOpenText },
  { to: "/admin/data", label: "Data", icon: Database },
];

export function AdminLayout() {
  useEffect(() => {
    const meta = document.querySelector("meta[name='robots']");
    const previous = meta?.getAttribute("content");
    let createdMeta = null;

    if (meta) {
      meta.setAttribute("content", "noindex,nofollow");
    } else {
      createdMeta = document.createElement("meta");
      createdMeta.setAttribute("name", "robots");
      createdMeta.setAttribute("content", "noindex,nofollow");
      document.head.appendChild(createdMeta);
    }

    return () => {
      if (meta) {
        if (previous) {
          meta.setAttribute("content", previous);
        } else {
          meta.removeAttribute("content");
        }
      } else if (createdMeta) {
        createdMeta.remove();
      }
    };
  }, []);

  return (
    <div className="admin-app-shell">
      <a className="skip-link" href="#admin-main-content">
        Skip to admin content
      </a>

      <div id="admin-main-content" className="admin-route-host">
        <AdminGate>
          <AdminShell />
        </AdminGate>
      </div>
    </div>
  );
}

function AdminShell() {
  const { adminProfile } = useAdminAuth();
  const navigate = useNavigate();
  const adminName = adminProfile?.displayName || adminProfile?.username || "Admin";
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  async function handleLogout() {
    await logoutAdmin();
    navigate("/admin", { replace: true });
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`} aria-label="Admin navigation">
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {sidebarExpanded ? (
          <>
            <div className="admin-brand">
              <span className="admin-brand-icon">
                <img src="/logo-2.png" alt="DIY Assist" />
              </span>
              <div>
                <strong>DIY Assist</strong>
                <span>Admin Dashboard</span>
              </div>
            </div>
          </>
        ) : (
          <div className="admin-brand-collapsed">
            <span className="admin-brand-icon">
              <img src="/logo-2.png" alt="DIY Assist" />
            </span>
          </div>
        )}
        <nav className="admin-nav" aria-label="Admin sections">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "admin-nav-link active" : "admin-nav-link"
                }
                title={!sidebarExpanded ? item.label : undefined}
              >
                <Icon aria-hidden="true" />
                {sidebarExpanded && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-actions">
          <Link className="admin-logout-button" to="/admin/settings" title={!sidebarExpanded ? "Settings" : undefined}>
            <Settings aria-hidden="true" />
            {sidebarExpanded && "Settings"}
          </Link>
          <button type="button" className="admin-logout-button" onClick={handleLogout} title={!sidebarExpanded ? "Log out" : undefined}>
            <LogOut aria-hidden="true" />
            {sidebarExpanded && "Log out"}
          </button>
        </div>
      </aside>

      <main className="admin-content-shell">
        <Outlet />
      </main>
    </div>
  );
}
