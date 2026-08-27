import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { UserEditorStore } from '../../data-access/user-editor.store';
import { UserMfaMethod } from '../../models/user-management.models';

@Component({
  selector: 'app-user-general-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-general-page.html',
})
export class UserGeneralPageComponent {
  readonly store = inject(UserEditorStore);
  private readonly authorization = inject(AuthorizationService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly canManage = computed(() => this.authorization.hasPermission(Permissions.User.Manage));

  readonly hasMultipleAssignedRoles = computed(
    () => !this.store.isCreateMode() && (this.store.user()?.roles.length ?? 0) > 1,
  );

  /**
   * Existing-user access changes are drafts only.
   * No API is called when an administrator changes a dropdown, switch, or radio button.
   * Everything is persisted only from Save changes.
   */
  readonly editRoleId = signal('');
  readonly editMfaEnabled = signal(false);
  readonly editMfaMethod = signal<UserMfaMethod>('Authenticator');

  readonly accessDraftChanged = computed(() => {
    if (this.store.isCreateMode()) {
      return false;
    }

    const user = this.store.user();
    if (!user) {
      return false;
    }

    const currentRoleId = user.roles.length === 1 ? (user.roles[0]?.id ?? '') : '';
    const currentMfaEnabled = user.isMfaRequired || user.isMfaEnabled;

    const roleChanged = !this.hasMultipleAssignedRoles() && this.editRoleId() !== currentRoleId;

    const mfaChanged =
      this.editMfaEnabled() !== currentMfaEnabled ||
      (this.editMfaEnabled() && this.editMfaMethod() !== user.mfaMethod);

    return roleChanged || mfaChanged;
  });

  readonly form = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    password: ['', [Validators.minLength(15), Validators.maxLength(128)]],
    phoneNumber: ['', [Validators.maxLength(32), Validators.pattern(/^\+?[0-9 ()-]{7,32}$/)]],
    isActive: [true],
  });

  constructor() {
    if (this.store.isCreateMode()) {
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
      this.form.reset(this.store.createGeneral(), { emitEvent: false });
      this.syncCreateDraft();
      this.form.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.syncCreateDraft());
      return;
    }

    effect(() => {
      const user = this.store.user();
      if (!user) {
        return;
      }

      this.resetEditDraft(user);

      if (!this.canManage()) {
        this.form.disable({ emitEvent: false });
      }
    });
  }

  save(): void {
    const user = this.store.user();

    if (!user || !this.canManage() || this.form.invalid || this.store.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const firstName = value.firstName.trim();
    const lastName = value.lastName.trim();
    const email = value.email.trim();
    const phoneNumber = value.phoneNumber.trim() || null;
    const password = value.password.trim() || null;

    const generalChanged =
      firstName !== user.firstName ||
      lastName !== user.lastName ||
      email !== user.email ||
      phoneNumber !== user.phoneNumber ||
      password !== null;

    const statusChanged = value.isActive !== user.isActive;

    const roleIds = this.hasMultipleAssignedRoles()
      ? user.roles.map((role) => role.id)
      : this.editRoleId()
        ? [this.editRoleId()]
        : [];

    const rolesChanged =
      !this.hasMultipleAssignedRoles() && roleIds[0] !== (user.roles[0]?.id ?? '');

    const currentMfaEnabled = user.isMfaRequired || user.isMfaEnabled;
    const mfaChanged =
      this.editMfaEnabled() !== currentMfaEnabled ||
      (this.editMfaEnabled() && this.editMfaMethod() !== user.mfaMethod);

    if (!generalChanged && !statusChanged && !rolesChanged && !mfaChanged) {
      return;
    }

    this.store.saveEdit({
      general: {
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        editorVersion: user.editorVersion,
      },
      isActive: value.isActive,
      roleIds,
      mfaEnabled: this.editMfaEnabled(),
      mfaMethod: this.editMfaMethod(),
      generalChanged,
      statusChanged,
      rolesChanged,
      mfaChanged,
    });
  }

  cancel(): void {
    const user = this.store.user();
    if (!user) {
      return;
    }

    this.store.clearMessages();
    this.resetEditDraft(user);
  }

  hasPendingChanges(): boolean {
    return this.form.dirty || this.accessDraftChanged();
  }

  changeCreateRole(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      this.store.selectCreateRole(event.target.value);
    }
  }

  changeEditRole(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement) || this.hasMultipleAssignedRoles()) {
      return;
    }

    this.editRoleId.set(event.target.value);

    const select = event.target as HTMLSelectElement;

    const selectedRole = this.store.roles().find((role) => role.id === select.value);

    if (selectedRole?.requiresMfa) {
      this.editMfaEnabled.set(true);
    }
    this.store.clearMessages();
  }

  changeCreateMfa(isEnabled: boolean): void {
    this.store.setCreateMfa(isEnabled);
  }

  changeMfa(isEnabled: boolean): void {
    const user = this.store.user();
    if (!user || (!isEnabled && user.isMfaRequiredByPermissions)) {
      return;
    }

    this.editMfaEnabled.set(isEnabled);
    this.store.clearMessages();
  }

  changeCreateMfaMethod(method: UserMfaMethod): void {
    this.store.setCreateMfaMethod(method);
  }

  changeEditMfaMethod(method: UserMfaMethod): void {
    if (!this.editMfaEnabled()) {
      return;
    }

    this.editMfaMethod.set(method);
    this.store.clearMessages();
  }

  private resetEditDraft(user: NonNullable<ReturnType<UserEditorStore['user']>>): void {
    this.form.reset(
      {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        phoneNumber: user.phoneNumber ?? '',
        isActive: user.isActive,
      },
      { emitEvent: false },
    );

    this.editRoleId.set(user.roles.length === 1 ? (user.roles[0]?.id ?? '') : '');
    this.editMfaEnabled.set(user.isMfaRequired || user.isMfaEnabled);
    this.editMfaMethod.set(user.mfaMethod);
  }

  private syncCreateDraft(): void {
    const value = this.form.getRawValue();
    this.store.updateCreateGeneral(
      {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        password: value.password,
        phoneNumber: value.phoneNumber,
        isActive: value.isActive,
      },
      this.form.valid,
    );
  }
}
