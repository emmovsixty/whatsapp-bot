import { getOpenAIClient, getAIConfig } from "../config/openai";
import { getSystemPrompt } from "../config/persona";
import { memoryService } from "./memory.service";

/**
 * AI Service
 * Handles AI API integration and response generation
 */

class AIService {
  /**
   * Generate AI response based on user message and conversation history
   */
  public async generateResponse(
    phoneNumber: string,
    userMessage: string,
  ): Promise<string> {
    try {
      // Get conversation history from memory service
      const history = memoryService.getHistory(phoneNumber);

      // Get system prompt based on contact type (VIP or regular)
      const systemPrompt = getSystemPrompt(phoneNumber);

      // Build messages array for AI
      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMessage },
      ];

      console.log(
        `🤖 Generating AI response for ${phoneNumber} with ${history.length} previous messages`,
      );

      // Get current AI client and config
      const aiClient = getOpenAIClient();
      const aiConfig = getAIConfig();

      // Call AI API
      const completion = await aiClient.chat.completions.create({
        model: aiConfig.model,
        messages: messages,
        max_tokens: aiConfig.maxTokens,
        temperature: aiConfig.temperature,
      });

      let aiResponse =
        completion.choices[0]?.message?.content?.trim() ||
        "Maaf, aku lagi bingung nih 🤔";

      // Add AI prefix to distinguish from human
      aiResponse = `🤖 ${aiResponse}`;

      console.log(
        `✅ AI response generated (${completion.usage?.total_tokens} tokens used)`,
      );

      return aiResponse;
    } catch (error: any) {
      console.error("❌ Error generating AI response:", error.message);

      // Return friendly error message
      if (error.code === "insufficient_quota") {
        return "Maaf, lagi ada masalah teknis nih. Coba lagi nanti ya 🙏";
      }

      return "Waduh, aku lagi error nih. Bisa ulangi lagi ga? 😅";
    }
  }

  /**
   * Process incoming message and generate response
   * This method handles the full flow: add to memory, generate, and save response
   */
  public async processMessage(
    phoneNumber: string,
    userMessage: string,
  ): Promise<string> {
    // Add user message to memory
    memoryService.addUserMessage(phoneNumber, userMessage);

    // Generate AI response
    const aiResponse = await this.generateResponse(phoneNumber, userMessage);

    // Add AI response to memory
    memoryService.addAssistantMessage(phoneNumber, aiResponse);

    return aiResponse;
  }
}

// Export singleton instance
export const aiService = new AIService();
