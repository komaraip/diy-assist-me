export const SUS_ITEMS = [
  "I think that I would like to use this system frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need the support of a technical person to be able to use this system.",
  "I found the various functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I would imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system.",
];

export function calculateSusScore(responses = {}) {
  const contributions = SUS_ITEMS.map((_, index) => {
    const itemNumber = index + 1;
    const response = Number(responses[`item${itemNumber}`]);
    if (!Number.isFinite(response)) return 0;
    return itemNumber % 2 === 1 ? response - 1 : 5 - response;
  });

  const contributionSum = contributions.reduce((total, value) => total + value, 0);

  return {
    contributions,
    contributionSum,
    susScore: contributionSum * 2.5,
  };
}

export function hasCompleteSusResponses(responses = {}) {
  return SUS_ITEMS.every((_, index) => {
    const value = Number(responses[`item${index + 1}`]);
    return Number.isInteger(value) && value >= 1 && value <= 5;
  });
}
