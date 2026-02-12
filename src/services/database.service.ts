/**
 * Database Service
 * Manages SQLite database for persistent storage
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dataDir, "pampam.db");
const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

/**
 * Initialize database schema
 */
export function initializeDatabase(): void {
  console.log("📦 Initializing database...");

  // Conversations table - stores message history
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Index for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_conversations_phone 
    ON conversations(phone_number, timestamp DESC)
  `);

  // Bot states table - tracks intro sent status
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_states (
      phone_number TEXT PRIMARY KEY,
      intro_sent INTEGER DEFAULT 0,
      last_active INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Whitelist table
  db.exec(`
    CREATE TABLE IF NOT EXISTS whitelist (
      phone_number TEXT PRIMARY KEY,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // VIP contacts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vip_contacts (
      phone_number TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      relationship TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Config table - key-value store for settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Database initialized");
}

/**
 * Get database instance
 */
function getDatabase(): Database.Database {
  return db;
}

/**
 * Close database connection
 */
function closeDatabase(): void {
  db.close();
  console.log("🔒 Database connection closed");
}

// Initialize on import
initializeDatabase();

// Export database and utility functions
export { db, getDatabase, closeDatabase };
