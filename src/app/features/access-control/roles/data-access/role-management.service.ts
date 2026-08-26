import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/app-config';
import {
  CreateRoleRequest,
  ModulePermissionGroup,
  ReplaceRolePermissionsRequest,
  RoleEditorModel,
  RoleListItem,
  UpdateRoleGeneralRequest,
} from '../models/role-management.models';

@Injectable({
  providedIn: 'root',
})
export class RoleManagementService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly http = inject(HttpClient);
  private readonly basePath = 'access-management/role-management';

  listRoles(): Observable<readonly RoleListItem[]> {
    return this.http.get<readonly RoleListItem[]>(
      `${this.apiBaseUrl}/${this.basePath}/roles`,
    );
  }

  getRole(roleId: string): Observable<RoleEditorModel> {
    return this.http.get<RoleEditorModel>(
      `${this.apiBaseUrl}/${this.basePath}/roles/${encodeURIComponent(roleId)}`,
    );
  }

  getPermissionCatalog(): Observable<readonly ModulePermissionGroup[]> {
    return this.http.get<readonly ModulePermissionGroup[]>(
      `${this.apiBaseUrl}/${this.basePath}/permission-catalog`,
    );
  }

  createRole(request: CreateRoleRequest): Observable<RoleEditorModel> {
    return this.http.post<RoleEditorModel>(
      `${this.apiBaseUrl}/${this.basePath}/roles`,
      request,
    );
  }

  updateGeneral(
    roleId: string,
    request: UpdateRoleGeneralRequest,
  ): Observable<RoleEditorModel> {
    return this.http.put<RoleEditorModel>(
      `${this.apiBaseUrl}/${this.basePath}/roles/${encodeURIComponent(roleId)}/general`,
      request,
    );
  }

  replacePermissions(
    roleId: string,
    request: ReplaceRolePermissionsRequest,
  ): Observable<RoleEditorModel> {
    return this.http.put<RoleEditorModel>(
      `${this.apiBaseUrl}/${this.basePath}/roles/${encodeURIComponent(roleId)}/permissions`,
      request,
    );
  }
}
