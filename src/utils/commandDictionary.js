import { VOICE_INTENTS } from "./voiceIntents.js";

export const COMMAND_DICTIONARY = [
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

export const SEARCH_PATTERNS = [
  /^(?:search for|find|look for)\s+(.+)$/,
  /^(?:search|find|look up)\s+(.+)$/,
];

export const STEP_PATTERNS = [
  /^(?:go to step|open step|jump to step|step)\s+(\d+)$/,
];

export const COMMAND_HINTS = [
  "next step",
  "repeat",
  "show materials",
  "search for tape",
  "go to step 3",
  "scroll down",
  "scroll up",
  "scroll to top",
  "stop listening",
];
