import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EmployeeCourse,
  EmployeeTrainingInformation,
  EmployeeTrainingSkill,
} from '../../models/employee.models';

@Component({
  selector: 'app-employee-training-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './employee-training-section.html',
  styleUrls: [
    './employee-form-page.css',
    './employee-form-validation.css',
    './payer-affiliation.css',
  ],
})
export class EmployeeTrainingSectionComponent {
  @Input({ required: true }) training!: EmployeeTrainingInformation;
  @Input({ required: true }) courseDraft!: EmployeeCourse;
  @Input({ required: true }) trainingDraft!: EmployeeTrainingSkill;
  @Input({ required: true }) courseOptions!: readonly string[];
  @Input({ required: true }) trainingOptions!: readonly string[];
  @Input() courseEditingIndex: number | null = null;
  @Input() trainingEditingIndex: number | null = null;
  @Input({ required: true }) errors!: Readonly<Record<string, string>>;
  @Output() readonly clearError = new EventEmitter<string>();
  @Output() readonly saveCourse = new EventEmitter<void>();
  @Output() readonly cancelCourse = new EventEmitter<void>();
  @Output() readonly editCourse = new EventEmitter<number>();
  @Output() readonly removeCourse = new EventEmitter<number>();
  @Output() readonly saveTraining = new EventEmitter<void>();
  @Output() readonly cancelTraining = new EventEmitter<void>();
  @Output() readonly editTraining = new EventEmitter<number>();
  @Output() readonly removeTraining = new EventEmitter<number>();

  fieldError(field: string): string {
    return this.errors[field] ?? '';
  }
}
