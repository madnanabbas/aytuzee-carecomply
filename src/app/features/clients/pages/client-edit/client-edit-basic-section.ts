import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { CompanyLocation } from '../../../../core/lookups/location-lookup.service';
import type { ClientFormModel } from '../../models/client-form.models';
import { CLIENT_STATUS_OPTIONS } from '../../models/client-presentation';
import { formatUsSsn } from '../../models/client-field-validation';

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
  styleUrls: ['../client-create/client-create-form.css', './client-edit-form.css'],
})
export class ClientEditBasicSectionComponent {
  readonly statusOptions = CLIENT_STATUS_OPTIONS;
  @Input() mode: 'basic' | 'contact' = 'basic';
  @Input({ required: true }) model!: ClientFormModel;
  @Input() fieldErrors: Readonly<Record<string, string>> = {};
  @Input() locationOptions: readonly CompanyLocation[] = [];
  @Input() serviceOptions: readonly string[] = [];
  @Input() servicesOpen = false;
  @Input() languageOptions: readonly string[] = [];
  @Input() languagesOpen = false;
  @Input() supervisorOptions: readonly ClientEditSupervisorOption[] = [];
  @Input() supervisorLoading = false;
  @Input() assignedSupervisorUnavailable = false;

  @Output() readonly pmiInput = new EventEmitter<Event>();
  @Output() readonly ssnChanged = new EventEmitter<string>();
  @Output() readonly locationSelected = new EventEmitter<string>();
  @Output() readonly servicesDropdownToggled = new EventEmitter<void>();
  @Output() readonly languagesDropdownToggled = new EventEmitter<void>();
  @Output() readonly arrayToggled = new EventEmitter<ClientEditArrayToggle>();
  @Output() readonly phoneChanged = new EventEmitter<ClientEditPhoneChange>();
  @Output() readonly postalCodeChanged = new EventEmitter<string>();

  normalizePmi(event: Event): void {
    this.pmiInput.emit(event);
  }

  normalizeSsnInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatUsSsn(input.value);
    input.value = formatted;
    this.model.ssn = formatted;
    this.ssnChanged.emit(formatted);
  }

  changeStatus(status: string): void {
    this.model.status = status;
    if (status !== 'Discharged') {
      this.model.dischargeDate = '';
      this.model.dischargeReason = '';
    }
  }

  selectLocation(locationId: string): void {
    this.locationSelected.emit(locationId);
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

  ageFromDob(): string {
    if (!this.model.dob) return 'Calculated automatically';
    const dob = new Date(`${this.model.dob}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return 'Calculated automatically';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const month = today.getMonth() - dob.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age -= 1;
    return `${Math.max(0, age)} years`;
  }
}
