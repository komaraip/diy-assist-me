import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DebriefForm } from "../components/study/DebriefForm.jsx";
import { GuidedProgress } from "../components/study/GuidedProgress.jsx";
import { submitDebriefResponse } from "../services/debriefService.js";
import { getStudySession } from "../services/studyService.js";

export function DebriefPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setStatusMessage(result.error || "Session complete. Thanks for your feedback.");
    setIsSubmitting(false);
  }

  if (isLoading) {
    return <p className="page-section status-note">Loading debrief form...</p>;
  }

  if (resultMeta.error || !session) {
    return (
      <section className="page-section narrow-page">
        <Link className="inline-link" to={`/study/session/${sessionId}`}>
          <ArrowLeft aria-hidden="true" />
          Back to guided session
        </Link>
        <div className="detail-shell">
          <h1>Feedback form unavailable</h1>
          <p>{resultMeta.error || "Session not found."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section narrow-page">
      <Link className="inline-link" to={`/study/session/${session.id}`}>
        <ArrowLeft aria-hidden="true" />
        Back to guided session
      </Link>
      <div className="page-header">
        <p className="eyebrow">Final feedback</p>
        <h1>Final feedback</h1>
        <p>Almost done. Tell us what worked well and what could be better.</p>
      </div>
      <GuidedProgress
        steps={[
          { id: "tasks", label: "Guided tasks", status: "Complete the tutorial modes" },
          { id: "questionnaires", label: "Questionnaires", status: "Answer after each mode" },
          { id: "feedback", label: "Final feedback", status: "Submit this form to finish" },
        ]}
        currentStepId="feedback"
        title="Final step"
      />
      <DebriefForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
      {statusMessage ? (
        <div className={statusMessage.includes("complete") ? "result-panel" : "result-panel error"} role="status">
          <h2>{statusMessage.includes("complete") ? "Session complete" : "Feedback not saved"}</h2>
          <p>{statusMessage}</p>
          {statusMessage.includes("complete") ? (
            <Link className="button secondary-action result-action" to="/">
              Back to home
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
