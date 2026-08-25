export type UserMfaStatus = 'enabled' | 'notEnabled';
export type UserMfaMethod = 'Authenticator' | 'Email';
export type UserStatusFilter = 'all' | 'active' | 'inactive';
export type UserMfaFilter = 'all' | UserMfaStatus;
export type UserListSort = 'name' | 'email' | 'status' | 'mfa';
export type SortDirection = 'asc' | 'desc';

export interface UserListRole {
  readonly id: string;
  readonly name: string;
}

export interface RoleMetadata {
  readonly id: string;
  readonly name: string;
  readonly permissions: readonly string[];
  readonly requiresMfa: boolean;
}

export interface UserListItem {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly mfaStatus: UserMfaStatus;
  readonly roles: readonly UserListRole[];
}

export interface UserListResponse {
  readonly items: readonly UserListItem[];
  readonly availableRoles: readonly UserListRole[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface UserListQuery {
  readonly search: string;
  readonly status: UserStatusFilter;
  readonly roleId: string;
  readonly mfaStatus: UserMfaFilter;
  readonly sortBy: UserListSort;
  readonly sortDirection: SortDirection;
  readonly pageNumber: number;
  readonly pageSize: number;
}

export interface UserListFilterValues {
  readonly search: string;
  readonly status: UserStatusFilter;
  readonly roleId: string;
  readonly mfaStatus: UserMfaFilter;
}

export interface UserDetails {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
  readonly email: string;
  readonly phoneNumber: string | null;
  readonly isActive: boolean;
  readonly isMfaEnabled: boolean;
  readonly requiresMfa: boolean;
  readonly isMfaRequired: boolean;
  readonly isMfaRequiredByPermissions: boolean;
  readonly mfaMethod: UserMfaMethod;
  readonly roles: readonly UserListRole[];
  readonly editorVersion: string;
}

export interface UpdateUserGeneralRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: string | null;
  readonly editorVersion: string;
}

export interface CreateUserGeneral {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly isActive: boolean;
}

export interface CreateUserRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: string | null;
  readonly isActive: boolean;
  readonly requiresMfa: boolean;
  readonly mfaMethod: UserMfaMethod;
  readonly roleIds: readonly string[];
}

export interface CreateUserResponse {
  readonly id: string;
}

export interface UpdateUserRolesRequest {
  readonly roleIds: readonly string[];
  readonly editorVersion: string;
}

export const EMPTY_CREATE_USER_GENERAL: CreateUserGeneral = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  isActive: true,
};

export const DEFAULT_USER_LIST_QUERY: UserListQuery = {
  search: '',
  status: 'all',
  roleId: '',
  mfaStatus: 'all',
  sortBy: 'name',
  sortDirection: 'asc',
  pageNumber: 1,
  pageSize: 25,
};
