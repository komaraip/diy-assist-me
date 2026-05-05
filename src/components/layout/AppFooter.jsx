import { Compass } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Compass aria-hidden="true" />
          <span>DIY Assist</span>
        </div>
        <p>Step-by-step DIY help with touch and voice controls.</p>
      </div>
    </footer>
  );
}
