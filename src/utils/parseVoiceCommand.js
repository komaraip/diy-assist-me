import { COMMAND_DICTIONARY, SEARCH_PATTERNS, STEP_PATTERNS } from "./commandDictionary.js";
import { normalizeTranscript } from "./normalizeTranscript.js";
import { VOICE_INTENTS } from "./voiceIntents.js";

export function parseVoiceCommand(transcript = "") {
  const normalizedTranscript = normalizeTranscript(transcript);

  if (!normalizedTranscript) {
    return unknownResult(normalizedTranscript);
  }

  for (const group of COMMAND_DICTIONARY) {
    const exactMatch = group.exact.find((phrase) => normalizedTranscript === normalizeTranscript(phrase));
    if (exactMatch) {
      return {
        intent: group.intent,
        query: "",
        stepNumber: null,
        normalizedTranscript,
        matchedPhrase: exactMatch,
        confidenceType: "exact",
      };
    }
  }

  for (const pattern of SEARCH_PATTERNS) {
    const match = normalizedTranscript.match(pattern);
    if (match?.[1]) {
      return {
        intent: VOICE_INTENTS.SEARCH,
        query: match[1].trim(),
        stepNumber: null,
        normalizedTranscript,
        matchedPhrase: pattern.source,
        confidenceType: "pattern",
      };
    }
  }

  for (const pattern of STEP_PATTERNS) {
    const match = normalizedTranscript.match(pattern);
    if (match?.[1]) {
      return {
        intent: VOICE_INTENTS.GO_TO_STEP,
        query: "",
        stepNumber: Number(match[1]),
        normalizedTranscript,
        matchedPhrase: pattern.source,
        confidenceType: "pattern",
      };
    }
  }

  for (const group of COMMAND_DICTIONARY) {
    const synonymMatch = group.exact.find((phrase) => {
      const normalizedPhrase = normalizeTranscript(phrase);
      return normalizedPhrase && normalizedTranscript.includes(normalizedPhrase);
    });
    if (synonymMatch) {
      return {
        intent: group.intent,
        query: "",
        stepNumber: null,
        normalizedTranscript,
        matchedPhrase: synonymMatch,
        confidenceType: "synonym",
      };
    }
  }

  return unknownResult(normalizedTranscript);
}

function unknownResult(normalizedTranscript) {
  return {
    intent: VOICE_INTENTS.UNKNOWN,
    query: "",
    stepNumber: null,
    normalizedTranscript,
    matchedPhrase: "",
    confidenceType: "unknown",
  };
}
