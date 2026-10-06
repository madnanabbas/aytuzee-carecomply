import {
  formatUsPhone,
  isValidEmail,
  isValidUsPhone,
} from '../../features/clients/models/client-field-validation';

/** Format a US contact number without treating it as numeric; leading zeros matter. */
export function formatContactPhone(value: string): string {
  return formatUsPhone(value);
}

export function maskContactPhoneInput(event: Event): string {
  const input = event.target as HTMLInputElement;
  const formatted = formatContactPhone(input.value);
  input.value = formatted;
  return formatted;
}

export function isValidContactPhone(value: string, required = false): boolean {
  if (!value.trim()) return !required;
  return isValidUsPhone(value);
}

export function isValidContactEmail(value: string): boolean {
  return isValidEmail(value);
}
