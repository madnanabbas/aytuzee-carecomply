export const Permissions = {
  Dashboard: {
    View: 'Dashboard.View',
  },
  Client: {
    View: 'Client.View',
    Create: 'Client.Create',
    Edit: 'Client.Edit',
    Archive: 'Client.Archive',
  },
  ClientDocument: {
    View: 'ClientDocument.View',
    Upload: 'ClientDocument.Upload',
    Download: 'ClientDocument.Download',
    Replace: 'ClientDocument.Replace',
    Archive: 'ClientDocument.Archive',
  },
  Employee: {
    View: 'Employee.View',
    Create: 'Employee.Create',
    Edit: 'Employee.Edit',
    Archive: 'Employee.Archive',
  },
  EmployeeDocument: {
    View: 'EmployeeDocument.View',
    Upload: 'EmployeeDocument.Upload',
    Download: 'EmployeeDocument.Download',
    Replace: 'EmployeeDocument.Replace',
    Archive: 'EmployeeDocument.Archive',
  },
  Training: {
    View: 'Training.View',
    Create: 'Training.Create',
    Edit: 'Training.Edit',
    Manage: 'Training.Manage',
  },
  TrainingDocument: {
    View: 'TrainingDocument.View',
    Upload: 'TrainingDocument.Upload',
  },
  BackgroundCheck: {
    View: 'BackgroundCheck.View',
    Create: 'BackgroundCheck.Create',
    Edit: 'BackgroundCheck.Edit',
    Manage: 'BackgroundCheck.Manage',
  },
  BackgroundCheckDocument: {
    View: 'BackgroundCheckDocument.View',
    Upload: 'BackgroundCheckDocument.Upload',
  },
  DHSLibrary: {
    View: 'DHSLibrary.View',
    Create: 'DHSLibrary.Create',
    Edit: 'DHSLibrary.Edit',
    PublishVersion: 'DHSLibrary.PublishVersion',
    Archive: 'DHSLibrary.Archive',
  },
  ExpiryReview: {
    View: 'ExpiryReview.View',
    Manage: 'ExpiryReview.Manage',
  },
  Notification: {
    View: 'Notification.View',
    Manage: 'Notification.Manage',
  },
  FinancialReport: {
    View: 'FinancialReport.View',
  },
  User: {
    View: 'User.View',
    Manage: 'User.Manage',
  },
  Role: {
    View: 'Role.View',
    Manage: 'Role.Manage',
  },
  Permission: {
    View: 'Permission.View',
    Manage: 'Permission.Manage',
  },
  AuditLog: {
    View: 'AuditLog.View',
  },
} as const;

type PermissionCatalog = typeof Permissions;

export type Permission = {
  [
    Resource in keyof PermissionCatalog
  ]: PermissionCatalog[Resource][keyof PermissionCatalog[Resource]];
}[keyof PermissionCatalog];

export const ALL_PERMISSIONS = Object.freeze(
  Object.values(Permissions).flatMap((resource) => Object.values(resource)),
) as readonly Permission[];

const permissionValues: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && permissionValues.has(value);
}
