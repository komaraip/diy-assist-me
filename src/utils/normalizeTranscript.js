export function normalizeTranscript(transcript = "") {
  let normalized = transcript
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Convert word numbers to digits
  const wordNumbers = {
    zero: "0", one: "1", two: "2", three: "3", four: "4",
    five: "5", six: "6", seven: "7", eight: "8", nine: "9",
    ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14",
    fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19",
    twenty: "20"
  };

  Object.keys(wordNumbers).forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    normalized = normalized.replace(regex, wordNumbers[word]);
  });

  return normalized;
}
