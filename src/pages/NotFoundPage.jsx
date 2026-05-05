import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="page-section narrow-page">
      <div className="detail-shell">
        <p className="eyebrow">404</p>
        <h1>Route not found</h1>
        <p>We could not find that page.</p>
        <Link className="button primary-button" to="/">
          Return home
        </Link>
      </div>
    </section>
  );
}
