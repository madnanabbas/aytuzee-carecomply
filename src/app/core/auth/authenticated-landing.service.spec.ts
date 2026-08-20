import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../authorization/authorization.service';
import { Permissions } from '../authorization/permissions';
import { AuthenticatedLandingService } from './authenticated-landing.service';

describe('AuthenticatedLandingService', () => {
  let authorization: AuthorizationService;
  let landing: AuthenticatedLandingService;

  beforeEach(() => {
    authorization = TestBed.inject(AuthorizationService);
    landing = TestBed.inject(AuthenticatedLandingService);
  });

  it('should select the first configured permitted route', () => {
    authorization.setPermissions([Permissions.Employee.View, Permissions.Dashboard.View]);

    expect(landing.firstAllowedPath()).toBe('/dashboard');
  });

  it('should support non-dashboard users without role assumptions', () => {
    authorization.setPermissions([Permissions.Employee.View]);

    expect(landing.firstAllowedPath()).toBe('/employees');
  });

  it('should select the Documents route for any configured document view permission', () => {
    authorization.setPermissions([Permissions.TrainingDocument.View]);

    expect(landing.firstAllowedPath()).toBe('/documents');
  });

  it('should fail closed when no application route is permitted', () => {
    expect(landing.firstAllowedPath()).toBe('/forbidden');
  });
});
