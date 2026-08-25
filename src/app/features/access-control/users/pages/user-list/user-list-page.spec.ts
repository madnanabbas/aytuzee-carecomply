import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { UserManagementApiService } from '../../data-access/user-management-api.service';
import { UserListResponse } from '../../models/user-management.models';
import { UserListPageComponent } from './user-list-page';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';

describe('UserListPageComponent', () => {
  const queryParams = new BehaviorSubject(convertToParamMap({}));
  let response: Subject<UserListResponse>;
  const api = { listUsers: vi.fn() };
  const router = { navigate: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    queryParams.next(convertToParamMap({}));
    response = new Subject<UserListResponse>();
    api.listUsers.mockClear();
    api.listUsers.mockReturnValue(response.asObservable());
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: UserManagementApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
        { provide: Router, useValue: router },
      ],
    });
    TestBed.inject(AuthorizationService).setPermissions([Permissions.User.View]);
  });

  it('should render loading and API error states', () => {
    const fixture = TestBed.createComponent(UserListPageComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading users');

    response.error(new Error('unavailable'));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Users could not be loaded');
  });

  it('should distinguish empty and filtered-empty results', () => {
    const emptyFixture = TestBed.createComponent(UserListPageComponent);
    emptyFixture.detectChanges();
    response.next(emptyResponse());
    emptyFixture.detectChanges();
    expect((emptyFixture.nativeElement as HTMLElement).textContent).toContain('No users found');
    emptyFixture.destroy();

    queryParams.next(convertToParamMap({ search: 'missing' }));
    const filteredResponse = new Subject<UserListResponse>();
    api.listUsers.mockReturnValueOnce(filteredResponse.asObservable());
    const filteredFixture = TestBed.createComponent(UserListPageComponent);
    filteredFixture.detectChanges();
    filteredResponse.next(emptyResponse());
    filteredFixture.detectChanges();
    expect((filteredFixture.nativeElement as HTMLElement).textContent).toContain(
      'No users match these filters',
    );
  });

  it('should render multiple database roles and explicit status and MFA labels', () => {
    const fixture = TestBed.createComponent(UserListPageComponent);
    fixture.detectChanges();
    response.next({
      items: [{
        id: 'user-1',
        displayName: 'Ada Lovelace',
        email: 'ada@example.test',
        isActive: false,
        mfaStatus: 'enabled',
        roles: [
          { id: 'role-1', name: 'Compliance Lead' },
          { id: 'role-2', name: 'Reviewer' },
        ],
      }],
      availableRoles: [
        { id: 'role-1', name: 'Compliance Lead' },
        { id: 'role-2', name: 'Reviewer' },
      ],
      pageNumber: 1,
      pageSize: 25,
      totalCount: 1,
    });
    fixture.detectChanges();
    const copy = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(copy).toContain('Ada Lovelace');
    expect(copy).toContain('Compliance Lead');
    expect(copy).toContain('Reviewer');
    expect(copy).toContain('Inactive');
    expect(copy).toContain('Enabled');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/access-control/users/user-1/general"]'))
      .not.toBeNull();
  });

  it('should preserve applied filters in route query parameters and reset paging', () => {
    const fixture = TestBed.createComponent(UserListPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.applyFilters({
      search: 'Ada',
      roleId: 'role-1',
      status: 'active',
      mfaStatus: 'notEnabled',
    });

    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({
        search: 'Ada',
        roleId: 'role-1',
        status: 'active',
        mfaStatus: 'notEnabled',
      }),
    }));
  });

  it('should expose Add User only with User.Manage', () => {
    const authorization = TestBed.inject(AuthorizationService);
    const fixture = TestBed.createComponent(UserListPageComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector(
      'a[href="/access-control/users/new/general"]',
    )).toBeNull();

    authorization.setPermissions([Permissions.User.View, Permissions.User.Manage]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector(
      'a[href="/access-control/users/new/general"]',
    )).not.toBeNull();
  });

  function emptyResponse(): UserListResponse {
    return { items: [], availableRoles: [], pageNumber: 1, pageSize: 25, totalCount: 0 };
  }
});
