import { ALL_PERMISSIONS, isPermission, Permissions } from './permissions';

describe('Permissions', () => {
  it('should contain exactly 48 permission values', () => {
    expect(ALL_PERMISSIONS).toHaveLength(48);
  });

  it('should contain only unique values', () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });

  it('should follow the Resource.Action naming convention', () => {
    expect(
      ALL_PERMISSIONS.every((permission) => /^[A-Z][A-Za-z]*\.[A-Z][A-Za-z]*$/.test(permission)),
    ).toBe(true);
  });

  it('should recognize a catalog permission', () => {
    expect(isPermission(Permissions.DHSLibrary.PublishVersion)).toBe(true);
  });

  it('should reject an unknown permission', () => {
    expect(isPermission('Client.Delete')).toBe(false);
  });
});
