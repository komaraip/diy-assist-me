import { VOICE_INTENTS } from "./voiceIntents.js";
import { getStudyCopy, normalizeStudyLanguage } from "../i18n/studyCopy.js";

const ENGLISH_COMMAND_DICTIONARY = [
  {
    intent: VOICE_INTENTS.NEXT_STEP,
    exact: ["next", "next step", "continue", "go forward"],
  },
  {
    intent: VOICE_INTENTS.PREVIOUS_STEP,
    exact: ["previous", "back", "go back", "previous step"],
  },
  {
    intent: VOICE_INTENTS.REPEAT_INSTRUCTION,
    exact: ["repeat", "repeat instruction", "say that again", "read again"],
  },
  {
    intent: VOICE_INTENTS.SHOW_MATERIALS,
    exact: ["show materials", "open materials", "what do i need", "materials"],
  },
  {
    intent: VOICE_INTENTS.CLOSE_MATERIALS,
    exact: ["close materials", "hide materials"],
  },
  {
    intent: VOICE_INTENTS.SHOW_OVERVIEW,
    exact: ["go to overview", "back to overview", "show tutorial overview", "overview"],
  },
  {
    intent: VOICE_INTENTS.HELP,
    exact: ["help", "what can i say", "show commands", "commands"],
  },
  {
    intent: VOICE_INTENTS.STOP_LISTENING,
    exact: ["stop listening", "turn off voice", "stop voice", "stop"],
  },
  {
    intent: VOICE_INTENTS.SCROLL_DOWN,
    exact: ["scroll down", "go down"],
  },
  {
    intent: VOICE_INTENTS.SCROLL_UP,
    exact: ["scroll up", "go up"],
  },
  {
    intent: VOICE_INTENTS.PAGE_DOWN,
    exact: ["page down"],
  },
  {
    intent: VOICE_INTENTS.PAGE_UP,
    exact: ["page up"],
  },
  {
    intent: VOICE_INTENTS.SCROLL_TOP,
    exact: ["scroll to top"],
  },
  {
    intent: VOICE_INTENTS.SCROLL_BOTTOM,
    exact: ["scroll to bottom"],
  },
];

const INDONESIAN_COMMAND_DICTIONARY = [
  {
    intent: VOICE_INTENTS.NEXT_STEP,
    exact: ["lanjut", "berikutnya", "langkah berikutnya", "maju", "lanjutkan"],
  },
  {
    intent: VOICE_INTENTS.PREVIOUS_STEP,
    exact: ["sebelumnya", "kembali", "mundur", "langkah sebelumnya"],
  },
  {
    intent: VOICE_INTENTS.REPEAT_INSTRUCTION,
    exact: ["ulangi", "ulang", "ulangi instruksi", "baca lagi"],
  },
  {
    intent: VOICE_INTENTS.SHOW_MATERIALS,
    exact: ["tampilkan bahan", "buka bahan", "lihat bahan", "bahan", "apa yang dibutuhkan"],
  },
  {
    intent: VOICE_INTENTS.CLOSE_MATERIALS,
    exact: ["tutup bahan", "sembunyikan bahan"],
  },
  {
    intent: VOICE_INTENTS.SHOW_OVERVIEW,
    exact: ["tampilkan ringkasan", "buka ringkasan", "ringkasan", "ikhtisar", "daftar langkah"],
  },
  {
    intent: VOICE_INTENTS.HELP,
    exact: ["bantuan", "apa yang bisa saya ucapkan", "tampilkan perintah", "perintah"],
  },
  {
    intent: VOICE_INTENTS.STOP_LISTENING,
    exact: ["berhenti mendengarkan", "matikan suara", "berhenti suara", "berhenti", "stop"],
  },
  {
    intent: VOICE_INTENTS.SCROLL_DOWN,
    exact: ["gulir ke bawah", "turun", "ke bawah"],
  },
  {
    intent: VOICE_INTENTS.SCROLL_UP,
    exact: ["gulir ke atas", "naik", "ke atas"],
  },
  {
    intent: VOICE_INTENTS.PAGE_DOWN,
    exact: ["halaman bawah"],
  },
  {
    intent: VOICE_INTENTS.PAGE_UP,
    exact: ["halaman atas"],
  },
  {
    intent: VOICE_INTENTS.SCROLL_TOP,
    exact: ["gulir ke paling atas", "ke paling atas"],
  },
  {
    intent: VOICE_INTENTS.SCROLL_BOTTOM,
    exact: ["gulir ke paling bawah", "ke paling bawah"],
  },
];

const ENGLISH_SEARCH_PATTERNS = [
  /^(?:search for|find|look for)\s+(.+)$/,
  /^(?:search|find|look up)\s+(.+)$/,
];

const INDONESIAN_SEARCH_PATTERNS = [
  /^(?:cari kata|cari bahan|cari langkah)\s+(.+)$/,
  /^(?:cari|temukan|lihat)\s+(.+)$/,
];

const ENGLISH_STEP_PATTERNS = [
  /^(?:go to step|open step|jump to step|step)\s+(\d+)$/,
];

const INDONESIAN_STEP_PATTERNS = [
  /^(?:pergi ke langkah|buka langkah|lompat ke langkah|ke langkah|langkah)\s+(\d+)$/,
];

export const COMMAND_DICTIONARY = ENGLISH_COMMAND_DICTIONARY;
export const SEARCH_PATTERNS = ENGLISH_SEARCH_PATTERNS;
export const STEP_PATTERNS = ENGLISH_STEP_PATTERNS;
export const COMMAND_HINTS = getStudyCopy("en").voice.hints;

export function getCommandDictionary(language = "en") {
  if (normalizeStudyLanguage(language) !== "id") return ENGLISH_COMMAND_DICTIONARY;
  return mergeCommandDictionaries(INDONESIAN_COMMAND_DICTIONARY, ENGLISH_COMMAND_DICTIONARY);
}

export function getSearchPatterns(language = "en") {
  if (normalizeStudyLanguage(language) !== "id") return ENGLISH_SEARCH_PATTERNS;
  return [...INDONESIAN_SEARCH_PATTERNS, ...ENGLISH_SEARCH_PATTERNS];
}

export function getStepPatterns(language = "en") {
  if (normalizeStudyLanguage(language) !== "id") return ENGLISH_STEP_PATTERNS;
  return [...INDONESIAN_STEP_PATTERNS, ...ENGLISH_STEP_PATTERNS];
}

export function getCommandHints(language = "en") {
  return getStudyCopy(language).voice.hints;
}

function mergeCommandDictionaries(primary, fallback) {
  return primary.map((primaryGroup) => {
    const fallbackGroup = fallback.find((group) => group.intent === primaryGroup.intent);
    return {
      intent: primaryGroup.intent,
      exact: [...primaryGroup.exact, ...(fallbackGroup?.exact || [])],
    };
  });
}
