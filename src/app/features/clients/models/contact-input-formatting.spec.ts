import { formatContactPhone, isValidContactPhone, isValidContactEmail } from './contact-input-formatting';

describe('client contact input formatting', () => {
  it('formats a US phone number including a pasted country code', () => {
    expect(formatContactPhone('1 (612) 555-0101')).toBe('(612) 555-0101');
    expect(formatContactPhone('612 abc 555 0101')).toBe('(612) 555-0101');
    expect(isValidContactPhone('(612) 555-0101', true)).toBe(true);
    expect(isValidContactPhone('612', true)).toBe(false);
    expect(isValidContactPhone('')).toBe(true);
  });

  it('checks email without changing the local part of the address', () => {
    expect(isValidContactEmail('Name@Example.com')).toBe(true);
    expect(isValidContactEmail('not an email')).toBe(false);
    expect(isValidContactEmail('')).toBe(true);
  });
});
