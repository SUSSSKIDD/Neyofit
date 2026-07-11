/**
 * Normalize phone number: strip non-digits, keep last 10 digits.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}
