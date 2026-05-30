import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DebriefForm } from "../components/guided-session/DebriefForm.jsx";
import { GuidedProgress } from "../components/guided-session/GuidedProgress.jsx";
import { submitDebriefResponse } from "../services/debriefService.js";
import { getStudySession } from "../services/studyService.js";
import { getStudyCopy, normalizeStudyLanguage } from "../i18n/studyCopy.js";

export function DebriefPage() {
  const { sessionId } = useParams();
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

  async function handleSubmit(responses) {
    setIsSubmitting(true);
    const result = await submitDebriefResponse({
      participantId: session.participantId,
      participantCode: session.participantCode,
      sessionId: session.id,
      responses,
    });
    setStatusMessage(result.error || copy.debriefPage.completeStatus);
    setIsSubmitting(false);
  }

  if (isLoading) {
    return <p className="page-section status-note">{copy.debriefPage.loading}</p>;
  }

  if (resultMeta.error || !session) {
    return (
      <section className="page-section">
        <Link className="inline-link" to={`/guided-session/${sessionId}`}>
          <ArrowLeft aria-hidden="true" />
          {copy.debriefPage.back}
        </Link>
        <div className="detail-shell">
          <h1>{copy.debriefPage.unavailableTitle}</h1>
          <p>{resultMeta.error || copy.debriefPage.unavailableFallback}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <Link className="inline-link" to={`/guided-session/${session.id}`}>
        <ArrowLeft aria-hidden="true" />
        {copy.debriefPage.back}
      </Link>
      <div className="page-header compact-header">
        <h1>{copy.debriefPage.title}</h1>
        <span className="session-code">
          {copy.shared.sessionCode}: {session.participantCode}
        </span>
      </div>
      <DebriefForm isSubmitting={isSubmitting} onSubmit={handleSubmit} language={language} />
      {statusMessage ? (
        <div className={statusMessage === copy.debriefPage.completeStatus ? "result-panel" : "result-panel error"} role="status">
          <h2>{statusMessage === copy.debriefPage.completeStatus ? copy.debriefPage.completeTitle : copy.debriefPage.notSavedTitle}</h2>
          <p>{statusMessage}</p>
          {statusMessage === copy.debriefPage.completeStatus ? (
            <Link className="button secondary-action result-action" to="/">
              {copy.debriefPage.homeButton}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
