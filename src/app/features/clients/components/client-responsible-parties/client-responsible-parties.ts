import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import {
  ClientResponsiblePartyApiService,
  ResponsibleParty,
  SaveResponsibleParty,
} from '../../data-access/client-responsible-party-api.service';
import {
  formatContactPhone,
  isValidContactEmail,
  isValidContactPhone,
  maskContactPhoneInput,
} from '../../../../shared/formatting/contact-input-formatting';

@Component({
  selector: 'app-client-responsible-parties',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-responsible-parties.html',
  styleUrl: '../client-related-section.css',
})
export class ClientResponsiblePartiesComponent implements OnInit {
  readonly clientId = input.required<string>();
  private readonly api = inject(ClientResponsiblePartyApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(Permissions.ClientResponsibleParty.Create),
  );
  readonly canEdit = computed(() =>
    this.authorization.hasPermission(Permissions.ClientResponsibleParty.Edit),
  );
  readonly canView = computed(() =>
    this.authorization.hasPermission(Permissions.ClientResponsibleParty.View),
  );
  readonly parties = signal<readonly ResponsibleParty[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal<ResponsibleParty | null>(null);
  readonly draft = {
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    livesWithClient: null as boolean | null,
    hasSpenddown: null as boolean | null,
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
        next: (items) => this.parties.set(items),
        error: () => this.error.set('Responsible parties could not be loaded.'),
      });
  }

  add(): void {
    if (!this.saving()) this.resetDraft();
  }

  edit(party: ResponsibleParty): void {
    this.editing.set(party);
    Object.assign(this.draft, {
      name: party.name,
      firstName: party.firstName ?? '',
      middleName: party.middleName ?? '',
      lastName: party.lastName ?? '',
      relationship: party.relationship,
      phone: formatContactPhone(party.phone),
      email: party.email,
      address: party.address,
      livesWithClient: party.livesWithClient,
      hasSpenddown: party.hasSpenddown,
      isActive: party.isActive,
    });
    this.error.set(null);
  }

  close(): void {
    if (!this.saving()) this.resetDraft();
  }

  onPhoneInput(event: Event): void {
    this.draft.phone = maskContactPhoneInput(event);
  }
  onEmailBlur(): void {
    this.draft.email = this.draft.email.trim();
  }
  validEmail(): boolean {
    return isValidContactEmail(this.draft.email);
  }
  validPhone(): boolean {
    return isValidContactPhone(this.draft.phone, true);
  }

  save(): void {
    if (this.saving() || !this.valid()) return;
    const request: SaveResponsibleParty = {
      name: this.draft.name.trim(),
      firstName: this.nullableTrimmed(this.draft.firstName),
      middleName: this.nullableTrimmed(this.draft.middleName),
      lastName: this.nullableTrimmed(this.draft.lastName),
      relationship: this.draft.relationship.trim(),
      phone: this.draft.phone.trim(),
      email: this.draft.email.trim(),
      address: this.draft.address.trim(),
      livesWithClient: this.draft.livesWithClient,
      hasSpenddown: this.draft.hasSpenddown,
      isActive: this.draft.isActive,
    };
    const existing = this.editing();
    this.saving.set(true);
    this.error.set(null);
    const operation = existing
      ? this.api.update(this.clientId(), existing.id, request)
      : this.api.create(this.clientId(), request);
    operation
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.parties.update((items) =>
            existing
              ? items.map((item) => (item.id === saved.id ? saved : item))
              : [...items, saved].sort((a, b) => a.name.localeCompare(b.name)),
          );
          this.resetDraft();
        },
        error: () =>
          this.error.set('Could not save the responsible party. Check the details and try again.'),
      });
  }

  valid(): boolean {
    return (
      !!this.draft.name.trim() &&
      !!this.draft.relationship.trim() &&
      this.validPhone() &&
      this.draft.name.length <= 200 &&
      this.draft.firstName.length <= 100 &&
      this.draft.middleName.length <= 100 &&
      this.draft.lastName.length <= 100 &&
      this.draft.relationship.length <= 100 &&
      this.draft.phone.length <= 30 &&
      this.draft.address.length <= 500 &&
      this.draft.email.length <= 320 &&
      this.validEmail() &&
      this.draft.livesWithClient !== null &&
      this.draft.hasSpenddown !== null
    );
  }

  hasUnsavedDraft(): boolean {
    return (
      this.editing() !== null ||
      !!this.draft.name.trim() ||
      !!this.draft.firstName.trim() ||
      !!this.draft.middleName.trim() ||
      !!this.draft.lastName.trim() ||
      !!this.draft.relationship.trim() ||
      !!this.draft.phone.trim() ||
      !!this.draft.email.trim() ||
      !!this.draft.address.trim() ||
      this.draft.livesWithClient !== null ||
      this.draft.hasSpenddown !== null ||
      !this.draft.isActive
    );
  }

  canLeaveStep(): boolean {
    if (!this.hasUnsavedDraft()) return true;
    this.error.set('Save the responsible party or cancel your changes before continuing.');
    return false;
  }

  structuredName(party: ResponsibleParty): string {
    return [party.firstName, party.middleName, party.lastName]
      .filter((part): part is string => !!part)
      .join(' ');
  }

  private resetDraft(): void {
    this.editing.set(null);
    Object.assign(this.draft, {
      name: '',
      firstName: '',
      middleName: '',
      lastName: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      livesWithClient: null,
      hasSpenddown: null,
      isActive: true,
    });
    this.error.set(null);
  }

  private nullableTrimmed(value: string): string | null {
    const trimmed = value.trim();
    return trimmed || null;
  }
}
