export const CLIENT_FIELD_LIMITS = {
  name: 100,
  pmi: 8,
  phone: 14,
  ssn: 11,
  street: 200,
  postalCode: 10,
} as const;

export function formatUsPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 10) return digits;
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatUsPostalCode(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  return digits.length <= 5 ? digits : `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatUsSsn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function formatPmi(value: string): string {
  return value.replace(/\D/g, '').slice(0, CLIENT_FIELD_LIMITS.pmi);
}

export function isValidUsPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10;
}

export function isValidEmail(value: string, required = false): boolean {
  const normalized = value.trim();
  if (!normalized) return !required;
  return normalized.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function isValidUsPostalCode(value: string): boolean {
  return /^\d{5}(?:-\d{4})?$/.test(value);
}

export function isValidUsSsn(value: string): boolean {
  return /^(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/.test(value);
}

export function isValidPmi(value: string): boolean {
  return /^\d{8}$/.test(value);
}
