import { formatUsPhone } from './client-field-validation';

/** Format a US contact number without treating it as a numeric value (leading zeros matter). */
export function formatContactPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return formatUsPhone(digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits);
}

export function maskContactPhoneInput(event: Event): string {
  const input = event.target as HTMLInputElement;
  const formatted = formatContactPhone(input.value);
  input.value = formatted;
  return formatted;
}

export function isValidContactPhone(value: string, required = false): boolean {
  if (!value.trim()) return !required;
  return /^\(\d{3}\) \d{3}-\d{4}$/.test(value);
}

export function isValidContactEmail(value: string): boolean {
  return !value.trim() || (value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
}
