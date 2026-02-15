/**
 * Message Filter Utility
 * Helps determine if a message is a question and filters spam
 */

/**
 * Common question indicators in Indonesian
 */
const QUESTION_INDICATORS = [
  "?", // Question mark
  "apa",
  "kenapa",
  "mengapa",
  "gimana",
  "bagaimana",
  "siapa",
  "kapan",
  "dimana",
  "di mana",
  "berapa",
  "apakah",
  "bisakah",
  "bolehkah",
  "maukah",
];

/**
 * Check if a message appears to be a question
 */
export function isQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Check for question mark
  if (lowerMessage.includes("?")) {
    return true;
  }

  // Check for question words
  return QUESTION_INDICATORS.some((indicator) => {
    // Match whole words or at the beginning of a sentence
    const regex = new RegExp(`\\b${indicator}\\b`, "i");
    return regex.test(lowerMessage);
  });
}

// function isNumeric(value: any): boolean {
//   return !isNaN(value) && isNaN(parseFloat(value));
// }
/**
 * Check if message is likely spam or should be ignored
 */
export function isSpam(message: string): boolean {
  const msgLength = message.trim().length; // Empty messages
  console.log("cek tipe input: ", typeof message);
  if (!message || msgLength === 0) {
    return true;
  }

  // Very short messages (single character/emoji)
  if (msgLength === 1 && (message == "1" || message == "2")) {
    return false;
  }

  // Repeated characters (e.g., "aaaaaaa")
  const repeatedPattern = /(.)\1{10,}/;
  if (repeatedPattern.test(message)) {
    return true;
  }

  return false;
}

/**
 * Normalize message for processing
 */
export function normalizeMessage(message: string): string {
  return message.trim();
}

/**
 * Determine response strategy based on message type
 */
export function getResponseStrategy(message: string): "question" | "casual" {
  if (isQuestion(message)) {
    return "question";
  }
  return "casual";
}
