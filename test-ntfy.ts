/**
 * Test Ntfy.sh Notification
 * Quick script to test if ntfy.sh notification is working
 *
 * Usage:
 *   npx ts-node test-ntfy.ts
 */

import { notificationService } from "./src/services/notification.service";

async function testNotification() {
  console.log("🧪 Testing ntfy.sh notification service...\n");

  // Check if configured
  if (!notificationService.isConfigured()) {
    console.error("❌ NTFY_TOPIC not set in .env file!");
    console.log("\n📝 Steps to fix:");
    console.log("1. Copy .env.example to .env");
    console.log("2. Set NTFY_TOPIC=farhan-vip-whatsapp (or your topic)");
    console.log("3. Run this script again\n");
    process.exit(1);
  }

  console.log("✅ Notification service configured\n");
  console.log("📱 Sending test notification...");

  // Send test notification
  const success = await notificationService.sendTestNotification();

  if (success) {
    console.log("\n✅ Test notification sent successfully!");
    console.log("\n📱 Check your phone:");
    console.log("   - Open ntfy app");
    console.log('   - You should see: "🧪 Test Notification"');
    console.log("   - If you see it, setup is correct! 🎉\n");
  } else {
    console.log("\n❌ Failed to send test notification");
    console.log("\n🐛 Troubleshooting:");
    console.log("1. Check your internet connection");
    console.log("2. Verify NTFY_TOPIC in .env is correct");
    console.log("3. Check if ntfy.sh is accessible\n");
    process.exit(1);
  }
}

// Run test
testNotification().catch((error) => {
  console.error("❌ Error running test:", error.message);
  process.exit(1);
});
