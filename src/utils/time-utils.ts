/**
 * Time Utilities
 * Helper functions for time-based logic with WIB timezone support
 */

/**
 * Get current hour in WIB timezone (UTC+7)
 * @returns Current hour in 24-hour format (0-23)
 */
export function getCurrentHourWIB(): number {
  const now = new Date();

  // Get UTC time
  const utcHours = now.getUTCHours();

  // Convert to WIB (UTC+7)
  let wibHours = utcHours + 7;

  // Handle day rollover
  if (wibHours >= 24) {
    wibHours -= 24;
  }

  return wibHours;
}

/**
 * Check if current time is after hours (after 9 PM WIB)
 * @returns true if current time is >= 21:00 WIB (9 PM)
 */
export function isAfterHours(): boolean {
  // TEMPORARY: Force after-hours mode for testing
  // TODO: Remove this after testing!
  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const start = 21 * 60; // 21:00
  const end = 5 * 60; // 05:00

  return currentMinutes >= start || currentMinutes < end;

  // Original logic (uncomment setelah testing):
  // const currentHour = getCurrentHourWIB();
  // return currentHour >= 21;
}

/**
 * Get current time formatted as HH:MM WIB
 * @returns Formatted time string
 */
export function getCurrentTimeWIB(): string {
  const now = new Date();

  // Get UTC time
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();

  // Convert to WIB (UTC+7)
  let wibHours = utcHours + 7;

  // Handle day rollover
  if (wibHours >= 24) {
    wibHours -= 24;
  }

  // Format with leading zeros
  const hours = String(wibHours).padStart(2, "0");
  const minutes = String(utcMinutes).padStart(2, "0");

  return `${hours}:${minutes} WIB`;
}
