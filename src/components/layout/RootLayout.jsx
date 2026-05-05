import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader.jsx";
import { AppFooter } from "./AppFooter.jsx";

export function RootLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      <main id="main-content">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
