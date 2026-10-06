import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import {
  ClientClinicalContactsApiService,
  ClinicalContact,
  ClinicalContactKind,
  ConsultationProviderInput,
  PhysicianInput,
} from '../../data-access/client-clinical-contacts-api.service';
import {
  formatContactPhone,
  isValidContactEmail,
  isValidContactPhone,
  maskContactPhoneInput,
} from '../../../../shared/formatting/contact-input-formatting';

@Component({
  selector: 'app-client-clinical-contacts',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-clinical-contacts.html',
  styleUrl: '../client-related-section.css',
})
export class ClientClinicalContactsComponent implements OnInit {
  readonly clientId = input.required<string>();
  readonly kind = input.required<ClinicalContactKind>();
  private readonly api = inject(ClientClinicalContactsApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly isPhysician = computed(() => this.kind() === 'physicians');
  readonly title = computed(() => (this.isPhysician() ? 'Doctors' : 'Consultation providers'));
  readonly canCreate = computed(() =>
    this.auth.hasPermission(
      this.isPhysician()
        ? Permissions.ClientPhysician.Create
        : Permissions.ClientConsultationProvider.Create,
    ),
  );
  readonly canEdit = computed(() =>
    this.auth.hasPermission(
      this.isPhysician()
        ? Permissions.ClientPhysician.Edit
        : Permissions.ClientConsultationProvider.Edit,
    ),
  );
  readonly canView = computed(() =>
    this.auth.hasPermission(
      this.isPhysician()
        ? Permissions.ClientPhysician.View
        : Permissions.ClientConsultationProvider.View,
    ),
  );
  readonly records = signal<readonly ClinicalContact[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal<ClinicalContact | null>(null);
  readonly draft = {
    name: '',
    phone: '',
    email: '',
    secondaryName: '',
    secondaryPhone: '',
    secondaryAddress: '',
    npi: '',
    fax: '',
    address: '',
    postalCode: '',
    city: '',
    state: '',
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
      .list(this.clientId(), this.kind())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (records) => this.records.set(records),
        error: () => this.error.set(`${this.title()} could not be loaded.`),
      });
  }

  add(): void {
    if (this.saving()) return;
    this.resetDraft();
  }

  edit(record: ClinicalContact): void {
    this.editing.set(record);
    Object.assign(this.draft, {
      name: record.name,
      phone: formatContactPhone(record.phone),
      email: record.email,
      secondaryName: record.secondaryName,
      secondaryPhone: formatContactPhone(record.secondaryPhone),
      secondaryAddress: record.secondaryAddress,
      npi: record.npi,
      fax: formatContactPhone(record.fax),
      address: record.address,
      postalCode: record.postalCode,
      city: record.city,
      state: record.state,
      isActive: record.isActive,
    });
    this.error.set(null);
  }

  close(): void {
    if (!this.saving()) this.resetDraft();
  }

  onPhoneInput(field: 'phone' | 'fax' | 'secondaryPhone', event: Event): void {
    this.draft[field] = maskContactPhoneInput(event);
  }
  onEmailBlur(): void {
    this.draft.email = this.draft.email.trim();
  }
  validEmail(): boolean {
    return isValidContactEmail(this.draft.email);
  }
  validPhone(field: 'phone' | 'fax' | 'secondaryPhone'): boolean {
    return isValidContactPhone(this.draft[field]);
  }

  onNpiInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.draft.npi = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = this.draft.npi;
  }

  valid(): boolean {
    if (!this.draft.name.trim() || this.draft.name.length > 200 || !this.validPhone('phone'))
      return false;
    if (this.isPhysician()) {
      return (
        (!this.draft.npi || /^[0-9]{10}$/.test(this.draft.npi)) &&
        this.validPhone('fax') &&
        this.draft.address.length <= 500 &&
        this.draft.postalCode.length <= 10 &&
        this.draft.city.length <= 100 &&
        this.draft.state.length <= 100
      );
    }
    return (
      this.validEmail() &&
      this.draft.secondaryName.length <= 200 &&
      this.validPhone('secondaryPhone') &&
      this.draft.secondaryAddress.length <= 500
    );
  }

  hasUnsavedDraft(): boolean {
    if (this.isPhysician()) {
      return (
        this.editing() !== null ||
        !!this.draft.name.trim() ||
        !!this.draft.npi.trim() ||
        !!this.draft.phone.trim() ||
        !!this.draft.fax.trim() ||
        !!this.draft.address.trim() ||
        !!this.draft.postalCode.trim() ||
        !!this.draft.city.trim() ||
        !!this.draft.state.trim() ||
        !this.draft.isActive
      );
    }
    return (
      this.editing() !== null ||
      !!this.draft.name.trim() ||
      !!this.draft.phone.trim() ||
      !!this.draft.email.trim() ||
      !!this.draft.secondaryName.trim() ||
      !!this.draft.secondaryPhone.trim() ||
      !!this.draft.secondaryAddress.trim() ||
      !this.draft.isActive
    );
  }

  canLeaveStep(): boolean {
    if (!this.hasUnsavedDraft()) return true;
    this.error.set(
      this.isPhysician()
        ? 'Save the doctor or cancel your changes before continuing.'
        : 'Save the consultation provider or cancel your changes before continuing.',
    );
    return false;
  }

  save(): void {
    if (this.saving() || !this.valid()) return;
    const request: ConsultationProviderInput | PhysicianInput = this.isPhysician()
      ? {
          name: this.draft.name.trim(),
          npi: this.draft.npi,
          phone: this.draft.phone.trim(),
          fax: this.draft.fax.trim(),
          address: this.draft.address.trim(),
          postalCode: this.draft.postalCode.trim(),
          city: this.draft.city.trim(),
          state: this.draft.state.trim(),
          isActive: this.draft.isActive,
        }
      : {
          name: this.draft.name.trim(),
          phone: this.draft.phone.trim(),
          email: this.draft.email.trim(),
          supportProviderName: this.draft.secondaryName.trim(),
          supportProviderPhone: this.draft.secondaryPhone.trim(),
          supportProviderAddress: this.draft.secondaryAddress.trim(),
          isActive: this.draft.isActive,
        };
    const current = this.editing();
    this.saving.set(true);
    this.error.set(null);
    const operation = current
      ? this.api.update(this.clientId(), this.kind(), current.id, request)
      : this.api.create(this.clientId(), this.kind(), request);
    operation
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.records.update((items) =>
            current
              ? items.map((item) => (item.id === saved.id ? saved : item))
              : [...items, saved].sort((a, b) => a.name.localeCompare(b.name)),
          );
          this.resetDraft();
        },
        error: () => this.error.set('Could not save this record. Check the details and try again.'),
      });
  }

  private resetDraft(): void {
    this.editing.set(null);
    Object.assign(this.draft, {
      name: '',
      phone: '',
      email: '',
      secondaryName: '',
      secondaryPhone: '',
      secondaryAddress: '',
      npi: '',
      fax: '',
      address: '',
      postalCode: '',
      city: '',
      state: '',
      isActive: true,
    });
    this.error.set(null);
  }
}
