import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ClientFormModel } from '../../models/client-form.models';
import type { ClientCreateArrayToggle } from './client-create-basic-section';
import type { ClientCreatePhoneChange } from './client-create-contact-section';

@Component({
  selector: 'app-client-create-additional-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-create-additional-section.html',
  styleUrl: './client-create-form.css',
})
export class ClientCreateAdditionalSectionComponent {
  @Input({ required: true }) draft!: ClientFormModel;
  @Input() dietOptions: readonly string[] = [];

  @Output() readonly phoneChanged = new EventEmitter<ClientCreatePhoneChange>();
  @Output() readonly arrayToggled = new EventEmitter<ClientCreateArrayToggle>();

  normalizePhone(field: 'phone1' | 'phone2' | 'companyPhone', value: string): void {
    this.phoneChanged.emit({ field, value });
  }

  onToggleArray(field: 'services' | 'languages' | 'diet', value: string, event: Event): void {
    this.arrayToggled.emit({ field, value, event });
  }
}
