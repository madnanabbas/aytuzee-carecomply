import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { Company, CompanyLookupService } from '../../../../../core/lookups/company-lookup.service';
import {
  CompanyLocation,
  LocationLookupService,
} from '../../../../../core/lookups/location-lookup.service';
import { UserEditorStore } from '../../data-access/user-editor.store';
import { UserMfaMethod } from '../../models/user-management.models';
import { UserAccountAccessSectionComponent } from './user-account-access-section';

@Component({
  selector: 'app-user-general-page',
  standalone: true,
  imports: [ReactiveFormsModule, UserAccountAccessSectionComponent],
  templateUrl: './user-general-page.html',
  styleUrls: ['../../user-density.css'],
})
export class UserGeneralPageComponent {
  readonly store = inject(UserEditorStore);
  private readonly authorization = inject(AuthorizationService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly session = inject(AuthSessionService);
  private readonly companyApi = inject(CompanyLookupService);
  private readonly locationApi = inject(LocationLookupService);
  readonly companies = signal<readonly Company[]>([]);
  readonly locations = signal<readonly CompanyLocation[]>([]);
  readonly isPlatformAdministrator = computed(
    () => this.session.currentUser()?.isPlatformAdministrator === true,
  );

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
    companyId: [''],
    firstName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    password: ['', [Validators.minLength(15), Validators.maxLength(128)]],
    phoneNumber: ['', [Validators.maxLength(32), Validators.pattern(/^\+?[0-9 ()-]{7,32}$/)]],
    isActive: [true],
    locationIds: [[] as string[], Validators.required],
  });

  constructor() {
    if (this.isPlatformAdministrator()) {
      if (this.store.isCreateMode())
        this.form.controls.companyId.addValidators(Validators.required);
      this.companyApi
        .list()
        .subscribe((companies) =>
          this.companies.set(companies.filter((company) => company.isActive)),
        );
    }
    if (this.store.isCreateMode()) {
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
      this.form.reset(this.store.createGeneral(), { emitEvent: false });
      if (!this.isPlatformAdministrator()) {
        this.form.controls.companyId.setValue(this.session.currentUser()?.companyId ?? '', {
          emitEvent: false,
        });
      }
      this.loadLocations(this.form.controls.companyId.value);
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
      if (!user.isPlatformAdministrator) this.loadLocations(user.companyId, user.locationIds ?? []);

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
    const companyId = user.isPlatformAdministrator ? null : value.companyId || user.companyId;

    const generalChanged =
      firstName !== user.firstName ||
      lastName !== user.lastName ||
      email !== user.email ||
      phoneNumber !== user.phoneNumber ||
      password !== null;
    const companyChanged = companyId !== user.companyId;
    const locationsChanged = !sameIds(value.locationIds, user.locationIds ?? []);

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

    if (!generalChanged && !companyChanged && !statusChanged && !rolesChanged && !mfaChanged) {
      return;
    }

    this.store.saveEdit({
      general: {
        companyId,
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        locationIds: value.locationIds,
        editorVersion: user.editorVersion,
      },
      isActive: value.isActive,
      roleIds,
      mfaEnabled: this.editMfaEnabled(),
      mfaMethod: this.editMfaMethod(),
      generalChanged: generalChanged || companyChanged || locationsChanged,
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

  changeCompany(): void {
    this.store.selectCreateRole('');
    this.editRoleId.set('');
    this.form.controls.locationIds.setValue([]);
    this.loadLocations(this.form.controls.companyId.value);
  }

  toggleLocation(locationId: string, selected: boolean): void {
    const next = new Set(this.form.controls.locationIds.value);
    if (selected) next.add(locationId);
    else next.delete(locationId);
    this.form.controls.locationIds.setValue([...next]);
    this.form.controls.locationIds.markAsDirty();
  }

  selectedLocationsLabel(): string {
    const selected = new Set(this.form.controls.locationIds.value);
    const names = this.locations()
      .filter((location) => selected.has(location.id))
      .map((location) => location.name);
    return names.length ? names.join(', ') : 'Select locations';
  }

  availableRoles(): readonly import('../../models/user-management.models').RoleMetadata[] {
    if (!this.isPlatformAdministrator()) return this.store.roles();
    const companyId = this.form.controls.companyId.value;
    const assignedRoleIds = new Set(this.store.user()?.roles.map((role) => role.id) ?? []);
    return this.store
      .roles()
      .filter(
        (role) =>
          assignedRoleIds.has(role.id) || (companyId !== '' && role.companyId === companyId),
      );
  }

  changeEditRole(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement) || this.hasMultipleAssignedRoles()) {
      return;
    }

    this.editRoleId.set(event.target.value);

    const select = event.target as HTMLSelectElement;

    this.store.clearMessages();
  }

  changeCreateMfa(isEnabled: boolean): void {
    this.store.setCreateMfa(isEnabled);
  }

  changeMfa(isEnabled: boolean): void {
    if (!this.store.user()) {
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
        companyId: user.companyId ?? '',
        lastName: user.lastName,
        email: user.email,
        password: '',
        phoneNumber: user.phoneNumber ?? '',
        isActive: user.isActive,
        locationIds: [...(user.locationIds ?? [])],
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
        companyId: value.companyId ?? '',
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        password: value.password,
        phoneNumber: value.phoneNumber,
        isActive: value.isActive,
        locationIds: value.locationIds ?? [],
      },
      this.form.valid,
    );
  }

  private loadLocations(companyId: string | null | undefined, selected?: readonly string[]): void {
    if (!companyId) {
      this.locations.set([]);
      return;
    }
    this.locationApi
      .list(this.isPlatformAdministrator() ? companyId : null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((locations) => {
        this.locations.set(locations);
        if (selected) this.form.controls.locationIds.setValue([...selected], { emitEvent: false });
        else if (!this.form.controls.locationIds.value.length) {
          const main = locations.find((location) => location.isMain);
          if (main) this.form.controls.locationIds.setValue([main.id]);
        }
      });
  }
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}
