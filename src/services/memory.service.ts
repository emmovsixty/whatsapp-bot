/**
 * Memory Service (Database-backed)
 * Manages conversation history with persistent SQLite storage
 */

import { db } from "./database.service";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

class MemoryService {
  private readonly MAX_MESSAGES = 7; // Keep last 5 messages per user

  /**
   * Add a user message to conversation history
   */
  public addUserMessage(phoneNumber: string, content: string): void {
    this.addMessage(phoneNumber, "user", content);
  }

  /**
   * Add an assistant message to conversation history
   */
  public addAssistantMessage(phoneNumber: string, content: string): void {
    this.addMessage(phoneNumber, "assistant", content);
  }

  /**
   * Add a message to conversation history (database)
   */
  private addMessage(
    phoneNumber: string,
    role: "user" | "assistant",
    content: string,
  ): void {
    const timestamp = Date.now();

    // Insert message into database
    const insert = db.prepare(
      "INSERT INTO conversations (phone_number, role, content, timestamp) VALUES (?, ?, ?, ?)",
    );
    insert.run(phoneNumber, role, content, timestamp);

    // Clean up old messages (keep only last MAX_MESSAGES)
    this.cleanupOldMessages(phoneNumber);

    const count = this.getMessageCount(phoneNumber);
    console.log(
      `💬 Message added for ${phoneNumber} (${role}): ${count} messages in history`,
    );
  }

  /**
   * Clean up old messages, keeping only the last MAX_MESSAGES
   */
  private cleanupOldMessages(phoneNumber: string): void {
    const cleanup = db.prepare(`
      DELETE FROM conversations 
      WHERE phone_number = ? 
      AND id NOT IN (
        SELECT id FROM conversations 
        WHERE phone_number = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      )
    `);
    cleanup.run(phoneNumber, phoneNumber, this.MAX_MESSAGES);
  }

  /**
   * Get conversation history for a user
   * Returns messages in OpenAI format
   */
  public getHistory(
    phoneNumber: string,
  ): Array<{ role: "user" | "assistant"; content: string }> {
    const stmt = db.prepare(`
      SELECT role, content 
      FROM conversations 
      WHERE phone_number = ? 
      ORDER BY timestamp ASC
      LIMIT ?
    `);

    const rows = stmt.all(phoneNumber, this.MAX_MESSAGES) as Message[];
    return rows.map((row) => ({
      role: row.role,
      content: row.content,
    }));
  }

  /**
   * Check if a message needs conversation context
   * Returns true if the message references previous conversation
   */
  private needsContext(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Keywords yang menunjukkan butuh context
    const contextKeywords = [
      // Referensi ke percakapan sebelumnya
      "itu",
      "tadi",
      "sebelumnya",
      "kamu bilang",
      "kamu tanya",
      "maksudnya",
      "maksud",
      "yang",
      "gimana",
      "kenapa",
      "kok",
      "lagi",
      "masih",
      "udah",
      "belum",
      // Pertanyaan lanjutan
      "terus",
      "lalu",
      "habis itu",
      "abis itu",
      // Klarifikasi
      "hah",
      "apa",
      "siapa",
      "kapan",
      "dimana",
      "di mana",
    ];

    // Check if message contains context keywords
    const hasContextKeyword = contextKeywords.some((keyword) =>
      lowerMessage.includes(keyword),
    );

    // Pesan pendek (< 10 karakter) biasanya gak butuh context
    // Kecuali ada keyword context
    if (message.length < 10 && !hasContextKeyword) {
      return false;
    }

    // Greeting messages gak butuh context
    const greetings = ["hai", "halo", "hi", "hello", "pam", "hei", "hey"];
    if (greetings.some((greeting) => lowerMessage === greeting)) {
      return false;
    }

    // Kalau ada context keyword, pasti butuh history
    if (hasContextKeyword) {
      return true;
    }

    // Default: pakai history kalau pesan > 15 karakter
    // (kemungkinan pertanyaan kompleks)
    return message.length > 15;
  }

  /**
   * Get smart history - only returns history if message needs context
   * This significantly speeds up responses for simple messages
   */
  public getSmartHistory(
    phoneNumber: string,
    currentMessage: string,
  ): Array<{ role: "user" | "assistant"; content: string }> {
    const needsHistoryContext = this.needsContext(currentMessage);

    if (!needsHistoryContext) {
      console.log(
        `⚡ Fast mode: No context needed for "${currentMessage}" - skipping history`,
      );
      return [];
    }

    console.log(
      `🧠 Context mode: Message needs history for "${currentMessage}"`,
    );
    return this.getHistory(phoneNumber);
  }

  /**
   * Clear conversation history for a user
   */
  public clearHistory(phoneNumber: string): void {
    const stmt = db.prepare("DELETE FROM conversations WHERE phone_number = ?");
    stmt.run(phoneNumber);
    console.log(`🗑️ Conversation history cleared for ${phoneNumber}`);
  }

  /**
   * Clear all conversations
   */
  public clearAll(): void {
    db.exec("DELETE FROM conversations");
    console.log("🗑️ All conversation histories cleared");
  }

  /**
   * Get conversation count for a user
   */
  public getMessageCount(phoneNumber: string): number {
    const stmt = db.prepare(
      "SELECT COUNT(*) as count FROM conversations WHERE phone_number = ?",
    );
    const result = stmt.get(phoneNumber) as { count: number };
    return result.count;
  }

  /**
   * Inject a system notification to all active conversations
   * Used when focus status changes to inform AI about the update
   */
  public injectSystemNotification(notification: string): void {
    // Get all unique phone numbers with active conversations
    const stmt = db.prepare("SELECT DISTINCT phone_number FROM conversations");
    const phoneNumbers = stmt.all() as Array<{ phone_number: string }>;

    // Add system notification to each active conversation
    phoneNumbers.forEach(({ phone_number }) => {
      this.addMessage(
        phone_number,
        "assistant",
        `[SYSTEM NOTIFICATION] ${notification}`,
      );
    });

    console.log(
      `📢 System notification sent to ${phoneNumbers.length} active conversations`,
    );
  }
}

// Export singleton instance
export const memoryService = new MemoryService();
