import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "./AppHeader.jsx";
import { AppFooter } from "./AppFooter.jsx";

export function RootLayout() {
  const location = useLocation();
  const isFocusedTutorialRunner =
    /^\/tutorials\/[^/]+\/?$/.test(location.pathname) ||
    /^\/guided-session\/[^/]+\/task\/[^/]+\/?$/.test(location.pathname);

  return (
    <div className={isFocusedTutorialRunner ? "app-shell tutorial-runner-route" : "app-shell"}>
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
