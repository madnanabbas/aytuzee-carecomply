import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientContact, ClientContactsApiService, ClientContactType, SaveClientContact } from '../../data-access/client-contacts-api.service';
import { formatContactPhone, isValidContactEmail, isValidContactPhone, maskContactPhoneInput } from '../../models/contact-input-formatting';

@Component({ selector: 'app-client-contacts', standalone: true, imports: [FormsModule], templateUrl: './client-contacts.html', styleUrl: '../client-related-section.css' })
export class ClientContactsComponent implements OnInit {
  readonly clientId = input.required<string>();
  private readonly api = inject(ClientContactsApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly canCreate = computed(() => this.auth.hasPermission(Permissions.ClientContact.Create));
  readonly canEdit = computed(() => this.auth.hasPermission(Permissions.ClientContact.Edit));
  readonly contacts = signal<readonly ClientContact[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly panelOpen = signal(false);
  readonly editing = signal<ClientContact | null>(null);
  readonly draft = { type: 'General' as ClientContactType, name: '', relationship: '', phone: '', email: '', address: '', isActive: true };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(this.clientId()).pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: contacts => this.contacts.set(contacts), error: () => this.error.set('Contacts could not be loaded.') });
  }

  add(): void {
    this.editing.set(null);
    Object.assign(this.draft, { type: 'General', name: '', relationship: '', phone: '', email: '', address: '', isActive: true });
    this.error.set(null);
    this.panelOpen.set(true);
  }

  edit(contact: ClientContact): void {
    this.editing.set(contact);
    Object.assign(this.draft, { type: contact.type, name: contact.name, relationship: contact.relationship,
      phone: formatContactPhone(contact.phone), email: contact.email, address: contact.address, isActive: contact.isActive });
    this.error.set(null);
    this.panelOpen.set(true);
  }

  close(): void { if (!this.saving()) this.panelOpen.set(false); }

  onPhoneInput(event: Event): void { this.draft.phone = maskContactPhoneInput(event); }
  onEmailBlur(): void { this.draft.email = this.draft.email.trim(); }
  validEmail(): boolean { return isValidContactEmail(this.draft.email); }
  validPhone(): boolean { return isValidContactPhone(this.draft.phone, true); }

  valid(): boolean {
    return !!this.draft.name.trim() && !!this.draft.relationship.trim() && this.validPhone()
      && this.draft.name.length <= 200 && this.draft.relationship.length <= 100 && this.draft.phone.length <= 30
      && this.draft.address.length <= 500 && this.draft.email.length <= 320
      && this.validEmail();
  }

  save(): void {
    if (this.saving() || !this.valid()) return;
    const request: SaveClientContact = {
      type: this.draft.type, name: this.draft.name.trim(), relationship: this.draft.relationship.trim(),
      phone: this.draft.phone.trim(), email: this.draft.email.trim(), address: this.draft.address.trim(), isActive: this.draft.isActive,
    };
    const existing = this.editing();
    this.saving.set(true);
    this.error.set(null);
    const action = existing
      ? this.api.update(this.clientId(), existing.id, request)
      : this.api.create(this.clientId(), request);
    action.pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: contact => {
        this.contacts.update(items => existing
          ? items.map(item => item.id === contact.id ? contact : item)
          : [...items, contact].sort((a, b) => a.name.localeCompare(b.name)));
        this.panelOpen.set(false);
      },
      error: () => this.error.set('Could not save the contact. Check the details and try again.'),
    });
  }
}
