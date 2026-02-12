import { WAMessage, whatsappService } from "./whatsapp.service";
import { botStateService } from "./bot-state.service";
import { aiService } from "./ai.service";
import { isWhitelisted, normalizePhoneNumber } from "../config/whitelist";
import { getIntroMessage } from "../config/persona";
import { isSpam, normalizeMessage } from "../utils/message-filter";

/**
 * Message Handler Service
 * Processes incoming WhatsApp messages
 * Replaces the webhook controller logic for whatsapp-web.js
 */

class MessageHandlerService {
  private processedMessages: Set<string> = new Set();

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
      if (message.from.includes("@g.us")) {
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
        return;
      }

      // Check if intro has been sent
      if (!botStateService.hasIntroBeenSent(normalizedFrom)) {
        console.log(`📧 Sending intro message to ${normalizedFrom}`);
        const introMessage = getIntroMessage(normalizedFrom); // Pass phone number for VIP detection
        await whatsappService.sendMessage(from, introMessage);
        botStateService.markIntroSent(normalizedFrom);

        // Small delay before processing the actual message
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Process message with AI
      console.log(`🤖 Processing AI response for: ${cleanMessage}`);
      const aiResponse = await aiService.processMessage(
        normalizedFrom,
        cleanMessage,
      );

      // Send AI response
      await whatsappService.sendMessage(from, aiResponse);
      console.log(`✅ Response sent to ${normalizedFrom}`);
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
