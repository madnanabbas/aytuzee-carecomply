import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ClientFormModel } from '../../models/client-form.models';

export interface ClientEditArrayToggle {
  readonly field: 'services' | 'languages' | 'diet';
  readonly value: string;
  readonly event: Event;
}

export interface ClientEditPhoneChange {
  readonly field: 'phone1' | 'phone2' | 'companyPhone';
  readonly value: string;
}

export interface ClientEditSupervisorOption {
  readonly id: string;
  readonly name: string;
  readonly jobTitle: string;
}

@Component({
  selector: 'app-client-edit-basic-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-edit-basic-section.html',
  styleUrl: './client-edit-form.css',
})
export class ClientEditBasicSectionComponent {
  @Input() mode: 'basic' | 'contact' = 'basic';
  @Input({ required: true }) model!: ClientFormModel;
  @Input() fieldErrors: Readonly<Record<string, string>> = {};
  @Input() locations: readonly string[] = [];
  @Input() serviceOptions: readonly string[] = [];
  @Input() servicesOpen = false;
  @Input() languageOptions: readonly string[] = [];
  @Input() languagesOpen = false;
  @Input() supervisorOptions: readonly ClientEditSupervisorOption[] = [];
  @Input() supervisorLoading = false;
  @Input() assignedSupervisorUnavailable = false;

  @Output() readonly pmiInput = new EventEmitter<Event>();
  @Output() readonly ssnChanged = new EventEmitter<string>();
  @Output() readonly servicesDropdownToggled = new EventEmitter<void>();
  @Output() readonly languagesDropdownToggled = new EventEmitter<void>();
  @Output() readonly arrayToggled = new EventEmitter<ClientEditArrayToggle>();
  @Output() readonly phoneChanged = new EventEmitter<ClientEditPhoneChange>();
  @Output() readonly postalCodeChanged = new EventEmitter<string>();

  normalizePmi(event: Event): void {
    this.pmiInput.emit(event);
  }

  normalizeSsn(value: string): void {
    this.ssnChanged.emit(value);
  }

  toggleServicesDropdown(): void {
    this.servicesDropdownToggled.emit();
  }

  toggleLanguagesDropdown(): void {
    this.languagesDropdownToggled.emit();
  }

  toggleArray(field: 'services' | 'languages' | 'diet', value: string, event: Event): void {
    this.arrayToggled.emit({ field, value, event });
  }

  normalizePhone(field: 'phone1' | 'phone2' | 'companyPhone', value: string): void {
    this.phoneChanged.emit({ field, value });
  }

  normalizePostalCode(value: string): void {
    this.postalCodeChanged.emit(value);
  }

  selectedLabel(values: readonly string[], placeholder: string): string {
    return values.length ? values.join(', ') : placeholder;
  }

  fieldError(field: string): string | null {
    return this.fieldErrors[field] ?? null;
  }
}
