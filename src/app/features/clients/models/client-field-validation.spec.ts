import {
  formatPmi,
  formatUsPhone,
  formatUsPostalCode,
  formatUsSsn,
  isValidPmi,
  isValidEmail,
  isValidUsPhone,
  isValidUsPostalCode,
  isValidUsSsn,
} from './client-field-validation';

describe('client field validation', () => {
  it('normalizes and validates Minnesota eight-digit PMI numbers', () => {
    expect(formatPmi('24 591-384 abc')).toBe('24591384');
    expect(isValidPmi('24591384')).toBe(true);
    expect(isValidPmi('2459138')).toBe(false);
  });

  it('accepts exactly ten US phone digits and rejects country-code or incomplete values', () => {
    expect(formatUsPhone('6125550142')).toBe('(612) 555-0142');
    expect(formatUsPhone('+1 612 555 0142')).toBe('16125550142');
    expect(isValidUsPhone('(612) 555-0142')).toBe(true);
    expect(isValidUsPhone('+1 612 555 0142')).toBe(false);
    expect(isValidUsPhone('612-555')).toBe(false);
    expect(isValidUsPhone('612555014299')).toBe(false);
  });

  it('validates optional email addresses consistently', () => {
    expect(isValidEmail('person@example.com')).toBe(true);
    expect(isValidEmail('not an email')).toBe(false);
    expect(isValidEmail('')).toBe(true);
    expect(isValidEmail('', true)).toBe(false);
  });

  it('formats and validates ZIP and ZIP+4 values', () => {
    expect(formatUsPostalCode('554011234')).toBe('55401-1234');
    expect(isValidUsPostalCode('55401')).toBe(true);
    expect(isValidUsPostalCode('55401-1234')).toBe(true);
    expect(isValidUsPostalCode('5540')).toBe(false);
  });

  it('formats and validates US Social Security numbers', () => {
    expect(formatUsSsn('123456789')).toBe('123-45-6789');
    expect(isValidUsSsn('123-45-6789')).toBe(true);
    expect(isValidUsSsn('123-45-678')).toBe(false);
  });
});
