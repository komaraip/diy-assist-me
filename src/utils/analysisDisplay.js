const LABEL_OVERRIDES = {
  no_matching_intent: "No matching intent",
  missing_touch_trial: "Missing touch trial",
  missing_voice_trial: "Missing voice trial",
  missing_touch_sus: "Missing touch SUS",
  missing_voice_sus: "Missing voice SUS",
  voice_required_action_incomplete: "Voice required action incomplete",
  touch_required_action_incomplete: "Touch required action incomplete",
  repeated_voice_recognition_errors: "Repeated voice recognition errors",
  completed_mostly_with_touch_fallback: "Completed mostly with touch fallback",
  zero_successful_voice_commands: "Zero successful voice commands",
  technical_issue: "Technical issue",
  fallback_completed: "Fallback completed",
  not_applicable: "Not applicable",
  partially_successful: "Partially successful",
  voice_no_match: "Voice no match",
  voice_recognition_error: "Voice recognition error",
  voice_unsupported: "Voice unsupported",
  scroll_down: "Scroll down",
  scroll_down_after_target: "Scroll down after target step",
  scroll_up: "Scroll up",
};

export function formatAnalysisLabel(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = text.toLowerCase();
  if (LABEL_OVERRIDES[normalized]) return LABEL_OVERRIDES[normalized];
  return toTitleCase(humanizeAnalysisText(text));
}

export function humanizeAnalysisText(value = "") {
  return String(value || "")
    .replace(/\bcondition_(\d+)_(practice|measured)_(\d+)\b/gi, (_, condition, trialType, index) =>
      `Condition ${condition} ${trialType} ${index}`,
    )
    .replace(/\bcondition_(\d+)\b/gi, "Condition $1")
    .replace(/\bRQ(\d)\b/g, "RQ$1")
    .replace(/\b([a-z]+(?:_[a-z0-9]+)+)\b/gi, (match) => LABEL_OVERRIDES[match.toLowerCase()] || match.replace(/_/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function splitAnalysisDetail(value = "") {
  const text = humanizeAnalysisText(value);
  if (!text) return [];
  return text
    .split(/;\s+|\. (?=[A-Z0-9])/)
    .map((item) => item.replace(/\.$/, "").trim())
    .filter(Boolean);
}

export function formatAnalysisList(values = []) {
  return values.map(humanizeAnalysisText).filter(Boolean);
}

function toTitleCase(value = "") {
  return String(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^RQ\d$/i.test(word)) return word.toUpperCase();
      if (/^SUS$/i.test(word)) return "SUS";
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}
