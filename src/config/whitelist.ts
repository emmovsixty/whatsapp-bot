/**
 * Whitelist Configuration (Database-backed)
 * Manages allowed phone numbers with persistent storage
 */

import { db } from "../services/database.service";

/**
 * Normalize phone number format (remove +, spaces, dashes)
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\+]/g, "");
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^\d{10,15}$/.test(normalized);
}

/**
 * Get all whitelisted numbers from database
 */
export function getWhitelist(): string[] {
  const stmt = db.prepare(
    "SELECT phone_number FROM whitelist ORDER BY added_at DESC",
  );
  const results = stmt.all() as { phone_number: string }[];
  return results.map((r) => r.phone_number);
}

/**
 * Check if a phone number is whitelisted
 */
export function isWhitelisted(phoneNumber: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);
  const stmt = db.prepare(
    "SELECT phone_number FROM whitelist WHERE phone_number = ?",
  );
  const result = stmt.get(normalized);
  return result !== undefined;
}

/**
 * Set whitelist (replace all existing numbers)
 */
export function setWhitelist(phoneNumbers: string[]): void {
  // Validate all numbers first
  const invalidNumbers = phoneNumbers.filter(
    (num) => !validatePhoneNumber(num),
  );
  if (invalidNumbers.length > 0) {
    throw new Error(`Invalid phone numbers: ${invalidNumbers.join(", ")}`);
  }

  // Normalize all numbers
  const normalizedNumbers = phoneNumbers.map(normalizePhoneNumber);

  // Use transaction for atomic operation
  const transaction = db.transaction(() => {
    // Clear existing whitelist
    db.exec("DELETE FROM whitelist");

    // Insert new numbers
    const insert = db.prepare(
      "INSERT INTO whitelist (phone_number) VALUES (?)",
    );
    for (const number of normalizedNumbers) {
      insert.run(number);
    }
  });

  transaction();
  console.log(`📝 Whitelist updated: ${normalizedNumbers.length} numbers`);
}

/**
 * Add a number to whitelist
 */
export function addToWhitelist(phoneNumber: string): void {
  if (!validatePhoneNumber(phoneNumber)) {
    throw new Error(`Invalid phone number: ${phoneNumber}`);
  }

  const normalized = normalizePhoneNumber(phoneNumber);
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO whitelist (phone_number) VALUES (?)
  `);
  stmt.run(normalized);
  console.log(`✅ Added to whitelist: ${normalized}`);
}

/**
 * Remove a number from whitelist
 */
export function removeFromWhitelist(phoneNumber: string): void {
  const normalized = normalizePhoneNumber(phoneNumber);
  const stmt = db.prepare("DELETE FROM whitelist WHERE phone_number = ?");
  stmt.run(normalized);
  console.log(`❌ Removed from whitelist: ${normalized}`);
}
