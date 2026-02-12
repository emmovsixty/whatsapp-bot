import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import {
  turnOnBot,
  turnOffBot,
  getBotStatus,
  getCurrentFocusStatus,
  updateFocusStatus,
  getWhitelistNumbers,
  updateWhitelistNumbers,
  getAIConfiguration,
  updateAIConfiguration,
  getVIPContacts,
  addVIPContactEndpoint,
  removeVIPContactEndpoint,
} from "./controllers/bot.controller";
import {
  getQRCode,
  getWhatsAppStatus,
  logoutWhatsApp,
} from "./controllers/whatsapp.controller";
import { validateAIConfig } from "./config/openai";
import { whatsappService } from "./services/whatsapp.service";
import { messageHandlerService } from "./services/message-handler.service";

// Load environment variables
dotenv.config();

/**
 * Express Application Setup
 */
const app: Application = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware
 */
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, "../public"))); // Serve static files

/**
 * Request logging middleware
 */
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Pampam AI - WhatsApp Bot",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * WhatsApp routes
 */
app.get("/whatsapp/qr", getQRCode); // Get QR code
app.get("/whatsapp/status", getWhatsAppStatus); // Get connection status
app.post("/whatsapp/logout", logoutWhatsApp); // Logout

/**
 * Bot control routes
 */
app.post("/bot/on", turnOnBot); // Activate bot
app.post("/bot/off", turnOffBot); // Deactivate bot
app.get("/bot/status", getBotStatus); // Get bot status
app.get("/bot/focus-status", getCurrentFocusStatus); // Get focus status
app.post("/bot/focus-status", updateFocusStatus); // Update focus status
app.get("/bot/whitelist", getWhitelistNumbers); // Get whitelist
app.post("/bot/whitelist", updateWhitelistNumbers); // Update whitelist
app.get("/bot/ai-config", getAIConfiguration); // Get AI config
app.post("/bot/ai-config", updateAIConfiguration); // Update AI config
app.get("/bot/vip-contacts", getVIPContacts); // Get VIP contacts
app.post("/bot/vip-contacts", addVIPContactEndpoint); // Add VIP contact
app.delete("/bot/vip-contacts/:phoneNumber", removeVIPContactEndpoint); // Remove VIP contact

/**
 * Dashboard route
 */
app.get("/dashboard", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

/**
 * Global error handler
 */
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Unhandled error:", error);
  res.status(500).json({
    error: "Internal Server Error",
    message: error.message,
  });
});

/**
 * Start server
 */
export async function startServer(): Promise<void> {
  try {
    // Validate configurations
    validateAIConfig();

    // Initialize WhatsApp service
    console.log("🔄 Initializing WhatsApp service...");
    await whatsappService.initialize();

    // Initialize message handler
    messageHandlerService.initialize();

    app.listen(PORT, () => {
      console.log("🚀 Pampam AI WhatsApp Bot started!");
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard`);
      console.log(`📱 Scan QR code in dashboard to connect WhatsApp`);
      console.log(
        `🎮 Bot controls: POST /bot/on | POST /bot/off | GET /bot/status`,
      );
      console.log("⏳ Bot is currently OFF - use dashboard or API to activate");
    });
  } catch (error: any) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

export default app;
