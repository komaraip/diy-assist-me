import { GitBranch, MonitorCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { GuidedProgress } from "../components/study/GuidedProgress.jsx";
import { createStudySession } from "../services/studyService.js";
import { SEQUENCE_ASSIGNMENTS, TUTORIAL_ROTATIONS } from "../utils/studyAssignments.js";

const initialEnvironment = {
  deviceType: "",
  browserName: "",
  microphonePermissionStatus: "",
  roomNoiseLevelNote: "",
  internetConnectionNote: "",
  taskEnvironmentNote: "",
  researcherObservationNote: "",
};

const setupProgressSteps = [
  { id: "setup", label: "Set up your session", status: "Add consent and choose the session options." },
  { id: "tutorials", label: "Follow the guided tasks", status: "Try touch mode and voice mode." },
  { id: "feedback", label: "Share feedback", status: "Answer quick questions at the end." },
];

export function StudyPage() {
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [environment, setEnvironment] = useState(initialEnvironment);
  const [sequenceAssignment, setSequenceAssignment] = useState("AB");
  const [tutorialRotation, setTutorialRotation] = useState("rotation_a");
  const [statusMessage, setStatusMessage] = useState("");
  const [sessionResult, setSessionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateSession(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    if (!consentConfirmed) {
      setSessionResult({ data: null, source: "local", warning: null, error: "Please confirm consent before creating a guided session." });
      setStatusMessage("Please confirm consent before creating a guided session.");
      setIsSubmitting(false);
      return;
    }

    const result = await createStudySession({
      consentConfirmed,
      environment,
      sequenceAssignment,
      tutorialRotation,
    });
    setSessionResult(result);
    setStatusMessage(
      result.error
        ? result.error
        : "Session ready."
    );
    setIsSubmitting(false);
  }

  function updateEnvironment(field, value) {
    setEnvironment((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">Guided mode</p>
        <h1>Start a guided session</h1>
        <p>
          You will try a short tutorial flow with touch controls and voice commands. Start here,
          then follow each page for the next step.
        </p>
      </div>

      <GuidedProgress steps={setupProgressSteps} currentStepId="setup" title="What happens next" />

      <form className="study-form" onSubmit={handleCreateSession}>
        <section className="form-section" aria-labelledby="consent-heading">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h2 id="consent-heading">Consent</h2>
            <p>
              Confirm that anonymous interaction details may be saved for this guided session.
              No real name or raw microphone audio is collected.
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(event) => setConsentConfirmed(event.target.checked)}
              />
              <span>I confirm consent before creating a guided session.</span>
            </label>
          </div>
        </section>

        <section className="form-section" aria-labelledby="assignment-heading">
          <GitBranch aria-hidden="true" />
          <div>
            <h2 id="assignment-heading">Session choices</h2>
            <p>Choose whether touch mode or voice mode comes first, then pick the tutorial set.</p>
            <div className="form-grid">
              <label className="field-label">
                Mode order
                <select
                  value={sequenceAssignment}
                  onChange={(event) => setSequenceAssignment(event.target.value)}
                >
                  {SEQUENCE_ASSIGNMENTS.map((assignment) => (
                    <option key={assignment.value} value={assignment.value}>
                      {assignment.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Tutorial set
                <select
                  value={tutorialRotation}
                  onChange={(event) => setTutorialRotation(event.target.value)}
                >
                  {TUTORIAL_ROTATIONS.map((rotation) => (
                    <option key={rotation.value} value={rotation.value}>
                      {rotation.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="form-section" aria-labelledby="environment-heading">
          <MonitorCheck aria-hidden="true" />
          <div>
            <h2 id="environment-heading">Setup notes</h2>
            <p>Optional notes about the device, browser, and room setup.</p>
            <div className="form-grid">
              <TextInput
                label="Device type"
                value={environment.deviceType}
                onChange={(value) => updateEnvironment("deviceType", value)}
                placeholder="Laptop, tablet, or phone"
              />
              <TextInput
                label="Browser name"
                value={environment.browserName}
                onChange={(value) => updateEnvironment("browserName", value)}
                placeholder="Google Chrome desktop"
              />
              <TextInput
                label="Microphone permission status"
                value={environment.microphonePermissionStatus}
                onChange={(value) => updateEnvironment("microphonePermissionStatus", value)}
                placeholder="Allowed, blocked, or not checked"
              />
              <TextInput
                label="Room noise level note"
                value={environment.roomNoiseLevelNote}
                onChange={(value) => updateEnvironment("roomNoiseLevelNote", value)}
                placeholder="Quiet room, light background noise, or noisy room"
              />
              <TextInput
                label="Internet connection note"
                value={environment.internetConnectionNote}
                onChange={(value) => updateEnvironment("internetConnectionNote", value)}
                placeholder="Stable, slow, or disconnected"
              />
              <TextInput
                label="Task environment note"
                value={environment.taskEnvironmentNote}
                onChange={(value) => updateEnvironment("taskEnvironmentNote", value)}
                placeholder="Optional notes about the device, browser, and room setup."
              />
            </div>
            <label className="field-label full-width-field">
              Extra setup note
              <textarea
                value={environment.researcherObservationNote}
                onChange={(event) => updateEnvironment("researcherObservationNote", event.target.value)}
                placeholder="Optional notes about the device, browser, and room setup."
                rows="3"
              />
            </label>
          </div>
        </section>

        <button className="button primary-button form-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Starting..." : "Start guided session"}
        </button>
      </form>

      {statusMessage && (
        <div className={sessionResult?.error ? "result-panel error" : "result-panel"} role="status">
          <h2>{sessionResult?.error ? "Session could not start" : "Session ready"}</h2>
          <p>{statusMessage}</p>
          {sessionResult?.data?.participantCode && <p>Session code: {sessionResult.data.participantCode}</p>}
          {sessionResult?.data?.id && (
            <Link className="button primary-button result-action" to={`/study/session/${sessionResult.data.id}`}>
              Continue to guided session
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function TextInput({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="field-label">
      {label}
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}
