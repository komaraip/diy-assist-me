import { getCommandDictionary, getSearchPatterns, getStepPatterns } from "./commandDictionary.js";
import { normalizeTranscript } from "./normalizeTranscript.js";
import { VOICE_INTENTS } from "./voiceIntents.js";

export function parseVoiceCommand(transcript = "", language = "en") {
  const normalizedTranscript = normalizeTranscript(transcript);
  const commandDictionary = getCommandDictionary(language);
  const searchPatterns = getSearchPatterns(language);
  const stepPatterns = getStepPatterns(language);

  if (!normalizedTranscript) {
    return unknownResult(normalizedTranscript);
  }

  for (const group of commandDictionary) {
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

  for (const pattern of searchPatterns) {
    const match = normalizedTranscript.match(pattern);
    if (match?.[1]) {
      const query = match[1].trim();
      if (!isMeaningfulSearchQuery(query)) {
        return unknownResult(normalizedTranscript);
      }
      return {
        intent: VOICE_INTENTS.SEARCH,
        query,
        stepNumber: null,
        normalizedTranscript,
        matchedPhrase: pattern.source,
        confidenceType: "pattern",
      };
    }
  }

  if (looksLikeIncompleteSearch(normalizedTranscript)) {
    return unknownResult(normalizedTranscript);
  }

  for (const pattern of stepPatterns) {
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

  for (const group of commandDictionary) {
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

const LOW_VALUE_SEARCH_QUERIES = new Set(["a", "an", "the", "for", "to", "in", "on", "of"]);

function isMeaningfulSearchQuery(query) {
  const normalizedQuery = normalizeTranscript(query);
  return normalizedQuery.length >= 2 && !LOW_VALUE_SEARCH_QUERIES.has(normalizedQuery);
}

function looksLikeIncompleteSearch(normalizedTranscript) {
  return /^(?:search for|search|find|look for|look up)(?:\s+\S*)?$/.test(normalizedTranscript);
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
