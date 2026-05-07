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

function formatDate(value) {
  if (!value) return "Not saved";
  if (typeof value?.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved";
  return date.toLocaleDateString();
}
