import { getCurrentTimeWIB } from "../utils/time-utils";

/**
 * Notification Service
 * Handles urgent push notifications to Farhan via ntfy.sh when VIP contacts send messages
 * Uses ntfy.sh API for real push notifications that can bypass silent mode
 */

class NotificationService {
  private ntfyTopic: string | null = null;
  private ntfyBaseUrl: string = "https://ntfy.sh";

  constructor() {
    // Get ntfy topic from environment
    this.ntfyTopic = process.env.NTFY_TOPIC || null;

    if (!this.ntfyTopic) {
      console.warn(
        "⚠️ NTFY_TOPIC not set in environment variables. Urgent notifications will not be sent.",
      );
    } else {
      console.log(
        `📱 Notification service initialized for ntfy topic: ${this.ntfyTopic}`,
      );
    }
  }

  /**
   * Send urgent push notification to Farhan via ntfy.sh about VIP message
   * @param vipName Name of the VIP contact
   * @param message The message content from VIP
   * @returns true if notification sent successfully
   */
  public async sendUrgentNotification(
    vipName: string,
    message: string,
  ): Promise<boolean> {
    if (!this.ntfyTopic) {
      console.error(
        "❌ Cannot send urgent notification: Ntfy topic not configured",
      );
      return false;
    }

    try {
      const currentTime = getCurrentTimeWIB();

      // Prepare notification message (emoji in body, not headers!)
      const notificationBody = `🚨 URGENT VIP ALERT 🚨

VIP: ${vipName}
Pesan: ${message}
Waktu: ${currentTime}

Silakan segera cek WhatsApp! 💖`;

      const ntfyUrl = `${this.ntfyBaseUrl}/${this.ntfyTopic}`;

      console.log(
        `🚨 Sending urgent push notification via ntfy.sh about ${vipName}`,
      );

      // Send POST request to ntfy.sh
      const response = await fetch(ntfyUrl, {
        method: "POST",
        body: notificationBody,
        headers: {
          Title: "URGENT: VIP Alert", // Plain text, no emoji (emoji causes encoding error)
          Priority: "urgent",
          Tags: "warning,skull,rotating_light",
        },
      });

      if (response.ok) {
        console.log(`✅ Urgent notification sent successfully to ntfy.sh`);
        return true;
      } else {
        console.error(
          `❌ Failed to send notification to ntfy.sh: ${response.status} ${response.statusText}`,
        );
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error sending urgent notification:", error.message);
      return false;
    }
  }

  /**
   * Update ntfy topic (for testing or configuration updates)
   * @param topic New ntfy topic name
   */
  public setNtfyTopic(topic: string): void {
    this.ntfyTopic = topic;
    console.log(`📱 Ntfy topic updated: ${topic}`);
  }

  /**
   * Check if notification service is properly configured
   * @returns true if ntfy topic is set
   */
  public isConfigured(): boolean {
    return this.ntfyTopic !== null;
  }

  /**
   * Send test notification to verify setup
   * @returns true if test notification sent successfully
   */
  public async sendTestNotification(): Promise<boolean> {
    if (!this.ntfyTopic) {
      console.error(
        "❌ Cannot send test notification: Ntfy topic not configured",
      );
      return false;
    }

    try {
      const ntfyUrl = `${this.ntfyBaseUrl}/${this.ntfyTopic}`;

      const response = await fetch(ntfyUrl, {
        method: "POST",
        body: "🧪 Test notification dari WhatsApp bot. Jika kamu menerima ini, setup berhasil! ✅",
        headers: {
          Title: "Test Notification", // Plain text, no emoji
          Priority: "high",
          Tags: "white_check_mark",
        },
      });

      if (response.ok) {
        console.log("✅ Test notification sent successfully");
        return true;
      } else {
        console.error(`❌ Test notification failed: ${response.status}`);
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error sending test notification:", error.message);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
