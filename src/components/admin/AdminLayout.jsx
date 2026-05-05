import { useState } from "react";
import { BarChart3, Download, Home, LogOut, ShieldCheck } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AdminGate, clearAdminUnlock } from "./AdminGate.jsx";

const adminNavItems = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/admin/export", label: "Export", icon: Download },
];

export function AdminLayout() {
  const [gateVersion, setGateVersion] = useState(0);
  const navigate = useNavigate();

  function handleLogout() {
    clearAdminUnlock();
    setGateVersion((current) => current + 1);
    navigate("/admin", { replace: true });
  }

  return (
    <div className="admin-app-shell">
      <a className="skip-link" href="#admin-main-content">
        Skip to admin content
      </a>

      <div id="admin-main-content" className="admin-route-host">
        <AdminGate key={gateVersion}>
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
        </AdminGate>
      </div>
    </div>
  );
}
