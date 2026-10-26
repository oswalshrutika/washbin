/** Normalises an Indian mobile number to "91XXXXXXXXXX", or returns null if it isn't one. */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^0+/, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `91${local}` : null;
}

export function formatPhone(normalized: string): string {
  const local = normalized.slice(2);
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

/** Shows only the last 4 digits, for places where the full number shouldn't be visible. */
export function maskPhone(normalized: string): string {
  return `+91 ••••• •${normalized.slice(-4)}`;
}
