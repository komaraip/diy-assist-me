import { TutorialManager } from "../components/admin/TutorialManager.jsx";

export function AdminTutorialsPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Tutorial content</p>
        <p>Manage public DIY tutorial content.</p>
      </div>

      <TutorialManager />
    </section>
  );
}
