import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { CompanyService } from '../../../companies/company.service';
import { LocationService } from '../../../companies/location.service';
import { UserEditorStore } from '../../data-access/user-editor.store';
import { UserGeneralPageComponent } from './user-general-page';

describe('UserGeneralPageComponent', () => {
  const existingUser = {
    id: 'user-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    displayName: 'Ada Lovelace',
    email: 'ada@example.test',
    phoneNumber: null,
    isActive: true,
    isMfaEnabled: true,
    requiresMfa: true,
    isMfaRequired: true,
    isMfaRequiredByPermissions: false,
    mfaMethod: 'Authenticator' as const,
    roles: [{ id: 'role-1', name: 'Database Role' }],
    editorVersion: 'A'.repeat(64),
  };
  const store = {
    isCreateMode: signal(false),
    createGeneral: signal({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', isActive: true }),
    roles: signal([{ id: 'role-1', name: 'Database Role', permissions: [], requiresMfa: false }]),
    selectedRoleIds: signal<readonly string[]>([]),
    createRequiresMfa: signal(false),
    createMfaMethod: signal<'Authenticator' | 'Email'>('Authenticator'),
    createMfaRequiredByRoles: signal(false),
    loading: signal(false),
    user: signal(existingUser),
    saving: signal(false),
    error: signal(null),
    successMessage: signal(null),
    saveGeneral: vi.fn(),
    saveEdit: vi.fn(),
    setActive: vi.fn(),
    setMfa: vi.fn(),
    replaceRoles: vi.fn(),
    clearMessages: vi.fn(),
    updateCreateGeneral: vi.fn(),
    selectCreateRole: vi.fn(),
    setCreateMfa: vi.fn(),
    setCreateMfaMethod: vi.fn(),
  };

  beforeEach(() => {
    store.isCreateMode.set(false);
    store.user.set(existingUser);
    store.roles.set([{ id: 'role-1', name: 'Database Role', permissions: [], requiresMfa: false }]);
    store.selectedRoleIds.set(['role-1']);
    store.updateCreateGeneral.mockClear();
    store.selectCreateRole.mockClear();
    store.setCreateMfa.mockClear();
    store.setCreateMfaMethod.mockClear();
    store.replaceRoles.mockClear();
    store.createRequiresMfa.set(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: UserEditorStore, useValue: store },
        { provide: AuthSessionService, useValue: {
          currentUser: signal({ companyId: 'company-1', isPlatformAdministrator: false }),
        } },
        { provide: CompanyService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
        { provide: LocationService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
      ],
    });
    TestBed.inject(AuthorizationService).setPermissions([Permissions.User.Manage]);
  });

  it('binds all named controls to the General form group', () => {
    const fixture = TestBed.createComponent(UserGeneralPageComponent);

    expect(() => fixture.detectChanges()).not.toThrow();
    const form = (fixture.nativeElement as HTMLElement).querySelector('form');
    expect(form).not.toBeNull();
    expect(form?.querySelectorAll('[formcontrolname]')).toHaveLength(6);
    expect(Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('#user-account-status option'))
      .map((option) => option.textContent?.trim())).toEqual(['Active', 'Inactive']);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('input[type="radio"]'))
      .toHaveLength(2);
  });

  it('keeps MFA changes local until Save changes is selected', () => {
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.changeMfa(false);

    expect(fixture.componentInstance.editMfaEnabled()).toBe(false);
    expect(store.setMfa).not.toHaveBeenCalled();
    expect(store.saveEdit).not.toHaveBeenCalled();
  });

  it('allows MFA to be turned off regardless of role permissions', () => {
    store.user.set({
      ...existingUser,
      isMfaRequiredByPermissions: true,
    });
    store.roles.set([
      { id: 'role-1', name: 'Protected Role', permissions: [], requiresMfa: true },
      { id: 'role-2', name: 'Standard Role', permissions: [], requiresMfa: false },
    ]);
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.changeMfa(false);

    expect(fixture.componentInstance.editMfaEnabled()).toBe(false);
  });

  it('captures validated create-mode General data without a password field', () => {
    store.isCreateMode.set(true);
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      companyId: 'company-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      password: 'StrongPassword123!',
      phoneNumber: '+1 555 0100',
      isActive: false,
      locationIds: ['location-1'],
    });
    fixture.detectChanges();

    expect(store.updateCreateGeneral).toHaveBeenLastCalledWith({
      companyId: 'company-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      password: 'StrongPassword123!',
      phoneNumber: '+1 555 0100',
      isActive: false,
      locationIds: ['location-1'],
    }, true);
    expect((fixture.nativeElement as HTMLElement).querySelector('[formcontrolname="isActive"]'))
      .not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('input[type="password"]'))
      .not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('input[name="mfa-method"]'))
      .toHaveLength(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Database Role');
  });

  it('shows the two approved methods only while create-mode MFA is on', () => {
    store.isCreateMode.set(true);
    store.createRequiresMfa.set(true);
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('input[name="mfa-method"]')).toHaveLength(2);
    expect(element.textContent).toContain('Use Microsoft Authenticator to verify sign-in.');
    expect(element.textContent).toContain(
      "Send a one-time verification code to the user's registered email.",
    );

    fixture.componentInstance.changeCreateMfaMethod('Email');
    expect(store.setCreateMfaMethod).toHaveBeenCalledWith('Email');
  });

  it('shows the assigned database role and submits an approved replacement', () => {
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();
    const select = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLSelectElement>('#user-role');

    expect(select?.value).toBe('role-1');
    expect(select?.disabled).toBe(false);

    store.roles.set([
      { id: 'role-1', name: 'Database Role', permissions: [], requiresMfa: false },
      { id: 'role-2', name: 'Replacement Role', permissions: [], requiresMfa: false },
    ]);
    fixture.detectChanges();
    select!.value = 'role-2';
    select!.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.editRoleId()).toBe('role-2');
    expect(store.replaceRoles).not.toHaveBeenCalled();
  });

  it('keeps role assignment read-only without User.Manage', () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.User.View]);
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement)
      .querySelector<HTMLSelectElement>('#user-role')?.disabled).toBe(true);
  });

  it('preserves ambiguous multiple-role assignments instead of choosing a primary role', () => {
    store.user.update((user) => ({
      ...user,
      roles: [
        { id: 'role-1', name: 'Database Role' },
        { id: 'role-2', name: 'Additional Role' },
      ],
    }));
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector<HTMLSelectElement>('#user-role')?.disabled).toBe(true);
    expect(element.textContent).toContain('Multiple roles assigned');
    expect(store.replaceRoles).not.toHaveBeenCalled();
  });

  it('renders MFA methods as compact labels without card styling', () => {
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();

    const labels = Array.from((fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLInputElement>('input[name="mfa-method"]'))
      .map((input) => input.closest('label'));
    expect(labels).toHaveLength(2);
    for (const label of labels) {
      expect(label?.classList.contains('border')).toBe(false);
      expect(Array.from(label?.classList ?? []).some((name) => name.startsWith('bg-'))).toBe(false);
      expect(label?.classList.contains('rounded-control')).toBe(false);
    }
  });
});
