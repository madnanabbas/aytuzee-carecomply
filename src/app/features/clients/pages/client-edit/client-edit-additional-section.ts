import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ClientFormModel } from '../../models/client-form.models';
import type { ClientEditArrayToggle, ClientEditPhoneChange } from './client-edit-basic-section';

@Component({
  selector: 'app-client-edit-additional-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-edit-additional-section.html',
  styleUrls: ['../client-create/client-create-form.css', './client-edit-form.css'],
})
export class ClientEditAdditionalSectionComponent {
  @Input({ required: true }) model!: ClientFormModel;
  @Input() dietOptions: readonly string[] = [];

  @Output() readonly phoneChanged = new EventEmitter<ClientEditPhoneChange>();
  @Output() readonly arrayToggled = new EventEmitter<ClientEditArrayToggle>();

  normalizePhone(field: 'phone1' | 'phone2' | 'companyPhone', value: string): void {
    this.phoneChanged.emit({ field, value });
  }

  toggleArray(field: 'services' | 'languages' | 'diet', value: string, event: Event): void {
    this.arrayToggled.emit({ field, value, event });
  }
}
