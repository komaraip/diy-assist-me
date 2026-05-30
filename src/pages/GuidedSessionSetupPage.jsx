import { GitBranch, MonitorCheck, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GuidedProgress } from "../components/guided-session/GuidedProgress.jsx";
import { InfoPopover } from "../components/guided-session/InfoPopover.jsx";
import { createStudySession } from "../services/studyService.js";
import { getSessionBalanceSummary } from "../services/sessionService.js";
import { SEQUENCE_ASSIGNMENTS, TUTORIAL_ROTATIONS } from "../utils/studyAssignments.js";
import { DEFAULT_STUDY_LANGUAGE, getStudyCopy } from "../config/guidedSessionContent.js";

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
  taskEnvironmentNote: "Desk-based hands-busy simulation",
  participantSetupNote: "",
  sameDeviceConfirmed: false,
  cacheResetConfirmed: false,
  microphoneCheckConfirmed: false,
};

const initialEligibility = {
  familiarWithWebTutorials: false,
  canPerformSimulatedDiy: false,
  notPrototypeDeveloper: false,
  notExpertInSelectedTasks: false,
  noTemporaryVoiceCondition: false,
  noUncorrectedHearingVisualLimit: false,
};

export function GuidedSessionSetupPage() {
  const [participantProfile, setParticipantProfile] = useState(initialParticipantProfile);
  const [eligibility, setEligibility] = useState(initialEligibility);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [environment, setEnvironment] = useState(initialEnvironment);
  const [sequenceAssignment, setSequenceAssignment] = useState("AB");
  const [tutorialRotation, setTutorialRotation] = useState("rotation_a");
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [sessionResult, setSessionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = getStudyCopy(DEFAULT_STUDY_LANGUAGE);
  const speechSupportStatus = getSpeechSupportStatus(copy);
  const environmentFields = copy.environmentFields;

  useEffect(() => {
    let isMounted = true;

    async function loadBalanceSummary() {
      const result = await getSessionBalanceSummary();
      if (!isMounted || result.error) return;
      setBalanceSummary(result.data);
      setSequenceAssignment(result.data.recommendedSequenceAssignment || "AB");
      setTutorialRotation(result.data.recommendedTutorialRotation || "rotation_a");
    }

    loadBalanceSummary();

    return () => {
      isMounted = false;
    };
  }, []);

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

    if (!isEligibleForStudy(participantProfile, eligibility)) {
      setSessionResult({ data: null, source: "local", warning: null, error: copy.setupPage.screeningError });
      setStatusMessage(copy.setupPage.screeningError);
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
      eligibility,
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

  function updateEligibility(field, value) {
    setEligibility((current) => ({
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
            <SetupCardHeading
              headingId="participant-profile-heading"
              infoId="participant-profile-info"
              title={copy.setupPage.participantHeading}
              description={copy.setupPage.participantDescription}
            />
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
            <SetupCardHeading
              headingId="consent-heading"
              infoId="consent-info"
              title={copy.setupPage.consentHeading}
              description={copy.setupPage.consentDescription}
            />
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

        <section className="form-section study-screening-card" aria-labelledby="screening-heading">
          <ShieldCheck aria-hidden="true" />
          <div>
            <SetupCardHeading
              headingId="screening-heading"
              infoId="screening-info"
              title={copy.setupPage.screeningHeading}
              description={copy.setupPage.screeningDescription}
            />
            <div className="checkbox-stack">
              {Object.entries(copy.setupPage.screeningFields).map(([field, label]) => (
                <label className="checkbox-row" key={field}>
                  <input
                    type="checkbox"
                    checked={eligibility[field]}
                    onChange={(event) => updateEligibility(field, event.target.checked)}
                    required
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="form-section study-choice-card" aria-labelledby="assignment-heading">
          <GitBranch aria-hidden="true" />
          <div>
            <SetupCardHeading
              headingId="assignment-heading"
              infoId="assignment-info"
              title={copy.setupPage.choicesHeading}
              description={copy.setupPage.choicesDescription}
            />
            <div className="form-grid">
              <label className="field-label">
                {copy.setupPage.modeOrderLabel}
                <select
                  value={sequenceAssignment}
                  onChange={(event) => setSequenceAssignment(event.target.value)}
                  required
                  disabled
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
                  disabled
                >
                  {TUTORIAL_ROTATIONS.map((rotation) => (
                    <option key={rotation.value} value={rotation.value}>
                      {copy.tutorialRotations[rotation.value] || rotation.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {balanceSummary ? (
              <p className="assignment-status">
                {copy.setupPage.recommendedAssignment(
                  balanceSummary.recommendedSequenceAssignment,
                  balanceSummary.recommendedTutorialRotation
                )}
              </p>
            ) : null}
          </div>
        </section>

        <section className="form-section study-setup-notes-card" aria-labelledby="environment-heading">
          <MonitorCheck aria-hidden="true" />
          <div>
            <SetupCardHeading
              headingId="environment-heading"
              infoId="environment-info"
              title={copy.setupPage.setupHeading}
              description={copy.setupPage.setupDescription(speechSupportStatus)}
            />
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
            <div className="checkbox-stack">
              <h3>{copy.setupPage.controlChecklistHeading}</h3>
              {Object.entries(copy.setupPage.controlChecklistFields).map(([field, label]) => (
                <label className="checkbox-row" key={field}>
                  <input
                    type="checkbox"
                    checked={environment[field]}
                    onChange={(event) => updateEnvironment(field, event.target.checked)}
                    required
                  />
                  <span>{label}</span>
                </label>
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
            <label className="field-label full-width-field" style={{ marginTop: "1rem" }}>
              Extra setup note (Optional)
              <input
                type="text"
                value={environment.participantSetupNote}
                onChange={(event) => updateEnvironment("participantSetupNote", event.target.value)}
                placeholder="e.g. mic volume low, minor background noise, lag spike during voice load"
              />
            </label>
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
            <Link className="button primary-button result-action" to={`/guided-session/${sessionResult.data.id}`}>
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

function SetupCardHeading({ headingId, title, description }) {
  return (
    <div className="setup-card-heading">
      <div className="setup-card-title-row">
        <h2 id={headingId}>{title}</h2>
        <InfoPopover title={title} description={description} />
      </div>
    </div>
  );
}

function hasCompleteEnvironment(environment, environmentFields) {
  return environmentFields.every((field) => String(environment[field.field] || "").trim()) &&
    environment.sameDeviceConfirmed === true &&
    environment.cacheResetConfirmed === true &&
    environment.microphoneCheckConfirmed === true;
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

function isEligibleForStudy(participantProfile, eligibility) {
  const ageEligible = participantProfile.ageRange === "18-24" || participantProfile.ageRange === "25-35";
  const englishEligible = participantProfile.englishAbility === "can_understand" ||
    participantProfile.englishAbility === "comfortable_commands";
  return ageEligible && englishEligible && Object.values(eligibility).every(Boolean);
}


function getSpeechSupportStatus(copy) {
  if (typeof window === "undefined") return copy.shared.notChecked;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    ? copy.shared.available
    : copy.shared.notAvailable;
}
