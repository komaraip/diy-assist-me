import { BarChart3, BookOpenText, Download, Home, LogOut, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../services/adminAuthService.js";
import { AdminGate } from "./AdminGate.jsx";
import { useAdminAuth } from "./AdminAuthContext.jsx";

const adminNavItems = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/admin/tutorials", label: "Tutorials", icon: BookOpenText },
  { to: "/admin/export", label: "Export", icon: Download },
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

  async function handleLogout() {
    await logoutAdmin();
    navigate("/admin", { replace: true });
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-brand">
          <span className="admin-brand-icon">
            <ShieldCheck aria-hidden="true" />
          </span>
          <div>
            <span>DIY Assist</span>
            <strong>Admin</strong>
          </div>
        </div>

        <div className="admin-user-card" aria-label="Signed in admin">
          <span>Signed in as</span>
          <strong>{adminName}</strong>
          {adminProfile?.role ? <small>{adminProfile.role}</small> : null}
        </div>

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
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-actions">
          <Link className="admin-back-link" to="/">
            <Home aria-hidden="true" />
            Back to site
          </Link>
          <button type="button" className="admin-logout-button" onClick={handleLogout}>
            <LogOut aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-content-shell">
        <Outlet />
      </main>
    </div>
  );
}
