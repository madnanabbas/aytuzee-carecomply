import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
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
  readonly hasMultipleAssignedRoles = computed(() =>
    !this.store.isCreateMode() && (this.store.user()?.roles.length ?? 0) > 1);
  readonly confirmingDeactivation = signal(false);
  readonly confirmingMfaDisable = signal(false);
  readonly pendingMfaMethod = signal<UserMfaMethod | null>(null);
  readonly form = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phoneNumber: ['', [Validators.maxLength(32), Validators.pattern(/^\+?[0-9 ()-]{7,32}$/)]],
    isActive: [true],
  });

  constructor() {
    if (this.store.isCreateMode()) {
      this.form.reset(this.store.createGeneral(), { emitEvent: false });
      this.syncCreateDraft();
      this.form.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.syncCreateDraft());
    } else {
      effect(() => {
        const user = this.store.user();
        if (!user) return;
        this.form.reset({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber ?? '',
          isActive: user.isActive,
        });
        if (!this.canManage()) this.form.disable();
      });
    }
  }

  save(): void {
    const user = this.store.user();
    if (!user || !this.canManage() || this.form.invalid || this.form.pristine) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.store.saveGeneral({
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      phoneNumber: value.phoneNumber.trim() || null,
      editorVersion: user.editorVersion,
    });
  }

  cancel(): void {
    const user = this.store.user();
    if (!user) return;
    this.store.clearMessages();
    this.form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? '',
      isActive: user.isActive,
    });
  }

  confirmDeactivation(): void {
    this.confirmingDeactivation.set(false);
    this.store.setActive(false);
  }

  changeStatus(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const user = this.store.user();
    if (!user) return;

    const requestedActive = event.target.value === 'active';
    event.target.value = user.isActive ? 'active' : 'inactive';
    if (requestedActive === user.isActive) return;

    if (requestedActive) {
      this.store.setActive(true);
    } else {
      this.confirmingDeactivation.set(true);
    }
  }

  changeMfa(isEnabled: boolean): void {
    const user = this.store.user();
    if (!user || user.isMfaRequiredByPermissions && !isEnabled) return;
    if (isEnabled) {
      this.store.setMfa(true, user.mfaMethod);
    } else {
      this.confirmingMfaDisable.set(true);
    }
  }

  confirmMfaDisable(): void {
    this.confirmingMfaDisable.set(false);
    this.store.setMfa(false, this.store.user()?.mfaMethod ?? 'Authenticator');
  }

  changeEditMfaMethod(method: UserMfaMethod): void {
    const user = this.store.user();
    if (!user || user.mfaMethod === method) return;
    this.pendingMfaMethod.set(method);
  }

  confirmMfaMethodChange(): void {
    const method = this.pendingMfaMethod();
    this.pendingMfaMethod.set(null);
    if (method) this.store.setMfa(true, method);
  }

  changeCreateRole(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      this.store.selectCreateRole(event.target.value);
    }
  }

  changeEditRole(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const user = this.store.user();
    if (!user || this.hasMultipleAssignedRoles()) return;

    const roleId = event.target.value;
    event.target.value = user.roles.at(0)?.id ?? '';
    if (!roleId || roleId === user.roles.at(0)?.id) return;
    this.store.replaceRoles([roleId]);
  }

  changeCreateMfa(isEnabled: boolean): void {
    this.store.setCreateMfa(isEnabled);
  }

  changeCreateMfaMethod(method: UserMfaMethod): void {
    this.store.setCreateMfaMethod(method);
  }

  private syncCreateDraft(): void {
    const value = this.form.getRawValue();
    this.store.updateCreateGeneral({
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phoneNumber: value.phoneNumber,
      isActive: value.isActive,
    }, this.form.valid);
  }
}
