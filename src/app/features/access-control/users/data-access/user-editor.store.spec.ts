import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { UserManagementApiService } from './user-management-api.service';
import { UserEditorStore } from './user-editor.store';

describe('UserEditorStore create mode', () => {
  const roles = [
    {
      id: 'role-1',
      name: 'Database Role',
      permissions: ['Client.View'],
      requiresMfa: false,
    },
  ];
  const api = {
    listRoles: vi.fn(),
    createUser: vi.fn(),
  };
  const router = { navigate: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    api.listRoles.mockReset().mockReturnValue(of(roles));
    api.createUser.mockReset().mockReturnValue(of({ id: 'created-user' }));
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        UserEditorStore,
        { provide: UserManagementApiService, useValue: api },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('loads roles, submits the focused contract once, and waits for success acknowledgement', () => {
    const store = TestBed.inject(UserEditorStore);
    store.initializeCreate();
    store.updateCreateGeneral(
      {
        firstName: ' Ada ',
        lastName: ' Lovelace ',
        email: ' ada@example.test ',
        password: 'StrongPassword123!',
        phoneNumber: ' ',
        isActive: true,
      },
      true,
    );
    store.toggleRole('role-1', true);

    store.create();

    expect(api.listRoles).toHaveBeenCalledOnce();
    expect(api.createUser).toHaveBeenCalledWith({
      companyId: null,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      password: 'StrongPassword123!',
      phoneNumber: null,
      isActive: true,
      requiresMfa: false,
      mfaMethod: 'Authenticator',
      roleIds: ['role-1'],
      locationIds: [],
    });
    expect(api.createUser.mock.calls[0][0].password).toBe('StrongPassword123!');
    expect(store.completionDialog()?.title).toContain('User created');
    expect(router.navigate).not.toHaveBeenCalled();

    store.confirmCompletion();
    expect(router.navigate).toHaveBeenCalledWith(['/access-control/users']);
  });

  it('requires General data and at least one role before calling the API', () => {
    const store = TestBed.inject(UserEditorStore);
    store.initializeCreate();

    store.create();
    expect(store.error()).toBe('invalidGeneral');
    expect(api.createUser).not.toHaveBeenCalled();

    store.updateCreateGeneral(
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.test',
        password: 'StrongPassword123!',
        phoneNumber: '',
        isActive: true,
      },
      true,
    );
    store.create();
    expect(store.error()).toBe('invalidRoles');
    expect(api.createUser).not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions and maps duplicate email safely', () => {
    const pending = new Subject<{ id: string }>();
    api.createUser.mockReturnValue(pending.asObservable());
    const store = TestBed.inject(UserEditorStore);
    store.initializeCreate();
    store.updateCreateGeneral(
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.test',
        password: 'StrongPassword123!',
        phoneNumber: '',
        isActive: true,
      },
      true,
    );
    store.toggleRole('role-1', true);

    store.create();
    store.create();
    expect(api.createUser).toHaveBeenCalledOnce();
    pending.error(
      new HttpErrorResponse({
        status: 409,
        error: { type: 'urn:carecomply:problem:user-duplicate-email' },
      }),
    );
    expect(store.error()).toBe('duplicateEmail');
  });

  it('lets an administrator control create-time MFA independently of the role', () => {
    const store = TestBed.inject(UserEditorStore);
    store.initializeCreate();
    store.setCreateMfa(true);
    store.setCreateMfaMethod('Email');
    expect(store.createRequiresMfa()).toBe(true);
    expect(store.createMfaMethod()).toBe('Email');

    store.setCreateMfa(false);
    expect(store.createRequiresMfa()).toBe(false);

    store.roles.set([
      {
        id: 'mfa-role',
        name: 'Protected role',
        permissions: ['User.Manage'],
        requiresMfa: true,
      },
    ]);
    store.selectCreateRole('mfa-role');
    store.setCreateMfa(false);
    expect(store.createMfaRequiredByRoles()).toBe(false);
    expect(store.createRequiresMfa()).toBe(false);
  });
});

describe('UserEditorStore existing-user roles', () => {
  const assignedRole = { id: 'role-1', name: 'Assigned Role' };
  const replacementRole = {
    id: 'role-2',
    name: 'Replacement Role',
    permissions: ['User.View'],
    requiresMfa: false,
  };
  const user = {
    id: 'user-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    displayName: 'Ada Lovelace',
    email: 'ada@example.test',
    phoneNumber: null,
    isActive: true,
    isMfaEnabled: false,
    requiresMfa: false,
    isMfaRequired: false,
    isMfaRequiredByPermissions: false,
    mfaMethod: 'Authenticator' as const,
    roles: [assignedRole],
    editorVersion: 'A'.repeat(64),
  };
  const updatedUser = {
    ...user,
    roles: [{ id: replacementRole.id, name: replacementRole.name }],
    editorVersion: 'B'.repeat(64),
  };
  const api = {
    getUser: vi.fn(),
    listRoles: vi.fn(),
    replaceRoles: vi.fn(),
  };

  beforeEach(() => {
    api.getUser.mockReset().mockReturnValue(of(user));
    api.listRoles
      .mockReset()
      .mockReturnValue(
        of([{ ...assignedRole, permissions: [], requiresMfa: false }, replacementRole]),
      );
    api.replaceRoles.mockReset().mockReturnValue(of(updatedUser));
    TestBed.configureTestingModule({
      providers: [
        UserEditorStore,
        { provide: UserManagementApiService, useValue: api },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
  });

  it('loads assigned and available roles for a manager', () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.User.Manage]);
    const store = TestBed.inject(UserEditorStore);

    store.load(user.id);

    expect(api.getUser).toHaveBeenCalledWith(user.id);
    expect(api.listRoles).toHaveBeenCalledOnce();
    expect(store.selectedRoleIds()).toEqual([assignedRole.id]);
    expect(store.roles().map((role) => role.id)).toEqual([assignedRole.id, replacementRole.id]);
  });

  it('retains an assigned role when it is absent from the selectable role response', () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.User.Manage]);
    api.listRoles.mockReturnValue(of([replacementRole]));
    const store = TestBed.inject(UserEditorStore);

    store.load(user.id);

    expect(store.selectedRoleIds()).toEqual([assignedRole.id]);
    expect(store.roles().map((role) => role.id)).toEqual([assignedRole.id, replacementRole.id]);
  });

  it('uses safe assigned-role metadata without loading manageable roles for a viewer', () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.User.View]);
    const store = TestBed.inject(UserEditorStore);

    store.load(user.id);

    expect(api.listRoles).not.toHaveBeenCalled();
    expect(store.roles()).toEqual([
      {
        ...assignedRole,
        permissions: [],
        requiresMfa: false,
      },
    ]);
  });

  it('replaces roles with the current editor version and accepts the authoritative response', () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.User.Manage]);
    const store = TestBed.inject(UserEditorStore);
    store.load(user.id);

    store.replaceRoles([replacementRole.id]);

    expect(api.replaceRoles).toHaveBeenCalledWith(user.id, {
      roleIds: [replacementRole.id],
      editorVersion: user.editorVersion,
    });
    expect(store.selectedRoleIds()).toEqual([replacementRole.id]);
    expect(store.user()?.editorVersion).toBe(updatedUser.editorVersion);
    expect(store.successMessage()).toContain('sessions were revoked');
  });
});
