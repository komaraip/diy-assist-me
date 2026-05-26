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
    practiceIndex: 0,
    measuredIndex: 1,
  },
  {
    value: "rotation_b",
    label: "Rotation B",
    practiceIndex: 2,
    measuredIndex: 3,
  },
];

const TASK_TARGETS = {
  rotation_a: {
    practice: { preferredKeywords: ["cream", "milk", "sugar"], targetStep: 2 },
    measured: { preferredKeywords: ["egg", "cheese", "wrap"], targetStep: 4 },
  },
  rotation_b: {
    practice: { preferredKeywords: ["rice", "sweetener", "bowl"], targetStep: 2 },
    measured: { preferredKeywords: ["microwave", "egg", "cheese"], targetStep: 3 },
  },
};

export function buildStudyPlan({
  sequenceAssignment = "AB",
  tutorialRotation = "rotation_a",
  tutorials = [],
} = {}) {
  const sequence = getSequenceAssignment(sequenceAssignment);
  const rotation = getTutorialRotation(tutorialRotation);
  const availableTutorials = tutorials.filter((tutorial) => tutorial?.id);

  if (!availableTutorials.length) {
    return [];
  }

  const practiceTutorial = pickTutorial(availableTutorials, rotation.practiceIndex);
  const measuredTutorial = pickTutorial(availableTutorials, rotation.measuredIndex);

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
    });
    const measuredTask = buildTask({
      conditionId,
      conditionOrder,
      modality,
      trialType: "measured",
      tutorial: measuredTutorial,
      rotationValue: rotation.value,
      taskIndex: 1,
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

function buildTask({ conditionId, conditionOrder, modality, trialType, tutorial, rotationValue, taskIndex }) {
  const tutorialId = tutorial?.id || "";
  const target = getTaskTarget({ tutorial, rotationValue, trialType });
  const isPractice = trialType === "practice";

  return {
    id: `${conditionId}_${trialType}_${taskIndex + 1}`,
    conditionId,
    conditionOrder,
    modality,
    trialType,
    tutorialId,
    taskId: `${conditionId}_${trialType}_${taskIndex + 1}`,
    taskGoal: isPractice
      ? "Practice the selected navigation mode before the measured task."
      : "Complete the assigned hands-busy tutorial navigation script using the selected mode.",
    label: isPractice ? "Practice task" : "Measured tutorial task",
    taskScript: isPractice
      ? buildPracticeScript()
      : buildMeasuredScript(target),
    requiredActions: isPractice
      ? ["materials_open", "step_next", "repeat_instruction"]
      : ["materials_open", "step_next", "repeat_instruction", "tutorial_search", "step_jump", "step_previous"],
    targetKeyword: target.targetKeyword,
    targetStep: target.targetStep,
    successCriteria: isPractice
      ? "Participant understands the available controls before the measured condition."
      : "Participant reaches the target instruction and completes the task without facilitator intervention.",
  };
}

function buildPracticeScript() {
  return [
    "Open the material list.",
    "Move to the next step.",
    "Repeat the current instruction.",
    "Return to the guided session when you are familiar with the controls.",
  ];
}

function buildMeasuredScript({ targetKeyword, targetStep }) {
  return [
    "Open the material list.",
    "Move to step 2.",
    "Repeat the current instruction.",
    `Search for "${targetKeyword}".`,
    `Go to step ${targetStep}.`,
    "Move backward once.",
    `Return to step ${targetStep}.`,
    "Finish the task.",
  ];
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
  const materialKeyword = (tutorial?.materials || [])
    .map((material) => material.name || material)
    .find(Boolean);
  if (materialKeyword) return String(materialKeyword).split(/\s+/)[0].toLowerCase();

  const stepKeyword = (tutorial?.steps || [])
    .flatMap((step) => step.keywords || [])
    .find(Boolean);
  return stepKeyword || "materials";
}

function clampStep(stepNumber, stepCount) {
  if (!stepCount) return Math.max(1, Number(stepNumber) || 1);
  return Math.max(1, Math.min(Number(stepNumber) || 1, stepCount));
}

function pickTutorial(tutorials, index) {
  return tutorials[index % tutorials.length];
}
