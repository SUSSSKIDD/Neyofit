import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Time format types
 */
export type TimeFormat = '12h' | '24h'

/**
 * Convert 24-hour time string to 12-hour format
 * @param time24 - Time in 24-hour format (e.g., "14:30")
 * @returns Time in 12-hour format (e.g., "2:30 PM")
 */
export function time24to12(time24: string): string {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

/**
 * Convert 12-hour time string to 24-hour format
 * @param time12 - Time in 12-hour format (e.g., "2:30 PM")
 * @returns Time in 24-hour format (e.g., "14:30")
 */
export function time12to24(time12: string): string {
  if (!time12) return ''
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return time12 // Already in 24h format or invalid
  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const ampm = match[3].toUpperCase()
  if (ampm === 'PM' && hours !== 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0
  return `${hours.toString().padStart(2, '0')}:${minutes}`
}

/**
 * Format time based on the selected format
 * @param time - Time string (24h format "HH:mm")
 * @param format - Target format ('12h' or '24h')
 * @returns Formatted time string
 */
export function formatTime(time: string, format: TimeFormat): string {
  if (!time) return ''
  if (format === '12h') return time24to12(time)
  return time
}

/**
 * Parse time input to 24-hour format for storage
 * @param time - Time string (can be 12h or 24h format)
 * @returns Time in 24-hour format (HH:mm)
 */
export function parseTimeTo24(time: string): string {
  if (!time) return ''
  // If already in 24h format (HH:mm)
  if (/^\d{2}:\d{2}$/.test(time)) return time
  // Try to parse as 12h format
  return time12to24(time)
}

/**
 * Get default time format from localStorage or system preference
 */
export function getDefaultTimeFormat(): TimeFormat {
  if (typeof window === 'undefined') return '24h'
  const stored = localStorage.getItem('timeFormat') as TimeFormat
  if (stored) return stored
  // Check system locale preference
  return navigator.language.startsWith('en-US') ? '12h' : '24h'
}

/**
 * Save time format preference
 */
export function saveTimeFormat(format: TimeFormat): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('timeFormat', format)
  }
}
