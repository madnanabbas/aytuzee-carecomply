import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientCreateStep } from '../../models/client-design.models';
import {
  ClientFormModel,
  clientFormToCreateRequest,
  createEmptyClientForm,
} from '../../models/client-form.models';

@Component({
  selector: 'app-client-create-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './client-create-page.html',
})
export class ClientCreatePageComponent {
  private readonly api = inject(ClientApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly steps: readonly ClientCreateStep[] = [
    { id: 'basic', title: 'Basic information' },
    { id: 'additional', title: 'Additional information' },
    { id: 'review', title: 'Review' },
  ];

  readonly stepIndex = signal(0);
  readonly servicesOpen = signal(false);
  readonly languagesOpen = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<readonly string[]>([]);

  readonly locationOptions = ['Minneapolis', 'St. Paul', 'Brooklyn Park', 'Bloomington'] as const;
  readonly serviceOptions = ['PCA', 'CFSS', '245D', 'Respite'] as const;
  readonly languageOptions = ['English', 'Spanish', 'Somali', 'Hmong'] as const;
  readonly dietOptions = ['Diabetic', 'Low Fat', 'Low Salt', 'High Fiber', 'Vegetarian', 'Regular', 'Uses Supplements'] as const;

  readonly activeStep = computed(() => this.steps[this.stepIndex()]);
  readonly isFirstStep = computed(() => this.stepIndex() === 0);
  readonly isLastStep = computed(() => this.stepIndex() === this.steps.length - 1);

  readonly draft: ClientFormModel = createEmptyClientForm();

  goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length || this.saving()) return;
    this.stepIndex.set(index);
    this.clearMessages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  next(): void {
    if (this.isLastStep()) return;

    const errors = this.validateStep(this.stepIndex());
    if (errors.length) {
      this.validationErrors.set(errors);
      return;
    }

    this.goToStep(this.stepIndex() + 1);
  }

  back(): void {
    if (!this.isFirstStep()) this.goToStep(this.stepIndex() - 1);
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

  onToggleArray(field: 'services' | 'languages' | 'diet', value: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const current = this.draft[field];
    this.draft[field] = event.target.checked
      ? [...current, value]
      : current.filter((item) => item !== value);
  }

  toggleServicesDropdown(): void {
    this.servicesOpen.update((open) => !open);
    this.languagesOpen.set(false);
  }

  toggleLanguagesDropdown(): void {
    this.languagesOpen.update((open) => !open);
    this.servicesOpen.set(false);
  }

  selectedLabel(values: string[], placeholder: string): string {
    if (!values.length) return placeholder;
    if (values.length <= 2) return values.join(', ');
    return `${values.slice(0, 2).join(', ')} +${values.length - 2}`;
  }

  createClient(): void {
    if (this.saving()) return;

    const errors = this.validateAll();
    if (errors.length) {
      this.validationErrors.set(errors);
      this.errorMessage.set('Please correct the highlighted client information before creating the record.');
      return;
    }

    this.clearMessages();
    this.saving.set(true);

    this.api.createClient(clientFormToCreateRequest(this.draft))
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (created) => {
          void this.router.navigate(['/clients', created.id], {
            state: { clientCreated: true },
          });
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private validateStep(index: number): readonly string[] {
    return index === 0 ? this.validateBasic() : [];
  }

  private validateAll(): readonly string[] {
    return [...this.validateBasic()];
  }

  private validateBasic(): readonly string[] {
    const errors: string[] = [];
    if (!this.draft.firstName.trim()) errors.push('First name is required.');
    if (!this.draft.lastName.trim()) errors.push('Last name is required.');
    if (!this.draft.dob) errors.push('Date of birth is required.');
    if (!this.draft.gender) errors.push('Gender is required.');
    if (!this.draft.pmi.trim()) errors.push('PMI number is required.');
    if (!this.draft.socDate) errors.push('SOC date is required.');
    if (this.draft.intakeDate && this.draft.socDate && this.draft.intakeDate > this.draft.socDate) {
      errors.push('Intake date cannot be after the SOC date.');
    }
    if (this.draft.status === 'Discharged' && !this.draft.dischargeDate) {
      errors.push('Discharge date is required for a discharged client.');
    }
    if (this.draft.dischargeDate && this.draft.socDate && this.draft.dischargeDate < this.draft.socDate) {
      errors.push('Discharge date cannot be before the SOC date.');
    }
    if (this.draft.evvHours) {
      const hours = Number(this.draft.evvHours);
      if (!Number.isFinite(hours) || hours < 0 || hours > 168) {
        errors.push('EVV authorized hours must be between 0 and 168 hours per week.');
      }
    }
    if (this.draft.languages.length > 10) errors.push('A maximum of 10 preferred languages can be selected.');
    if (this.draft.services.length > 20) errors.push('A maximum of 20 services can be selected.');
    return errors;
  }

  private handleApiError(error: HttpErrorResponse): void {
    const problem = error.error as { type?: string; detail?: string; errors?: Record<string, string[]> } | null;
    const problemType = typeof problem?.type === 'string' ? problem.type : '';
    const serverErrors = problem?.errors
      ? Object.values(problem.errors).flat().filter((message): message is string => typeof message === 'string')
      : [];

    if (serverErrors.length) this.validationErrors.set(serverErrors);

    if (problemType.endsWith('client-duplicate-pmi') || (error.status === 409 && !problemType)) {
      this.errorMessage.set('A client with this PMI number already exists.');
      return;
    }

    this.errorMessage.set(problem?.detail || 'The client could not be created. Please review the information and try again.');
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.validationErrors.set([]);
  }
}
