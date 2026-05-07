import { TutorialManager } from "../components/admin/TutorialManager.jsx";

export function AdminTutorialsPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Tutorial content</p>
        <h1>Tutorials</h1>
        <p>
          Create, edit, preview, and publish DIY tutorial content used by the public tutorial pages.
        </p>
      </div>

      <TutorialManager />
    </section>
  );
}
