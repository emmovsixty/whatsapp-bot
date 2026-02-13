import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

/**
 * AI Configuration (supports OpenAI and OpenRouter)
 */
interface AIConfig {
  provider: "openai" | "openrouter";
  apiKey: string;
  model: string;
  baseURL?: string;
  maxTokens: number;
  temperature: number;
}

// Current active configuration
let currentConfig: AIConfig = {
  provider:
    (process.env.AI_PROVIDER as "openai" | "openrouter") || "openrouter",
  apiKey:
    (process.env.AI_PROVIDER === "openai"
      ? process.env.OPENAI_API_KEY
      : process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY) || "",
  model: process.env.OPENAI_MODEL || "meta-llama/llama-3.3-70b-instruct",
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  maxTokens: parseInt(process.env.MAX_TOKENS || "500"),
  temperature: parseFloat(process.env.TEMPERATURE || "0.7"),
};

// OpenAI client instance
let openaiClient: OpenAI;

/**
 * Initialize OpenAI client with current config
 */
function initializeClient(): void {
  const baseURL =
    currentConfig.provider === "openrouter"
      ? "https://openrouter.ai/api/v1"
      : undefined;

  openaiClient = new OpenAI({
    apiKey: currentConfig.apiKey,
    baseURL: baseURL || currentConfig.baseURL,
    defaultHeaders:
      currentConfig.provider === "openrouter"
        ? {
            "HTTP-Referer": "https://github.com/yourusername/pampam-ai",
            "X-Title": "Pampam AI",
          }
        : undefined,
  });
}

// Initialize on startup
initializeClient();

/**
 * Get current OpenAI client
 */
export function getOpenAIClient(): OpenAI {
  return openaiClient;
}

/**
 * Get current AI configuration
 */
export function getAIConfig(): AIConfig {
  return { ...currentConfig };
}

/**
 * Update AI configuration and reinitialize client
 */
export function updateAIConfig(config: Partial<AIConfig>): void {
  // Prevent API key update from client
  const { apiKey, ...safeConfig } = config;

  currentConfig = {
    ...currentConfig,
    ...safeConfig,
    // Always enforce .env API key based on selected provider
    apiKey:
      ((safeConfig.provider || currentConfig.provider) === "openai"
        ? process.env.OPENAI_API_KEY
        : process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY) || "",
  };

  initializeClient();
  console.log("✅ AI configuration updated");
  console.log(`📦 Provider: ${currentConfig.provider}`);
  console.log(`📦 Model: ${currentConfig.model}`);
}

/**
 * Get recommended free models for OpenRouter
 */
export function getFreeModels(): Record<string, string> {
  return {
    "meta-llama/llama-3.3-70b-instruct:free":
      "Meta Llama 3.3 70B (Recommended)",
    "deepseek/deepseek-r1-0528:free": "DeepSeek R1 (Reasoning)",
    "openrouter/free": "Auto-select Free Model",
    "nvidia/nemotron-3-nano-30b-a3b:free": "NVIDIA Nemotron 3 Nano",
  };
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(): void {
  if (!currentConfig.apiKey) {
    throw new Error(
      "AI API key is not set.\n" +
        "For OpenRouter (FREE): Get API key from https://openrouter.ai/keys\n" +
        "For OpenAI: Get API key from https://platform.openai.com/api-keys",
    );
  }

  console.log("✅ AI API configured");
  console.log(`📦 Provider: ${currentConfig.provider}`);
  console.log(`📦 Model: ${currentConfig.model}`);
}

// Export current client (getter for compatibility)
export const openai = getOpenAIClient();
export const OPENAI_CONFIG = getAIConfig();
