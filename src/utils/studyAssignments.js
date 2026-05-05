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

export function buildStudyPlan({
  sequenceAssignment = "AB",
  tutorialRotation = "rotation_a",
  tutorials = [],
} = {}) {
  const sequence = getSequenceAssignment(sequenceAssignment);
  const rotation = getTutorialRotation(tutorialRotation);
  const tutorialIds = tutorials.map((tutorial) => tutorial.id).filter(Boolean);

  if (!tutorialIds.length) {
    return [];
  }

  const practiceTutorialId = pickTutorialId(tutorialIds, rotation.practiceIndex);
  const measuredTutorialId = pickTutorialId(tutorialIds, rotation.measuredIndex);

  return sequence.modalities.map((modality, index) => {
    const conditionId = `condition_${index + 1}`;
    const conditionOrder = index + 1;
    const practiceTask = buildTask({
      conditionId,
      conditionOrder,
      modality,
      trialType: "practice",
      tutorialId: practiceTutorialId,
      taskIndex: 0,
    });
    const measuredTask = buildTask({
      conditionId,
      conditionOrder,
      modality,
      trialType: "measured",
      tutorialId: measuredTutorialId,
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

function buildTask({ conditionId, conditionOrder, modality, trialType, tutorialId, taskIndex }) {
  return {
    id: `${conditionId}_${trialType}_${taskIndex + 1}`,
    conditionId,
    conditionOrder,
    modality,
    trialType,
    tutorialId,
    taskId: `${conditionId}_${trialType}_${taskIndex + 1}`,
    taskGoal: trialType === "practice"
      ? "Practice moving through the tutorial before the main task."
      : "Complete the assigned tutorial task using the selected mode.",
    label: trialType === "practice" ? "Practice task" : "Tutorial task",
  };
}

function pickTutorialId(tutorialIds, index) {
  return tutorialIds[index % tutorialIds.length];
}
