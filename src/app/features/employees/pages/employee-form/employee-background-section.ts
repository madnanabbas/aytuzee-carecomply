import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EmployeeBackgroundCheck,
  EmployeeBackgroundInformation,
} from '../../models/employee.models';

@Component({
  selector: 'app-employee-background-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './employee-background-section.html',
  styleUrls: [
    './employee-form-page.css',
    './employee-form-validation.css',
    './payer-affiliation.css',
  ],
})
export class EmployeeBackgroundSectionComponent {
  @Input({ required: true }) background!: EmployeeBackgroundInformation;
  @Input({ required: true }) backgroundDraft!: EmployeeBackgroundCheck;
  @Input() editingIndex: number | null = null;
  @Input({ required: true }) errors!: Readonly<Record<string, string>>;
  @Output() readonly clearError = new EventEmitter<string>();
  @Output() readonly saveCheck = new EventEmitter<void>();
  @Output() readonly cancelCheck = new EventEmitter<void>();
  @Output() readonly editCheck = new EventEmitter<number>();
  @Output() readonly removeCheck = new EventEmitter<number>();

  fieldError(field: string): string {
    return this.errors[field] ?? '';
  }
}
