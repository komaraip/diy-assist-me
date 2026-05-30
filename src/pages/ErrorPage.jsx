import { Link, useRouteError } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export function ErrorPage() {
  const error = useRouteError();
  console.error("Unhandled Route Error:", error);

  return (
    <section className="page-section narrow-page" style={{ padding: "4rem 2rem", textAlign: "center" }}>
      <div className="detail-shell" style={{ padding: "3rem 2rem", display: "grid", justifyItems: "center", gap: "1rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          background: "rgba(220, 38, 38, 0.1)",
          color: "#dc2626",
          marginBottom: "0.5rem"
        }}>
          <AlertCircle size={28} />
        </div>
        <p className="eyebrow" style={{ color: "#dc2626" }}>Application Error</p>
        <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: "480px", color: "var(--muted)", margin: "0 auto" }}>
          An unexpected error occurred while rendering this page.
        </p>
        {error && (
          <code style={{
            display: "block",
            padding: "0.75rem 1rem",
            background: "var(--surface-soft)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "0.85rem",
            color: "#dc2626",
            fontFamily: "monospace",
            maxWidth: "100%",
            overflowX: "auto",
            margin: "0.5rem 0 1.5rem"
          }}>
            {error.statusText || error.message || String(error)}
          </code>
        )}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            className="button primary-button"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
          <Link className="button secondary-action" to="/">
            Return home
          </Link>
        </div>
      </div>
    </section>
  );
}
