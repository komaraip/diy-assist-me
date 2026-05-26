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

const environmentFields = [
  {
    field: "deviceType",
    label: "Device type",
    placeholder: "Select device type",
    options: ["Laptop", "Desktop computer", "Tablet", "Smartphone"],
  },
  {
    field: "browserName",
    label: "Browser name",
    placeholder: "Select browser",
    options: ["Google Chrome desktop", "Microsoft Edge desktop", "Safari", "Firefox", "Other browser"],
  },
  {
    field: "microphonePermissionStatus",
    label: "Microphone permission status",
    placeholder: "Select microphone status",
    options: ["Allowed", "Blocked", "Prompt not shown yet", "Not checked"],
  },
  {
    field: "roomNoiseLevelNote",
    label: "Room noise level",
    placeholder: "Select room noise level",
    options: ["Quiet room", "Low background noise", "Moderate background noise", "Noisy room"],
  },
  {
    field: "internetConnectionNote",
    label: "Internet connection",
    placeholder: "Select internet condition",
    options: ["Stable connection", "Slow but usable", "Unstable connection", "Disconnected"],
  },
  {
    field: "taskEnvironmentNote",
    label: "Task environment",
    placeholder: "Select task environment",
    options: [
      "Desk-based hands-busy simulation",
      "Kitchen-like controlled setup",
      "Workshop-like controlled setup",
      "Other controlled setup",
    ],
  },
  {
    field: "researcherObservationNote",
    label: "Extra setup note",
    placeholder: "Select extra setup note",
    fullWidth: true,
    options: [
      "No extra setup issue observed",
      "Participant needed setup clarification",
      "Microphone or browser issue observed",
      "Internet or environment issue observed",
      "Facilitator intervention needed",
    ],
  },
];

export function StudyPage() {
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [environment, setEnvironment] = useState(initialEnvironment);
  const [sequenceAssignment, setSequenceAssignment] = useState("AB");
  const [tutorialRotation, setTutorialRotation] = useState("rotation_a");
  const [statusMessage, setStatusMessage] = useState("");
  const [sessionResult, setSessionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const speechSupportStatus = getSpeechSupportStatus();

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

    if (!hasCompleteEnvironment(environment)) {
      setSessionResult({ data: null, source: "local", warning: null, error: "Please complete all setup notes before creating a guided session." });
      setStatusMessage("Please complete all setup notes before creating a guided session.");
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
              Confirm that anonymous interaction details may be saved for this guided session. Use an
              anonymous participant code only. No real name or raw microphone audio is collected.
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(event) => setConsentConfirmed(event.target.checked)}
                required
              />
              <span>I confirm consent before creating a guided session.</span>
            </label>
          </div>
        </section>

        <section className="form-section" aria-labelledby="assignment-heading">
          <GitBranch aria-hidden="true" />
          <div>
            <h2 id="assignment-heading">Session choices</h2>
            <p>
              Choose whether touch mode or voice mode comes first, then pick the tutorial set.
              Use 12 AB and 12 BA sessions for the planned balanced sample.
            </p>
            <div className="form-grid">
              <label className="field-label">
                Mode order
                <select
                  value={sequenceAssignment}
                  onChange={(event) => setSequenceAssignment(event.target.value)}
                  required
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
                  required
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
            <p>
              Record Chrome desktop, microphone permission, internet condition, and room noise before
              testing. Select one option for each setup field. Current browser voice support: {speechSupportStatus}.
            </p>
            <div className="form-grid">
              {environmentFields.filter((field) => !field.fullWidth).map((field) => (
                <SelectInput
                  key={field.field}
                  label={field.label}
                  value={environment[field.field]}
                  onChange={(value) => updateEnvironment(field.field, value)}
                  placeholder={field.placeholder}
                  options={field.options}
                />
              ))}
            </div>
            {environmentFields.filter((field) => field.fullWidth).map((field) => (
              <SelectInput
                key={field.field}
                label={field.label}
                value={environment[field.field]}
                onChange={(value) => updateEnvironment(field.field, value)}
                placeholder={field.placeholder}
                options={field.options}
                fullWidth
              />
            ))}
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

function SelectInput({ label, value, onChange, placeholder, options, fullWidth = false }) {
  return (
    <label className={fullWidth ? "field-label full-width-field" : "field-label"}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function hasCompleteEnvironment(environment) {
  return environmentFields.every((field) => String(environment[field.field] || "").trim());
}

function getSpeechSupportStatus() {
  if (typeof window === "undefined") return "not checked";
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    ? "available"
    : "not available";
}
