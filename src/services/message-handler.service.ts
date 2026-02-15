import { WAMessage, whatsappService } from "./whatsapp.service";
import { botStateService } from "./bot-state.service";
import { aiService } from "./ai.service";
import { isWhitelisted, normalizePhoneNumber } from "../config/whitelist";
import {
  getIntroMessage,
  isVIPContact,
  getVIPInfo,
  getVIPAfterHoursMessage,
} from "../config/persona";
import { isSpam, normalizeMessage } from "../utils/message-filter";
import { isAfterHours } from "../utils/time-utils";
import { notificationService } from "./notification.service";

/**
 * Message Handler Service
 * Processes incoming WhatsApp messages
 * Replaces the webhook controller logic for whatsapp-web.js
 */

type UserSessionState = "intro_sent" | "chat_with_farhan" | "chat_with_bot";

// Map<PhoneNumber, SessionState>
// Example: '628123456789@c.us' -> 'intro_sent'

class MessageHandlerService {
  private processedMessages: Set<string> = new Set();
  private afterHoursReplySent: Set<string> = new Set(); // Track VIP contacts who received after-hours reply
  private userSessions: Map<string, UserSessionState> = new Map();
  private choiceMenu: string[] = [
    "1. Chat dengan Farhan (Owner) 👤",
    "\n2. Ngobrol dengan Pampam (AI Assistant) 🤖",
  ];

  public get getChoiceMenu(): string[] {
    return this.choiceMenu;
  }

  public get sizeChoiceMenu(): number {
    return this.choiceMenu.length;
  }

  /**
   * Process incoming WhatsApp message
   */
  public async handleMessage(message: WAMessage): Promise<void> {
    try {
      const messageId = message.id._serialized;

      // Extract phone number - handle both @c.us and @lid formats
      let from = message.from;

      // Try to get actual phone number from message contact
      try {
        const contact = await message.getContact();
        if (contact && contact.number) {
          from = contact.number;
          console.log(`📞 Extracted phone number from contact: ${from}`);
        } else {
          // Fallback: remove @c.us, @lid, etc
          from = from.replace(/@.*$/, "");
          console.log(`📞 Extracted from message.from: ${from}`);
        }
      } catch (error) {
        // If getContact fails, just remove suffix
        from = from.replace(/@.*$/, "");
        console.log(`📞 Fallback extraction: ${from}`);
      }

      const messageBody = message.body;

      console.log(`📨 Incoming message from ${from}: ${messageBody}`);

      // Check for duplicate messages
      if (this.processedMessages.has(messageId)) {
        console.log(`⚠️ Duplicate message detected: ${messageId}`);
        return;
      }

      // Mark message as processed
      this.processedMessages.add(messageId);

      // Clean up old message IDs (keep only last 100)
      if (this.processedMessages.size > 100) {
        const iterator = this.processedMessages.values();
        const firstItem = iterator.next().value;
        if (firstItem) {
          this.processedMessages.delete(firstItem);
        }
      }

      // Ignore messages from groups
      if (message.from.includes("@g.us") || message.from.includes("@g.id")) {
        console.log("⚠️ Ignoring group message");
        return;
      }

      // Ignore messages from self
      if (message.fromMe) {
        console.log("⚠️ Ignoring message from self");
        return;
      }

      // Check if bot is active
      if (!botStateService.isActivated()) {
        console.log("⚠️ Bot is OFF - ignoring message");
        return;
      }

      // Check if sender is whitelisted
      const normalizedFrom = normalizePhoneNumber(from);
      if (!isWhitelisted(normalizedFrom)) {
        console.log(`⚠️ Non-whitelisted number: ${normalizedFrom}`);
        return;
      }

      console.log(`✅ Message from whitelisted number: ${normalizedFrom}`);

      // Check for spam
      const cleanMessage = normalizeMessage(messageBody);
      if (isSpam(cleanMessage)) {
        console.log("⚠️ Spam detected - ignoring");
        await whatsappService.sendMessage(from, "Jangan Spam yaaa 🥲");
        return;
      }

      // --- SESSION MANAGEMENT START ---
      let currentSession = this.userSessions.get(normalizedFrom);

      // Scenario 1: User has NO session (New chat or Reset)
      // Check if we should send intro
      if (
        !currentSession &&
        !botStateService.hasIntroBeenSent(normalizedFrom)
      ) {
        console.log(`📧 Sending intro & menu to ${normalizedFrom}`);

        // Get base intro message
        const baseIntro = getIntroMessage(normalizedFrom);

        // Append Menu Options
        const menuMessage = `${baseIntro}\n\nSilakan pilih menu:\n${this.choiceMenu.join("\n")}`;

        await whatsappService.sendMessage(from, menuMessage);

        // Mark intro as sent in DB and set Session
        botStateService.markIntroSent(normalizedFrom);
        this.userSessions.set(normalizedFrom, "intro_sent");
        return;
      }

      // If user has no session but intro was already sent previously (e.g. restart),
      // we can default to 'chat_with_farhan' OR treat as new session.
      // For now, let's treat as new session to show menu again if they chat after restart.
      if (!currentSession && botStateService.hasIntroBeenSent(normalizedFrom)) {
        // Optional: You could just set them to a default state, but showing menu is safer
        // or just let them fall through to a default if you prefer.
        // Let's perform a "Soft Reset" -> Show menu again.
        console.log(
          `🔄 Session expired for ${normalizedFrom}, showing menu again.`,
        );
        const menuMessage = `Halo lagi! 👋\n\nSilakan pilih menu:\n${this.choiceMenu.join("\n")}`;
        await whatsappService.sendMessage(from, menuMessage);
        this.userSessions.set(normalizedFrom, "intro_sent");
        return;
      }

      // Scenario 2: User is in 'intro_sent' state (Waiting for Menu Selection)
      if (currentSession === "intro_sent") {
        if (cleanMessage === "1") {
          this.userSessions.set(normalizedFrom, "chat_with_farhan");
          await whatsappService.sendMessage(
            from,
            "Oke, pesanmu akan diteruskan ke Farhan. Mohon tunggu balasannya ya! 👤",
          );
          return;
        } else if (cleanMessage === "2") {
          this.userSessions.set(normalizedFrom, "chat_with_bot");
          await whatsappService.sendMessage(
            from,
            "Halo! Aku Pampam, asisten pintarnya Farhan. Yuk ngobrol! 🤖",
          );
          return;
        } else {
          await whatsappService.sendMessage(
            from,
            "Pilihan tidak valid. Silakan ketik 1 atau 2.\n1. Chat dengan Farhan\n2. Ngobrol dengan Bot",
          );
          return;
        }
      }

      // Scenario 3: User is in 'chat_with_farhan' state
      if (currentSession === "chat_with_farhan") {
        // VIP Logic Check
        const isVIP = isVIPContact(normalizedFrom);
        const afterHours = isAfterHours();

        if (isVIP) {
          // VIPs ALWAYS trigger notification
          const vipInfo = getVIPInfo(normalizedFrom);
          const vipName = vipInfo?.name || "kamu";

          // Send special after-hours auto-reply (only after 9 PM, once per session)
          if (afterHours && !this.afterHoursReplySent.has(normalizedFrom)) {
            console.log(
              `🌙 VIP after-hours message detected from ${normalizedFrom}`,
            );
            const afterHoursMessage = getVIPAfterHoursMessage(vipName);
            await whatsappService.sendMessage(from, afterHoursMessage);
            this.afterHoursReplySent.add(normalizedFrom);
          }

          console.log(
            `🚨 Sending urgent notification to Farhan about VIP ${vipName}`,
          );
          await notificationService.sendUrgentNotification(
            vipName,
            messageBody,
          );
        } else {
          // Regular User Logic for 'Chat with Farhan'
          // Here you might want to send a regular notification (not urgent) or just log it
          // For now, let's just log it or maybe use ntfy with lower priority?
          console.log(
            `👤 User ${normalizedFrom} sent message to Farhan: ${messageBody}`,
          );
          // TODO: Implement regular notification if needed
        }

        // NO AI RESPONSE HERE
        return;
      }

      // Scenario 4: User is in 'chat_with_bot' state
      if (currentSession === "chat_with_bot") {
        // 1. VIP Notification (Always ON for VIPs as requested)
        const isVIP = isVIPContact(normalizedFrom);
        if (isVIP) {
          const vipInfo = getVIPInfo(normalizedFrom);
          const vipName = vipInfo?.name || "kamu";
          console.log(
            `🚨 Sending urgent notification to Farhan about VIP ${vipName} (in Bot Mode)`,
          );
          await notificationService.sendUrgentNotification(
            vipName,
            messageBody,
          );
        }

        // 2. AI Processing
        console.log(`🤖 Processing AI response for: ${cleanMessage}`);
        const aiResponse = await aiService.processMessage(
          normalizedFrom,
          cleanMessage,
        );

        // Send AI response
        await whatsappService.sendMessage(from, aiResponse);
        console.log(`✅ Response sent to ${normalizedFrom}`);
      }
    } catch (error: any) {
      console.error("❌ Error handling message:", error.message);
    }
  }

  /**
   * Initialize message handler
   * Registers the handler with WhatsApp service
   */
  public initialize(): void {
    whatsappService.onMessage(async (message: WAMessage) => {
      await this.handleMessage(message);
    });
    console.log("📬 Message handler initialized");
  }
}

// Export singleton instance
export const messageHandlerService = new MessageHandlerService();
