export interface RoleListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly assignedUsers: number;
  readonly permissionCount: number;
}

export interface PermissionOption {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
}

export interface FeaturePermissionGroup {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly permissions: readonly PermissionOption[];
}

export interface ModulePermissionGroup {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly features: readonly FeaturePermissionGroup[];
}

export interface RoleEditorModel {
  readonly id: string | null;
  readonly name: string;
  readonly description: string;
  readonly permissionIds: readonly string[];
}