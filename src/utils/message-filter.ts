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

/**
 * Check if message is likely spam or should be ignored
 */
export function isSpam(message: string): boolean {
  // Empty messages
  if (!message || message.trim().length === 0) {
    return true;
  }

  // Very short messages (single character/emoji)
  if (message.trim().length === 1) {
    return true;
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
