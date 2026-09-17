export interface RoleListItem {
  readonly id: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly name: string;
  readonly description: string;
  readonly assignedUsers: number;
  readonly permissionCount: number;
  readonly editorVersion: string;
}

export interface PermissionOption {
  readonly id: number;
  readonly code: string;
  readonly action: string;
}

export interface ResourcePermissionGroup {
  readonly key: string;
  readonly name: string;
  readonly permissions: readonly PermissionOption[];
}

export interface FeaturePermissionGroup {
  readonly id: number;
  readonly key: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly permissions: readonly PermissionOption[];
}

export interface ModulePermissionGroup {
  readonly id: number;
  readonly key: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly features: readonly FeaturePermissionGroup[];
}

export interface RoleEditorModel {
  readonly id: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly name: string;
  readonly description: string;
  readonly permissionIds: readonly number[];
  readonly assignedUsers: number;
  readonly editorVersion: string;
}

export interface CreateRoleRequest {
  readonly companyId: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly permissionIds: readonly number[];
}

export interface UpdateRoleGeneralRequest {
  readonly name: string;
  readonly description: string | null;
  readonly editorVersion: string;
}

export interface ReplaceRolePermissionsRequest {
  readonly permissionIds: readonly number[];
  readonly editorVersion: string;
}

export type RoleEditorError =
  | 'notFound'
  | 'conflict'
  | 'duplicateName'
  | 'invalidPermission'
  | 'lastRoleManager'
  | 'failed';
