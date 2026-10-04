import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/app-config';
import { UserListQuery } from '../models/user-management.models';
import { UserManagementApiService } from './user-management-api.service';

describe('UserManagementApiService', () => {
  let api: UserManagementApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(UserManagementApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should construct the approved user-list search and filter query', () => {
    const query: UserListQuery = {
      search: 'Ada',
      status: 'inactive',
      roleId: 'role-id',
      mfaStatus: 'enabled',
      sortBy: 'email',
      sortDirection: 'desc',
      pageNumber: 2,
      pageSize: 10,
    };

    api.listUsers(query).subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/access-management/users');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('Ada');
    expect(request.request.params.get('isActive')).toBe('false');
    expect(request.request.params.get('roleId')).toBe('role-id');
    expect(request.request.params.get('mfaStatus')).toBe('enabled');
    expect(request.request.params.get('sortBy')).toBe('email');
    expect(request.request.params.get('sortDirection')).toBe('desc');
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('10');
    request.flush({ items: [], availableRoles: [], pageNumber: 2, pageSize: 10, totalCount: 0 });
  });

  it('should omit optional all-filter values', () => {
    api
      .listUsers({
        search: '',
        status: 'all',
        roleId: '',
        mfaStatus: 'all',
        sortBy: 'name',
        sortDirection: 'asc',
        pageNumber: 1,
        pageSize: 25,
      })
      .subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/access-management/users');
    expect(request.request.params.has('search')).toBe(false);
    expect(request.request.params.has('isActive')).toBe(false);
    expect(request.request.params.has('roleId')).toBe(false);
    expect(request.request.params.has('mfaStatus')).toBe(false);
    request.flush({ items: [], availableRoles: [], pageNumber: 1, pageSize: 25, totalCount: 0 });
  });

  it('should use focused user detail, general update, and status endpoints', () => {
    api.getUser('user/one').subscribe();
    const detail = http.expectOne('/api/access-management/users/user%2Fone');
    expect(detail.request.method).toBe('GET');
    detail.flush({});

    api
      .updateGeneral('user-1', {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.test',
        phoneNumber: null,
        editorVersion: 'version',
      })
      .subscribe();
    const update = http.expectOne('/api/access-management/users/user-1/general');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual(expect.objectContaining({ editorVersion: 'version' }));
    update.flush({});

    api.setActive('user-1', false, 'next-version').subscribe();
    const status = http.expectOne('/api/access-management/users/user-1/deactivate');
    expect(status.request.method).toBe('POST');
    expect(status.request.body).toEqual({ editorVersion: 'next-version' });
    status.flush({});

    api.setMfa('user-1', true, 'Email', 'mfa-version').subscribe();
    const mfa = http.expectOne('/api/access-management/users/user-1/mfa');
    expect(mfa.request.method).toBe('PUT');
    expect(mfa.request.body).toEqual({
      isEnabled: true,
      method: 'Email',
      editorVersion: 'mfa-version',
    });
    mfa.flush({});

    api
      .replaceRoles('user-1', {
        roleIds: ['role-2'],
        editorVersion: 'role-version',
      })
      .subscribe();
    const roleUpdate = http.expectOne('/api/access-management/users/user-1/roles');
    expect(roleUpdate.request.method).toBe('PUT');
    expect(roleUpdate.request.body).toEqual({
      roleIds: ['role-2'],
      editorVersion: 'role-version',
    });
    roleUpdate.flush({});
  });

  it('should load backend role metadata and post only the approved create contract', () => {
    api.listRoles().subscribe();
    const roles = http.expectOne('/api/access-management/roles');
    expect(roles.request.method).toBe('GET');
    roles.flush([]);

    api
      .createUser({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.test',
        password: 'StrongPassword123!',
        phoneNumber: null,
        isActive: true,
        requiresMfa: true,
        mfaMethod: 'Authenticator',
        roleIds: ['role-1', 'role-2'],
      })
      .subscribe();
    const create = http.expectOne('/api/access-management/users');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      password: 'StrongPassword123!',
      phoneNumber: null,
      isActive: true,
      requiresMfa: true,
      mfaMethod: 'Authenticator',
      roleIds: ['role-1', 'role-2'],
    });
    expect(create.request.body.password).toBe('StrongPassword123!');
    create.flush({ id: 'user-1' });
  });
});
