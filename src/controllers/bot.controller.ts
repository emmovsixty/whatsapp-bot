import { Request, Response } from "express";
import { botStateService } from "../services/bot-state.service";
import { getFocusStatus, setFocusStatus } from "../config/persona";
import {
  getWhitelist,
  setWhitelist,
  normalizePhoneNumber,
} from "../config/whitelist";
import { getAIConfig, updateAIConfig, getFreeModels } from "../config/openai";
import {
  getAllVIPContacts,
  addVIPContact,
  removeVIPContact,
} from "../config/persona";

/**
 * Bot Controller
 * Handles bot state management API endpoints
 */

/**
 * POST /bot/on
 * Turn bot ON
 */
export function turnOnBot(_req: Request, res: Response): void {
  try {
    botStateService.turnOn();

    res.json({
      success: true,
      message: "Bot activated",
      active: true,
    });
  } catch (error: any) {
    console.error("Error turning on bot:", error);
    res.status(500).json({
      success: false,
      message: "Failed to turn on bot",
      error: error.message,
    });
  }
}

/**
 * POST /bot/off
 * Turn bot OFF
 */
export function turnOffBot(_req: Request, res: Response): void {
  try {
    botStateService.turnOff();

    res.json({
      success: true,
      message: "Bot deactivated",
      active: false,
    });
  } catch (error: any) {
    console.error("Error turning off bot:", error);
    res.status(500).json({
      success: false,
      message: "Failed to turn off bot",
      error: error.message,
    });
  }
}

/**
 * GET /bot/status
 * Get bot status
 */
export function getBotStatus(_req: Request, res: Response): void {
  try {
    const active = botStateService.isActivated();

    res.json({
      success: true,
      active: active,
    });
  } catch (error: any) {
    console.error("Error getting bot status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bot status",
      error: error.message,
    });
  }
}

/**
 * GET /bot/focus-status
 * Get current focus status
 */
export function getCurrentFocusStatus(_req: Request, res: Response): void {
  try {
    const status = getFocusStatus();

    res.json({
      success: true,
      focusStatus: status,
    });
  } catch (error: any) {
    console.error("Error getting focus status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get focus status",
      error: error.message,
    });
  }
}

/**
 * POST /bot/focus-status
 * Update focus status
 */
export function updateFocusStatus(req: Request, res: Response): void {
  try {
    const { focusStatus: status } = req.body;

    if (!status || typeof status !== "string") {
      res.status(400).json({
        success: false,
        message: "Focus status is required and must be a string",
      });
      return;
    }

    setFocusStatus(status);

    res.json({
      success: true,
      message: "Focus status updated successfully",
      focusStatus: status,
    });
  } catch (error: any) {
    console.error("Error updating focus status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update focus status",
      error: error.message,
    });
  }
}

/**
 * GET /bot/whitelist
 * Get whitelist numbers
 */
export function getWhitelistNumbers(_req: Request, res: Response): void {
  try {
    const whitelist = getWhitelist();

    res.json({
      success: true,
      whitelist: whitelist,
      count: whitelist.length,
    });
  } catch (error: any) {
    console.error("Error getting whitelist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get whitelist",
      error: error.message,
    });
  }
}

/**
 * POST /bot/whitelist
 * Update whitelist numbers
 */
export function updateWhitelistNumbers(req: Request, res: Response): void {
  try {
    const { numbers } = req.body;

    if (!Array.isArray(numbers)) {
      res.status(400).json({
        success: false,
        message: "Numbers must be an array",
      });
      return;
    }

    // Clean and normalize numbers
    const cleanedNumbers = numbers
      .map((num) => String(num).trim())
      .filter((num) => num.length > 0)
      .map((num) => normalizePhoneNumber(num));

    // Remove duplicates
    const uniqueNumbers = [...new Set(cleanedNumbers)];

    // Validate format
    const invalidNumbers = uniqueNumbers.filter(
      (num) => !/^\d{10,15}$/.test(num),
    );
    if (invalidNumbers.length > 0) {
      res.status(400).json({
        success: false,
        message: "Invalid phone number format",
        invalidNumbers: invalidNumbers,
      });
      return;
    }

    // Update whitelist
    setWhitelist(cleanedNumbers);

    // Success response
    res.json({
      success: true,
      message: "Whitelist updated successfully",
      numbers: cleanedNumbers,
      count: cleanedNumbers.length,
    });
  } catch (error: any) {
    console.error("Error updating whitelist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update whitelist",
      error: error.message,
    });
  }
}

/**
 * GET /bot/ai-config
 * Get AI configuration
 */
export function getAIConfiguration(_req: Request, res: Response): void {
  try {
    const config = getAIConfig();
    const freeModels = getFreeModels();

    res.json({
      success: true,
      config: {
        provider: config.provider,
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
      },
      freeModels: freeModels,
    });
  } catch (error: any) {
    console.error("Error getting AI config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI configuration",
      error: error.message,
    });
  }
}

/**
 * POST /bot/ai-config
 * Update AI configuration
 */
export function updateAIConfiguration(req: Request, res: Response): void {
  try {
    const { provider, model, maxTokens, temperature } = req.body;

    // Validate provider
    if (provider && !["openai", "openrouter"].includes(provider)) {
      res.status(400).json({
        success: false,
        message: "Provider must be 'openai' or 'openrouter'",
      });
      return;
    }

    // Build update object
    const updates: any = {};
    if (provider) updates.provider = provider;
    if (model) updates.model = model;
    // API Key is managed via .env only
    if (maxTokens) updates.maxTokens = parseInt(maxTokens);
    if (temperature !== undefined)
      updates.temperature = parseFloat(temperature);

    // Update configuration
    updateAIConfig(updates);

    const newConfig = getAIConfig();

    res.json({
      success: true,
      message: "AI configuration updated successfully",
      config: {
        provider: newConfig.provider,
        model: newConfig.model,
        maxTokens: newConfig.maxTokens,
        temperature: newConfig.temperature,
      },
    });
  } catch (error: any) {
    console.error("Error updating AI config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update AI configuration",
      error: error.message,
    });
  }
}

/**
 * GET /bot/vip-contacts
 * Get all VIP contacts
 */
export function getVIPContacts(_req: Request, res: Response): void {
  try {
    const vipContacts = getAllVIPContacts();

    res.json({
      success: true,
      vipContacts: vipContacts,
      count: vipContacts.length,
    });
  } catch (error: any) {
    console.error("Error getting VIP contacts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get VIP contacts",
      error: error.message,
    });
  }
}

/**
 * POST /bot/vip-contacts
 * Add a new VIP contact
 */
export function addVIPContactEndpoint(req: Request, res: Response): void {
  try {
    const { phoneNumber, name, relationship } = req.body;

    // Validate inputs
    if (!phoneNumber || !name) {
      res.status(400).json({
        success: false,
        message: "Phone number and name are required",
      });
      return;
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Validate phone format
    if (!/^\d{10,15}$/.test(normalizedPhone)) {
      res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
      return;
    }

    // Add VIP contact
    addVIPContact(normalizedPhone, name, relationship || "");

    res.json({
      success: true,
      message: "VIP contact added successfully",
      vipContact: {
        phoneNumber: normalizedPhone,
        name: name,
        relationship: relationship || "",
      },
    });
  } catch (error: any) {
    console.error("Error adding VIP contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add VIP contact",
      error: error.message,
    });
  }
}

/**
 * DELETE /bot/vip-contacts/:phoneNumber
 * Remove a VIP contact
 */
export function removeVIPContactEndpoint(req: Request, res: Response): void {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
      res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
      return;
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Remove VIP contact
    removeVIPContact(normalizedPhone);

    res.json({
      success: true,
      message: "VIP contact removed successfully",
      phoneNumber: normalizedPhone,
    });
  } catch (error: any) {
    console.error("Error removing VIP contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove VIP contact",
      error: error.message,
    });
  }
}
