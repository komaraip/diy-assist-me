import { Plus, RefreshCcw, Search, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createAdminTutorial,
  deleteAdminTutorial,
  importLocalTutorialDataset,
  isAdminTutorialCrudAvailable,
  listAdminTutorials,
  updateAdminTutorial,
} from "../../services/adminTutorialService.js";
import {
  createEmptyTutorialDraft,
  createTutorialDraftFromRaw,
  prepareTutorialForSave,
  validateTutorialDraft,
} from "../../utils/validateTutorial.js";
import { getGuidedSessionTutorialIntegrity, REQUIRED_GUIDED_TUTORIALS } from "../../utils/studyAssignments.js";
import { TutorialForm } from "./TutorialForm.jsx";
import { TutorialTable } from "./TutorialTable.jsx";

export function TutorialManager() {
  const [tutorials, setTutorials] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const categories = useMemo(() => {
    return Array.from(new Set(tutorials.map((tutorial) => tutorial.normalized.category).filter(Boolean))).sort();
  }, [tutorials]);

  const filteredTutorials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tutorials.filter((tutorial) => {
      const matchesQuery =
        !normalizedQuery ||
        tutorial.normalized.title.toLowerCase().includes(normalizedQuery) ||
        tutorial.id.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === "all" || tutorial.normalized.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [categoryFilter, query, tutorials]);
  const guidedTutorialIntegrity = useMemo(() => {
    return getGuidedSessionTutorialIntegrity(tutorials.map((tutorial) => tutorial.normalized));
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
    setDraft(createEmptyTutorialDraft());
    setEditingId(null);
    setFormErrors({});
    setStatusMessage("");
    setErrorMessage("");
  }

  function handleEdit(tutorial) {
    setDraft(createTutorialDraftFromRaw(tutorial.raw));
    setEditingId(tutorial.id);
    setFormErrors({});
    setStatusMessage("");
    setErrorMessage("");
  }

  async function handleDelete(tutorial) {
    if (isProtectedGuidedTutorial(tutorial)) {
      setErrorMessage(
        `"${tutorial.normalized.title}" is required by guided sessions and cannot be deleted. Mark it inactive only after replacing the controlled core tutorial set.`
      );
      setStatusMessage("");
      return;
    }

    const confirmed = window.confirm(`Delete "${tutorial.normalized.title}"? This cannot be undone.`);
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

  async function handleSave() {
    const isCreate = !editingId;
    const validation = validateTutorialDraft(draft, { isCreate });
    setFormErrors(validation.errors);
    setStatusMessage("");
    setErrorMessage("");

    if (!validation.isValid) {
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    setIsSaving(true);
    const prepared = prepareTutorialForSave(draft);
    const result = isCreate
      ? await createAdminTutorial(prepared)
      : await updateAdminTutorial(editingId, { ...prepared, id: editingId });
    setIsSaving(false);

    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }

    setStatusMessage(isCreate ? "Tutorial created." : "Tutorial updated.");
    setDraft(null);
    setEditingId(null);
    await loadTutorials();
  }

  async function handleImportLocalDataset() {
    const confirmed = window.confirm(
      "Import local dataset to Firebase? This will upsert all 12 local tutorials into the tutorials collection."
    );
    if (!confirmed) return;

    setDraft(null);
    setEditingId(null);
    setFormErrors({});
    setStatusMessage("");
    setErrorMessage("");
    setIsImporting(true);

    const result = await importLocalTutorialDataset();
    setIsImporting(false);

    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }

    setStatusMessage(`Imported ${result.data.imported} tutorials from local dataset.`);
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
          <label className="search-field">
            Search tutorials
            <span className="search-input-wrap">
              <Search aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title or ID"
              />
            </span>
          </label>
          <label className="field-label">
            Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-toolbar-actions">
          <button type="button" className="button secondary-action" onClick={loadTutorials}>
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
          <button type="button" className="button primary-button" onClick={handleCreate}>
            <Plus aria-hidden="true" />
            Create tutorial
          </button>
        </div>
      </div>

      {errorMessage ? <p className="status-note error-note" role="alert">{errorMessage}</p> : null}
      {statusMessage ? <p className="status-note" role="status">{statusMessage}</p> : null}
      {!isLoading && tutorials.length ? <GuidedTutorialIntegrityNotice integrity={guidedTutorialIntegrity} /> : null}

      {draft ? (
        <TutorialForm
          draft={draft}
          errors={formErrors}
          isCreate={!editingId}
          isSaving={isSaving}
          statusMessage=""
          onChange={setDraft}
          onCancel={() => {
            setDraft(null);
            setEditingId(null);
            setFormErrors({});
          }}
          onSubmit={handleSave}
        />
      ) : isLoading ? (
        <p className="status-note">Loading tutorials...</p>
      ) : (
        <TutorialTable tutorials={filteredTutorials} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
}

function GuidedTutorialIntegrityNotice({ integrity }) {
  if (integrity.isReady) {
    return (
      <p className="status-note" role="status">
        Guided session core tutorials are ready: tutorial_001, tutorial_002, tutorial_005, and tutorial_009.
      </p>
    );
  }

  const issueSummary = [
    formatIntegrityIssue("missing", integrity.missing),
    formatIntegrityIssue("inactive", integrity.inactive),
    formatIntegrityIssue("incomplete", integrity.incomplete),
    formatIntegrityIssue("wrong role", integrity.wrongRole),
    formatIntegrityIssue("not priority", integrity.notPriority),
  ].filter(Boolean).join("; ");

  return (
    <p className="status-note error-note" role="alert">
      Guided session core tutorial integrity issue: {issueSummary}. Fix these before creating new guided sessions.
    </p>
  );
}

function formatIntegrityIssue(label, items = []) {
  if (!items.length) return "";
  return `${label}: ${items.map((item) => item.id).join(", ")}`;
}

function isProtectedGuidedTutorial(tutorial) {
  return Boolean(tutorial.raw.guided_session_priority || tutorial.normalized.guidedSessionPriority) ||
    REQUIRED_GUIDED_TUTORIALS.some((item) => item.id === tutorial.id);
}
