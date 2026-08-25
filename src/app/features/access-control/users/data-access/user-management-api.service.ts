import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/app-config';
import {
  UserListQuery,
  UserListResponse,
  UserDetails,
  UpdateUserGeneralRequest,
  UpdateUserRolesRequest,
  CreateUserRequest,
  CreateUserResponse,
  RoleMetadata,
  UserMfaMethod,
} from '../models/user-management.models';

@Injectable({
  providedIn: 'root',
})
export class UserManagementApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly http = inject(HttpClient);

  listUsers(query: UserListQuery): Observable<UserListResponse> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.status !== 'all') {
      params = params.set('isActive', query.status === 'active');
    }

    if (query.roleId) {
      params = params.set('roleId', query.roleId);
    }

    if (query.mfaStatus !== 'all') {
      params = params.set('mfaStatus', query.mfaStatus);
    }

    return this.http.get<UserListResponse>(
      `${this.apiBaseUrl}/access-management/users`,
      { params },
    );
  }

  getUser(userId: string): Observable<UserDetails> {
    return this.http.get<UserDetails>(
      `${this.apiBaseUrl}/access-management/users/${encodeURIComponent(userId)}`,
    );
  }

  listRoles(): Observable<readonly RoleMetadata[]> {
    return this.http.get<readonly RoleMetadata[]>(
      `${this.apiBaseUrl}/access-management/roles`,
    );
  }

  createUser(request: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(
      `${this.apiBaseUrl}/access-management/users`,
      request,
    );
  }

  updateGeneral(
    userId: string,
    request: UpdateUserGeneralRequest,
  ): Observable<UserDetails> {
    return this.http.put<UserDetails>(
      `${this.apiBaseUrl}/access-management/users/${encodeURIComponent(userId)}/general`,
      request,
    );
  }

  setActive(userId: string, isActive: boolean, editorVersion: string): Observable<UserDetails> {
    const operation = isActive ? 'activate' : 'deactivate';
    return this.http.post<UserDetails>(
      `${this.apiBaseUrl}/access-management/users/${encodeURIComponent(userId)}/${operation}`,
      { editorVersion },
    );
  }

  setMfa(
    userId: string,
    isEnabled: boolean,
    method: UserMfaMethod,
    editorVersion: string,
  ): Observable<UserDetails> {
    return this.http.put<UserDetails>(
      `${this.apiBaseUrl}/access-management/users/${encodeURIComponent(userId)}/mfa`,
      { isEnabled, method, editorVersion },
    );
  }

  replaceRoles(
    userId: string,
    request: UpdateUserRolesRequest,
  ): Observable<UserDetails> {
    return this.http.put<UserDetails>(
      `${this.apiBaseUrl}/access-management/users/${encodeURIComponent(userId)}/roles`,
      request,
    );
  }
}
