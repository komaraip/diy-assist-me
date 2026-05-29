import { DEFAULT_STUDY_LANGUAGE, getStudyCopy, normalizeStudyLanguage } from "../i18n/studyCopy.js";

export const SEQUENCE_ASSIGNMENTS = [
  {
    value: "AB",
    label: "Touch first, then voice",
    modalities: ["touch", "voice"],
  },
  {
    value: "BA",
    label: "Voice first, then touch",
    modalities: ["voice", "touch"],
  },
];

export const TUTORIAL_ROTATIONS = [
  {
    value: "rotation_a",
    label: "Rotation A",
    practiceTutorialId: "tutorial_001",
    measuredTutorialId: "tutorial_002",
    practiceIndex: 0,
    measuredIndex: 1,
  },
  {
    value: "rotation_b",
    label: "Rotation B",
    practiceTutorialId: "tutorial_005",
    measuredTutorialId: "tutorial_009",
    practiceIndex: 4,
    measuredIndex: 8,
  },
];

const TASK_TARGETS = {
  rotation_a: {
    practice: { preferredKeywords: ["oats", "milk", "bowl"], targetStep: 2 },
    measured: { preferredKeywords: ["egg", "cheese", "wrap"], targetStep: 4 },
  },
  rotation_b: {
    practice: { preferredKeywords: ["bottle", "soap", "brush"], targetStep: 2 },
    measured: { preferredKeywords: ["cable", "label", "desk"], targetStep: 4 },
  },
};

const PLACEHOLDER_KEYWORDS = new Set(["lorem", "ipsum", "dolor", "amet"]);

export function buildStudyPlan({
  sequenceAssignment = "AB",
  tutorialRotation = "rotation_a",
  tutorials = [],
  language = DEFAULT_STUDY_LANGUAGE,
} = {}) {
  const sequence = getSequenceAssignment(sequenceAssignment);
  const rotation = getTutorialRotation(tutorialRotation);
  const availableTutorials = tutorials.filter((tutorial) => tutorial?.id);
  const normalizedLanguage = normalizeStudyLanguage(language);

  if (!availableTutorials.length) {
    return [];
  }

  const practiceTutorial = pickStudyTutorial({
    tutorials: availableTutorials,
    tutorialId: rotation.practiceTutorialId,
    studyRole: "core_practice",
    fallbackIndex: rotation.practiceIndex,
  });
  const measuredTutorial = pickStudyTutorial({
    tutorials: availableTutorials,
    tutorialId: rotation.measuredTutorialId,
    studyRole: "core_measured",
    fallbackIndex: rotation.measuredIndex,
  });

  return sequence.modalities.map((modality, index) => {
    const conditionId = `condition_${index + 1}`;
    const conditionOrder = index + 1;
    const practiceTask = buildTask({
      conditionId,
      conditionOrder,
      modality,
      trialType: "practice",
      tutorial: practiceTutorial,
      rotationValue: rotation.value,
      taskIndex: 0,
      language: normalizedLanguage,
    });
    const measuredTask = buildTask({
      conditionId,
      conditionOrder,
      modality,
      trialType: "measured",
      tutorial: measuredTutorial,
      rotationValue: rotation.value,
      taskIndex: 1,
      language: normalizedLanguage,
    });

    return {
      id: conditionId,
      conditionId,
      conditionOrder,
      modality,
      sequenceAssignment: sequence.value,
      tutorialRotation: rotation.value,
      practiceTasks: [practiceTask],
      measuredTasks: [measuredTask],
      tasks: [practiceTask, measuredTask],
    };
  });
}

export function getSequenceAssignment(value) {
  return SEQUENCE_ASSIGNMENTS.find((assignment) => assignment.value === value) || SEQUENCE_ASSIGNMENTS[0];
}

export function getTutorialRotation(value) {
  return TUTORIAL_ROTATIONS.find((rotation) => rotation.value === value) || TUTORIAL_ROTATIONS[0];
}

export function getAllStudyTasks(session) {
  return (session?.conditions || []).flatMap((condition) => condition.tasks || []);
}

export function findStudyTask(session, taskId) {
  return getAllStudyTasks(session).find((task) => task.id === taskId) || null;
}

export function findStudyCondition(session, conditionId) {
  return (session?.conditions || []).find((condition) => condition.id === conditionId) || null;
}

function buildTask({ conditionId, conditionOrder, modality, trialType, tutorial, rotationValue, taskIndex, language }) {
  const copy = getStudyCopy(language).tasks;
  const tutorialId = tutorial?.id || "";
  const target = getTaskTarget({ tutorial, rotationValue, trialType });
  const targetKeyword = target.targetKeyword || copy.targetKeywordFallback;
  const isPractice = trialType === "practice";

  return {
    id: `${conditionId}_${trialType}_${taskIndex + 1}`,
    conditionId,
    conditionOrder,
    modality,
    trialType,
    tutorialId,
    taskId: `${conditionId}_${trialType}_${taskIndex + 1}`,
    taskGoal: "",
    label: isPractice ? copy.practiceLabel : copy.measuredLabel,
    taskScript: isPractice
      ? (modality === "voice" ? copy.voicePracticeScript : copy.touchPracticeScript)
      : (modality === "voice"
          ? copy.voiceMeasuredScript({ targetKeyword, targetStep: target.targetStep })
          : copy.touchMeasuredScript({ targetKeyword, targetStep: target.targetStep })
        ),
    requiredActions: isPractice
      ? ["materials_open", "step_next", "repeat_instruction"]
      : ["materials_open", "step_next", "repeat_instruction", "tutorial_search", "step_jump", "step_previous"],
    targetKeyword,
    targetStep: target.targetStep,
    successCriteria: isPractice ? copy.practiceSuccess : copy.measuredSuccess,
  };
}

function getTaskTarget({ tutorial, rotationValue, trialType }) {
  const profile = TASK_TARGETS[rotationValue]?.[trialType] || {};
  const steps = tutorial?.steps || [];
  const targetStep = clampStep(profile.targetStep || 2, steps.length);
  const targetKeyword = findPreferredKeyword(tutorial, profile.preferredKeywords || []) || findFallbackKeyword(tutorial);

  return {
    targetKeyword,
    targetStep,
  };
}

function findPreferredKeyword(tutorial, preferredKeywords) {
  const searchableText = [
    tutorial?.title,
    tutorial?.description,
    ...(tutorial?.tags || []),
    ...(tutorial?.materials || []).map((material) => material.name || material),
    ...(tutorial?.steps || []).flatMap((step) => [
      step.instruction,
      ...(step.keywords || []),
    ]),
  ]
    .join(" ")
    .toLowerCase();

  return preferredKeywords.find((keyword) => searchableText.includes(keyword)) || "";
}

function findFallbackKeyword(tutorial) {
  const stepKeyword = (tutorial?.steps || [])
    .flatMap((step) => step.keywords || [])
    .map((keyword) => normalizeKeywordCandidate(keyword))
    .find(Boolean);
  if (stepKeyword) return stepKeyword;

  const materialKeyword = (tutorial?.materials || [])
    .map((material) => normalizeKeywordCandidate(material.name || material))
    .find(Boolean);
  return materialKeyword || "materials";
}

function normalizeKeywordCandidate(value) {
  return String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9-]/g, ""))
    .find((token) => token.length > 2 && !PLACEHOLDER_KEYWORDS.has(token)) || "";
}

function clampStep(stepNumber, stepCount) {
  if (!stepCount) return Math.max(1, Number(stepNumber) || 1);
  return Math.max(1, Math.min(Number(stepNumber) || 1, stepCount));
}

function pickTutorial(tutorials, index) {
  return tutorials[index % tutorials.length];
}

function pickStudyTutorial({ tutorials, tutorialId, studyRole, fallbackIndex }) {
  return (
    tutorials.find((tutorial) => tutorial.id === tutorialId) ||
    tutorials.find((tutorial) => tutorial.studyRole === studyRole && tutorial.guidedSessionPriority) ||
    pickTutorial(tutorials, fallbackIndex)
  );
}
