import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GuidedProgress } from "../components/study/GuidedProgress.jsx";
import { SUSForm } from "../components/study/SUSForm.jsx";
import { getStudySession } from "../services/studyService.js";
import { submitSusResponse } from "../services/susService.js";
import { findStudyCondition } from "../utils/studyAssignments.js";

export function SUSPage() {
  const { sessionId, conditionId } = useParams();
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
    setStatusMessage(result.error || "Thanks, your answers were saved.");
    setIsSubmitting(false);
  }

  if (isLoading) {
    return <p className="page-section status-note">Loading questionnaire...</p>;
  }

  if (resultMeta.error || !session || !condition) {
    return (
      <section className="page-section narrow-page">
        <Link className="inline-link" to={`/study/session/${sessionId}`}>
          <ArrowLeft aria-hidden="true" />
          Back to guided session
        </Link>
        <div className="detail-shell">
          <h1>Questionnaire unavailable</h1>
          <p>{resultMeta.error || "Mode not found in this session."}</p>
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
        <p className="eyebrow">Questionnaire</p>
        <h1>Quick usability questionnaire</h1>
        <p>
          Answer these questions based only on the {formatMode(condition)} you just used.
          After saving, return to the guided session for the next step.
        </p>
      </div>
      <GuidedProgress
        steps={[
          { id: "mode", label: `${formatModeTitle(condition)} task`, status: "Complete this mode first" },
          { id: "questionnaire", label: "Questionnaire", status: "Answer all 10 items" },
          { id: "continue", label: "Continue", status: "Return to the guided session" },
        ]}
        currentStepId="questionnaire"
        title="Questionnaire progress"
      />
      <SUSForm condition={condition} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
      {statusMessage ? (
        <div className={statusMessage.includes("saved") ? "result-panel" : "result-panel error"} role="status">
          <h2>{statusMessage.includes("saved") ? "Questionnaire saved" : "Questionnaire not saved"}</h2>
          <p>{statusMessage}</p>
          {statusMessage.includes("saved") ? (
            <Link className="button primary-button result-action" to={`/study/session/${session.id}`}>
              Back to guided session
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function formatMode(condition) {
  if (condition.modality === "voice") return "voice mode";
  if (condition.modality === "touch") return "touch mode";
  return "this mode";
}

function formatModeTitle(condition) {
  if (condition.modality === "voice") return "Voice mode";
  if (condition.modality === "touch") return "Touch mode";
  return "Tutorial mode";
}
