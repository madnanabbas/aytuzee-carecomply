import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientDetails } from '../../models/client-api.models';
import {
  ClientFormModel,
  clientDetailsToForm,
  clientFormToUpdateRequest,
  clientServiceCode,
  createEmptyClientForm,
} from '../../models/client-form.models';
import { clientStatusCode } from '../../models/client-presentation';
import { SuccessDialogComponent } from '../../../../shared/components/success-dialog/success-dialog';
import { ClientWizardSidebarComponent } from '../../../../shared/components/client-wizard-sidebar/client-wizard-sidebar';
import {
  formatPmi,
  formatUsPhone,
  formatUsPostalCode,
  formatUsSsn,
  isValidPmi,
  isValidEmail,
  isValidUsPhone,
  isValidUsPostalCode,
  isValidUsSsn,
} from '../../models/client-field-validation';
import { CLIENT_SERVICE_OPTIONS } from '../../models/client-service-catalog';
import { ClientCaregiversComponent } from '../../components/client-caregivers/client-caregivers';
import { ClientContactsComponent } from '../../components/client-contacts/client-contacts';
import { ClientCareCoordinatorsComponent } from '../../components/client-care-coordinators/client-care-coordinators';
import { ClientClinicalContactsComponent } from '../../components/client-clinical-contacts/client-clinical-contacts';
import { ClientResponsiblePartiesComponent } from '../../components/client-responsible-parties/client-responsible-parties';
import { ClientHospitalizationsComponent } from '../../components/client-hospitalizations/client-hospitalizations';
import { ClientEditAdditionalSectionComponent } from './client-edit-additional-section';
import { ClientEditBasicSectionComponent } from './client-edit-basic-section';
import {
  CLIENT_DIET_OPTIONS,
  CLIENT_LANGUAGE_OPTIONS,
} from '../client-create/client-create-options';
import { CLIENT_EDIT_LOCATIONS, CLIENT_EDIT_STEPS, ClientEditSection } from './client-edit-options';

@Component({
  selector: 'app-client-edit-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    SuccessDialogComponent,
    ClientWizardSidebarComponent,
    ClientCaregiversComponent,
    ClientContactsComponent,
    ClientCareCoordinatorsComponent,
    ClientClinicalContactsComponent,
    ClientResponsiblePartiesComponent,
    ClientHospitalizationsComponent,
    ClientEditAdditionalSectionComponent,
    ClientEditBasicSectionComponent,
  ],
  templateUrl: './client-edit-page.html',
  styleUrls: ['./client-edit-form.css', '../client-wizard-shell.css'],
})
export class ClientEditPageComponent {
  private readonly api = inject(ClientApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly section = signal<ClientEditSection>('basic');
  readonly steps = CLIENT_EDIT_STEPS;
  readonly activeStepIndex = computed(() =>
    this.steps.findIndex((step) => step.id === this.section()),
  );
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadFailed = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<readonly string[]>([]);
  readonly fieldErrors = signal<Readonly<Record<string, string>>>({});
  readonly completionDialog = signal<{ readonly title: string; readonly message: string } | null>(
    null,
  );
  readonly servicesOpen = signal(false);
  readonly languagesOpen = signal(false);
  readonly supervisorOptions = signal<readonly { id: string; name: string; jobTitle: string }[]>(
    [],
  );
  readonly supervisorLoading = signal(false);

  assignedSupervisorUnavailable(): boolean {
    return (
      !!this.model.supervisor &&
      !this.supervisorOptions().some((person) => person.id === this.model.supervisor)
    );
  }

  readonly locations = CLIENT_EDIT_LOCATIONS;
  readonly serviceOptions = CLIENT_SERVICE_OPTIONS;
  readonly languageOptions = CLIENT_LANGUAGE_OPTIONS;
  readonly dietOptions = CLIENT_DIET_OPTIONS;
  readonly model: ClientFormModel = createEmptyClientForm();

  readonly clientId: string;
  private original: ClientDetails | null = null;

  constructor() {
    this.clientId = this.route.snapshot.paramMap.get('clientId') ?? '';
    if (!this.clientId) {
      this.loadFailed.set(true);
      this.loading.set(false);
      return;
    }
    this.load();
  }

  get backLink(): readonly string[] {
    return ['/clients', this.clientId];
  }

  selectSection(index: number): void {
    const step = this.steps[index];
    if (step) this.section.set(step.id);
  }

  load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.errorMessage.set(null);
    this.api
      .getClient(this.clientId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (client) => this.acceptClient(client),
        error: () => this.loadFailed.set(true),
      });
  }

  save(): void {
    const original = this.original;
    if (!original || this.saving()) return;

    const errors = this.validate();
    if (errors.length) {
      this.validationErrors.set(errors);
      this.errorMessage.set('Please correct the client information before saving.');
      return;
    }

    this.model.country = 'United States';
    const statusChanged =
      clientStatusCode(this.model.status) !== normalizeStatus(original.status) ||
      (this.model.status === 'Discharged' &&
        ((original.dischargeDate ?? '') !== this.model.dischargeDate ||
          (original.dischargeReason ?? '') !== this.model.dischargeReason.trim()));

    this.saving.set(true);
    this.clearMessages();

    this.api
      .updateClient(this.clientId, clientFormToUpdateRequest(this.model, original.editorVersion))
      .pipe(
        switchMap((updated) =>
          statusChanged
            ? this.api.changeStatus(this.clientId, {
                status: clientStatusCode(this.model.status),
                dischargeDate:
                  this.model.status === 'Discharged' ? this.model.dischargeDate || null : null,
                dischargeReason:
                  this.model.status === 'Discharged'
                    ? this.model.dischargeReason.trim() || null
                    : null,
                editorVersion: updated.editorVersion,
              })
            : of(updated),
        ),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.acceptClient(updated);
          this.completionDialog.set({
            title: 'Client updated successfully',
            message: 'The client details were saved successfully.',
          });
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  confirmCompletion(): void {
    if (!this.completionDialog()) return;
    this.completionDialog.set(null);
    void this.router.navigate(this.backLink);
  }

  toggleServicesDropdown(): void {
    this.servicesOpen.update((open) => !open);
    this.languagesOpen.set(false);
  }

  toggleLanguagesDropdown(): void {
    this.languagesOpen.update((open) => !open);
    this.servicesOpen.set(false);
  }

  toggleArray(field: 'services' | 'languages' | 'diet', value: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const current = this.model[field];
    this.model[field] = event.target.checked
      ? [...current, value]
      : current.filter((item) => item !== value);
  }

  normalizePmi(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.model.pmi = formatPmi(input.value);
    input.value = this.model.pmi;
  }
  normalizeSsn(value: string): void {
    this.model.ssn = formatUsSsn(value);
  }
  normalizePostalCode(value: string): void {
    this.model.zip = formatUsPostalCode(value);
  }
  normalizePhone(field: 'phone1' | 'phone2' | 'companyPhone', value: string): void {
    this.model[field] = formatUsPhone(value);
  }

  selectedLabel(values: readonly string[], placeholder: string): string {
    if (!values.length) return placeholder;
    if (values.length <= 2) return values.join(', ');
    return `${values.slice(0, 2).join(', ')} +${values.length - 2}`;
  }

  private acceptClient(client: ClientDetails): void {
    this.original = client;
    Object.assign(this.model, clientDetailsToForm(client));
    this.model.country = 'United States';
    this.supervisorOptions.set([]);
    this.supervisorLoading.set(true);
    this.api
      .supervisorCandidates(client.locationId)
      .pipe(
        finalize(() => this.supervisorLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (staff) => this.supervisorOptions.set(staff),
        error: () => this.errorMessage.set('Supervisors could not be loaded. Please retry.'),
      });
  }

  private validate(): readonly string[] {
    const errors: string[] = [];
    if (!this.model.firstName.trim()) errors.push('First name is required.');
    if (!this.model.lastName.trim()) errors.push('Last name is required.');
    if (!this.model.dob) errors.push('Date of birth is required.');
    else if (this.model.dob > new Date().toISOString().slice(0, 10))
      errors.push('Date of birth cannot be in the future.');
    if (!this.model.gender) errors.push('Gender is required.');
    if (!this.model.pmi.trim()) errors.push('PMI number is required.');
    else if (!isValidPmi(this.model.pmi)) errors.push('PMI number must contain exactly 8 digits.');
    if (!this.model.phone1.trim()) errors.push('Primary phone is required.');
    else if (!isValidUsPhone(this.model.phone1))
      errors.push('Primary phone must contain 10 digits.');
    if (this.model.phone2 && !isValidUsPhone(this.model.phone2))
      errors.push('Secondary phone must contain 10 digits.');
    if (this.model.email && !isValidEmail(this.model.email))
      errors.push('Enter a valid email address.');
    if (this.model.ssn && !isValidUsSsn(this.model.ssn))
      errors.push('SSN must contain a valid 9-digit US Social Security number.');
    if (!this.model.street.trim()) errors.push('Street address is required.');
    if (this.model.zip && !isValidUsPostalCode(this.model.zip))
      errors.push('Use ZIP format 12345 or 12345-6789.');
    if (!this.model.languages.length) errors.push('Select at least one preferred language.');
    else if (
      new Set(this.model.languages.map((value) => value.trim().toLowerCase())).size !==
      this.model.languages.length
    )
      errors.push('Preferred languages cannot contain duplicates.');
    if (!this.model.socDate) errors.push('SOC date is required.');
    if (this.model.intakeDate && this.model.socDate && this.model.intakeDate > this.model.socDate) {
      errors.push('Intake date cannot be after SOC date.');
    }
    if (this.model.status === 'Discharged' && !this.model.dischargeDate) {
      errors.push('Discharge date is required for a discharged client.');
    }
    if (this.model.evvHours) {
      const hours = Number(this.model.evvHours);
      if (!Number.isFinite(hours) || hours < 0 || hours > 168) {
        errors.push('EVV authorized hours must be between 0 and 168.');
      }
    }

    const originalServices =
      this.original?.services
        .filter((service) => service.isActive)
        .map((service) => service.code.toUpperCase())
        .sort() ?? [];
    const selectedServices = this.model.services
      .map((service) => clientServiceCode(service))
      .sort();
    const servicesChanged = originalServices.join('|') !== selectedServices.join('|');
    if (servicesChanged && !this.model.serviceChangeEffectiveDate) {
      errors.push('Service change effective date is required when client services are changed.');
    }
    this.fieldErrors.set(
      Object.fromEntries(
        errors
          .map((message) => [validationField(message), message] as const)
          .filter(([field]) => field.length > 0),
      ),
    );
    return errors;
  }

  private handleApiError(error: HttpErrorResponse): void {
    const problem = error.error as {
      type?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    } | null;
    const type = typeof problem?.type === 'string' ? problem.type : '';
    const serverErrors = problem?.errors ? Object.values(problem.errors).flat() : [];
    if (serverErrors.length) this.validationErrors.set(serverErrors);

    if (error.status === 409 && (type.endsWith('client-concurrency-conflict') || !type)) {
      this.errorMessage.set(
        'This client was changed by another user. Reload the record before saving again.',
      );
      return;
    }
    if (type.endsWith('client-duplicate-pmi')) {
      this.errorMessage.set('Another client already uses this PMI number.');
      return;
    }
    this.errorMessage.set(
      problem?.detail || 'The client changes could not be saved. Please try again.',
    );
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.validationErrors.set([]);
    this.fieldErrors.set({});
  }
}

function validationField(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.startsWith('first name')) return 'firstName';
  if (normalized.startsWith('last name')) return 'lastName';
  if (normalized.startsWith('date of birth')) return 'dob';
  if (normalized.startsWith('gender')) return 'gender';
  if (normalized.startsWith('pmi')) return 'pmi';
  if (normalized.startsWith('primary phone')) return 'phone1';
  if (normalized.startsWith('secondary phone')) return 'phone2';
  if (normalized.startsWith('ssn')) return 'ssn';
  if (normalized.startsWith('enter a valid email')) return 'email';
  if (normalized.startsWith('street')) return 'street';
  if (normalized.startsWith('use zip')) return 'zip';
  if (
    normalized.startsWith('select at least one preferred language') ||
    normalized.startsWith('preferred languages')
  )
    return 'languages';
  if (normalized.startsWith('soc date')) return 'socDate';
  if (normalized.startsWith('intake date')) return 'intakeDate';
  if (normalized.startsWith('evv')) return 'evvHours';
  return '';
}

function normalizeStatus(status: ClientDetails['status']): number {
  if (typeof status === 'number') return status;
  return clientStatusCode(status);
}
