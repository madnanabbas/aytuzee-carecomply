import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { CompanyLocation } from '../../../../core/lookups/location-lookup.service';
import type { ClientFormModel } from '../../models/client-form.models';
import { CLIENT_STATUS_OPTIONS } from '../../models/client-presentation';
import { formatUsSsn } from '../../models/client-field-validation';

export interface ClientCreateArrayToggle {
  readonly field: 'services' | 'languages' | 'diet';
  readonly value: string;
  readonly event: Event;
}

export interface ClientSupervisorOption {
  readonly id: string;
  readonly name: string;
  readonly jobTitle: string;
}

@Component({
  selector: 'app-client-create-basic-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-create-basic-section.html',
  styleUrl: './client-create-form.css',
})
export class ClientCreateBasicSectionComponent {
  readonly statusOptions = CLIENT_STATUS_OPTIONS;
  @Input({ required: true }) draft!: ClientFormModel;
  @Input() fieldErrors: Readonly<Record<string, string>> = {};
  @Input() locationOptions: readonly CompanyLocation[] = [];
  @Input() supervisorOptions: readonly ClientSupervisorOption[] = [];
  @Input() supervisorLoading = false;
  @Input() serviceOptions: readonly string[] = [];
  @Input() servicesOpen = false;
  @Input() readOnly = false;

  @Output() readonly fieldCleared = new EventEmitter<string>();
  @Output() readonly pmiInput = new EventEmitter<Event>();
  @Output() readonly ssnChanged = new EventEmitter<string>();
  @Output() readonly locationSelected = new EventEmitter<string>();
  @Output() readonly servicesDropdownToggled = new EventEmitter<void>();
  @Output() readonly arrayToggled = new EventEmitter<ClientCreateArrayToggle>();

  fieldError(field: string): string | null {
    return this.fieldErrors[field] ?? null;
  }

  clearFieldError(field: string): void {
    this.fieldCleared.emit(field);
  }

  normalizePmi(event: Event): void {
    this.pmiInput.emit(event);
  }

  normalizeSsnInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatUsSsn(input.value);
    input.value = formatted;
    this.draft.ssn = formatted;
    this.ssnChanged.emit(formatted);
  }

  changeStatus(status: string): void {
    this.draft.status = status;
    this.clearFieldError('status');
    if (status !== 'Discharged') {
      this.draft.dischargeDate = '';
      this.draft.dischargeReason = '';
      this.clearFieldError('dischargeDate');
      this.clearFieldError('dischargeReason');
    }
  }

  selectLocation(locationId: string): void {
    this.locationSelected.emit(locationId);
  }

  toggleServicesDropdown(): void {
    this.servicesDropdownToggled.emit();
  }

  onToggleArray(field: 'services' | 'languages' | 'diet', value: string, event: Event): void {
    this.arrayToggled.emit({ field, value, event });
  }

  selectedLabel(values: readonly string[], placeholder: string): string {
    return values.length ? values.join(', ') : placeholder;
  }

  ageFromDob(): string {
    if (!this.draft.dob) return 'Calculated automatically';
    const dob = new Date(`${this.draft.dob}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return 'Calculated automatically';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const month = today.getMonth() - dob.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age -= 1;
    return `${Math.max(0, age)} years`;
  }
}
