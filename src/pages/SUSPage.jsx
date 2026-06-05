import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SUSForm } from "../components/guided-session/SUSForm.jsx";
import { getStudySession } from "../services/studyService.js";
import { submitSusResponse } from "../services/susService.js";
import { findStudyCondition } from "../utils/studyAssignments.js";
import { formatStudyMode, getStudyCopy, normalizeStudyLanguage } from "../config/guidedSessionContent.js";

export function SUSPage() {
  const { sessionId, conditionId } = useParams();
  const [session, setSession] = useState(null);
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const language = normalizeStudyLanguage(session?.language);
  const copy = getStudyCopy(language);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      setIsLoading(true);
      const result = await getStudySession(sessionId);
      if (!isMounted) return;
      setSession(result.data);
      setResultMeta({ source: result.source, warning: result.warning, error: result.error });
      setIsLoading(false);
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const condition = useMemo(() => findStudyCondition(session, conditionId), [conditionId, session]);

  async function handleSubmit(responses) {
    setIsSubmitting(true);
    const result = await submitSusResponse({
      participantId: session.participantId,
      participantCode: session.participantCode,
      sessionId: session.id,
      conditionId: condition.id,
      conditionOrder: condition.conditionOrder,
      modality: condition.modality,
      responses,
    });
    setStatusMessage(result.error || copy.susPage.savedStatus);
    setIsSubmitting(false);
  }

  if (isLoading) {
    return <p className="page-section status-note">{copy.susPage.loading}</p>;
  }

  if (resultMeta.error || !session || !condition) {
    return (
      <section className="page-section">
        <Link className="inline-link" to={`/guided-session/${sessionId}`}>
          <ArrowLeft aria-hidden="true" />
          {copy.susPage.back}
        </Link>
        <div className="detail-shell">
          <h1>{copy.susPage.unavailableTitle}</h1>
          <p>{resultMeta.error || copy.susPage.unavailableFallback}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section" style={{ paddingTop: "1.5rem", paddingBottom: "1rem" }}>
      <Link className="inline-link" to={`/guided-session/${session.id}`} style={{ marginBottom: "0.5rem", display: "inline-flex", alignItems: "center" }}>
        <ArrowLeft aria-hidden="true" size={16} />
        {copy.susPage.back}
      </Link>
      <div className="page-header compact-header" style={{ marginTop: "0.25rem", marginBottom: "1.25rem" }}>
        <h1>{copy.susPage.title}</h1>
        <span className="session-code">
          {copy.shared.sessionCode}: {session.participantCode} | {formatMode(condition, language)}
        </span>
      </div>
      <SUSForm condition={condition} isSubmitting={isSubmitting} onSubmit={handleSubmit} language={language} />
      {statusMessage ? (
        <div className={statusMessage === copy.susPage.savedStatus ? "result-panel" : "result-panel error"} role="status">
          <h2>{statusMessage === copy.susPage.savedStatus ? copy.susPage.savedTitle : copy.susPage.notSavedTitle}</h2>
          <p>{statusMessage}</p>
          {statusMessage === copy.susPage.savedStatus ? (
            <Link className="button primary-button result-action" to={`/guided-session/${session.id}`}>
              {copy.susPage.backButton}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function formatMode(condition, language) {
  if (!condition?.modality) return getStudyCopy(language).modes.thisMode;
  return formatStudyMode(condition.modality, language, "lower");
}

function formatModeTitle(condition, language) {
  return formatStudyMode(condition?.modality, language);
}
