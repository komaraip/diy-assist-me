import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TutorialForm } from "../components/admin/TutorialForm.jsx";
import {
  createAdminTutorial,
  isAdminTutorialCrudAvailable,
  listAdminTutorials,
  updateAdminTutorial,
} from "../services/adminTutorialService.js";
import {
  createEmptyTutorialDraft,
  createTutorialDraftFromRaw,
  prepareTutorialForSave,
  validateTutorialDraft,
} from "../utils/validateTutorial.js";

export function AdminTutorialEditorPage() {
  const { tutorialId } = useParams();
  const navigate = useNavigate();
  const isCreate = !tutorialId;
  const [draft, setDraft] = useState(() =>
    isCreate ? createEmptyTutorialDraft() : null,
  );
  const [isLoading, setIsLoading] = useState(!isCreate);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTutorialForEdit() {
      if (isCreate) {
        setDraft(createEmptyTutorialDraft());
        setFormErrors({});
        setErrorMessage("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setFormErrors({});
      const result = await listAdminTutorials();

      if (!isMounted) return;

      if (!result.success) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      const tutorial = result.data.find((item) => item.id === tutorialId);
      if (!tutorial) {
        setErrorMessage(`Tutorial "${tutorialId}" was not found.`);
        setIsLoading(false);
        return;
      }

      setDraft(createTutorialDraftFromRaw(tutorial.raw));
      setIsLoading(false);
    }

    loadTutorialForEdit();

    return () => {
      isMounted = false;
    };
  }, [isCreate, tutorialId]);

  async function handleSave() {
    const validation = validateTutorialDraft(draft, { isCreate });
    setFormErrors(validation.errors);
    setErrorMessage("");

    if (!validation.isValid) {
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    setIsSaving(true);
    const prepared = prepareTutorialForSave(draft);
    const result = isCreate
      ? await createAdminTutorial(prepared)
      : await updateAdminTutorial(tutorialId, { ...prepared, id: tutorialId });
    setIsSaving(false);

    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }

    navigate("/admin/tutorials", { replace: true });
  }

  if (!isAdminTutorialCrudAvailable()) {
    return (
      <section className="admin-page">
        <section className="admin-panel">
          <h2>Firebase is required to manage tutorial content.</h2>
          <p className="status-note error-note">
            Configure Firebase Auth and Firestore before using tutorial CRUD.
          </p>
        </section>
      </section>
    );
  }

  return (
    <section className="admin-page tutorial-editor-page">
      {errorMessage ? (
        <p className="status-note error-note" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? <p className="status-note">Loading tutorial...</p> : null}

      {!isLoading && draft ? (
        <TutorialForm
          draft={draft}
          errors={formErrors}
          isCreate={isCreate}
          isSaving={isSaving}
          onChange={setDraft}
          onCancel={() => navigate("/admin/tutorials")}
          onSubmit={handleSave}
        />
      ) : null}

      {!isLoading && !draft ? (
        <section className="admin-panel">
          <h2>Tutorial not found.</h2>
          <p className="status-note">
            Choose another tutorial from the tutorial list.
          </p>
          <Link className="button secondary-action" to="/admin/tutorials">
            <ArrowLeft aria-hidden="true" />
            Back to tutorials
          </Link>
        </section>
      ) : null}
    </section>
  );
}
