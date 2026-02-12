import { Request, Response } from "express";
import { whatsappService } from "../services/whatsapp.service";

/**
 * WhatsApp Controller
 * Handles WhatsApp-specific endpoints for QR code, status, and logout
 */

/**
 * GET /whatsapp/qr
 * Get QR code for authentication
 */
export async function getQRCode(_req: Request, res: Response): Promise<void> {
  try {
    const qrImage = await whatsappService.getQRCodeImage();

    if (!qrImage) {
      res.status(404).json({
        success: false,
        message:
          "QR code not available. Either already connected or initializing.",
      });
      return;
    }

    res.json({
      success: true,
      qrCode: qrImage,
    });
  } catch (error: any) {
    console.error("Error getting QR code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get QR code",
      error: error.message,
    });
  }
}

/**
 * GET /whatsapp/status
 * Get WhatsApp connection status
 */
export function getWhatsAppStatus(_req: Request, res: Response): void {
  try {
    const status = whatsappService.getConnectionStatus();

    res.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    console.error("Error getting WhatsApp status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get WhatsApp status",
      error: error.message,
    });
  }
}

/**
 * POST /whatsapp/logout
 * Logout from WhatsApp and destroy session
 */
export async function logoutWhatsApp(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    await whatsappService.logout();

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Error during WhatsApp logout:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout",
      error: error.message,
    });
  }
}
