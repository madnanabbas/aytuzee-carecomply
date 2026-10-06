import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize, forkJoin, Observable, of, switchMap } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import {
  CreateUserGeneral,
  EMPTY_CREATE_USER_GENERAL,
  RoleMetadata,
  UserDetails,
  UpdateUserGeneralRequest,
  UserMfaMethod,
} from '../models/user-management.models';
import { UserManagementApiService } from './user-management-api.service';

export interface SaveUserEditRequest {
  readonly general: UpdateUserGeneralRequest;
  readonly isActive: boolean;
  readonly roleIds: readonly string[];
  readonly mfaEnabled: boolean;
  readonly mfaMethod: UserMfaMethod;
  readonly generalChanged: boolean;
  readonly statusChanged: boolean;
  readonly rolesChanged: boolean;
  readonly mfaChanged: boolean;
}

export type UserEditorError =
  | 'conflict'
  | 'duplicateEmail'
  | 'invalidGeneral'
  | 'invalidRoles'
  | 'mfaRequiredByPermissions'
  | 'notFound'
  | 'failed'
  | null;

@Injectable()
export class UserEditorStore {
  private readonly api = inject(UserManagementApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly isCreateMode = signal(false);
  readonly user = signal<UserDetails | null>(null);
  readonly roles = signal<readonly RoleMetadata[]>([]);
  readonly selectedRoleIds = signal<readonly string[]>([]);
  readonly createGeneral = signal<CreateUserGeneral>(EMPTY_CREATE_USER_GENERAL);
  readonly createGeneralValid = signal(false);
  readonly createMfaEnabled = signal(false);
  readonly createMfaMethod = signal<UserMfaMethod>('Authenticator');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<UserEditorError>(null);
  readonly successMessage = signal<string | null>(null);
  readonly completionDialog = signal<{ readonly title: string; readonly message: string } | null>(
    null,
  );
  readonly selectedRoles = computed(() => {
    const selectedIds = new Set(this.selectedRoleIds());
    return this.roles().filter((role) => selectedIds.has(role.id));
  });
  readonly effectivePermissions = computed(() =>
    Array.from(new Set(this.selectedRoles().flatMap((role) => role.permissions))).sort(
      (left, right) => left.localeCompare(right),
    ),
  );
  readonly createMfaRequiredByRoles = computed(() => false);
  readonly createRequiresMfa = computed(() => this.createMfaEnabled());

  initializeCreate(): void {
    this.isCreateMode.set(true);
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listRoles()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (roles) => this.roles.set(roles),
        error: () => this.error.set('failed'),
      });
  }

  load(userId: string): void {
    this.isCreateMode.set(false);
    this.loading.set(true);
    this.error.set(null);
    const canManage = this.authorization.hasPermission(Permissions.User.Manage);
    forkJoin({
      user: this.api.getUser(userId),
      availableRoles: canManage ? this.api.listRoles() : of(null),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ user, availableRoles }) => {
          this.acceptUser(user);
          this.roles.set(mergeAssignedRoles(user, availableRoles ?? []));
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.status === 404 ? 'notFound' : 'failed'),
      });
  }

  updateCreateGeneral(value: CreateUserGeneral, isValid: boolean): void {
    this.createGeneral.set(value);
    this.createGeneralValid.set(isValid);
    if (this.error() === 'invalidGeneral') this.error.set(null);
  }

  toggleRole(roleId: string, selected: boolean): void {
    const next = new Set(this.selectedRoleIds());
    if (selected) next.add(roleId);
    else next.delete(roleId);
    this.selectedRoleIds.set(Array.from(next));
    if (this.error() === 'invalidRoles' && next.size > 0) this.error.set(null);
  }

  selectCreateRole(roleId: string): void {
    this.selectedRoleIds.set(roleId ? [roleId] : []);
    if (this.error() === 'invalidRoles' && roleId) this.error.set(null);
  }

  setCreateMfa(isEnabled: boolean): void {
    this.createMfaEnabled.set(isEnabled);
  }

  setCreateMfaMethod(method: UserMfaMethod): void {
    this.createMfaMethod.set(method);
  }

  create(): void {
    if (this.saving()) return;
    if (!this.createGeneralValid()) {
      this.error.set('invalidGeneral');
      void this.router.navigate(['/access-control/users/new/general']);
      return;
    }
    if (this.selectedRoleIds().length === 0) {
      this.error.set('invalidRoles');
      void this.router.navigate(['/access-control/users/new/general']);
      return;
    }

    const general = this.createGeneral();
    this.beginOperation();
    this.api
      .createUser({
        companyId: general.companyId || null,
        firstName: general.firstName.trim(),
        lastName: general.lastName.trim(),
        email: general.email.trim(),
        password: general.password,
        phoneNumber: general.phoneNumber.trim() || null,
        isActive: general.isActive,
        requiresMfa: this.createMfaEnabled(),
        mfaMethod: this.createMfaMethod(),
        roleIds: this.selectedRoleIds(),
        locationIds: general.locationIds ?? [],
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (_created) => {
          this.completionDialog.set({
            title: 'User created successfully',
            message:
              'The new CareComply user account was created and is ready for assigned access.',
          });
        },
        error: (error: HttpErrorResponse) => {
          const problemType = typeof error.error?.type === 'string' ? error.error.type : '';
          this.error.set(
            problemType.endsWith('user-duplicate-email')
              ? 'duplicateEmail'
              : problemType.endsWith('user-role-invalid')
                ? 'invalidRoles'
                : 'failed',
          );
        },
      });
  }

  saveEdit(request: SaveUserEditRequest): void {
    const currentUser = this.user();
    if (!currentUser || this.saving()) {
      return;
    }

    this.beginOperation();

    let operation$: Observable<UserDetails> = of(currentUser);

    if (request.generalChanged) {
      operation$ = operation$.pipe(
        switchMap((user) =>
          this.api.updateGeneral(user.id, {
            ...request.general,
            editorVersion: user.editorVersion,
          }),
        ),
      );
    }

    if (request.rolesChanged) {
      operation$ = operation$.pipe(
        switchMap((user) =>
          this.api.replaceRoles(user.id, {
            roleIds: request.roleIds,
            editorVersion: user.editorVersion,
          }),
        ),
      );
    }

    if (request.statusChanged) {
      operation$ = operation$.pipe(
        switchMap((user) => this.api.setActive(user.id, request.isActive, user.editorVersion)),
      );
    }

    if (request.mfaChanged) {
      operation$ = operation$.pipe(
        switchMap((user) =>
          this.api.setMfa(user.id, request.mfaEnabled, request.mfaMethod, user.editorVersion),
        ),
      );
    }

    operation$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.acceptUser(updated);
          this.completionDialog.set({
            title: 'User updated successfully',
            message:
              'The user account, access settings, and security changes were saved successfully.',
          });
        },
        error: (error: HttpErrorResponse) => {
          const problemType = typeof error.error?.type === 'string' ? error.error.type : '';

          this.error.set(
            problemType.endsWith('user-duplicate-email')
              ? 'duplicateEmail'
              : problemType.endsWith('user-role-invalid')
                ? 'invalidRoles'
                : problemType.endsWith('user-mfa-required-by-permissions')
                  ? 'mfaRequiredByPermissions'
                  : error.status === 409
                    ? 'conflict'
                    : 'failed',
          );
        },
      });
  }

  saveGeneral(request: UpdateUserGeneralRequest): void {
    const user = this.user();
    if (!user || this.saving()) return;

    this.beginOperation();
    this.api
      .updateGeneral(user.id, request)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.acceptUser(updated);
          this.completionDialog.set({
            title: 'User updated',
            message: 'The user details were updated successfully.',
          });
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.status === 409 ? 'conflict' : 'failed'),
      });
  }

  setActive(isActive: boolean): void {
    const user = this.user();
    if (!user || this.saving()) return;

    this.beginOperation();
    this.api
      .setActive(user.id, isActive, user.editorVersion)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.acceptUser(updated);
          this.successMessage.set(isActive ? 'User activated.' : 'User deactivated.');
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.status === 409 ? 'conflict' : 'failed'),
      });
  }

  setMfa(isEnabled: boolean, method: UserMfaMethod = 'Authenticator'): void {
    const user = this.user();
    if (!user || this.saving()) return;

    this.beginOperation();
    this.api
      .setMfa(user.id, isEnabled, method, user.editorVersion)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.acceptUser(updated);
          this.successMessage.set(
            isEnabled
              ? method === 'Email'
                ? 'Email MFA enabled. The user will receive a code during sign in after their email is confirmed.'
                : 'Authenticator MFA enabled. The user must enroll at their next login if needed.'
              : 'MFA disabled. Existing MFA enrollment and sessions were revoked.',
          );
        },
        error: (error: HttpErrorResponse) => {
          const problemType = typeof error.error?.type === 'string' ? error.error.type : '';
          this.error.set(
            problemType.endsWith('user-mfa-required-by-permissions')
              ? 'mfaRequiredByPermissions'
              : error.status === 409
                ? 'conflict'
                : 'failed',
          );
        },
      });
  }

  replaceRoles(roleIds: readonly string[]): void {
    const user = this.user();
    if (!user || this.saving()) return;

    this.beginOperation();
    this.api
      .replaceRoles(user.id, { roleIds, editorVersion: user.editorVersion })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.acceptUser(updated);
          this.successMessage.set('User role updated. Existing sessions were revoked.');
        },
        error: (error: HttpErrorResponse) => {
          const problemType = typeof error.error?.type === 'string' ? error.error.type : '';
          this.error.set(
            problemType.endsWith('user-role-invalid')
              ? 'invalidRoles'
              : error.status === 409
                ? 'conflict'
                : 'failed',
          );
        },
      });
  }

  clearMessages(): void {
    this.error.set(null);
    this.successMessage.set(null);
  }

  confirmCompletion(): void {
    if (!this.completionDialog()) return;
    this.completionDialog.set(null);
    void this.router.navigate(['/access-control/users']);
  }

  private beginOperation(): void {
    this.saving.set(true);
    this.clearMessages();
  }

  private acceptUser(user: UserDetails): void {
    this.user.set(user);
    this.selectedRoleIds.set(user.roles.map((role) => role.id));
  }
}

function mergeAssignedRoles(
  user: UserDetails,
  availableRoles: readonly RoleMetadata[],
): readonly RoleMetadata[] {
  const availableRoleIds = new Set(availableRoles.map((role) => role.id));
  const missingAssignedRoles = user.roles
    .filter((role) => !availableRoleIds.has(role.id))
    .map((role): RoleMetadata => ({
      ...role,
      ...(user.companyId ? { companyId: user.companyId } : {}),
      ...(user.companyName ? { companyName: user.companyName } : {}),
      permissions: [],
      requiresMfa: false,
    }));

  return [...availableRoles, ...missingAssignedRoles].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}
