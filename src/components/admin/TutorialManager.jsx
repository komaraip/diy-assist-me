import { Plus, RefreshCcw, Search, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteAdminTutorial,
  importLocalTutorialDataset,
  isAdminTutorialCrudAvailable,
  listAdminTutorials,
} from "../../services/adminTutorialService.js";
import {
  getGuidedSessionTutorialIntegrity,
  REQUIRED_GUIDED_TUTORIALS,
} from "../../utils/studyAssignments.js";
import { TutorialTable } from "./TutorialTable.jsx";

export function TutorialManager() {
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        tutorials
          .map((tutorial) => tutorial.normalized.category)
          .filter(Boolean),
      ),
    ).sort();
  }, [tutorials]);

  const filteredTutorials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tutorials.filter((tutorial) => {
      const matchesQuery =
        !normalizedQuery ||
        tutorial.normalized.title.toLowerCase().includes(normalizedQuery) ||
        tutorial.id.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === "all" ||
        tutorial.normalized.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [categoryFilter, query, tutorials]);
  const guidedTutorialIntegrity = useMemo(() => {
    return getGuidedSessionTutorialIntegrity(
      tutorials.map((tutorial) => tutorial.normalized),
    );
  }, [tutorials]);

  async function loadTutorials() {
    setIsLoading(true);
    setErrorMessage("");
    const result = await listAdminTutorials();
    if (result.success) {
      setTutorials(result.data);
    } else {
      setErrorMessage(result.error);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadTutorials();
  }, []);

  function handleCreate() {
    navigate("/admin/tutorials/new");
  }

  function handleEdit(tutorial) {
    navigate(`/admin/tutorials/${tutorial.id}/edit`);
  }

  async function handleDelete(tutorial) {
    if (isProtectedGuidedTutorial(tutorial)) {
      setErrorMessage(
        `"${tutorial.normalized.title}" is required by guided sessions and cannot be deleted. Mark it inactive only after replacing the controlled core tutorial set.`,
      );
      setStatusMessage("");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${tutorial.normalized.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setErrorMessage("");
    setStatusMessage("");
    const result = await deleteAdminTutorial(tutorial.id);
    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }

    setStatusMessage(`Deleted "${tutorial.normalized.title}".`);
    await loadTutorials();
  }

  async function handleImportLocalDataset() {
    const confirmed = window.confirm(
      "Import local dataset to Firebase? This will upsert all 12 local tutorials into the tutorials collection.",
    );
    if (!confirmed) return;

    setStatusMessage("");
    setErrorMessage("");
    setIsImporting(true);

    const result = await importLocalTutorialDataset();
    setIsImporting(false);

    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }

    setStatusMessage(
      `Imported ${result.data.imported} tutorials from local dataset.`,
    );
    await loadTutorials();
  }

  if (!isAdminTutorialCrudAvailable()) {
    return (
      <section className="admin-panel">
        <h2>Firebase is required to manage tutorial content.</h2>
        <p className="status-note error-note">
          Configure Firebase Auth and Firestore before using tutorial CRUD.
        </p>
      </section>
    );
  }

  return (
    <div className="tutorial-manager">
      <div className="admin-toolbar">
        <div className="admin-filter-grid">
          <span className="search-input-wrap">
            <Search aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or ID"
            />
          </span>
          <span className="field-label">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </span>
        </div>

        <div className="admin-toolbar-actions">
          <button
            type="button"
            className="button secondary-action"
            onClick={loadTutorials}
          >
            <RefreshCcw aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            className="button secondary-action"
            onClick={handleImportLocalDataset}
            disabled={isImporting}
          >
            <UploadCloud aria-hidden="true" />
            {isImporting ? "Importing..." : "Import local dataset"}
          </button>
          <button
            type="button"
            className="button primary-button"
            onClick={handleCreate}
          >
            <Plus aria-hidden="true" />
            Create tutorial
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="status-note error-note" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="status-note" role="status">
          {statusMessage}
        </p>
      ) : null}
      {!isLoading && tutorials.length ? (
        <GuidedTutorialIntegrityNotice integrity={guidedTutorialIntegrity} />
      ) : null}

      {isLoading ? (
        <p className="status-note">Loading tutorials...</p>
      ) : (
        <TutorialTable
          tutorials={filteredTutorials}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function GuidedTutorialIntegrityNotice({ integrity }) {
  if (integrity.isReady) {
    return (
      <p className="status-note" role="status">
        Guided session core tutorials are ready: tutorial_001, tutorial_002,
        tutorial_005, and tutorial_009.
      </p>
    );
  }

  const issueSummary = [
    formatIntegrityIssue("missing", integrity.missing),
    formatIntegrityIssue("inactive", integrity.inactive),
    formatIntegrityIssue("incomplete", integrity.incomplete),
    formatIntegrityIssue("wrong role", integrity.wrongRole),
    formatIntegrityIssue("not priority", integrity.notPriority),
  ]
    .filter(Boolean)
    .join("; ");

  return (
    <p className="status-note error-note" role="alert">
      Guided session core tutorial integrity issue: {issueSummary}. Fix these
      before creating new guided sessions.
    </p>
  );
}

function formatIntegrityIssue(label, items = []) {
  if (!items.length) return "";
  return `${label}: ${items.map((item) => item.id).join(", ")}`;
}

function isProtectedGuidedTutorial(tutorial) {
  return (
    Boolean(
      tutorial.raw.guided_session_priority ||
      tutorial.normalized.guidedSessionPriority,
    ) || REQUIRED_GUIDED_TUTORIALS.some((item) => item.id === tutorial.id)
  );
}
