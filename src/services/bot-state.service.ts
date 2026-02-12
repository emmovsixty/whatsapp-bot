/**
 * Bot State Service (Database-backed)
 * Manages bot state with persistent SQLite storage
 */

import { db } from "./database.service";

class BotStateService {
  private isActive: boolean = false;

  /**
   * Turn bot ON
   */
  public turnOn(): void {
    this.isActive = true;

    // Reset intro sent states when turning on
    db.exec("UPDATE bot_states SET intro_sent = 0");

    console.log("🟢 Bot activated - intro state reset");
  }

  /**
   * Turn bot OFF
   */
  public turnOff(): void {
    this.isActive = false;
    console.log("🔴 Bot deactivated");
  }

  /**
   * Check if bot is active
   */
  public isActivated(): boolean {
    return this.isActive;
  }

  /**
   * Check if intro message has been sent to a user
   */
  public hasIntroBeenSent(phoneNumber: string): boolean {
    const stmt = db.prepare(
      "SELECT intro_sent FROM bot_states WHERE phone_number = ?",
    );
    const result = stmt.get(phoneNumber) as { intro_sent: number } | undefined;
    return result?.intro_sent === 1;
  }

  /**
   * Mark intro as sent for a user
   */
  public markIntroSent(phoneNumber: string): void {
    const stmt = db.prepare(`
      INSERT INTO bot_states (phone_number, intro_sent, last_active)
      VALUES (?, 1, ?)
      ON CONFLICT(phone_number) DO UPDATE SET
        intro_sent = 1,
        last_active = ?,
        updated_at = CURRENT_TIMESTAMP
    `);
    const now = Date.now();
    stmt.run(phoneNumber, now, now);
    console.log(`✅ Intro marked as sent for ${phoneNumber}`);
  }

  /**
   * Reset intro state for a specific user
   */
  public resetIntroState(phoneNumber: string): void {
    const stmt = db.prepare(
      "UPDATE bot_states SET intro_sent = 0 WHERE phone_number = ?",
    );
    stmt.run(phoneNumber);
    console.log(`🔄 Intro state reset for ${phoneNumber}`);
  }

  /**
   * Reset all intro states
   */
  public resetAllIntroStates(): void {
    db.exec("UPDATE bot_states SET intro_sent = 0");
    console.log("🔄 All intro states reset");
  }

  /**
   * Update last active timestamp for a user
   */
  public updateLastActive(phoneNumber: string): void {
    const stmt = db.prepare(`
      INSERT INTO bot_states (phone_number, last_active)
      VALUES (?, ?)
      ON CONFLICT(phone_number) DO UPDATE SET
        last_active = ?,
        updated_at = CURRENT_TIMESTAMP
    `);
    const now = Date.now();
    stmt.run(phoneNumber, now, now);
  }

  /**
   * Get all active users (chatted in last 24 hours)
   */
  public getActiveUsers(): string[] {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const stmt = db.prepare(`
      SELECT phone_number 
      FROM bot_states 
      WHERE last_active > ?
      ORDER BY last_active DESC
    `);
    const results = stmt.all(oneDayAgo) as { phone_number: string }[];
    return results.map((r) => r.phone_number);
  }
}

// Export singleton instance
export const botStateService = new BotStateService();
