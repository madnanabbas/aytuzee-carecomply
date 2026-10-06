import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../authorization/authorization.service';
import { Permissions } from '../authorization/permissions';
import { APP_ROUTE_METADATA, canAccessNavigationRoute } from './app-navigation';

describe('application route metadata', () => {
  it('keeps typed route guards independent from runtime sidebar metadata', () => {
    expect(APP_ROUTE_METADATA.documents.permissions).toEqual([
      Permissions.ClientDocument.View,
      Permissions.EmployeeDocument.View,
      Permissions.TrainingDocument.View,
      Permissions.BackgroundCheckDocument.View,
    ]);
    expect(APP_ROUTE_METADATA.accessControl.permissions).toContain(Permissions.User.View);
    expect(APP_ROUTE_METADATA.companies).toEqual({
      key: 'companies',
      route: '/access-control/companies',
      permissions: [Permissions.Company.View],
    });
    expect(APP_ROUTE_METADATA.users.route).toBe('/access-control/users');
  });

  it('accepts only an exact registered key/path with a current permission', () => {
    const authorization = TestBed.inject(AuthorizationService);
    authorization.setPermissions([Permissions.Employee.View]);

    expect(canAccessNavigationRoute(authorization, 'employees', '/employees')).toBe(true);
    expect(canAccessNavigationRoute(authorization, 'employees', '/clients')).toBe(false);
    expect(canAccessNavigationRoute(authorization, 'unknown', '/employees')).toBe(false);
  });

  it('allows the Companies menu only with the matching company permission and route', () => {
    const authorization = TestBed.inject(AuthorizationService);
    authorization.setPermissions([Permissions.Company.View]);

    expect(canAccessNavigationRoute(authorization, 'companies', '/access-control/companies')).toBe(
      true,
    );
    expect(canAccessNavigationRoute(authorization, 'companies', '/access-control')).toBe(false);
  });
});
