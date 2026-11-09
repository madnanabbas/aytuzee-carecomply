export const Permissions = {
  Dashboard: {
    View: 'Dashboard.View',
  },
  Client: {
    View: 'Client.View',
    Create: 'Client.Create',
    Edit: 'Client.Edit',
    Archive: 'Client.Archive',
    RevealSsn: 'Client.RevealSsn',
    GuestInvite: 'Client.GuestInvite',
  },
  ClientDocument: {
    View: 'ClientDocument.View',
    Upload: 'ClientDocument.Upload',
    Download: 'ClientDocument.Download',
    Replace: 'ClientDocument.Replace',
    Archive: 'ClientDocument.Archive',
  },
  ClientTodo: {
    View: 'ClientTodo.View',
    Create: 'ClientTodo.Create',
    Edit: 'ClientTodo.Edit',
    Complete: 'ClientTodo.Complete',
    Reopen: 'ClientTodo.Reopen',
    Cancel: 'ClientTodo.Cancel',
  },
  ClientQuickNote: {
    View: 'ClientQuickNote.View',
    Create: 'ClientQuickNote.Create',
    Edit: 'ClientQuickNote.Edit',
  },
  ClientServiceAgreement: {
    View: 'ClientServiceAgreement.View',
    Create: 'ClientServiceAgreement.Create',
    Edit: 'ClientServiceAgreement.Edit',
  },
  ClientCoverage: {
    View: 'ClientCoverage.View',
    Create: 'ClientCoverage.Create',
    Edit: 'ClientCoverage.Edit',
  },
  Payer: {
    View: 'Payer.View',
    Create: 'Payer.Create',
    Edit: 'Payer.Edit',
  },
  ClientCaregiver: {
    View: 'ClientCaregiver.View',
    Create: 'ClientCaregiver.Create',
    Edit: 'ClientCaregiver.Edit',
  },
  ClientResponsibleParty: {
    View: 'ClientResponsibleParty.View',
    Create: 'ClientResponsibleParty.Create',
    Edit: 'ClientResponsibleParty.Edit',
  },
  ClientContact: {
    View: 'ClientContact.View',
    Create: 'ClientContact.Create',
    Edit: 'ClientContact.Edit',
  },
  ClientCareCoordinator: {
    View: 'ClientCareCoordinator.View',
    Create: 'ClientCareCoordinator.Create',
    Edit: 'ClientCareCoordinator.Edit',
  },
  ClientConsultationProvider: {
    View: 'ClientConsultationProvider.View',
    Create: 'ClientConsultationProvider.Create',
    Edit: 'ClientConsultationProvider.Edit',
  },
  ClientPhysician: {
    View: 'ClientPhysician.View',
    Create: 'ClientPhysician.Create',
    Edit: 'ClientPhysician.Edit',
  },
  ClientHospitalization: {
    View: 'ClientHospitalization.View',
    Create: 'ClientHospitalization.Create',
    Edit: 'ClientHospitalization.Edit',
  },
  ClientVisit: { View: 'ClientVisit.View', Create: 'ClientVisit.Create', Edit: 'ClientVisit.Edit' },
  ClientForm: {
    View: 'ClientForm.View',
    Create: 'ClientForm.Create',
    Edit: 'ClientForm.Edit',
    Export: 'ClientForm.Export',
  },
  ClientEmailLog: { View: 'ClientEmailLog.View' },
  ClientEmployeeService: {
    View: 'ClientEmployeeService.View',
    Create: 'ClientEmployeeService.Create',
    Edit: 'ClientEmployeeService.Edit',
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
  Company: {
    View: 'Company.View',
    Create: 'Company.Create',
    Edit: 'Company.Edit',
    Delete: 'Company.Delete',
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
