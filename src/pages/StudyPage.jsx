import { GitBranch, MonitorCheck, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { GuidedProgress } from "../components/study/GuidedProgress.jsx";
import { createStudySession } from "../services/studyService.js";
import { SEQUENCE_ASSIGNMENTS, TUTORIAL_ROTATIONS } from "../utils/studyAssignments.js";
import { DEFAULT_STUDY_LANGUAGE, getStudyCopy } from "../i18n/studyCopy.js";

const initialParticipantProfile = {
  fullName: "",
  email: "",
  ageRange: "",
  englishAbility: "",
  tutorialAppUsage: "",
};

const initialEnvironment = {
  deviceType: "",
  browserName: "",
  microphonePermissionStatus: "",
  roomNoiseLevelNote: "",
  internetConnectionNote: "",
  taskEnvironmentNote: "",
  researcherObservationNote: "",
};

export function StudyPage() {
  const [participantProfile, setParticipantProfile] = useState(initialParticipantProfile);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [environment, setEnvironment] = useState(initialEnvironment);
  const [sequenceAssignment, setSequenceAssignment] = useState("AB");
  const [tutorialRotation, setTutorialRotation] = useState("rotation_a");
  const [statusMessage, setStatusMessage] = useState("");
  const [sessionResult, setSessionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = getStudyCopy(DEFAULT_STUDY_LANGUAGE);
  const speechSupportStatus = getSpeechSupportStatus(copy);
  const environmentFields = copy.environmentFields;

  async function handleCreateSession(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    if (!hasCompleteParticipantProfile(participantProfile)) {
      setSessionResult({ data: null, source: "local", warning: null, error: copy.setupPage.participantError });
      setStatusMessage(copy.setupPage.participantError);
      setIsSubmitting(false);
      return;
    }

    if (!consentConfirmed) {
      setSessionResult({ data: null, source: "local", warning: null, error: copy.setupPage.consentError });
      setStatusMessage(copy.setupPage.consentError);
      setIsSubmitting(false);
      return;
    }

    if (!hasCompleteEnvironment(environment, environmentFields)) {
      setSessionResult({ data: null, source: "local", warning: null, error: copy.setupPage.setupError });
      setStatusMessage(copy.setupPage.setupError);
      setIsSubmitting(false);
      return;
    }

    const result = await createStudySession({
      participantProfile,
      consentConfirmed,
      environment,
      sequenceAssignment,
      tutorialRotation,
      language: DEFAULT_STUDY_LANGUAGE,
    });
    setSessionResult(result);
    setStatusMessage(
      result.error
        ? result.error
        : copy.setupPage.sessionReady
    );
    setIsSubmitting(false);
  }

  function updateParticipantProfile(field, value) {
    setParticipantProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateEnvironment(field, value) {
    setEnvironment((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <section className="page-section study-setup-page">
      <div className="page-header">
        <p className="eyebrow">{copy.setupPage.eyebrow}</p>
        <h1>{copy.setupPage.title}</h1>
        <p>{copy.setupPage.description}</p>
      </div>

      <div className="study-setup-row">
        <GuidedProgress
          steps={copy.setupProgress}
          currentStepId="setup"
          title={copy.setupPage.progressTitle}
          eyebrow={copy.shared.progressEyebrow}
        />
      </div>

      <form className="study-form" onSubmit={handleCreateSession}>
        <section className="form-section participant-profile-card" aria-labelledby="participant-profile-heading">
          <UserRound aria-hidden="true" />
          <div>
            <h2 id="participant-profile-heading">{copy.setupPage.participantHeading}</h2>
            <p>{copy.setupPage.participantDescription}</p>
            <div className="form-grid">
              <label className="field-label">
                {copy.setupPage.participantFields.fullName}
                <input
                  type="text"
                  value={participantProfile.fullName}
                  onChange={(event) => updateParticipantProfile("fullName", event.target.value)}
                  required
                />
              </label>
              <label className="field-label">
                {copy.setupPage.participantFields.email}
                <input
                  type="email"
                  value={participantProfile.email}
                  onChange={(event) => updateParticipantProfile("email", event.target.value)}
                  required
                />
              </label>
              <SelectInput
                label={copy.setupPage.participantFields.ageRange}
                value={participantProfile.ageRange}
                onChange={(value) => updateParticipantProfile("ageRange", value)}
                placeholder={copy.setupPage.participantPlaceholders.ageRange}
                options={copy.participantProfileOptions.ageRange}
              />
              <SelectInput
                label={copy.setupPage.participantFields.englishAbility}
                value={participantProfile.englishAbility}
                onChange={(value) => updateParticipantProfile("englishAbility", value)}
                placeholder={copy.setupPage.participantPlaceholders.englishAbility}
                options={copy.participantProfileOptions.englishAbility}
              />
              <SelectInput
                label={copy.setupPage.participantFields.tutorialAppUsage}
                value={participantProfile.tutorialAppUsage}
                onChange={(value) => updateParticipantProfile("tutorialAppUsage", value)}
                placeholder={copy.setupPage.participantPlaceholders.tutorialAppUsage}
                options={copy.participantProfileOptions.tutorialAppUsage}
              />
            </div>
          </div>
        </section>

        <section className="form-section study-consent-card" aria-labelledby="consent-heading">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h2 id="consent-heading">{copy.setupPage.consentHeading}</h2>
            <p>{copy.setupPage.consentDescription}</p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(event) => setConsentConfirmed(event.target.checked)}
                required
              />
              <span>{copy.setupPage.consentLabel}</span>
            </label>
          </div>
        </section>

        <section className="form-section study-choice-card" aria-labelledby="assignment-heading">
          <GitBranch aria-hidden="true" />
          <div>
            <h2 id="assignment-heading">{copy.setupPage.choicesHeading}</h2>
            <p>{copy.setupPage.choicesDescription}</p>
            <div className="form-grid">
              <label className="field-label">
                {copy.setupPage.modeOrderLabel}
                <select
                  value={sequenceAssignment}
                  onChange={(event) => setSequenceAssignment(event.target.value)}
                  required
                >
                  {SEQUENCE_ASSIGNMENTS.map((assignment) => (
                    <option key={assignment.value} value={assignment.value}>
                      {copy.sequenceAssignments[assignment.value] || assignment.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                {copy.setupPage.tutorialSetLabel}
                <select
                  value={tutorialRotation}
                  onChange={(event) => setTutorialRotation(event.target.value)}
                  required
                >
                  {TUTORIAL_ROTATIONS.map((rotation) => (
                    <option key={rotation.value} value={rotation.value}>
                      {copy.tutorialRotations[rotation.value] || rotation.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="form-section study-setup-notes-card" aria-labelledby="environment-heading">
          <MonitorCheck aria-hidden="true" />
          <div>
            <h2 id="environment-heading">{copy.setupPage.setupHeading}</h2>
            <p>{copy.setupPage.setupDescription(speechSupportStatus)}</p>
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
          {isSubmitting ? copy.setupPage.startingButton : copy.setupPage.startButton}
        </button>
      </form>

      {statusMessage && (
        <div className={sessionResult?.error ? "result-panel error" : "result-panel"} role="status">
          <h2>{sessionResult?.error ? copy.setupPage.sessionErrorTitle : copy.setupPage.sessionReadyTitle}</h2>
          <p>{statusMessage}</p>
          {sessionResult?.data?.participantCode && <p>{copy.shared.sessionCode}: {sessionResult.data.participantCode}</p>}
          {sessionResult?.data?.id && (
            <Link className="button primary-button result-action" to={`/study/session/${sessionResult.data.id}`}>
              {copy.setupPage.continueButton}
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
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function hasCompleteEnvironment(environment, environmentFields) {
  return environmentFields.every((field) => String(environment[field.field] || "").trim());
}

function hasCompleteParticipantProfile(participantProfile) {
  return [
    participantProfile.fullName,
    participantProfile.email,
    participantProfile.ageRange,
    participantProfile.englishAbility,
    participantProfile.tutorialAppUsage,
  ].every((value) => String(value || "").trim());
}

function getSpeechSupportStatus(copy) {
  if (typeof window === "undefined") return copy.shared.notChecked;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    ? copy.shared.available
    : copy.shared.notAvailable;
}
