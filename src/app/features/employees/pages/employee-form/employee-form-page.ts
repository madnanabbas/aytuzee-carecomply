import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { Company, CompanyService } from '../../../access-control/companies/company.service';
import {
  CompanyLocation,
  LocationService,
} from '../../../access-control/companies/location.service';
import {
  formatContactPhone,
  isValidContactEmail,
  isValidContactPhone,
} from '../../../clients/models/contact-input-formatting';
import {
  EmployeeApiService,
  EmployeeBackgroundCheck,
  EmployeeBackgroundInformation,
  EmployeeContact,
  EmployeeCourse,
  EmployeeFormModel,
  EmployeePayerAffiliation,
  EmployeeTrainingInformation,
  EmployeeTrainingSkill,
  emptyEmployee,
} from '../../data-access/employee-api.service';

@Component({
  selector: 'app-employee-form-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './employee-form-page.html',
  styleUrls: [
    './employee-form-page.css',
    './employee-form-validation.css',
    './payer-affiliation.css',
  ],
})
export class EmployeeFormPageComponent {
  private readonly api = inject(EmployeeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locationsApi = inject(LocationService);
  private readonly companiesApi = inject(CompanyService);
  private readonly session = inject(AuthSessionService);
  private readonly destroy = inject(DestroyRef);
  readonly steps = [
    'Basic info',
    'Additional info',
    'Contact info',
    'Training info',
    'Payer info',
    'Background info',
  ] as const;
  readonly step = signal(0);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly fieldErrors = signal<Readonly<Record<string, string>>>({});
  readonly companies = signal<readonly Company[]>([]);
  readonly locations = signal<readonly CompanyLocation[]>([]);
  readonly draft: EmployeeFormModel = emptyEmployee();
  readonly employeeId = this.route.snapshot.paramMap.get('employeeId');
  private persistedEmployeeId: string | null = this.employeeId;
  readonly editing = !!this.employeeId;
  readonly title = computed(() => (this.editing ? 'Edit employee' : 'Add employee'));
  readonly languages = ['English', 'Spanish', 'Somali', 'Hmong', 'Arabic'] as const;
  readonly payerEditingIndex = signal<number | null>(null);
  readonly payerDraft: EmployeePayerAffiliation = {
    company: '',
    payer: '',
    payerId: '',
    applicationFaxedDate: '',
    affiliationDate: '',
    affiliationEndDate: '',
  };
  readonly backgroundEditingIndex = signal<number | null>(null);
  readonly backgroundDraft: EmployeeBackgroundCheck = this.emptyBackgroundCheck();
  readonly courseEditingIndex = signal<number | null>(null);
  readonly courseDraft: EmployeeCourse = this.emptyCourse();
  readonly trainingEditingIndex = signal<number | null>(null);
  readonly trainingDraft: EmployeeTrainingSkill = this.emptyTraining();
  readonly contactEditingIndex = signal<number | null>(null);
  readonly contactDraft: EmployeeContact = this.emptyContact();
  readonly courseOptions = [
    'Orientation',
    'HIPAA and privacy',
    'CPR / First Aid',
    'Medication administration',
    'Infection control',
    'Person-centered care',
  ] as const;
  readonly trainingOptions = [
    'PCA certification',
    'CFSS worker training',
    'CPR certification',
    'First Aid certification',
    'Medication administration',
    'Positive supports',
  ] as const;
  readonly weekdays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ] as const;
  readonly qualificationOptions = [
    'PCA',
    'CFSS Support Worker',
    'Home Health Aide',
    'CNA',
    'RN',
    'Medication Administration',
  ] as const;
  readonly clientTypeOptions = [
    'Adults',
    'Children',
    'Seniors',
    'Behavioral health',
    'Physical disabilities',
    'Developmental disabilities',
  ] as const;
  constructor() {
    const requestedStep = Number(this.route.snapshot.queryParamMap.get('step'));
    if (this.editing && Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < this.steps.length)
      this.step.set(requestedStep);
    this.draft.insuranceAffiliationRequired = false;
    this.draft.payerAffiliations = [];
    this.draft.backgroundInformation = this.emptyBackgroundInformation();
    this.draft.trainingInformation = this.emptyTrainingInformation();
    this.draft.contacts = [];
    forkJoin({
      companies: this.session.currentUser()?.isPlatformAdministrator
        ? this.companiesApi.list().pipe(catchError(() => of([])))
        : of([] as readonly Company[]),
      locations: this.locationsApi.list().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(({ companies, locations }) => {
        this.companies.set(companies.filter((x) => x.isActive));
        this.locations.set(locations);
        if (!this.editing && locations.length)
          this.draft.locationIds = [locations.find((x) => x.isMain)?.id ?? locations[0].id];
      });
    if (this.employeeId) {
      this.loading.set(true);
      this.api
        .get(this.employeeId)
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe({
          next: (value) => {
            Object.assign(this.draft, this.normalize(value));
            this.loadLocations(value.companyId);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Employee could not be loaded.');
            this.loading.set(false);
          },
        });
    }
  }
  go(index: number) {
    if (this.saving() || this.loading()) return;
    if (index === this.step() + 1) {
      this.next();
    } else if (index < this.step()) {
      this.error.set('');
      this.step.set(index);
    }
  }
  next() {
    if (this.saving() || this.loading() || this.step() >= this.steps.length - 1 || !this.validateCurrentStep()) return;
    this.persistEmployee(this.step() + 1);
  }
  back() {
    this.step.update((x) => Math.max(0, x - 1));
  }
  companyChanged(id: string) {
    this.draft.companyId = id || null;
    this.draft.locationIds = [];
    this.loadLocations(id);
  }
  private loadLocations(companyId?: string | null) {
    this.locationsApi
      .list(companyId)
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((items) => {
        this.locations.set(items);
        if (!this.draft.locationIds.length && items.length)
          this.draft.locationIds = [items.find((x) => x.isMain)?.id ?? items[0].id];
      });
  }
  toggleLocation(id: string, checked: boolean) {
    this.draft.locationIds = checked
      ? [...this.draft.locationIds, id]
      : this.draft.locationIds.filter((x) => x !== id);
    this.clearFieldError('locationIds');
  }
  toggleLanguage(value: string, checked: boolean) {
    this.draft.languages = checked
      ? [...this.draft.languages, value]
      : this.draft.languages.filter((x) => x !== value);
  }
  toggleList(
    field: 'availableDays' | 'qualifications' | 'clientTypes',
    value: string,
    checked: boolean,
  ) {
    const values = this.draft[field];
    this.draft[field] = checked ? [...values, value] : values.filter((x) => x !== value);
  }
  addPreviousAddress() {
    if (this.draft.previousAddresses.length >= 10) return;
    this.draft.previousAddresses = [
      ...this.draft.previousAddresses,
      { street: '', postalCode: '', city: '', county: '', state: 'MN' },
    ];
  }
  removePreviousAddress(index: number) {
    this.draft.previousAddresses = this.draft.previousAddresses.filter((_, i) => i !== index);
  }
  savePayerAffiliation() {
    const company = this.payerDraft.company.trim();
    const payer = this.payerDraft.payer.trim();
    if (!company || !payer) {
      this.fieldErrors.set({
        ...this.fieldErrors(),
        payerAffiliation: 'Company and payer are required.',
      });
      return;
    }
    if (
      this.payerDraft.affiliationDate &&
      this.payerDraft.affiliationEndDate &&
      this.payerDraft.affiliationEndDate < this.payerDraft.affiliationDate
    ) {
      this.fieldErrors.set({
        ...this.fieldErrors(),
        payerAffiliation: 'Affiliation end date cannot be before the affiliation date.',
      });
      return;
    }
    const item = { ...this.payerDraft, company, payer, payerId: this.payerDraft.payerId.trim() };
    const affiliations = [...(this.draft.payerAffiliations ?? [])];
    const index = this.payerEditingIndex();
    if (index === null) affiliations.push(item);
    else affiliations[index] = item;
    this.draft.payerAffiliations = affiliations;
    this.cancelPayerAffiliation();
    this.clearFieldError('payerAffiliations');
  }
  editPayerAffiliation(index: number) {
    Object.assign(this.payerDraft, (this.draft.payerAffiliations ?? [])[index]);
    this.payerEditingIndex.set(index);
    this.clearFieldError('payerAffiliation');
  }
  removePayerAffiliation(index: number) {
    this.draft.payerAffiliations = (this.draft.payerAffiliations ?? []).filter(
      (_, i) => i !== index,
    );
    this.clearFieldError('payerAffiliations');
  }
  cancelPayerAffiliation() {
    Object.assign(this.payerDraft, {
      company: '',
      payer: '',
      payerId: '',
      applicationFaxedDate: '',
      affiliationDate: '',
      affiliationEndDate: '',
    });
    this.payerEditingIndex.set(null);
    this.clearFieldError('payerAffiliation');
  }
  saveBackgroundCheck() {
    const licenseType = this.backgroundDraft.licenseType.trim();
    const studyType = this.backgroundDraft.studyType.trim();
    const information = this.backgroundInformation();
    if (this.backgroundEditingIndex() === null && information.checks.length >= 20) {
      this.fieldErrors.set({
        ...this.fieldErrors(),
        backgroundCheck: 'No more than 20 background checks may be recorded.',
      });
      return;
    }
    if (!licenseType || !studyType) {
      this.fieldErrors.set({
        ...this.fieldErrors(),
        backgroundCheck: 'License type and study type are required.',
      });
      return;
    }
    if (this.backgroundDraft.received && !this.backgroundDraft.receivedDate) {
      this.fieldErrors.set({
        ...this.fieldErrors(),
        backgroundCheck: 'Received date is required when the check is marked received.',
      });
      return;
    }
    if (
      this.backgroundDraft.checkDate &&
      this.backgroundDraft.receivedDate &&
      this.backgroundDraft.receivedDate < this.backgroundDraft.checkDate
    ) {
      this.fieldErrors.set({
        ...this.fieldErrors(),
        backgroundCheck: 'Received date cannot be before the check date.',
      });
      return;
    }
    const item = { ...this.backgroundDraft, licenseType, studyType };
    const checks = [...information.checks];
    const index = this.backgroundEditingIndex();
    if (index === null) checks.push(item);
    else checks[index] = item;
    information.checks = checks;
    this.cancelBackgroundCheck();
    this.clearFieldError('backgroundInformation');
  }
  editBackgroundCheck(index: number) {
    Object.assign(this.backgroundDraft, this.backgroundInformation().checks[index]);
    this.backgroundEditingIndex.set(index);
    this.clearFieldError('backgroundCheck');
  }
  removeBackgroundCheck(index: number) {
    this.backgroundInformation().checks = this.backgroundInformation().checks.filter(
      (_, i) => i !== index,
    );
    this.clearFieldError('backgroundInformation');
  }
  cancelBackgroundCheck() {
    Object.assign(this.backgroundDraft, this.emptyBackgroundCheck());
    this.backgroundEditingIndex.set(null);
    this.clearFieldError('backgroundCheck');
  }
  get background(): EmployeeBackgroundInformation {
    return this.backgroundInformation();
  }
  get training(): EmployeeTrainingInformation {
    return this.trainingInformation();
  }
  saveCourse(): boolean {
    const name = this.courseDraft.courseName.trim();
    const information = this.trainingInformation();
    if (information.courses.length >= 50 && this.courseEditingIndex() === null)
      return this.setTrainingError('No more than 50 courses may be recorded.');
    if (!name) return this.setTrainingError('Select a course.');
    if (
      !this.validPoints(this.courseDraft.qualifyingPoints) ||
      !this.validPoints(this.courseDraft.obtainedPoints)
    )
      return this.setTrainingError('Course points must be between 0 and 10,000.');
    const item = { ...this.courseDraft, courseName: name, notes: this.courseDraft.notes.trim() };
    const rows = [...information.courses];
    const index = this.courseEditingIndex();
    if (index === null) rows.push(item);
    else rows[index] = item;
    information.courses = rows;
    this.cancelCourse();
    return true;
  }
  editCourse(index: number) {
    Object.assign(this.courseDraft, this.trainingInformation().courses[index]);
    this.courseEditingIndex.set(index);
    this.clearFieldError('trainingInformation');
  }
  removeCourse(index: number) {
    this.trainingInformation().courses = this.trainingInformation().courses.filter(
      (_, i) => i !== index,
    );
    this.clearFieldError('trainingInformation');
  }
  cancelCourse() {
    Object.assign(this.courseDraft, this.emptyCourse());
    this.courseEditingIndex.set(null);
    this.clearFieldError('trainingInformation');
  }
  saveTraining(): boolean {
    const name = this.trainingDraft.trainingName.trim();
    const information = this.trainingInformation();
    if (information.trainings.length >= 50 && this.trainingEditingIndex() === null)
      return this.setTrainingError('No more than 50 training records may be recorded.');
    if (!name) return this.setTrainingError('Select a training or skill.');
    if (
      !this.validPoints(this.trainingDraft.qualifyingPoints) ||
      !this.validPoints(this.trainingDraft.obtainedPoints)
    )
      return this.setTrainingError('Training points must be between 0 and 10,000.');
    if (
      this.trainingDraft.completedOn &&
      this.trainingDraft.expiresOn &&
      this.trainingDraft.expiresOn < this.trainingDraft.completedOn
    )
      return this.setTrainingError('Expiration date cannot be before the completed date.');
    const item = {
      ...this.trainingDraft,
      trainingName: name,
      jobTitle: this.trainingDraft.jobTitle.trim(),
      notes: this.trainingDraft.notes.trim(),
    };
    const rows = [...information.trainings];
    const index = this.trainingEditingIndex();
    if (index === null) rows.push(item);
    else rows[index] = item;
    information.trainings = rows;
    this.cancelTraining();
    return true;
  }
  editTraining(index: number) {
    Object.assign(this.trainingDraft, this.trainingInformation().trainings[index]);
    this.trainingEditingIndex.set(index);
    this.clearFieldError('trainingInformation');
  }
  removeTraining(index: number) {
    this.trainingInformation().trainings = this.trainingInformation().trainings.filter(
      (_, i) => i !== index,
    );
    this.clearFieldError('trainingInformation');
  }
  cancelTraining() {
    Object.assign(this.trainingDraft, this.emptyTraining());
    this.trainingEditingIndex.set(null);
    this.clearFieldError('trainingInformation');
  }
  contactPhone(value: string) {
    this.contactDraft.phone = formatContactPhone(value);
    this.clearFieldError('contacts');
  }
  saveContact(): boolean {
    const name = this.contactDraft.name.trim();
    const contacts = this.draft.contacts ?? [];
    if (contacts.length >= 20 && this.contactEditingIndex() === null)
      return this.setContactError('No more than 20 contacts may be recorded.');
    if (!name) return this.setContactError('Contact name is required.');
    if (!isValidContactPhone(this.contactDraft.phone))
      return this.setContactError('Enter a valid 10-digit US contact phone number.');
    const item = {
      name,
      phone: this.contactDraft.phone,
      relationship: this.contactDraft.relationship.trim(),
    };
    const rows = [...contacts];
    const index = this.contactEditingIndex();
    if (index === null) rows.push(item);
    else rows[index] = item;
    this.draft.contacts = rows;
    this.cancelContact();
    return true;
  }
  editContact(index: number) {
    Object.assign(this.contactDraft, (this.draft.contacts ?? [])[index]);
    this.contactEditingIndex.set(index);
    this.clearFieldError('contacts');
  }
  removeContact(index: number) {
    this.draft.contacts = (this.draft.contacts ?? []).filter((_, i) => i !== index);
    this.clearFieldError('contacts');
  }
  cancelContact() {
    Object.assign(this.contactDraft, this.emptyContact());
    this.contactEditingIndex.set(null);
    this.clearFieldError('contacts');
  }
  previousAddressPostal(index: number, value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    this.draft.previousAddresses[index].postalCode =
      digits.length <= 5 ? digits : `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  phone(field: 'phone' | 'secondaryPhone' | 'emergencyContactPhone' | 'payerPhone', value: string) {
    this.draft[field] = formatContactPhone(value);
    this.clearFieldError(field);
  }
  ssn(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 9);
    this.draft.ssn =
      d.length <= 3
        ? d
        : d.length <= 5
          ? `${d.slice(0, 3)}-${d.slice(3)}`
          : `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
    this.clearFieldError('ssn');
  }
  pin(value: string) {
    this.draft.ivrPin = value.replace(/\D/g, '').slice(0, 10);
  }
  npi(value: string) {
    this.draft.npi = value.replace(/\D/g, '').slice(0, 10);
    this.clearFieldError('npi');
  }
  postal(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    this.draft.postalCode =
      digits.length <= 5 ? digits : `${digits.slice(0, 5)}-${digits.slice(5)}`;
    this.clearFieldError('postalCode');
  }
  fieldError(field: string): string {
    return this.fieldErrors()[field] ?? '';
  }
  clearFieldError(field: string) {
    if (!this.fieldErrors()[field]) return;
    const next = { ...this.fieldErrors() };
    delete next[field];
    this.fieldErrors.set(next);
  }
  age(): string {
    if (!this.draft.dateOfBirth) return 'Calculated automatically';
    const dob = new Date(`${this.draft.dateOfBirth}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const month = today.getMonth() - dob.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age--;
    return Number.isFinite(age) && age >= 0 ? String(age) : 'Calculated automatically';
  }
  save() {
    if (this.saving() || this.loading() || !this.validateAll()) return;
    this.persistEmployee(null);
  }
  private validateCurrentStep(): boolean {
    const current = this.step();
    if (!this.validate(current)) return false;
    if (current === 2) return this.validateContacts();
    if (current === 3) return this.validateTraining();
    if (current === 4 && this.draft.insuranceAffiliationRequired && !this.draft.payerAffiliations?.length) {
      this.fieldErrors.set({ payerAffiliations: 'Add at least one payer affiliation when insurance affiliation is required.' });
      return this.invalid('Review the highlighted payer information.');
    }
    return current !== 5 || this.validateBackground();
  }
  private persistEmployee(nextStep: number | null): void {
    this.saving.set(true);
    this.error.set('');
    const request = this.persistedEmployeeId
      ? this.api.update(this.persistedEmployeeId, this.draft)
      : this.api.create(this.draft);
    request.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (employee) => {
        const createdNow = !this.persistedEmployeeId;
        this.persistedEmployeeId = employee.id;
        if (nextStep === null) {
          void this.router.navigate(['/employees', employee.id]);
        } else if (createdNow) {
          void this.router.navigate(['/employees', employee.id, 'edit'], {
            queryParams: { step: nextStep },
            replaceUrl: true,
          }).then((navigated) => {
            if (!navigated) this.error.set('Employee was saved, but the next step could not open. Open the employee again to continue.');
          });
        } else {
          this.step.set(nextStep);
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { step: nextStep },
            replaceUrl: true,
          });
        }
        this.saving.set(false);
      },
      error: (error) => this.handleSaveError(error),
    });
  }
  private handleSaveError(error: { error?: { errors?: Record<string, string[]>; title?: string } }): void {
    const serverErrors = error.error?.errors;
    if (serverErrors) {
      const mapped: Record<string, string> = {};
      for (const [key, messages] of Object.entries(serverErrors))
        mapped[key.charAt(0).toLowerCase() + key.slice(1)] = messages[0] ?? 'Invalid value.';
      this.fieldErrors.set(mapped);
    }
    this.error.set(error.error?.title ?? 'Employee could not be saved. Review the highlighted fields.');
    this.saving.set(false);
  }
  private validate(index: number) {
    const errors: Record<string, string> = {};
    if (index === 0) {
      if (!this.draft.hireDate) errors['hireDate'] = 'Hire date is required.';
      if (!this.draft.locationIds.length) errors['locationIds'] = 'Select at least one location.';
      if (!this.draft.firstName.trim()) errors['firstName'] = 'First name is required.';
      if (!this.draft.lastName.trim()) errors['lastName'] = 'Last name is required.';
      if (!this.draft.jobTitle.trim()) errors['jobTitle'] = 'Primary title is required.';
      if (!this.draft.email.trim()) errors['email'] = 'Employee email is required.';
      else if (!isValidContactEmail(this.draft.email))
        errors['email'] = 'Enter a valid email address.';
      if (!this.draft.dateOfBirth) errors['dateOfBirth'] = 'Date of birth is required.';
      if (!this.draft.gender) errors['gender'] = 'Select a gender.';
      if (!isValidContactPhone(this.draft.phone, true))
        errors['phone'] = 'Enter a 10-digit US phone number.';
      if (!this.draft.streetAddress.trim()) errors['streetAddress'] = 'Street address is required.';
      if (!this.persistedEmployeeId && this.draft.ssn.replace(/\D/g, '').length !== 9)
        errors['ssn'] = 'Enter a 9-digit SSN.';
      if (this.draft.npi && this.draft.npi.length !== 10)
        errors['npi'] = 'NPI must contain 10 digits.';
      if (this.draft.evvEmail && !isValidContactEmail(this.draft.evvEmail))
        errors['evvEmail'] = 'Enter a valid EVV email address.';
      if (this.draft.evvPassword !== this.draft.evvPasswordConfirm)
        errors['evvPasswordConfirm'] = 'Passwords do not match.';
    }
    if (index === 1) {
      if (this.draft.hasUsedDifferentName && !this.draft.previousName.trim())
        errors['previousName'] = 'Enter the name previously used.';
      if (
        this.draft.heightInches !== null &&
        (this.draft.heightInches <= 0 || this.draft.heightInches > 120)
      )
        errors['heightInches'] = 'Enter a height from 1 to 120 inches.';
      if (
        this.draft.weightPounds !== null &&
        (this.draft.weightPounds <= 0 || this.draft.weightPounds > 1500)
      )
        errors['weightPounds'] = 'Enter a weight from 1 to 1,500 pounds.';
      if (
        this.draft.hasWorkingHourRestrictions &&
        (!this.draft.availableStartTime || !this.draft.availableEndTime)
      )
        errors['availableStartTime'] = 'Enter both an available start and end time.';
      else if (
        this.draft.availableStartTime &&
        this.draft.availableEndTime &&
        this.draft.availableStartTime >= this.draft.availableEndTime
      )
        errors['availableEndTime'] = 'End time must be after start time.';
      if (!this.draft.canWorkWithSmokers && !this.draft.smokerRestrictionExplanation.trim())
        errors['smokerRestrictionExplanation'] = 'Explain the smoking restriction.';
      if (this.draft.isMilitaryVeteran && !this.draft.militaryServiceExplanation.trim())
        errors['militaryServiceExplanation'] = 'Provide military service details.';
      if (!this.draft.canWorkWithPets && !this.draft.petRestrictionExplanation.trim())
        errors['petRestrictionExplanation'] = 'Explain the pet restriction.';
      if (this.draft.hasOtherJob && !this.draft.otherEmployerName.trim())
        errors['otherEmployerName'] = 'Enter the other employer name.';
    }
    if (index === 4 && !isValidContactPhone(this.draft.payerPhone))
      errors['payerPhone'] = 'Enter a 10-digit US phone number.';
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length)
      return this.invalid('Review the highlighted fields and correct the messages below them.');
    this.fieldErrors.set({});
    return true;
  }
  private validateAll() {
    for (let i = 0; i < 6; i++)
      if (!this.validate(i)) {
        this.step.set(i);
        return false;
      }
    if (!this.validateContacts()) {
      this.step.set(2);
      return false;
    }
    if (!this.validateTraining()) {
      this.step.set(3);
      return false;
    }
    if (this.draft.insuranceAffiliationRequired && !this.draft.payerAffiliations?.length) {
      this.step.set(4);
      this.fieldErrors.set({
        payerAffiliations:
          'Add at least one payer affiliation when insurance affiliation is required.',
      });
      return this.invalid('Review the highlighted fields and correct the messages below them.');
    }
    if (!this.validateBackground()) {
      this.step.set(5);
      return false;
    }
    return true;
  }
  private invalid(message: string) {
    this.error.set(message);
    return false;
  }
  private validateBackground() {
    const information = this.backgroundInformation();
    const hasUnsavedCheck = Object.entries(this.backgroundDraft).some(
      ([, value]) => value !== '' && value !== false,
    );
    if (hasUnsavedCheck) {
      this.fieldErrors.set({
        backgroundCheck: 'Add or update the background check before saving the employee.',
      });
      return this.invalid('Review the highlighted background information.');
    }
    if (
      information.mantouxGivenDate &&
      information.mantouxCheckedDate &&
      information.mantouxCheckedDate < information.mantouxGivenDate
    ) {
      this.fieldErrors.set({
        backgroundInformation: 'Mantoux checked date cannot be before the given date.',
      });
      return this.invalid('Review the highlighted background information.');
    }
    if (
      information.mantouxReceived &&
      (!information.mantouxGivenDate || !information.mantouxCheckedDate)
    ) {
      this.fieldErrors.set({
        backgroundInformation:
          'Mantoux given and checked dates are required when the result is received.',
      });
      return this.invalid('Review the highlighted background information.');
    }
    if (information.medicalTestingReceived && !information.medicalTestingDate) {
      this.fieldErrors.set({
        backgroundInformation: 'Medical testing date is required when the result is received.',
      });
      return this.invalid('Review the highlighted background information.');
    }
    return true;
  }
  private backgroundInformation(): EmployeeBackgroundInformation {
    return (
      this.draft.backgroundInformation ??
      (this.draft.backgroundInformation = this.emptyBackgroundInformation())
    );
  }
  private trainingInformation(): EmployeeTrainingInformation {
    return (
      this.draft.trainingInformation ??
      (this.draft.trainingInformation = this.emptyTrainingInformation())
    );
  }
  private validateTraining() {
    const dirtyCourse = Object.entries(this.courseDraft).some(
      ([, v]) => v !== '' && v !== null && v !== false,
    );
    const dirtyTraining = Object.entries(this.trainingDraft).some(
      ([, v]) => v !== '' && v !== null && v !== false,
    );
    if (dirtyCourse || dirtyTraining) {
      this.setTrainingError(
        'Add or update the current course/training before saving the employee.',
      );
      return this.invalid('Review the highlighted training information.');
    }
    return true;
  }
  private validPoints(value: number | null) {
    return value === null || (Number.isFinite(value) && value >= 0 && value <= 10000);
  }
  private setTrainingError(message: string) {
    this.fieldErrors.set({ ...this.fieldErrors(), trainingInformation: message });
    return false;
  }
  private emptyCourse(): EmployeeCourse {
    return {
      courseName: '',
      qualifyingPoints: null,
      completedOn: '',
      obtainedPoints: null,
      notes: '',
    };
  }
  private emptyTraining(): EmployeeTrainingSkill {
    return {
      trainingName: '',
      jobTitle: '',
      qualifyingPoints: null,
      completedOn: '',
      expiresOn: '',
      obtainedPoints: null,
      notes: '',
      allowedTraining: false,
    };
  }
  private emptyTrainingInformation(): EmployeeTrainingInformation {
    return { courses: [], trainings: [] };
  }
  private emptyContact(): EmployeeContact {
    return { name: '', phone: '', relationship: '' };
  }
  private setContactError(message: string) {
    this.fieldErrors.set({ ...this.fieldErrors(), contacts: message });
    return false;
  }
  private validateContacts() {
    const dirty = Object.values(this.contactDraft).some((value) => value !== '');
    if (dirty) {
      this.setContactError('Add or update the current contact before saving the employee.');
      return this.invalid('Review the highlighted contact information.');
    }
    return true;
  }
  private emptyBackgroundCheck(): EmployeeBackgroundCheck {
    return { checkDate: '', receivedDate: '', licenseType: '', studyType: '', received: false };
  }
  private emptyBackgroundInformation(): EmployeeBackgroundInformation {
    return {
      checks: [],
      mantouxGivenDate: '',
      mantouxCheckedDate: '',
      mantouxReceived: false,
      medicalTestingDate: '',
      medicalTestingReceived: false,
    };
  }
  private normalize(value: EmployeeFormModel) {
    const v = { ...emptyEmployee(), ...value };
    for (const key of [
      'hireDate',
      'startOfServiceDate',
      'inactiveDate',
      'dateOfBirth',
      'driverLicenseExpiresOn',
      'trainingCompletedOn',
      'trainingExpiresOn',
      'payerEffectiveFrom',
      'payerEffectiveTo',
      'tierEffectiveDate',
    ] as const)
      v[key] = v[key] ?? '';
    v.availableStartTime = v.availableStartTime?.slice(0, 5) ?? '';
    v.availableEndTime = v.availableEndTime?.slice(0, 5) ?? '';
    v.previousAddresses = v.previousAddresses ?? [];
    v.contacts = value.contacts ?? [];
    const background = value.backgroundInformation ?? this.emptyBackgroundInformation();
    v.backgroundInformation = {
      ...background,
      checks: (background.checks ?? []).map((check) => ({
        ...check,
        checkDate: check.checkDate ?? '',
        receivedDate: check.receivedDate ?? '',
      })),
      mantouxGivenDate: background.mantouxGivenDate ?? '',
      mantouxCheckedDate: background.mantouxCheckedDate ?? '',
      medicalTestingDate: background.medicalTestingDate ?? '',
    };
    const training = value.trainingInformation ?? this.emptyTrainingInformation();
    v.trainingInformation = {
      courses: (training.courses ?? []).map((x) => ({ ...x, completedOn: x.completedOn ?? '' })),
      trainings: (training.trainings ?? []).map((x) => ({
        ...x,
        completedOn: x.completedOn ?? '',
        expiresOn: x.expiresOn ?? '',
      })),
    };
    v.ssn = '';
    v.evvPassword = '';
    v.evvPasswordConfirm = '';
    v.ivrPin = '';
    return v;
  }
}
