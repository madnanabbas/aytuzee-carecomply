import { AuthorizationService } from '../authorization/authorization.service';
import { Permission, Permissions } from '../authorization/permissions';

export interface RegisteredNavigationRoute {
  readonly key: string;
  readonly route: string;
  readonly permissions: readonly [Permission, ...Permission[]];
}

/** Angular owns executable routes and independent UX guards. Runtime sidebar
 * labels, groups, ordering and icon keys come from the navigation API. */
export const APP_ROUTE_METADATA = {
  dashboard: route('dashboard', '/dashboard', [Permissions.Dashboard.View]),
  clients: route('clients', '/clients', [Permissions.Client.View]),
  employees: route('employees', '/employees', [Permissions.Employee.View]),
  dhsLibrary: route('dhs-library', '/dhs-library', [Permissions.DHSLibrary.View]),
  documents: route('documents', '/documents', [
    Permissions.ClientDocument.View,
    Permissions.EmployeeDocument.View,
    Permissions.TrainingDocument.View,
    Permissions.BackgroundCheckDocument.View,
  ]),
  expiryReview: route('expiry-review', '/expiry-review', [Permissions.ExpiryReview.View]),
  training: route('training', '/training', [Permissions.Training.View]),
  backgroundChecks: route('background-checks', '/background-checks', [
    Permissions.BackgroundCheck.View,
  ]),
  notifications: route('notifications', '/notifications', [Permissions.Notification.View]),
  reports: route('reports', '/reports', [Permissions.FinancialReport.View]),
  companies: route('companies', '/access-control/companies', [Permissions.Company.View]),
  accessControl: route('access-management', '/access-control', [
    Permissions.User.View,
    Permissions.User.Manage,
    Permissions.Role.View,
    Permissions.Role.Manage,
    Permissions.Permission.View,
    Permissions.Permission.Manage,
    Permissions.AuditLog.View,
  ]),
  users: route('users', '/access-control/users', [Permissions.User.View]),
  roles: route('roles', '/access-control/roles', [Permissions.Role.View]),
  modulesFeatures: route('modules-features', '/access-control/modules-features', [
    Permissions.Permission.View,
  ]),
  permissions: route('permissions', '/access-control/permissions', [Permissions.Permission.View]),
  auditLogs: route('audit-logs', '/access-control/audit-logs', [Permissions.AuditLog.View]),
} as const satisfies Record<string, RegisteredNavigationRoute>;

const ROUTES_BY_KEY = new Map<string, RegisteredNavigationRoute>(
  Object.values(APP_ROUTE_METADATA).map((item) => [item.key, item]),
);

export function canAccessNavigationRoute(
  authorization: AuthorizationService,
  key: string,
  path: string,
): boolean {
  const item = ROUTES_BY_KEY.get(key);
  return item?.route === path && authorization.hasAnyPermission(item.permissions);
}

function route(
  key: string,
  path: string,
  permissions: readonly [Permission, ...Permission[]],
): RegisteredNavigationRoute {
  return { key, route: path, permissions };
}
