import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
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
    createGeneral: signal({ firstName: '', lastName: '', email: '', phoneNumber: '', isActive: true }),
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
      providers: [{ provide: UserEditorStore, useValue: store }],
    });
    TestBed.inject(AuthorizationService).setPermissions([Permissions.User.Manage]);
  });

  it('binds all named controls to the General form group', () => {
    const fixture = TestBed.createComponent(UserGeneralPageComponent);

    expect(() => fixture.detectChanges()).not.toThrow();
    const form = (fixture.nativeElement as HTMLElement).querySelector('form');
    expect(form).not.toBeNull();
    expect(form?.querySelectorAll('[formcontrolname]')).toHaveLength(4);
    expect(Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('select option'))
      .map((option) => option.textContent?.trim())).toEqual(['Active', 'Inactive']);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('input[type="radio"]'))
      .toHaveLength(2);
  });

  it('requires confirmation before disabling an enrolled authenticator', () => {
    store.setMfa.mockClear();
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.changeMfa(false);
    fixture.detectChanges();
    expect(store.setMfa).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Confirm MFA disable');

    fixture.componentInstance.confirmMfaDisable();
    expect(store.setMfa).toHaveBeenCalledWith(false, 'Authenticator');
  });

  it('captures validated create-mode General data without a password field', () => {
    store.isCreateMode.set(true);
    const fixture = TestBed.createComponent(UserGeneralPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      phoneNumber: '+1 555 0100',
      isActive: false,
    });
    fixture.detectChanges();

    expect(store.updateCreateGeneral).toHaveBeenLastCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      phoneNumber: '+1 555 0100',
      isActive: false,
    }, true);
    expect((fixture.nativeElement as HTMLElement).querySelector('[formcontrolname="isActive"]'))
      .not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('input[type="password"]'))
      .toBeNull();
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

    expect(store.replaceRoles).toHaveBeenCalledWith(['role-2']);
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
