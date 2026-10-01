/**
 * Normalizes phone numbers to standard E.164 without leading plus for WhatsApp JIDs
 * Defaults to Indonesia (+62) if leading with '0' or '8'.
 */
export function normalizePhoneNumber(rawNumber: string, defaultCountryCode = '62'): string {
  // Strip all non-digit characters
  let cleaned = rawNumber.replace(/\D/g, '');

  if (!cleaned) {
    throw new Error('Nomor telepon tidak valid atau kosong');
  }

  // If starts with 0, replace with default country code
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
}

/**
 * Returns formatted JID for WhatsApp (e.g. 6281234567890@s.whatsapp.net)
 */
export function toWhatsAppJid(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return `${normalized}@s.whatsapp.net`;
}
