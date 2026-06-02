// src/utils/dateFormat.js
// Global date formatting utility for frontend

/**
 * Format a date as DD/MM/YYYY or DD/MM/YYYY HH:MM AM/PM
 * @param {string|Date} date - The date to format
 * @param {boolean} showTime - Whether to include time (default: false)
 * @returns {string}
 */
export function formatDate(date, showTime = false) {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let formatted = `${day}/${month}/${year}`;
  if (showTime) {
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    formatted += ` ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  }
  return formatted;
}
