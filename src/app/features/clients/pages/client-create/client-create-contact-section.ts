import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemedComboboxComponent } from '../../../../shared/components/themed-combobox/themed-combobox';
import type { ClientFormModel } from '../../models/client-form.models';
import type { ClientCreateArrayToggle } from './client-create-basic-section';

export interface ClientCreatePhoneChange {
  readonly field: 'phone1' | 'phone2' | 'companyPhone';
  readonly value: string;
}

@Component({
  selector: 'app-client-create-contact-section',
  standalone: true,
  imports: [FormsModule, ThemedComboboxComponent],
  templateUrl: './client-create-contact-section.html',
  styleUrl: './client-create-form.css',
})
export class ClientCreateContactSectionComponent {
  @Input({ required: true }) draft!: ClientFormModel;
  @Input() fieldErrors: Readonly<Record<string, string>> = {};
  @Input() languageOptions: readonly string[] = [];
  @Input() languagesOpen = false;
  @Input() postalLookupLoading = false;
  @Input() postalLookupMessage: string | null = null;
  @Input() stateNames: readonly string[] = [];
  @Input() cityOptions: readonly string[] = [];

  @Output() readonly fieldCleared = new EventEmitter<string>();
  @Output() readonly phoneChanged = new EventEmitter<ClientCreatePhoneChange>();
  @Output() readonly languagesDropdownToggled = new EventEmitter<void>();
  @Output() readonly arrayToggled = new EventEmitter<ClientCreateArrayToggle>();
  @Output() readonly postalCodeChanged = new EventEmitter<string>();
  @Output() readonly stateChanged = new EventEmitter<string>();
  @Output() readonly cityChanged = new EventEmitter<string>();

  fieldError(field: string): string | null {
    return this.fieldErrors[field] ?? null;
  }

  clearFieldError(field: string): void {
    this.fieldCleared.emit(field);
  }

  normalizePhone(field: 'phone1' | 'phone2' | 'companyPhone', value: string): void {
    this.phoneChanged.emit({ field, value });
  }

  toggleLanguagesDropdown(): void {
    this.languagesDropdownToggled.emit();
  }

  onToggleArray(field: 'services' | 'languages' | 'diet', value: string, event: Event): void {
    this.arrayToggled.emit({ field, value, event });
  }

  normalizePostalCode(value: string): void {
    this.postalCodeChanged.emit(value);
  }

  onStateChange(value: string): void {
    this.stateChanged.emit(value);
  }

  onCityChange(value: string): void {
    this.cityChanged.emit(value);
  }

  selectedLabel(values: readonly string[], placeholder: string): string {
    return values.length ? values.join(', ') : placeholder;
  }
}
