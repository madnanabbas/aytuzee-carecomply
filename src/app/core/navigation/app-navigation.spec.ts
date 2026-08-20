import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../authorization/authorization.service';
import { ALL_PERMISSIONS, Permission, Permissions } from '../authorization/permissions';
import {
  APP_NAVIGATION_GROUPS,
  APP_NAVIGATION_ITEMS,
  APP_NAVIGATION_ORDER,
  canViewNavigationItem,
  findNavigationItem,
} from './app-navigation';

describe('application navigation', () => {
  let authorization: AuthorizationService;

  beforeEach(() => {
    authorization = TestBed.inject(AuthorizationService);
  });

  it('should define the canonical groups, order, routes, and typed permission requirements', () => {
    expect(APP_NAVIGATION_GROUPS.map((group) => group.label)).toEqual([
      'Overview',
      'People',
      'Compliance',
      'Operations',
      'Administration',
    ]);
    expect(APP_NAVIGATION_ORDER.map((item) => [item.label, item.route])).toEqual([
      ['Dashboard', '/dashboard'],
      ['Clients', '/clients'],
      ['Employees', '/employees'],
      ['DHS Library', '/dhs-library'],
      ['Documents', '/documents'],
      ['Expiry & Review', '/expiry-review'],
      ['Training', '/training'],
      ['Background Checks', '/background-checks'],
      ['Notifications', '/notifications'],
      ['Reports', '/reports'],
      ['Access & Permissions', '/access-control'],
    ]);
    expect(APP_NAVIGATION_ITEMS.documents.permissions).toEqual([
      Permissions.ClientDocument.View,
      Permissions.EmployeeDocument.View,
      Permissions.TrainingDocument.View,
      Permissions.BackgroundCheckDocument.View,
    ]);
    expect(APP_NAVIGATION_ITEMS.accessControl.permissions).toEqual([
      Permissions.User.View,
      Permissions.Role.View,
      Permissions.Permission.View,
      Permissions.AuditLog.View,
    ]);
  });

  it.each([
    {
      profile: 'system administrator permissions',
      permissions: ALL_PERMISSIONS,
      visible: APP_NAVIGATION_ORDER.map((item) => item.label),
    },
    {
      profile: 'compliance permissions',
      permissions: [
        Permissions.Dashboard.View,
        Permissions.Client.View,
        Permissions.ClientDocument.View,
        Permissions.Employee.View,
        Permissions.EmployeeDocument.View,
        Permissions.Training.View,
        Permissions.TrainingDocument.View,
        Permissions.BackgroundCheck.View,
        Permissions.BackgroundCheckDocument.View,
        Permissions.DHSLibrary.View,
        Permissions.ExpiryReview.View,
        Permissions.Notification.View,
        Permissions.FinancialReport.View,
      ],
      visible: APP_NAVIGATION_ORDER
        .filter((item) => item !== APP_NAVIGATION_ITEMS.accessControl)
        .map((item) => item.label),
    },
    {
      profile: 'HR permissions',
      permissions: [
        Permissions.Dashboard.View,
        Permissions.Employee.View,
        Permissions.EmployeeDocument.View,
        Permissions.Training.View,
        Permissions.TrainingDocument.View,
        Permissions.BackgroundCheck.View,
        Permissions.BackgroundCheckDocument.View,
        Permissions.ExpiryReview.View,
        Permissions.Notification.View,
      ],
      visible: [
        'Dashboard',
        'Employees',
        'Documents',
        'Expiry & Review',
        'Training',
        'Background Checks',
        'Notifications',
      ],
    },
    {
      profile: 'read-only permissions',
      permissions: [
        Permissions.Dashboard.View,
        Permissions.Client.View,
        Permissions.ClientDocument.View,
        Permissions.Employee.View,
        Permissions.EmployeeDocument.View,
        Permissions.Training.View,
        Permissions.TrainingDocument.View,
        Permissions.BackgroundCheck.View,
        Permissions.BackgroundCheckDocument.View,
        Permissions.DHSLibrary.View,
        Permissions.ExpiryReview.View,
        Permissions.Notification.View,
        Permissions.FinancialReport.View,
      ],
      visible: APP_NAVIGATION_ORDER
        .filter((item) => item !== APP_NAVIGATION_ITEMS.accessControl)
        .map((item) => item.label),
    },
  ] satisfies readonly {
    profile: string;
    permissions: readonly Permission[];
    visible: readonly string[];
  }[])('should derive $profile navigation without role names', ({ permissions, visible }) => {
    authorization.setPermissions(permissions);

    expect(
      APP_NAVIGATION_ORDER
        .filter((item) => canViewNavigationItem(authorization, item))
        .map((item) => item.label),
    ).toEqual(visible);
  });

  it.each(APP_NAVIGATION_ITEMS.documents.permissions)(
    'should show Documents for any approved document view permission: %s',
    (permission) => {
      authorization.setPermissions([permission]);
      expect(canViewNavigationItem(authorization, APP_NAVIGATION_ITEMS.documents)).toBe(true);
    },
  );

  it.each(APP_NAVIGATION_ITEMS.accessControl.permissions)(
    'should show Access & Permissions for any approved administration view permission: %s',
    (permission) => {
      authorization.setPermissions([permission]);
      expect(canViewNavigationItem(authorization, APP_NAVIGATION_ITEMS.accessControl)).toBe(true);
    },
  );

  it('should resolve page context for exact and nested routes without query or fragment data', () => {
    expect(findNavigationItem('/clients')).toBe(APP_NAVIGATION_ITEMS.clients);
    expect(findNavigationItem('/clients/record?tab=documents#current')).toBe(
      APP_NAVIGATION_ITEMS.clients,
    );
    expect(findNavigationItem('/forbidden')).toBeUndefined();
  });
});
