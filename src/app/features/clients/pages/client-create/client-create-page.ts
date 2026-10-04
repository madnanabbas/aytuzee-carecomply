import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  Subject,
  switchMap,
  tap,
  timeout,
  TimeoutError,
} from 'rxjs';
import { ClientApiService } from '../../data-access/client-api.service';
import {
  GeographyDirectoryService,
  StateOption,
} from '../../data-access/geography-directory.service';
import { PostalLookupService } from '../../data-access/postal-lookup.service';
import { SuccessDialogComponent } from '../../../../shared/components/success-dialog/success-dialog';
import { ClientWizardSidebarComponent } from '../../../../shared/components/client-wizard-sidebar/client-wizard-sidebar';
import {
  ClientFormModel,
  clientFormToBasicDetailsRequest,
  clientFormToBasicDetailsUpdateRequest,
  clientFormToAdditionalInformationRequest,
  clientFormToContactInformationRequest,
  clientDetailsToForm,
  createEmptyClientForm,
} from '../../models/client-form.models';
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
import {
  CompanyLocation,
  LocationLookupService,
} from '../../../../core/lookups/location-lookup.service';
import { ClientCaregiversComponent } from '../../components/client-caregivers/client-caregivers';
import { ClientContactsComponent } from '../../components/client-contacts/client-contacts';
import { ClientCareCoordinatorsComponent } from '../../components/client-care-coordinators/client-care-coordinators';
import { ClientClinicalContactsComponent } from '../../components/client-clinical-contacts/client-clinical-contacts';
import { ClientResponsiblePartiesComponent } from '../../components/client-responsible-parties/client-responsible-parties';
import { ClientHospitalizationsComponent } from '../../components/client-hospitalizations/client-hospitalizations';
import { ClientCreateAdditionalSectionComponent } from './client-create-additional-section';
import { ClientCreateBasicSectionComponent } from './client-create-basic-section';
import { ClientCreateContactSectionComponent } from './client-create-contact-section';
import {
  CLIENT_CREATE_STEPS,
  CLIENT_DIET_OPTIONS,
  CLIENT_LANGUAGE_OPTIONS,
} from './client-create-options';

@Component({
  selector: 'app-client-create-page',
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
    ClientCreateAdditionalSectionComponent,
    ClientCreateBasicSectionComponent,
    ClientCreateContactSectionComponent,
  ],
  templateUrl: './client-create-page.html',
  styleUrls: ['./client-create-form.css', '../client-wizard-shell.css'],
})
export class ClientCreatePageComponent {
  private readonly api = inject(ClientApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly postalLookup = inject(PostalLookupService);
  private readonly geography = inject(GeographyDirectoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly locationApi = inject(LocationLookupService);
  private readonly postalCodeChanges = new Subject<string>();
  private lastAutofilledCity: string | null = null;
  private lastAutofilledState: string | null = null;
  private lastPostalCode = '';
  private postalLookupCountryCode = 'US';
  private postalLookupCountryName = 'United States';

  readonly steps = CLIENT_CREATE_STEPS;
  readonly contactsSection = viewChild(ClientContactsComponent);
  readonly careCoordinatorsSection = viewChild(ClientCareCoordinatorsComponent);
  readonly clinicalContactsSection = viewChild(ClientClinicalContactsComponent);
  readonly responsiblePartiesSection = viewChild(ClientResponsiblePartiesComponent);
  readonly hospitalizationsSection = viewChild(ClientHospitalizationsComponent);

  readonly stepIndex = signal(0);
  readonly furthestStepIndex = signal(0);
  readonly resuming = signal(false);
  readonly servicesOpen = signal(false);
  readonly languagesOpen = signal(false);
  readonly saving = signal(false);
  readonly completionDialog = signal<{ readonly title: string; readonly message: string } | null>(
    null,
  );
  readonly createdClientId = signal<string | null>(null);
  readonly editorVersion = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<readonly string[]>([]);
  readonly fieldErrors = signal<Readonly<Record<string, string>>>({});
  readonly postalLookupLoading = signal(false);
  readonly postalLookupMessage = signal<string | null>(null);
  readonly postalCountry = signal('United States');
  readonly selectedCountryCode = signal('US');
  readonly stateOptions = signal<readonly StateOption[]>([]);
  readonly cityOptions = signal<readonly string[]>([]);
  readonly stateNames = computed(() => this.stateOptions().map((state) => state.name));

  readonly locationOptions = signal<readonly CompanyLocation[]>([]);
  readonly supervisorOptions = signal<readonly { id: string; name: string; jobTitle: string }[]>(
    [],
  );
  readonly supervisorLoading = signal(false);
  readonly serviceOptions = CLIENT_SERVICE_OPTIONS;
  readonly languageOptions = CLIENT_LANGUAGE_OPTIONS;
  readonly dietOptions = CLIENT_DIET_OPTIONS;

  readonly activeStep = computed(() => this.steps[this.stepIndex()]);
  readonly isFirstStep = computed(() => this.stepIndex() === 0);
  readonly isLastStep = computed(() => this.stepIndex() === this.steps.length - 1);

  readonly draft: ClientFormModel = createEmptyClientForm();

  constructor() {
    this.locationApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((locations) => {
        this.locationOptions.set(locations);
        const selected =
          locations.find((location) => location.id === this.draft.locationId) ??
          locations.find((location) => location.isMain);
        if (selected) this.selectLocation(selected.id);
      });
    this.lastAutofilledState = this.draft.state || null;
    this.postalCodeChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap(() => {
          this.postalLookupLoading.set(true);
          this.postalLookupMessage.set(null);
        }),
        switchMap((lookup) => {
          const separator = lookup.indexOf('|');
          return this.postalLookup
            .lookupPostalCode(lookup.slice(0, separator), lookup.slice(separator + 1))
            .pipe(
              map((match) => ({ match, failure: null as 'not-found' | 'unavailable' | null })),
              catchError((error: HttpErrorResponse) =>
                of({
                  match: null,
                  failure: error.status === 404 ? ('not-found' as const) : ('unavailable' as const),
                }),
              ),
              finalize(() => this.postalLookupLoading.set(false)),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ match, failure }) => {
        if (!match) {
          this.postalLookupMessage.set(
            failure === 'not-found'
              ? `No postal match was found in ${this.postalLookupCountryName}. Select or enter the country, state, city, and area manually.`
              : 'Postal lookup is temporarily unavailable. Select or enter the state, city, and area manually.',
          );
          return;
        }

        this.draft.city = match.city;
        this.lastAutofilledCity = match.city;
        this.draft.state = match.state;
        this.lastAutofilledState = match.state;
        if (match.area) this.draft.county = match.area;
        this.selectedCountryCode.set('US');
        this.postalCountry.set('United States');
        this.draft.country = 'United States';
        this.loadStates('United States');
        this.postalLookupMessage.set(
          'City and state were suggested from the ZIP code. Please verify the address.',
        );
      });

    this.loadStates('United States');

    const resumeClientId = this.route?.snapshot.paramMap.get('clientId');
    if (resumeClientId) this.loadCreationState(resumeClientId);
  }

  selectLocation(locationId: string): void {
    const location = this.locationOptions().find((option) => option.id === locationId);
    if (this.draft.locationId !== locationId) this.draft.supervisor = '';
    this.draft.locationId = location?.id ?? '';
    this.draft.location = location?.name ?? '';
    this.supervisorOptions.set([]);
    if (!location) return;
    this.supervisorLoading.set(true);
    this.api
      .supervisorCandidates(location.id)
      .pipe(
        finalize(() => this.supervisorLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (staff) => {
          if (this.draft.locationId === location.id) this.supervisorOptions.set(staff);
        },
        error: () => {
          if (this.draft.locationId === location.id)
            this.errorMessage.set(
              'Supervisors could not be loaded. Try selecting the location again.',
            );
        },
      });
  }

  selectedSupervisorName(): string {
    return (
      this.supervisorOptions().find((person) => person.id === this.draft.supervisor)?.name ??
      'Not assigned'
    );
  }

  onStateChange(stateName: string): void {
    this.draft.state = stateName;
    this.draft.city = '';
    this.cityOptions.set([]);
    if (!stateName) return;
    this.geography
      .cities(this.postalCountry(), stateName)
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cities) => this.cityOptions.set(cities));
  }

  onCityChange(cityName: string): void {
    this.draft.city = cityName;
  }

  goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length || this.saving()) return;
    if (index !== this.stepIndex() && !this.canLeaveCurrentStep()) return;
    if (!this.createdClientId() && index !== 0) return;
    if (index > this.furthestStepIndex()) return;
    if (index > this.stepIndex() && this.stepIndex() < 3) {
      const errors = this.validateStep(this.stepIndex());
      if (errors.length) {
        this.validationErrors.set(errors);
        this.errorMessage.set('Complete the required fields before continuing.');
        return;
      }
    }
    this.stepIndex.set(index);
    this.clearMessages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  next(): void {
    if (this.isLastStep()) return;

    if (this.activeStep().id === 'basic') {
      if (this.createdClientId()) this.updateClientBasicDetails();
      else this.createClientFromBasicDetails();
      return;
    }

    if (this.activeStep().id === 'additional') {
      this.saveAdditionalInformation();
      return;
    }

    if (this.activeStep().id === 'contact') {
      this.saveContactInformation();
      return;
    }

    if (this.stepIndex() >= 3) {
      this.advanceRelatedProgress();
      return;
    }

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
    if (field === 'languages' && this.draft.languages.length > 0) this.clearFieldError('languages');
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

  normalizePmi(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.draft.pmi = formatPmi(input.value);
    input.value = this.draft.pmi;
    this.clearFieldError('pmi');
  }

  normalizePhone(field: 'phone1' | 'phone2' | 'companyPhone', value: string): void {
    this.draft[field] = formatUsPhone(value);
    this.clearFieldError(field);
  }

  normalizeSsn(value: string): void {
    this.draft.ssn = formatUsSsn(value);
    this.clearFieldError('ssn');
  }

  normalizePostalCode(value: string): void {
    const lookupCountryCode = this.selectedCountryCode() || this.postalLookupCountryCode;
    const formattedPostalCode =
      lookupCountryCode === 'US'
        ? formatUsPostalCode(value)
        : value
            .toUpperCase()
            .replace(/[^A-Z0-9 -]/g, '')
            .slice(0, 20);
    this.draft.zip = formattedPostalCode;
    this.clearFieldError('zip');

    if (formattedPostalCode !== this.lastPostalCode) {
      this.lastPostalCode = formattedPostalCode;
      this.selectedCountryCode.set('US');
      this.postalCountry.set('United States');
      this.draft.country = 'United States';
      this.draft.state = '';
      this.draft.city = '';
      this.draft.county = '';
      this.stateOptions.set([]);
      this.cityOptions.set([]);
    }

    if (this.draft.zip.trim().length >= (lookupCountryCode === 'US' ? 5 : 2)) {
      this.queuePostalLookup(lookupCountryCode);
    } else {
      this.postalLookupMessage.set(null);
    }
  }

  private queuePostalLookup(
    countryCode = this.selectedCountryCode() || this.postalLookupCountryCode,
  ): void {
    this.postalCodeChanges.next(`${countryCode}|${this.draft.zip.trim()}`);
  }

  private loadStates(country: string): void {
    this.geography
      .states(country)
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((states) => this.stateOptions.set(states));
  }

  createClientFromBasicDetails(): void {
    if (this.saving()) return;

    this.draft.country = 'United States';
    const errors = this.validateStep(0);
    if (errors.length) {
      this.validationErrors.set(errors);
      this.errorMessage.set(
        'Please correct the highlighted client information before creating the record.',
      );
      return;
    }

    this.clearMessages();
    this.saving.set(true);

    this.api
      .createClientBasicDetails(clientFormToBasicDetailsRequest(this.draft))
      .pipe(
        timeout(30_000),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (created) => {
          this.createdClientId.set(created.id);
          this.editorVersion.set(created.editorVersion);
          this.furthestStepIndex.set(1);
          this.stepIndex.set(1);
          void this.router.navigate(['/clients', 'new', created.id], { replaceUrl: true });
          this.clearMessages();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.errorMessage.set(
              'The API did not finish creating the client within 30 seconds. No success was confirmed; check the API logs before trying again.',
            );
            return;
          }
          this.handleApiError(error as HttpErrorResponse);
        },
      });
  }

  updateClientBasicDetails(): void {
    if (this.saving()) return;
    const clientId = this.createdClientId();
    const editorVersion = this.editorVersion();
    if (!clientId || !editorVersion) {
      this.errorMessage.set('The client creation session is unavailable.');
      return;
    }

    const errors = this.validateStep(0);
    if (errors.length) {
      this.validationErrors.set(errors);
      this.errorMessage.set('Please correct the highlighted client information before saving.');
      return;
    }

    this.clearMessages();
    this.saving.set(true);
    this.api
      .updateClientBasicDetails(
        clientId,
        clientFormToBasicDetailsUpdateRequest(this.draft, editorVersion),
      )
      .pipe(
        timeout(30_000),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.editorVersion.set(updated.editorVersion);
          this.stepIndex.set(1);
          this.clearMessages();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.errorMessage.set(
              'The API did not finish saving the Basic details. No success was confirmed.',
            );
            return;
          }
          this.handleApiError(error as HttpErrorResponse);
        },
      });
  }

  saveAdditionalInformation(): void {
    if (this.saving()) return;
    const clientId = this.createdClientId();
    const editorVersion = this.editorVersion();
    if (!clientId || !editorVersion) {
      this.errorMessage.set('Save Basic details before continuing.');
      return;
    }

    this.clearMessages();
    this.saving.set(true);
    this.api
      .updateClientAdditionalInformation(
        clientId,
        clientFormToAdditionalInformationRequest(this.draft, editorVersion),
      )
      .pipe(
        timeout(30_000),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.editorVersion.set(updated.editorVersion);
          this.furthestStepIndex.update((current) => Math.max(current, 2));
          this.stepIndex.set(2);
          this.clearMessages();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.errorMessage.set(
              'The API did not finish saving the additional information. No success was confirmed.',
            );
            return;
          }
          this.handleApiError(error as HttpErrorResponse);
        },
      });
  }

  saveContactInformation(): void {
    if (this.saving()) return;
    const clientId = this.createdClientId();
    const editorVersion = this.editorVersion();
    if (!clientId || !editorVersion) {
      this.errorMessage.set('Save the previous steps before continuing.');
      return;
    }
    const errors = this.validateStep(2);
    if (errors.length) {
      this.validationErrors.set(errors);
      return;
    }

    this.clearMessages();
    this.saving.set(true);
    this.api
      .updateClientContactInformation(
        clientId,
        clientFormToContactInformationRequest(this.draft, editorVersion),
      )
      .pipe(
        timeout(30_000),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.editorVersion.set(updated.editorVersion);
          this.furthestStepIndex.update((current) => Math.max(current, 3));
          this.stepIndex.set(3);
          this.clearMessages();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.errorMessage.set(
              'The API did not finish saving the contact information. No success was confirmed.',
            );
            return;
          }
          this.handleApiError(error as HttpErrorResponse);
        },
      });
  }

  confirmCompletion(): void {
    const clientId = this.createdClientId();
    if (!clientId) return;
    this.completionDialog.set(null);
    void this.router.navigate(['/clients', clientId], { state: { clientCreated: true } });
  }

  finish(): void {
    const clientId = this.createdClientId();
    const editorVersion = this.editorVersion();
    if (this.saving()) return;
    if (!clientId || !editorVersion) {
      this.errorMessage.set('Save the client details before finishing setup.');
      return;
    }
    const hospitalizations = this.hospitalizationsSection();
    if (hospitalizations && !hospitalizations.canLeaveStep()) return;

    this.clearMessages();
    this.saving.set(true);
    this.api
      .completeClientCreation(clientId, editorVersion)
      .pipe(
        timeout(30_000),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (completed) => {
          this.editorVersion.set(completed.editorVersion);
          this.completionDialog.set({
            title: 'Client created successfully',
            message: 'The client setup has been completed.',
          });
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.errorMessage.set(
              'The API did not confirm completion within 30 seconds. Check the client before trying again.',
            );
            return;
          }
          this.handleApiError(error as HttpErrorResponse);
        },
      });
  }

  private loadCreationState(clientId: string): void {
    this.resuming.set(true);
    this.saving.set(true);
    this.api
      .getClientCreationState(clientId)
      .pipe(
        finalize(() => {
          this.resuming.set(false);
          this.saving.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (state) => {
          Object.assign(this.draft, clientDetailsToForm(state.client), { ssn: '' });
          this.createdClientId.set(state.id);
          this.editorVersion.set(state.editorVersion);
          const restoredIndex = Math.min(Math.max(state.currentStep - 1, 0), this.steps.length - 1);
          this.furthestStepIndex.set(restoredIndex);
          this.stepIndex.set(restoredIndex);
          if (this.draft.locationId) this.selectLocation(this.draft.locationId);
          this.clearMessages();
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 409) {
            void this.router.navigate(['/clients', clientId]);
            return;
          }
          this.errorMessage.set(
            error.status === 404
              ? 'The pending client could not be found or you no longer have access.'
              : 'The client creation session could not be loaded. Try again.',
          );
        },
      });
  }

  private advanceRelatedProgress(): void {
    if (this.saving() || !this.canLeaveCurrentStep()) return;
    const clientId = this.createdClientId();
    const editorVersion = this.editorVersion();
    if (!clientId || !editorVersion) {
      this.errorMessage.set('The client creation session is unavailable.');
      return;
    }

    const nextIndex = this.stepIndex() + 1;
    const nextStep = nextIndex + 1;
    this.clearMessages();
    this.saving.set(true);
    this.api
      .advanceClientCreationProgress(clientId, nextStep, editorVersion)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (progress) => {
          this.editorVersion.set(progress.editorVersion);
          this.furthestStepIndex.update((current) => Math.max(current, progress.currentStep - 1));
          this.stepIndex.set(nextIndex);
          this.clearMessages();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private canLeaveCurrentStep(): boolean {
    switch (this.activeStep().id) {
      case 'client-contacts':
        return this.contactsSection()?.canLeaveStep() ?? true;
      case 'care-coordinators':
        return this.careCoordinatorsSection()?.canLeaveStep() ?? true;
      case 'consultation-providers':
      case 'doctors':
        return this.clinicalContactsSection()?.canLeaveStep() ?? true;
      case 'responsible-parties':
        return this.responsiblePartiesSection()?.canLeaveStep() ?? true;
      case 'hospitalizations':
        return this.hospitalizationsSection()?.canLeaveStep() ?? true;
      default:
        return true;
    }
  }

  private validateStep(index: number): readonly string[] {
    if (index === 0) return this.validateSections(true, false);
    if (index === 2) return this.validateSections(false, true);
    return [];
  }

  private validateAll(): readonly string[] {
    return this.validateSections(true, true);
  }

  private validateSections(includeBasic: boolean, includeContact: boolean): readonly string[] {
    const fields: Record<string, string> = {};
    const add = (field: string, message: string): void => {
      fields[field] = message;
    };
    if (includeBasic) {
      if (!this.draft.firstName.trim()) add('firstName', 'First name is required.');
      if (!this.draft.lastName.trim()) add('lastName', 'Last name is required.');
      if (!this.draft.dob) add('dob', 'Date of birth is required.');
      else if (this.draft.dob > new Date().toISOString().slice(0, 10))
        add('dob', 'Date of birth cannot be in the future.');
      if (!this.draft.gender) add('gender', 'Gender is required.');
      if (!this.draft.pmi.trim()) add('pmi', 'PMI number is required.');
      else if (!isValidPmi(this.draft.pmi)) add('pmi', 'PMI number must contain exactly 8 digits.');
      if (!this.draft.socDate) add('socDate', 'SOC date is required.');
      if (this.draft.ssn && !isValidUsSsn(this.draft.ssn))
        add('ssn', 'Enter a valid 9-digit US Social Security number.');
      if (this.draft.intakeDate && this.draft.socDate && this.draft.intakeDate > this.draft.socDate)
        add('intakeDate', 'Intake date cannot be after the SOC date.');
      if (this.draft.status === 'Discharged' && !this.draft.dischargeDate)
        add('dischargeDate', 'Discharge date is required for a discharged client.');
      if (
        this.draft.dischargeDate &&
        this.draft.socDate &&
        this.draft.dischargeDate < this.draft.socDate
      )
        add('dischargeDate', 'Discharge date cannot be before the SOC date.');
      if (this.draft.evvHours) {
        const hours = Number(this.draft.evvHours);
        if (!Number.isFinite(hours) || hours < 0 || hours > 168)
          add('evvHours', 'EVV hours must be between 0 and 168 per week.');
      }
      if (this.draft.services.length > 20) add('services', 'Select no more than 20 services.');
    }
    if (includeContact) {
      if (this.draft.email && !isValidEmail(this.draft.email))
        add('email', 'Enter a valid email address.');
      if (!this.draft.phone1.trim()) add('phone1', 'Primary phone is required.');
      else if (!isValidUsPhone(this.draft.phone1))
        add('phone1', 'Enter a 10-digit US phone number.');
      if (this.draft.phone2 && !isValidUsPhone(this.draft.phone2))
        add('phone2', 'Enter a 10-digit US phone number.');
      if (!this.draft.street.trim()) add('street', 'Street address is required.');
      if (
        this.draft.zip &&
        this.selectedCountryCode() === 'US' &&
        !isValidUsPostalCode(this.draft.zip)
      ) {
        add('zip', 'Use ZIP format 12345 or 12345-6789.');
      }
      if (this.draft.languages.length === 0)
        add('languages', 'Select at least one preferred language.');
      else if (this.draft.languages.length > 10)
        add('languages', 'Select no more than 10 preferred languages.');
      else if (
        new Set(this.draft.languages.map((value) => value.trim().toLowerCase())).size !==
        this.draft.languages.length
      )
        add('languages', 'Preferred languages cannot contain duplicates.');
    }
    this.fieldErrors.set(fields);
    return Object.values(fields);
  }

  fieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  clearFieldError(field: string): void {
    if (!this.fieldErrors()[field]) return;
    const next = { ...this.fieldErrors() };
    delete next[field];
    this.fieldErrors.set(next);
    if (Object.keys(next).length === 0) this.errorMessage.set(null);
  }

  private handleApiError(error: HttpErrorResponse): void {
    const problem = error.error as {
      type?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    } | null;
    const problemType = typeof problem?.type === 'string' ? problem.type : '';
    const serverErrors = problem?.errors
      ? Object.values(problem.errors)
          .flat()
          .filter((message): message is string => typeof message === 'string')
      : [];

    if (serverErrors.length) this.validationErrors.set(serverErrors);

    if (problemType.endsWith('client-duplicate-pmi') || (error.status === 409 && !problemType)) {
      this.errorMessage.set('A client with this PMI number already exists.');
      return;
    }

    this.errorMessage.set(
      problem?.detail ||
        'The client could not be created. Please review the information and try again.',
    );
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.validationErrors.set([]);
    this.fieldErrors.set({});
  }
}
