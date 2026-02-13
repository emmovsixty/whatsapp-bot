import { Client, LocalAuth, Message as WAMessage } from "whatsapp-web.js";
import QRCode from "qrcode";
import qrCodeTerminal from "qrcode-terminal";

/**
 * WhatsApp Service using whatsapp-web.js
 * Handles WhatsApp client initialization, QR authentication, and message sending
 */

interface ConnectionStatus {
  connected: boolean;
  ready: boolean;
  phoneNumber?: string;
}

class WhatsAppService {
  private client: Client | null = null;
  private qrCode: string | null = null;
  private isReady: boolean = false;
  private phoneNumber: string | null = null;
  private messageCallback: ((message: WAMessage) => Promise<void>) | null =
    null;

  /**
   * Initialize WhatsApp client with session persistence
   */
  public async initialize(): Promise<void> {
    if (this.client) {
      console.log("⚠️ WhatsApp client already initialized");
      return;
    }

    console.log("🔄 Initializing WhatsApp client...");

    // Initialize client with local authentication (session persistence)
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: process.env.SESSION_PATH || ".wwebjs_auth",
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      },
    });

    // QR Code received - display in terminal and store for web
    this.client.on("qr", (qr: string) => {
      console.log("📱 QR Code received! Scan with your phone:");
      qrCodeTerminal.generate(qr, { small: true });
      this.qrCode = qr;
    });

    // Client is ready
    this.client.on("ready", () => {
      console.log("✅ WhatsApp client is ready!");
      this.isReady = true;
      this.qrCode = null;

      // Get phone number if available
      if (this.client && this.client.info) {
        try {
          const wid = this.client.info.wid._serialized;
          this.phoneNumber = wid.split("@")[0];
          console.log(`📞 Connected as: ${this.phoneNumber}`);
        } catch (error) {
          console.log("📞 WhatsApp connected (number unavailable)");
        }
      }
    });

    // Client authenticated
    this.client.on("authenticated", () => {
      console.log("🔐 WhatsApp authenticated!");
    });

    // Authentication failure
    this.client.on("auth_failure", (msg: string) => {
      console.error("❌ Authentication failed:", msg);
      this.qrCode = null;
    });

    // Client disconnected
    this.client.on("disconnected", (reason: string) => {
      console.log("🔌 WhatsApp disconnected:", reason);
      this.isReady = false;
      this.phoneNumber = null;
      this.qrCode = null;
    });

    // State changes (more reliable than 'disconnected' event for logout detection)
    this.client.on("change_state", (state: string) => {
      console.log(`🔄 WhatsApp state changed: ${state}`);
      if (state !== "CONNECTED") {
        this.isReady = false;
        this.phoneNumber = null;
        this.qrCode = null;
        console.log("⚠️ Auto-detected disconnect via state change");
      }
    });

    // Incoming messages
    this.client.on("message", async (message: WAMessage) => {
      if (this.messageCallback) {
        await this.messageCallback(message);
      }
    });

    // Initialize the client
    await this.client.initialize();
  }

  /**
   * Register callback for incoming messages
   */
  public onMessage(callback: (message: WAMessage) => Promise<void>): void {
    this.messageCallback = callback;
  }

  /**
   * Get QR code as base64 image for web display
   */
  public async getQRCodeImage(): Promise<string | null> {
    if (!this.qrCode) {
      return null;
    }

    try {
      // Generate QR code as base64 data URL
      const qrImage = await QRCode.toDataURL(this.qrCode);
      return qrImage;
    } catch (error) {
      console.error("Error generating QR code image:", error);
      return null;
    }
  }

  /**
   * Get raw QR code string
   */
  public getQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * Check if client is ready
   */
  public isClientReady(): boolean {
    return this.isReady;
  }

  /**
   * Get connection status
   */
  public async getConnectionStatus(): Promise<ConnectionStatus> {
    // Verify actual connection state instead of just relying on cached flag
    // This fixes the issue where 'disconnected' event doesn't fire when unlinking from phone
    let actuallyConnected = this.isReady;

    if (this.client && this.isReady) {
      try {
        // Use getState() to check actual connection state (not cached)
        // Possible states: CONFLICT, CONNECTED, DEPRECATED_VERSION, OPENING, PAIRING, PROXYBLOCK, SMB_TOS_BLOCK, TIMEOUT, TOS_BLOCK, UNLAUNCHED, UNPAIRED, UNPAIRED_IDLE
        const state = await this.client.getState();

        if (state !== "CONNECTED") {
          actuallyConnected = false;
          this.isReady = false;
          this.phoneNumber = null;
          console.log(
            `⚠️ Detected disconnect (state: ${state}), updating status`,
          );
        }
      } catch (error) {
        // Error accessing client state means disconnected
        actuallyConnected = false;
        this.isReady = false;
        this.phoneNumber = null;
        console.log(
          "⚠️ Detected disconnect (error accessing state), updating status",
        );
      }
    }

    return {
      connected: actuallyConnected,
      ready: actuallyConnected,
      phoneNumber: this.phoneNumber || undefined,
    };
  }

  /**
   * Send message to a WhatsApp number
   */
  public async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.client || !this.isReady) {
      console.error("❌ WhatsApp client is not ready");
      return false;
    }

    try {
      // Format phone number (ensure it has @c.us suffix)
      const chatId = to.includes("@") ? to : `${to}@c.us`;

      await this.client.sendMessage(chatId, message);
      console.log(`✅ Message sent to ${to}`);
      return true;
    } catch (error: any) {
      console.error("❌ Error sending message:", error.message);
      return false;
    }
  }

  /**
   * Logout and destroy session
   */
  public async logout(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.logout();
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      this.phoneNumber = null;
      this.qrCode = null;
      console.log("👋 Logged out from WhatsApp");
    } catch (error: any) {
      console.error("Error during logout:", error.message);
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
export type { WAMessage };
