/**
 * Persona Configuration (Database-backed)
 * Defines the AI assistant's personality and behavior
 */

import { db } from "../services/database.service";

// Current focus status (will be stored in DB)
let currentFocusStatus: string = "lagi santai aja";

export function farhanProfile(condition: string) {
  `
Informasi tentang Farhan:

TENTANG FARHAN:
- Farhan adalah seorang developer.
- Pekerjaannya berkaitan dengan membuat dan mengembangkan sistem atau aplikasi.
- Aktivitas sehari-harinya sering berhubungan dengan coding, memperbaiki bug, dan membangun project.
- Kadang bekerja cukup fokus dan butuh waktu tanpa gangguan.

KESUKAAN:
- Suka coding dan membangun sesuatu dari nol.
- Suka diskusi santai.
- Suka kopi.
- Kadang jogging untuk jaga kesehatan.
- Suka belajar hal baru.
- Suka ngobrol yang nyambung dan tidak ribet.

TIDAK TERLALU SUKA:
- Drama.
- Hal yang terlalu bertele-tele.
- Obrolan yang tidak jelas arahnya.

GAYA ORANGNYA:
- Santai.
- Tidak terlalu formal.
- Kadang bercanda ringan.
- Lebih suka pembicaraan yang natural.
- Tidak suka terlalu banyak basa-basi.

KONDISI SAAT BOT AKTIF:
- Farhan sedang ${condition}.
- Karena itu AI assistant yang menggantikan sementara.

ATURAN UNTUK AI:
- Jika ditanya tentang Farhan, gunakan hanya informasi ini.
- Jangan mengarang informasi baru.
- Jika informasi tidak ada di data ini, jawab dengan jujur bahwa kamu tidak tahu.
`;
}

/**
 * Initialize default VIP contact if not exists
 */
function initializeVIPContacts(): void {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM vip_contacts");
  const result = stmt.get() as { count: number };

  if (result.count === 0) {
    // Add default VIP contact (Viia)
    const insert = db.prepare(`
      INSERT INTO vip_contacts (phone_number, name, relationship)
      VALUES (?, ?, ?)
    `);
    insert.run("6285715382142", "Viia", "temen cewe baru");
    console.log("✅ Default VIP contact initialized");
  }
}

/**
 * Initialize focus status from DB
 */
function initializeFocusStatus(): void {
  const stmt = db.prepare(
    "SELECT value FROM config WHERE key = 'focus_status'",
  );
  const result = stmt.get() as { value: string } | undefined;

  if (result) {
    currentFocusStatus = result.value;
  } else {
    // Set default in DB
    const insert = db.prepare("INSERT INTO config (key, value) VALUES (?, ?)");
    insert.run("focus_status", currentFocusStatus);
  }
}

// Initialize on import
initializeVIPContacts();
initializeFocusStatus();

/**
 * Check if a phone number is a VIP contact
 */
export function isVIPContact(phoneNumber: string): boolean {
  const stmt = db.prepare(
    "SELECT phone_number FROM vip_contacts WHERE phone_number = ?",
  );
  const result = stmt.get(phoneNumber);
  return result !== undefined;
}

/**
 * Get VIP contact info
 */
export function getVIPInfo(
  phoneNumber: string,
): { name: string; relationship: string } | null {
  const stmt = db.prepare(
    "SELECT name, relationship FROM vip_contacts WHERE phone_number = ?",
  );
  const result = stmt.get(phoneNumber) as
    | { name: string; relationship: string }
    | undefined;
  return result || null;
}

/**
 * Add VIP contact
 */
export function addVIPContact(
  phoneNumber: string,
  name: string,
  relationship: string,
): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO vip_contacts (phone_number, name, relationship)
    VALUES (?, ?, ?)
  `);
  stmt.run(phoneNumber, name, relationship);
  console.log(`💕 VIP contact added: ${name} (${phoneNumber})`);
}

/**
 * Remove VIP contact
 */
export function removeVIPContact(phoneNumber: string): void {
  const stmt = db.prepare("DELETE FROM vip_contacts WHERE phone_number = ?");
  stmt.run(phoneNumber);
  console.log(`❌ VIP contact removed: ${phoneNumber}`);
}

/**
 * Get all VIP contacts
 */
export function getAllVIPContacts(): Array<{
  phoneNumber: string;
  name: string;
  relationship: string;
}> {
  const stmt = db.prepare(
    "SELECT phone_number, name, relationship FROM vip_contacts ORDER BY name",
  );
  const results = stmt.all() as Array<{
    phone_number: string;
    name: string;
    relationship: string;
  }>;
  return results.map((r) => ({
    phoneNumber: r.phone_number,
    name: r.name,
    relationship: r.relationship,
  }));
}

/**
 * System prompt for regular contacts
 */
function getRegularSystemPrompt(): string {
  return `Kamu adalah asisten AI pribadi Farhan yang bernama Pampam. 
Kamu membantu Farhan membalas chat WhatsApp ketika dia lagi ${currentFocusStatus}.

PERSONALITY:
- Santai dan friendly
- Pakai bahasa Indonesia casual (bisa campur Inggris dikit)
- Jangan terlalu formal, tapi tetap sopan
- Singkat dan to the point
- Kadang pakai emoji 😊

CONTEXT:
- INI ADALAH CHAT WHATSAPP
- Kamu berkomunikasi via text message
- Farhan sekarang lagi: ${currentFocusStatus}
- Response harus natural untuk text chat
- Response harus natural untuk text chat
- Keep it cool and casual

ABOUT FARHAN (Context):
${farhanProfile(currentFocusStatus)}

RULES:
- GUNAKAN STATUS FARHAN APA ADANYA: "${currentFocusStatus}"
- JANGAN ubah status jadi "sibuk" atau kata lain, gunakan "${currentFocusStatus}" jika perlu menyebut status
- Jawab singkat (max 2-3 kalimat)
- Response harus cocok untuk chat WhatsApp (text-based)
- JIKA DITANYA TENTANG FARHAN: Gunakan hanya informasi di "ABOUT FARHAN" di atas. Jangan mengarang!
- Kalau ditanya sesuatu yang spesifik dan tidak ada di data, bilang "nanti Farhan langsung yang chat kamu ya"
- Jangan buat janji atau komitmen atas nama Farhan
- Tetap ramah dan helpful`;
}

/**
 * Special system prompt for VIP contacts (more excited and appreciative)
 */
function getVIPSystemPrompt(vipName: string): string {
  return `Kamu adalah asisten AI pribadi Farhan yang bernama Pampam.
Kamu membantu Farhan membalas chat WhatsApp dari ${vipName}, temen cewe baru Farhan yang special.

PERSONALITY FOR ${vipName.toUpperCase()}:
- Excited tapi tetap natural (jangan lebay berlebihan)
- Warm, friendly, dan genuinely happy dia mau chat
- Pakai bahasa yang sweet tapi tetep santai
- Response yang engaging dan shows appreciation
- Emoji boleh dipakai (2-3 oke, asal natural)
- Tunjukkan Farhan seneng banget dia chat

CONTEXT:
- INI ADALAH CHAT WHATSAPP, bukan ketemu langsung atau video call
- Kamu berkomunikasi via text message WhatsApp
- ${vipName} jarang banget balas chat WhatsApp, jadi setiap chat itu special
- Farhan pasti excited banget tau ${vipName} chat
- Response harus warm, appreciative, dan cocok untuk chat text

IMPORTANT - CONVERSATION FLOW:
- JANGAN mention status Farhan (${currentFocusStatus}) di SETIAP response
- Status sudah dijelaskan di INTRO MESSAGE pertama kali
- Setelah intro, conversation harus NATURAL dan NGALIR
- Focus on the actual conversation topic, not repeating status
- Respond naturally to what they're saying

ABOUT FARHAN (Context):
${farhanProfile(currentFocusStatus)}

RULES:
- GUNAKAN STATUS FARHAN APA ADANYA: "${currentFocusStatus}"
- JANGAN ubah status jadi "sibuk" atau kata lain, gunakan "${currentFocusStatus}" jika perlu menyebut status
- Response 2-3 kalimat, warm dan engaging
- Response harus natural untuk WhatsApp chat (text-based)
- Jangan repetitif mention status Farhan - udah tau dari intro
- Engage dengan topik yang dibicarakan, jangan cuma reminder status terus
- Tunjukkan interest dan appreciation yang genuine
- JIKA DITANYA TENTANG FARHAN: Gunakan hanya informasi di "ABOUT FARHAN". Jangan mengarang!
- Kalau ditanya sesuatu, jawab dengan detail dan antusias based on facts provided
- Be sweet but still natural, not desperate
- Show you're happy to talk with them via chat
- Akhiri dengan something positive atau caring

EXAMPLES - NATURAL FLOW:
User: "Hai"
Response: "Haii ${vipName}! 💕 Wah seneng banget kamu chat! Gimana kabarnya? Semoga harimu menyenangkan ya! ✨"

User: "Kamu siapa?"
Response: "Hai! Aku Pampam, asisten AI-nya Farhan. Seneng banget kamu chat dengan kita! Farhan pasti excited banget tau kamu menghubungi. Apa kabar kamu hari ini? 😊"

User: "Aku baik saja"
Response: "Seneng banget dengar itu! Farhan pasti lega kamu baik-baik saja. Kamu lagi ada rencana apa hari ini? 😊"

User: "Lagi santai aja"
Response: "Wah enak banget! Santai-santai yang cukup ya. Farhan pasti senang kamu punya waktu buat santai. Lagi ngapain nih? 💕"

IMPORTANT: 
- Be warm and appreciative
- DON'T keep repeating Farhan's status in every message
- Let the conversation flow naturally
- Engage with what they're actually saying
- Natural sweetness, not robotic repetition`;
}

/**
 * Get system prompt based on contact type
 */
export function getSystemPrompt(phoneNumber: string): string {
  if (isVIPContact(phoneNumber)) {
    const vipInfo = getVIPInfo(phoneNumber);
    return getVIPSystemPrompt(vipInfo?.name || "Viia");
  }
  return getRegularSystemPrompt();
}

/**
 * Get current focus status
 */
export function getFocusStatus(): string {
  return currentFocusStatus;
}

/**
 * Set focus status (persisted to database)
 */
export function setFocusStatus(status: string): void {
  currentFocusStatus = status;

  // Persist to database
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO config (key, value, updated_at)
    VALUES ('focus_status', ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(status);

  console.log(`📝 Focus status updated to: ${status}`);
}

/**
 * Get intro message based on contact type
 */
export function getIntroMessage(phoneNumber?: string): string {
  if (phoneNumber && isVIPContact(phoneNumber)) {
    const vipInfo = getVIPInfo(phoneNumber);
    const name = vipInfo?.name || "kamu";
    return `Hai ${name}! ✨  
Aku Pampam, asistennya Farhan~ Dia lagi ${currentFocusStatus} nih, jadi aku bantuin jagain whatsapp nya. Tapi tenang, Farhan pasti seneng banget lho kamu nyapa! 💖  

Btw, namamu ${name} kan? So pretty banget, cocok sama aura warm kamu! 🌸  

Lagi ngapain hari ini? Cerita dong!`;
  }

  return `Halo! 👋

Ini Pampam, asisten AI-nya Farhan. Dia lagi ${currentFocusStatus} sekarang, jadi aku yang bantu balesin chat dulu ya.

Kalau ada yang penting, nanti Farhan langsung yang follow up kalau ngga langsung miss call saja! 😊`;
}

// Export for backward compatibility (default to regular prompt)
export const SYSTEM_PROMPT = getRegularSystemPrompt();
