import { VOICE_INTENTS } from "./voiceIntents.js";
import { getStudyCopy } from "../i18n/studyCopy.js";

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
    intent: VOICE_INTENTS.CLOSE_OVERVIEW,
    exact: ["close overview", "hide overview"],
  },
  {
    intent: VOICE_INTENTS.SHOW_SEARCH,
    exact: ["show search", "open search", "search"],
  },
  {
    intent: VOICE_INTENTS.CLOSE_SEARCH,
    exact: ["close search", "hide search"],
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
    intent: VOICE_INTENTS.START_LISTENING,
    exact: ["start listening", "start voice", "listen"],
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

const ENGLISH_SEARCH_PATTERNS = [
  /^(?:search for|find|look for)\s+(.+)$/,
  /^(?:search|find|look up)\s+(.+)$/,
];

const ENGLISH_STEP_PATTERNS = [
  /^(?:go to step|open step|jump to step|step)(?:\s+number)?\s+(\d+)$/,
];

export const COMMAND_DICTIONARY = ENGLISH_COMMAND_DICTIONARY;
export const SEARCH_PATTERNS = ENGLISH_SEARCH_PATTERNS;
export const STEP_PATTERNS = ENGLISH_STEP_PATTERNS;
export const COMMAND_HINTS = getStudyCopy("en").voice.hints;

export function getCommandDictionary() {
  return ENGLISH_COMMAND_DICTIONARY;
}

export function getSearchPatterns() {
  return ENGLISH_SEARCH_PATTERNS;
}

export function getStepPatterns() {
  return ENGLISH_STEP_PATTERNS;
}

export function getCommandHints() {
  return getStudyCopy("en").voice.hints;
}
