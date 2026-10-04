import {
  formatContactPhone,
  isValidContactPhone,
  isValidContactEmail,
} from '../../../shared/formatting/contact-input-formatting';

describe('client contact input formatting', () => {
  it('formats ten digits and preserves an unsupported country code as invalid input', () => {
    expect(formatContactPhone('1 (612) 555-0101')).toBe('16125550101');
    expect(formatContactPhone('612 abc 555 0101')).toBe('(612) 555-0101');
    expect(isValidContactPhone('(612) 555-0101', true)).toBe(true);
    expect(isValidContactPhone('1 (612) 555-0101', true)).toBe(false);
    expect(isValidContactPhone('612', true)).toBe(false);
    expect(isValidContactPhone('')).toBe(true);
  });

  it('checks email without changing the local part of the address', () => {
    expect(isValidContactEmail('Name@Example.com')).toBe(true);
    expect(isValidContactEmail('not an email')).toBe(false);
    expect(isValidContactEmail('')).toBe(true);
  });
});
