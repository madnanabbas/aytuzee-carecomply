import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import {
  CareCoordinator,
  ClientCareCoordinatorApiService,
  SaveCareCoordinator,
} from '../../data-access/client-care-coordinator-api.service';
import {
  formatContactPhone,
  isValidContactEmail,
  isValidContactPhone,
  maskContactPhoneInput,
} from '../../../../shared/formatting/contact-input-formatting';

@Component({
  selector: 'app-client-care-coordinators',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-care-coordinators.html',
  styleUrl: '../client-related-section.css',
})
export class ClientCareCoordinatorsComponent implements OnInit {
  readonly clientId = input.required<string>();
  private readonly api = inject(ClientCareCoordinatorApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly canCreate = computed(() =>
    this.auth.hasPermission(Permissions.ClientCareCoordinator.Create),
  );
  readonly canEdit = computed(() =>
    this.auth.hasPermission(Permissions.ClientCareCoordinator.Edit),
  );
  readonly canView = computed(() =>
    this.auth.hasPermission(Permissions.ClientCareCoordinator.View),
  );
  readonly coordinators = signal<readonly CareCoordinator[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal<CareCoordinator | null>(null);
  readonly draft = {
    name: '',
    companyName: '',
    phone: '',
    phoneExtension: '',
    fax: '',
    email: '',
    isActive: true,
  };

  ngOnInit(): void {
    this.resetDraft();
    if (this.canView()) this.load();
    else this.loading.set(false);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(this.clientId())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => this.coordinators.set(items),
        error: () => this.error.set('Care coordinators could not be loaded.'),
      });
  }

  add(): void {
    if (!this.saving()) this.resetDraft();
  }

  edit(value: CareCoordinator): void {
    this.editing.set(value);
    Object.assign(this.draft, {
      name: value.name,
      companyName: value.companyName,
      phone: formatContactPhone(value.phone),
      phoneExtension: value.phoneExtension,
      fax: formatContactPhone(value.fax),
      email: value.email,
      isActive: value.isActive,
    });
    this.error.set(null);
  }

  close(): void {
    if (!this.saving()) this.resetDraft();
  }

  onPhoneInput(field: 'phone' | 'fax', event: Event): void {
    this.draft[field] = maskContactPhoneInput(event);
  }
  onEmailBlur(): void {
    this.draft.email = this.draft.email.trim();
  }
  onExtensionInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.draft.phoneExtension = input.value.replace(/\D/g, '').slice(0, 15);
    input.value = this.draft.phoneExtension;
  }
  validEmail(): boolean {
    return isValidContactEmail(this.draft.email);
  }
  validPhone(field: 'phone' | 'fax'): boolean {
    return isValidContactPhone(this.draft[field]);
  }

  valid(): boolean {
    return (
      !!this.draft.name.trim() &&
      this.draft.name.length <= 200 &&
      this.draft.companyName.length <= 200 &&
      this.validPhone('phone') &&
      this.validPhone('fax') &&
      /^\d{0,15}$/.test(this.draft.phoneExtension) &&
      this.validEmail()
    );
  }

  hasUnsavedDraft(): boolean {
    return (
      this.editing() !== null ||
      !!this.draft.name.trim() ||
      !!this.draft.companyName.trim() ||
      !!this.draft.phone.trim() ||
      !!this.draft.phoneExtension.trim() ||
      !!this.draft.fax.trim() ||
      !!this.draft.email.trim() ||
      !this.draft.isActive
    );
  }

  canLeaveStep(): boolean {
    if (!this.hasUnsavedDraft()) return true;
    this.error.set('Save the coordinator or cancel your changes before continuing.');
    return false;
  }

  save(): void {
    if (this.saving() || !this.valid()) return;
    const request: SaveCareCoordinator = {
      name: this.draft.name.trim(),
      companyName: this.draft.companyName.trim(),
      phone: this.draft.phone.trim(),
      phoneExtension: this.draft.phoneExtension.trim(),
      fax: this.draft.fax.trim(),
      email: this.draft.email.trim(),
      isActive: this.draft.isActive,
    };
    const current = this.editing();
    this.saving.set(true);
    this.error.set(null);
    const operation = current
      ? this.api.update(this.clientId(), current.id, request)
      : this.api.create(this.clientId(), request);
    operation
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.coordinators.update((items) =>
            current
              ? items.map((item) => (item.id === saved.id ? saved : item))
              : [...items, saved].sort((a, b) => a.name.localeCompare(b.name)),
          );
          this.resetDraft();
        },
        error: () =>
          this.error.set('Could not save the care coordinator. Check the details and try again.'),
      });
  }

  private resetDraft(): void {
    this.editing.set(null);
    Object.assign(this.draft, {
      name: '',
      companyName: '',
      phone: '',
      phoneExtension: '',
      fax: '',
      email: '',
      isActive: true,
    });
    this.error.set(null);
  }
}
