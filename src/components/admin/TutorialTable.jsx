import { Edit3, Trash2 } from "lucide-react";

export function TutorialTable({ tutorials, onEdit, onDelete }) {
  if (!tutorials.length) {
    return <p className="empty-state">No tutorials match the current filters.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="admin-table tutorial-admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Role</th>
            <th>Steps</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tutorials.map((tutorial) => (
            <tr key={tutorial.id}>
              <td>
                <strong>{tutorial.normalized.title}</strong>
                <span>{tutorial.id}</span>
              </td>
              <td>{tutorial.normalized.category}</td>
              <td>
                {formatStudyRole(tutorial.raw.study_role || tutorial.normalized.studyRole)}
                {tutorial.raw.guided_session_priority || tutorial.normalized.guidedSessionPriority ? (
                  <span>Core</span>
                ) : null}
              </td>
              <td>{tutorial.normalized.steps.length}</td>
              <td>{tutorial.raw.active === false ? "Inactive" : "Active"}</td>
              <td>{formatDate(tutorial.raw.updatedAt || tutorial.raw.createdAt)}</td>
              <td>
                <div className="admin-table-actions">
                  <button type="button" className="button secondary-action" onClick={() => onEdit(tutorial)}>
                    <Edit3 aria-hidden="true" />
                    Edit
                  </button>
                  <button type="button" className="button secondary-action danger-action" onClick={() => onDelete(tutorial)}>
                    <Trash2 aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatStudyRole(value) {
  if (value === "core_practice") return "Core practice";
  if (value === "core_measured") return "Core measured";
  return "Catalog";
}

function formatDate(value) {
  if (!value) return "Not saved";
  if (typeof value?.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved";
  return date.toLocaleDateString();
}
