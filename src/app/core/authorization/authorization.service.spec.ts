import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from './authorization.service';
import { Permissions } from './permissions';

describe('AuthorizationService', () => {
  let authorization: AuthorizationService;

  beforeEach(() => {
    authorization = TestBed.inject(AuthorizationService);
  });

  it('should start with no permissions', () => {
    expect(authorization.hasPermission(Permissions.Client.View)).toBe(false);
  });

  it('should set permissions', () => {
    authorization.setPermissions([Permissions.Client.View]);

    expect(authorization.hasPermission(Permissions.Client.View)).toBe(true);
  });

  it('should replace the complete permission set', () => {
    authorization.setPermissions([Permissions.Client.View]);
    authorization.setPermissions([Permissions.Employee.View]);

    expect(authorization.hasPermission(Permissions.Client.View)).toBe(false);
    expect(authorization.hasPermission(Permissions.Employee.View)).toBe(true);
  });

  it('should clear permissions', () => {
    authorization.setPermissions([Permissions.Client.View]);
    authorization.clearPermissions();

    expect(authorization.hasPermission(Permissions.Client.View)).toBe(false);
  });

  it('should check whether any permission is present', () => {
    authorization.setPermissions([Permissions.Client.View]);

    expect(
      authorization.hasAnyPermission([Permissions.Employee.View, Permissions.Client.View]),
    ).toBe(true);
    expect(
      authorization.hasAnyPermission([Permissions.Employee.View, Permissions.Dashboard.View]),
    ).toBe(false);
  });

  it('should check whether all permissions are present', () => {
    authorization.setPermissions([Permissions.Client.View, Permissions.Client.Edit]);

    expect(
      authorization.hasAllPermissions([Permissions.Client.View, Permissions.Client.Edit]),
    ).toBe(true);
    expect(
      authorization.hasAllPermissions([Permissions.Client.View, Permissions.Client.Archive]),
    ).toBe(false);
  });

  it('should handle duplicate permissions without changing check behavior', () => {
    authorization.setPermissions([
      Permissions.Client.View,
      Permissions.Client.View,
      Permissions.Client.Edit,
    ]);

    expect(
      authorization.hasAllPermissions([
        Permissions.Client.View,
        Permissions.Client.View,
        Permissions.Client.Edit,
      ]),
    ).toBe(true);
  });

  it('should fail closed for empty any and all requirements', () => {
    authorization.setPermissions([Permissions.Client.View]);

    expect(authorization.hasAnyPermission([])).toBe(false);
    expect(authorization.hasAllPermissions([])).toBe(false);
  });
});
