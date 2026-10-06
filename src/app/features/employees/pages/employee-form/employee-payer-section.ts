import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeFormModel, EmployeePayerAffiliation } from '../../models/employee.models';

@Component({
  selector: 'app-employee-payer-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './employee-payer-section.html',
  styleUrls: [
    './employee-form-page.css',
    './employee-form-validation.css',
    './payer-affiliation.css',
  ],
})
export class EmployeePayerSectionComponent {
  @Input({ required: true }) draft!: EmployeeFormModel;
  @Input({ required: true }) payerDraft!: EmployeePayerAffiliation;
  @Input() editingIndex: number | null = null;
  @Input({ required: true }) errors!: Readonly<Record<string, string>>;
  @Output() readonly clearError = new EventEmitter<string>();
  @Output() readonly saveAffiliation = new EventEmitter<void>();
  @Output() readonly cancelAffiliation = new EventEmitter<void>();
  @Output() readonly editAffiliation = new EventEmitter<number>();
  @Output() readonly removeAffiliation = new EventEmitter<number>();

  fieldError(field: string): string {
    return this.errors[field] ?? '';
  }
}
