import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo';
import { ClientWizardStepperComponent } from '../../shared/components/client-wizard-stepper/client-wizard-stepper';
import {
  formatContactPhone,
  isValidContactEmail,
  isValidContactPhone,
} from '../../shared/formatting/contact-input-formatting';
import { createEmptyClientForm } from '../clients/models/client-form.models';
import { PostalLookupService } from '../clients/data-access/postal-lookup.service';
import {
  formatPmi,
  formatUsSsn,
  formatUsPhone,
  isValidPmi,
  isValidUsSsn,
} from '../clients/models/client-field-validation';
import { CLIENT_SERVICE_OPTIONS } from '../clients/models/client-service-catalog';
import { CLIENT_WIZARD_STEP_TITLES } from '../clients/models/client-wizard-steps';
import { ClientCreateAdditionalSectionComponent } from '../clients/pages/client-create/client-create-additional-section';
import {
  CLIENT_DIET_OPTIONS,
  CLIENT_LANGUAGE_OPTIONS,
} from '../clients/pages/client-create/client-create-options';
import {
  PublicClientBasicDetailsRequest,
  PublicClientAdditionalInformation,
  PublicClientIntakeLocation,
  PublicClientIntakeSupervisor,
  PublicCaregiverAssignment,
  PublicCaregiverCandidate,
  SavePublicCaregiverRequest,
  PublicClientContact,
  SavePublicClientContactRequest,
  PublicCareCoordinator,
  SavePublicCareCoordinatorRequest,
  PublicConsultationProvider,
  SavePublicConsultationProviderRequest,
  PublicPhysician,
  SavePublicPhysicianRequest,
  PublicResponsibleParty,
  SavePublicResponsiblePartyRequest,
  PublicHospitalization,
  SavePublicHospitalizationRequest,
} from './public-client-intake.models';
import { PublicClientIntakeState } from './public-client-intake-state.service';
import { PublicIntakeMessageComponent } from './public-intake-message';

@Component({
  selector: 'app-public-client-intake-page',
  standalone: true,
  imports: [
    BrandLogoComponent,
    ClientWizardStepperComponent,
    ClientCreateAdditionalSectionComponent,
    DatePipe,
    FormsModule,
    PublicIntakeMessageComponent,
  ],
  providers: [PublicClientIntakeState],
  templateUrl: './public-client-intake-page.html',
  styleUrl: './public-client-intake-page.scss',
})
export class PublicClientIntakePageComponent implements OnInit, OnDestroy {
  readonly intake = inject(PublicClientIntakeState);
  private readonly postalLookup = inject(PostalLookupService);
  readonly started = signal(false);
  readonly saving = signal(false);
  readonly continuation = signal(false);
  readonly currentStep = signal(1);
  readonly editorVersion = signal<string | null>(null);
  readonly locations = signal<readonly PublicClientIntakeLocation[]>([]);
  readonly supervisors = signal<readonly PublicClientIntakeSupervisor[]>([]);
  readonly fieldErrors = signal<Readonly<Record<string, string>>>({});
  readonly submitError = signal<string | null>(null);
  readonly postalLookupLoading = signal(false);
  readonly postalLookupMessage = signal<string | null>(null);
  readonly draft = createEmptyClientForm();
  readonly serviceOptions = CLIENT_SERVICE_OPTIONS;
  readonly dietOptions = CLIENT_DIET_OPTIONS;
  readonly languageOptions = CLIENT_LANGUAGE_OPTIONS;
  readonly caregiverCandidates = signal<readonly PublicCaregiverCandidate[]>([]);
  readonly caregiverAssignments = signal<readonly PublicCaregiverAssignment[]>([]);
  readonly caregiverServices = signal<readonly string[]>([]);
  readonly editingCaregiver = signal<PublicCaregiverAssignment | null>(null);
  readonly caregiverDraft = {
    caregiverUserId: '',
    assignmentType: 'Primary' as 'Primary' | 'Backup',
    startDate: '',
    endDate: '',
    relationship: '',
    livesWithClient: null as boolean | null,
    assignedServices: [] as string[],
    notes: '',
    clientPreference: false,
  };
  readonly contacts = signal<readonly PublicClientContact[]>([]);
  readonly editingContact = signal<PublicClientContact | null>(null);
  readonly contactDraft = {
    type: 'General' as 'General' | 'Emergency',
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    isActive: true,
  };
  readonly careCoordinators = signal<readonly PublicCareCoordinator[]>([]);
  readonly editingCareCoordinator = signal<PublicCareCoordinator | null>(null);
  readonly careCoordinatorDraft = {
    name: '',
    companyName: '',
    phone: '',
    phoneExtension: '',
    fax: '',
    email: '',
    isActive: true,
  };
  readonly consultationProviders = signal<readonly PublicConsultationProvider[]>([]);
  readonly editingConsultationProvider = signal<PublicConsultationProvider | null>(null);
  readonly consultationProviderDraft = {
    name: '',
    phone: '',
    email: '',
    supportProviderName: '',
    supportProviderPhone: '',
    supportProviderAddress: '',
    isActive: true,
  };
  readonly physicians = signal<readonly PublicPhysician[]>([]);
  readonly editingPhysician = signal<PublicPhysician | null>(null);
  readonly physicianDraft = {
    name: '',
    npi: '',
    phone: '',
    fax: '',
    address: '',
    zipCode: '',
    city: '',
    state: '',
    isActive: true,
  };
  readonly responsibleParties = signal<readonly PublicResponsibleParty[]>([]);
  readonly editingResponsibleParty = signal<PublicResponsibleParty | null>(null);
  readonly responsiblePartyDraft = {
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    livesWithClient: null as boolean | null,
    hasSpenddown: null as boolean | null,
    isActive: true,
  };
  readonly hospitalizations = signal<readonly PublicHospitalization[]>([]);
  readonly editingHospitalization = signal<PublicHospitalization | null>(null);
  readonly hospitalizationDraft = {
    hospitalName: '',
    admittedAt: '',
    dischargedAt: '',
    reason: '',
    diagnosis: '',
    dischargeInstructions: '',
  };
  readonly steps = CLIENT_WIZARD_STEP_TITLES;
  readonly stepPresentations = CLIENT_WIZARD_STEP_TITLES.map((title) => ({ title }));

  ngOnInit(): void {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.intake.initialize();
    if (this.intake.viewState() === 'ready' && this.intake.context()?.hasCreatedClient) {
      await this.start();
    }
  }
  ngOnDestroy(): void {
    this.intake.clear();
  }
  async start(): Promise<void> {
    this.started.set(true);
    if (this.intake.context()?.hasCreatedClient) {
      await this.enterStepTwo();
      return;
    }
    try {
      this.locations.set(await this.intake.locations());
    } catch {
      this.submitError.set('Locations could not be loaded. Please try again.');
    }
  }

  normalizePmi(event: Event): void {
    this.draft.pmi = formatPmi((event.target as HTMLInputElement).value);
    this.clearError('pmi');
  }

  normalizeSsn(value: string): void {
    this.draft.ssn = formatUsSsn(value);
    this.clearError('ssn');
  }
  normalizeContactPhone(field: 'phone1' | 'phone2', value: string): void {
    this.draft[field] = formatUsPhone(value);
    this.clearError(field);
  }

  async lookupContactPostalCode(): Promise<void> {
    const postalCode = this.draft.zip.replace(/\D/g, '').slice(0, 5);
    this.draft.zip = postalCode;
    if (postalCode.length !== 5 || this.postalLookupLoading()) return;
    this.postalLookupLoading.set(true);
    this.postalLookupMessage.set(null);
    try {
      const match = await firstValueFrom(this.postalLookup.lookupPostalCode('US', postalCode));
      if (!match) {
        this.postalLookupMessage.set(
          'No postal match was found. Enter the city, state, and county manually.',
        );
        return;
      }
      this.draft.city = match.city;
      this.draft.state = match.state;
      if (match.area) this.draft.county = match.area;
      this.draft.country = 'United States';
      this.postalLookupMessage.set(
        'City and state were suggested from the ZIP code. Please verify the address.',
      );
    } catch {
      this.postalLookupMessage.set(
        'Postal lookup is temporarily unavailable. Enter the address manually.',
      );
    } finally {
      this.postalLookupLoading.set(false);
    }
  }

  toggleService(service: string, checked: boolean): void {
    const selected = new Set(this.draft.services);
    checked ? selected.add(service) : selected.delete(service);
    this.draft.services = this.serviceOptions.filter((value) => selected.has(value));
  }

  async selectLocation(locationId: string): Promise<void> {
    this.draft.locationId = locationId;
    this.draft.supervisor = '';
    this.supervisors.set([]);
    if (!locationId) return;
    try {
      this.supervisors.set(await this.intake.supervisors(locationId));
    } catch {
      this.submitError.set('Supervisors could not be loaded. You may continue without one.');
    }
  }

  async submit(): Promise<void> {
    if (this.saving()) return;
    const errors = this.validate();
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) return;
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const continuation = await this.intake.createBasicDetails(this.toRequest());
      this.editorVersion.set(continuation.editorVersion);
      await this.enterStepTwo();
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 410) {
        this.intake.viewState.set('expired');
      } else if (error instanceof HttpErrorResponse && error.error?.state === 'Completed') {
        this.intake.viewState.set('completed');
      } else if (error instanceof HttpErrorResponse && error.error?.state === 'Unavailable') {
        this.intake.viewState.set('unavailable');
      } else {
        this.submitError.set(
          error instanceof HttpErrorResponse && error.status === 409
            ? 'These details conflict with an existing client record. Review the PMI and try again.'
            : 'Basic details could not be saved. Review the form and try again.',
        );
      }
    } finally {
      this.saving.set(false);
    }
  }

  async enterStepTwo(resumeForward = true): Promise<void> {
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const state = await this.intake.additionalInformation();
      if (resumeForward && state.creationProgressStep >= 3) {
        await this.enterStepThree();
        return;
      }
      this.editorVersion.set(state.editorVersion);
      this.hydrateAdditionalInformation(state.additionalInformation);
      this.currentStep.set(2);
      this.continuation.set(false);
    } catch (error: unknown) {
      this.handleLifecycleError(error, 'Additional information could not be loaded.');
    } finally {
      this.saving.set(false);
    }
  }

  async saveAdditionalInformation(): Promise<void> {
    if (this.saving() || !this.editorVersion()) return;
    this.saving.set(true);
    this.submitError.set(null);
    const previousVersion = this.editorVersion();
    try {
      const result = await this.intake.updateAdditionalInformation({
        additionalInformation: this.toAdditionalInformation(),
        editorVersion: previousVersion!,
      });
      this.editorVersion.set(result.editorVersion);
      await this.enterStepThree();
    } catch (error: unknown) {
      this.editorVersion.set(previousVersion);
      this.handleLifecycleError(error, 'Additional information could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }

  async enterStepThree(resumeForward = true): Promise<void> {
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const state = await this.intake.contactInformation();
      if (resumeForward && state.creationProgressStep >= 4) {
        await this.enterStepFour();
        return;
      }
      const contact = state.contactInformation;
      Object.assign(this.draft, {
        email: contact.email ?? '',
        phone1: contact.primaryPhone ?? '',
        phone2: contact.secondaryPhone ?? '',
        street: contact.addressLine1 ?? '',
        apartment: contact.addressLine2 ?? '',
        city: contact.city ?? '',
        state: contact.state ?? '',
        zip: contact.postalCode ?? '',
        county: contact.county ?? '',
        country: contact.country ?? 'United States',
        languages: contact.preferredLanguages.map((value) => value.languageName),
      });
      this.editorVersion.set(state.editorVersion);
      this.currentStep.set(3);
      this.continuation.set(false);
    } catch (error) {
      this.handleLifecycleError(error, 'Contact information could not be loaded.');
    } finally {
      this.saving.set(false);
    }
  }

  async saveContactInformation(): Promise<void> {
    if (this.saving() || !this.editorVersion()) return;
    const errors: Record<string, string> = {};
    if (!isValidContactEmail(this.draft.email)) errors['email'] = 'Enter a valid email address.';
    if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(this.draft.phone1))
      errors['phone1'] = 'Primary phone must use (555) 555-1234 format.';
    if (this.draft.phone2 && !/^\(\d{3}\) \d{3}-\d{4}$/.test(this.draft.phone2))
      errors['phone2'] = 'Secondary phone must use (555) 555-1234 format.';
    if (!this.draft.street.trim()) errors['street'] = 'Street address is required.';
    if (!this.draft.languages.length)
      errors['languages'] = 'Select at least one preferred language.';
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length) return;
    const previousVersion = this.editorVersion();
    this.saving.set(true);
    this.submitError.set(null);
    try {
      debugger;
      const result = await this.intake.updateContactInformation({
        contactInformation: {
          email: optional(this.draft.email),
          primaryPhone: optional(this.draft.phone1),
          secondaryPhone: optional(this.draft.phone2),
          addressLine1: optional(this.draft.street),
          addressLine2: optional(this.draft.apartment),
          city: optional(this.draft.city),
          state: optional(this.draft.state),
          postalCode: optional(this.draft.zip),
          county: optional(this.draft.county),
          country: "United States",
          preferredLanguages: this.draft.languages.map((name, index) => ({
            languageCode: languageCode(name),
            languageName: name,
            isPrimary: index === 0,
          })),
        },
        editorVersion: previousVersion!,
      });
      this.editorVersion.set(result.editorVersion);
      await this.enterStepFour();
    } catch (error) {
      this.editorVersion.set(previousVersion);
      this.handleLifecycleError(error, 'Contact information could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }

  toggleLanguage(language: string, checked: boolean): void {
    const values = new Set(this.draft.languages);
    checked ? values.add(language) : values.delete(language);
    this.draft.languages = this.languageOptions.filter((value) => values.has(value));
  }

  async enterStepFour(allowForward = true): Promise<void> {
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const [candidates, state] = await Promise.all([
        this.intake.caregiverCandidates(),
        this.intake.caregivers(),
      ]);
      this.caregiverCandidates.set(candidates);
      this.caregiverAssignments.set(state.caregivers);
      this.caregiverServices.set(state.availableServices);
      this.resetCaregiver();
      if (allowForward && state.creationProgressStep >= 5) {
        await this.enterStepFive();
        return;
      }
      this.currentStep.set(4);
      this.continuation.set(false);
    } catch (error) {
      this.handleLifecycleError(error, 'Primary caregivers could not be loaded.');
    } finally {
      this.saving.set(false);
    }
  }

  editCaregiver(value: PublicCaregiverAssignment): void {
    this.editingCaregiver.set(value);
    Object.assign(this.caregiverDraft, {
      caregiverUserId: value.caregiverUserId,
      assignmentType: value.assignmentType,
      startDate: value.startDate,
      endDate: value.endDate ?? '',
      relationship: value.relationship,
      livesWithClient: value.livesWithClient,
      assignedServices: value.assignedServices
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      notes: value.notes,
      clientPreference: value.clientPreference,
    });
  }

  resetCaregiver(): void {
    this.editingCaregiver.set(null);
    Object.assign(this.caregiverDraft, {
      caregiverUserId: '',
      assignmentType: 'Primary',
      startDate: '',
      endDate: '',
      relationship: '',
      livesWithClient: null,
      assignedServices: [],
      notes: '',
      clientPreference: false,
    });
  }

  toggleCaregiverService(service: string, checked: boolean): void {
    const values = new Set(this.caregiverDraft.assignedServices);
    checked ? values.add(service) : values.delete(service);
    this.caregiverDraft.assignedServices = this.caregiverServices().filter((value) =>
      values.has(value),
    );
  }

  async saveCaregiver(): Promise<void> {
    if (this.saving()) return;
    const draft = this.caregiverDraft;
    const errors: Record<string, string> = {};
    if (!draft.caregiverUserId) errors['caregiver'] = 'Select a caregiver.';
    if (!draft.startDate) errors['startDate'] = 'Start date is required.';
    if (!draft.relationship) errors['relationship'] = 'Relationship is required.';
    if (draft.livesWithClient === null)
      errors['livesWithClient'] = 'Select whether the caregiver lives with the client.';
    if (draft.endDate && draft.endDate < draft.startDate)
      errors['endDate'] = 'End date cannot be before the start date.';
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length) return;
    const editing = this.editingCaregiver();
    const request: SavePublicCaregiverRequest = {
      caregiverUserId: draft.caregiverUserId,
      assignmentType: draft.assignmentType,
      clientPreference: draft.clientPreference,
      assignedServices: draft.assignedServices.join(', ') || null,
      startDate: draft.startDate,
      endDate: draft.endDate || null,
      relationship: draft.relationship,
      livesWithClient: draft.livesWithClient,
      notes: draft.notes.trim() || null,
      ...(editing ? { editorVersion: editing.editorVersion } : {}),
    };
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const saved = editing
        ? await this.intake.updateCaregiver(editing.assignmentId, request)
        : await this.intake.createCaregiver(request);
      this.caregiverAssignments.update((items) =>
        editing
          ? items.map((value) => (value.assignmentId === saved.assignmentId ? saved : value))
          : [saved, ...items],
      );
      this.resetCaregiver();
    } catch (error) {
      this.handleLifecycleError(error, 'The caregiver assignment could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }

  async endCaregiver(value: PublicCaregiverAssignment): Promise<void> {
    if (!window.confirm(`End the caregiver assignment for ${value.caregiverDisplayName}?`)) return;
    this.saving.set(true);
    try {
      const saved = await this.intake.endCaregiver(
        value.assignmentId,
        new Date().toISOString().slice(0, 10),
        value.editorVersion,
      );
      this.caregiverAssignments.update((items) =>
        items.map((item) => (item.assignmentId === saved.assignmentId ? saved : item)),
      );
    } catch (error) {
      this.handleLifecycleError(error, 'The caregiver assignment could not be ended.');
    } finally {
      this.saving.set(false);
    }
  }

  async continueFromCaregivers(): Promise<void> {
    if (this.saving()) return;
    if (this.caregiverDraftDirty()) {
      this.submitError.set('Save or cancel the caregiver form before continuing.');
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.intake.continueCaregivers();
      this.editorVersion.set(result.editorVersion);
      await this.enterStepFive();
    } catch (error) {
      this.handleLifecycleError(error, 'Primary caregivers could not be completed.');
    } finally {
      this.saving.set(false);
    }
  }

  caregiverDraftDirty(): boolean {
    const value = this.caregiverDraft;
    return !!(
      value.caregiverUserId ||
      value.startDate ||
      value.relationship ||
      value.notes ||
      value.assignedServices.length ||
      value.livesWithClient !== null ||
      value.clientPreference
    );
  }

  async enterStepFive(): Promise<void> {
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const state = await this.intake.contacts();
      this.contacts.set(state.contacts);
      this.resetContact();
      this.currentStep.set(5);
      this.continuation.set(false);
    } catch (error) {
      this.handleLifecycleError(error, 'Contacts could not be loaded.');
    } finally {
      this.saving.set(false);
    }
  }

  editContact(contact: PublicClientContact): void {
    this.editingContact.set(contact);
    Object.assign(this.contactDraft, contact);
  }

  resetContact(): void {
    this.editingContact.set(null);
    Object.assign(this.contactDraft, {
      type: 'General',
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      isActive: true,
    });
  }

  normalizeGuestContactPhone(value: string): void {
    this.contactDraft.phone = formatContactPhone(value);
    this.clearError('contactPhone');
  }

  async saveContact(): Promise<void> {
    if (this.saving()) return;
    const draft = this.contactDraft;
    const errors: Record<string, string> = {};
    if (!draft.name.trim()) errors['contactName'] = 'Name is required.';
    if (!draft.relationship.trim()) errors['contactRelationship'] = 'Relationship is required.';
    if (!isValidContactPhone(draft.phone, true))
      errors['contactPhone'] = 'Enter a valid phone number.';
    if (!isValidContactEmail(draft.email)) errors['contactEmail'] = 'Enter a valid email address.';
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length) return;
    const request: SavePublicClientContactRequest = {
      type: draft.type,
      name: draft.name.trim(),
      relationship: draft.relationship.trim(),
      phone: draft.phone,
      email: draft.email.trim() || null,
      address: draft.address.trim() || null,
      isActive: draft.isActive,
    };
    const editing = this.editingContact();
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const saved = editing
        ? await this.intake.updateContact(editing.id, request)
        : await this.intake.createContact(request);
      this.contacts.update((items) =>
        editing ? items.map((value) => (value.id === saved.id ? saved : value)) : [saved, ...items],
      );
      this.resetContact();
    } catch (error) {
      this.handleLifecycleError(error, 'The contact could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }

  async continueFromContacts(): Promise<void> {
    if (this.saving()) return;
    if (this.contactDraftDirty()) {
      this.submitError.set('Save or cancel the contact form before continuing.');
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.intake.continueContacts();
      this.editorVersion.set(result.editorVersion);
      await this.enterStepSix();
    } catch (error) {
      this.handleLifecycleError(error, 'Contacts could not be completed.');
    } finally {
      this.saving.set(false);
    }
  }

  contactDraftDirty(): boolean {
    const value = this.contactDraft;
    return !!(
      value.name ||
      value.relationship ||
      value.phone ||
      value.email ||
      value.address ||
      value.type !== 'General' ||
      !value.isActive
    );
  }

  async enterStepSix(): Promise<void> {
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const state = await this.intake.careCoordinators();
      this.careCoordinators.set(state.coordinators);
      this.resetCareCoordinator();
      this.currentStep.set(6);
      this.continuation.set(false);
    } catch (error) {
      this.handleLifecycleError(error, 'Care coordinators could not be loaded.');
    } finally {
      this.saving.set(false);
    }
  }
  editCareCoordinator(value: PublicCareCoordinator): void {
    this.editingCareCoordinator.set(value);
    Object.assign(this.careCoordinatorDraft, value);
  }
  resetCareCoordinator(): void {
    this.editingCareCoordinator.set(null);
    Object.assign(this.careCoordinatorDraft, {
      name: '',
      companyName: '',
      phone: '',
      phoneExtension: '',
      fax: '',
      email: '',
      isActive: true,
    });
  }
  normalizeCoordinatorPhone(field: 'phone' | 'fax', value: string): void {
    this.careCoordinatorDraft[field] = formatContactPhone(value);
    this.clearError(field === 'phone' ? 'coordinatorPhone' : 'coordinatorFax');
  }
  async saveCareCoordinator(): Promise<void> {
    if (this.saving()) return;
    const draft = this.careCoordinatorDraft;
    const errors: Record<string, string> = {};
    if (!draft.name.trim()) errors['coordinatorName'] = 'Name is required.';
    if (!isValidContactPhone(draft.phone))
      errors['coordinatorPhone'] = 'Enter a valid phone number.';
    if (!isValidContactPhone(draft.fax)) errors['coordinatorFax'] = 'Enter a valid fax number.';
    if (draft.phoneExtension.length > 15) errors['coordinatorExtension'] = 'Extension is too long.';
    if (!isValidContactEmail(draft.email))
      errors['coordinatorEmail'] = 'Enter a valid email address.';
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length) return;
    const request: SavePublicCareCoordinatorRequest = {
      name: draft.name.trim(),
      companyName: draft.companyName.trim() || null,
      phone: draft.phone || null,
      phoneExtension: draft.phoneExtension.trim() || null,
      fax: draft.fax || null,
      email: draft.email.trim() || null,
      isActive: draft.isActive,
    };
    const editing = this.editingCareCoordinator();
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const saved = editing
        ? await this.intake.updateCareCoordinator(editing.id, request)
        : await this.intake.createCareCoordinator(request);
      this.careCoordinators.update((items) =>
        editing ? items.map((value) => (value.id === saved.id ? saved : value)) : [saved, ...items],
      );
      this.resetCareCoordinator();
    } catch (error) {
      this.handleLifecycleError(error, 'The care coordinator could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }
  async continueFromCareCoordinators(): Promise<void> {
    if (this.saving()) return;
    if (this.careCoordinatorDraftDirty()) {
      this.submitError.set('Save or cancel the care coordinator form before continuing.');
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.intake.continueCareCoordinators();
      this.editorVersion.set(result.editorVersion);
      await this.enterStepSeven();
    } catch (error) {
      this.handleLifecycleError(error, 'Care coordinators could not be completed.');
    } finally {
      this.saving.set(false);
    }
  }
  careCoordinatorDraftDirty(): boolean {
    const x = this.careCoordinatorDraft;
    return !!(
      x.name ||
      x.companyName ||
      x.phone ||
      x.phoneExtension ||
      x.fax ||
      x.email ||
      !x.isActive
    );
  }

  async enterStepSeven(): Promise<void> {
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const state = await this.intake.consultationProviders();
      this.consultationProviders.set(state.providers);
      this.resetConsultationProvider();
      this.currentStep.set(7);
      this.continuation.set(false);
    } catch (error) {
      this.handleLifecycleError(error, 'Consultation providers could not be loaded.');
    } finally {
      this.saving.set(false);
    }
  }

  editConsultationProvider(value: PublicConsultationProvider): void {
    this.editingConsultationProvider.set(value);
    Object.assign(this.consultationProviderDraft, value);
  }

  resetConsultationProvider(): void {
    this.editingConsultationProvider.set(null);
    Object.assign(this.consultationProviderDraft, {
      name: '',
      phone: '',
      email: '',
      supportProviderName: '',
      supportProviderPhone: '',
      supportProviderAddress: '',
      isActive: true,
    });
  }

  normalizeProviderPhone(field: 'phone' | 'supportProviderPhone', value: string): void {
    this.consultationProviderDraft[field] = formatContactPhone(value);
    this.clearError(field === 'phone' ? 'providerPhone' : 'supportProviderPhone');
  }

  async saveConsultationProvider(): Promise<void> {
    if (this.saving()) return;
    const draft = this.consultationProviderDraft;
    const errors: Record<string, string> = {};
    if (!draft.name.trim()) errors['providerName'] = 'Name is required.';
    if (!isValidContactPhone(draft.phone)) errors['providerPhone'] = 'Enter a valid phone number.';
    if (!isValidContactEmail(draft.email)) errors['providerEmail'] = 'Enter a valid email address.';
    if (!isValidContactPhone(draft.supportProviderPhone))
      errors['supportProviderPhone'] = 'Enter a valid phone number.';
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length) return;
    const request: SavePublicConsultationProviderRequest = {
      name: draft.name.trim(),
      phone: draft.phone || null,
      email: draft.email.trim() || null,
      supportProviderName: draft.supportProviderName.trim() || null,
      supportProviderPhone: draft.supportProviderPhone || null,
      supportProviderAddress: draft.supportProviderAddress.trim() || null,
      isActive: draft.isActive,
    };
    const editing = this.editingConsultationProvider();
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const saved = editing
        ? await this.intake.updateConsultationProvider(editing.id, request)
        : await this.intake.createConsultationProvider(request);
      this.consultationProviders.update((items) =>
        editing ? items.map((value) => (value.id === saved.id ? saved : value)) : [saved, ...items],
      );
      this.resetConsultationProvider();
    } catch (error) {
      this.handleLifecycleError(error, 'The consultation provider could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }

  async continueFromConsultationProviders(): Promise<void> {
    if (this.saving()) return;
    if (this.consultationProviderDraftDirty()) {
      this.submitError.set('Save or cancel the consultation provider form before continuing.');
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.intake.continueConsultationProviders();
      this.editorVersion.set(result.editorVersion);
      await this.enterStepEight();
    } catch (error) {
      this.handleLifecycleError(error, 'Consultation providers could not be completed.');
    } finally {
      this.saving.set(false);
    }
  }

  consultationProviderDraftDirty(): boolean {
    const value = this.consultationProviderDraft;
    return !!(
      value.name ||
      value.phone ||
      value.email ||
      value.supportProviderName ||
      value.supportProviderPhone ||
      value.supportProviderAddress ||
      !value.isActive
    );
  }

  async enterStepEight(): Promise<void> {
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const state = await this.intake.physicians();
      this.physicians.set(state.physicians);
      this.resetPhysician();
      this.currentStep.set(8);
      this.continuation.set(false);
    } catch (error) {
      this.handleLifecycleError(error, 'Doctors could not be loaded.');
    } finally {
      this.saving.set(false);
    }
  }

  editPhysician(value: PublicPhysician): void {
    this.editingPhysician.set(value);
    Object.assign(this.physicianDraft, value);
  }

  resetPhysician(): void {
    this.editingPhysician.set(null);
    Object.assign(this.physicianDraft, {
      name: '',
      npi: '',
      phone: '',
      fax: '',
      address: '',
      zipCode: '',
      city: '',
      state: '',
      isActive: true,
    });
  }

  normalizePhysicianPhone(field: 'phone' | 'fax', value: string): void {
    this.physicianDraft[field] = formatContactPhone(value);
    this.clearError(field === 'phone' ? 'physicianPhone' : 'physicianFax');
  }

  async savePhysician(): Promise<void> {
    if (this.saving()) return;
    const draft = this.physicianDraft;
    const errors: Record<string, string> = {};
    if (!draft.name.trim()) errors['physicianName'] = 'Name is required.';
    if (draft.npi && !/^\d{10}$/.test(draft.npi))
      errors['physicianNpi'] = 'NPI must contain exactly 10 digits.';
    if (!isValidContactPhone(draft.phone)) errors['physicianPhone'] = 'Enter a valid phone number.';
    if (!isValidContactPhone(draft.fax)) errors['physicianFax'] = 'Enter a valid fax number.';
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length) return;
    const request: SavePublicPhysicianRequest = {
      name: draft.name.trim(),
      npi: draft.npi || null,
      phone: draft.phone || null,
      fax: draft.fax || null,
      address: draft.address.trim() || null,
      zipCode: draft.zipCode.trim() || null,
      city: draft.city.trim() || null,
      state: draft.state.trim() || null,
      isActive: draft.isActive,
    };
    const editing = this.editingPhysician();
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const saved = editing
        ? await this.intake.updatePhysician(editing.id, request)
        : await this.intake.createPhysician(request);
      this.physicians.update((items) =>
        editing ? items.map((value) => (value.id === saved.id ? saved : value)) : [saved, ...items],
      );
      this.resetPhysician();
    } catch (error) {
      this.handleLifecycleError(error, 'The doctor could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }

  async continueFromPhysicians(): Promise<void> {
    if (this.saving()) return;
    if (this.physicianDraftDirty()) {
      this.submitError.set('Save or cancel the doctor form before continuing.');
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.intake.continuePhysicians();
      this.editorVersion.set(result.editorVersion);
      await this.enterStepNine();
    } catch (error) {
      this.handleLifecycleError(error, 'Doctors could not be completed.');
    } finally {
      this.saving.set(false);
    }
  }

  physicianDraftDirty(): boolean {
    const value = this.physicianDraft;
    return !!(
      value.name ||
      value.npi ||
      value.phone ||
      value.fax ||
      value.address ||
      value.zipCode ||
      value.city ||
      value.state ||
      !value.isActive
    );
  }

  async enterStepNine(): Promise<void> {
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const state = await this.intake.responsibleParties();
      this.responsibleParties.set(state.responsibleParties);
      this.resetResponsibleParty();
      this.currentStep.set(9);
      this.continuation.set(false);
    } catch (error) {
      this.handleLifecycleError(error, 'Responsible parties could not be loaded.');
    } finally {
      this.saving.set(false);
    }
  }

  editResponsibleParty(value: PublicResponsibleParty): void {
    this.editingResponsibleParty.set(value);
    Object.assign(this.responsiblePartyDraft, value);
  }

  resetResponsibleParty(): void {
    this.editingResponsibleParty.set(null);
    Object.assign(this.responsiblePartyDraft, {
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      livesWithClient: null,
      hasSpenddown: null,
      isActive: true,
    });
  }

  normalizeResponsiblePartyPhone(value: string): void {
    this.responsiblePartyDraft.phone = formatContactPhone(value);
    this.clearError('responsiblePartyPhone');
  }

  async saveResponsibleParty(): Promise<void> {
    if (this.saving()) return;
    const draft = this.responsiblePartyDraft;
    const errors: Record<string, string> = {};
    if (!draft.name.trim()) errors['responsiblePartyName'] = 'Name is required.';
    if (!draft.relationship.trim())
      errors['responsiblePartyRelationship'] = 'Relationship is required.';
    if (!isValidContactPhone(draft.phone, true))
      errors['responsiblePartyPhone'] = 'Enter a valid phone number.';
    if (!isValidContactEmail(draft.email))
      errors['responsiblePartyEmail'] = 'Enter a valid email address.';
    if (draft.livesWithClient === null)
      errors['responsiblePartyLivesWithClient'] =
        'Select whether this person lives with the client.';
    if (draft.hasSpenddown === null)
      errors['responsiblePartySpenddown'] =
        'Select whether this person has spenddown responsibility.';
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length) return;
    const request: SavePublicResponsiblePartyRequest = {
      name: draft.name.trim(),
      relationship: draft.relationship.trim(),
      phone: draft.phone,
      email: draft.email.trim() || null,
      address: draft.address.trim() || null,
      livesWithClient: draft.livesWithClient!,
      hasSpenddown: draft.hasSpenddown!,
      isActive: draft.isActive,
    };
    const editing = this.editingResponsibleParty();
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const saved = editing
        ? await this.intake.updateResponsibleParty(editing.id, request)
        : await this.intake.createResponsibleParty(request);
      this.responsibleParties.update((items) =>
        editing ? items.map((value) => (value.id === saved.id ? saved : value)) : [saved, ...items],
      );
      this.resetResponsibleParty();
    } catch (error) {
      this.handleLifecycleError(error, 'The responsible party could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }

  async continueFromResponsibleParties(): Promise<void> {
    if (this.saving()) return;
    if (this.responsiblePartyDraftDirty()) {
      this.submitError.set('Save or cancel the responsible party form before continuing.');
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.intake.continueResponsibleParties();
      this.editorVersion.set(result.editorVersion);
      await this.enterStepTen();
    } catch (error) {
      this.handleLifecycleError(error, 'Responsible parties could not be completed.');
    } finally {
      this.saving.set(false);
    }
  }

  responsiblePartyDraftDirty(): boolean {
    const value = this.responsiblePartyDraft;
    return !!(
      value.name ||
      value.relationship ||
      value.phone ||
      value.email ||
      value.address ||
      value.livesWithClient !== null ||
      value.hasSpenddown !== null ||
      !value.isActive
    );
  }

  async enterStepTen(): Promise<void> {
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const state = await this.intake.hospitalizations();
      this.hospitalizations.set(state.hospitalizations);
      this.resetHospitalization();
      this.currentStep.set(10);
      this.continuation.set(false);
    } catch (error) {
      this.handleLifecycleError(error, 'Hospitalizations could not be loaded.');
    } finally {
      this.saving.set(false);
    }
  }

  editHospitalization(value: PublicHospitalization): void {
    this.editingHospitalization.set(value);
    Object.assign(this.hospitalizationDraft, {
      hospitalName: value.hospitalName,
      admittedAt: this.toLocalDateTime(value.admittedAtUtc),
      dischargedAt: value.dischargedAtUtc ? this.toLocalDateTime(value.dischargedAtUtc) : '',
      reason: value.reason,
      diagnosis: value.diagnosis,
      dischargeInstructions: value.dischargeInstructions,
    });
  }

  resetHospitalization(): void {
    this.editingHospitalization.set(null);
    Object.assign(this.hospitalizationDraft, {
      hospitalName: '',
      admittedAt: '',
      dischargedAt: '',
      reason: '',
      diagnosis: '',
      dischargeInstructions: '',
    });
    this.fieldErrors.set({});
  }

  async saveHospitalization(): Promise<void> {
    if (this.saving()) return;
    const draft = this.hospitalizationDraft;
    const errors: Record<string, string> = {};
    if (!draft.hospitalName.trim()) errors['hospitalName'] = 'Hospital name is required.';
    if (!draft.admittedAt) errors['admittedAt'] = 'Admission date and time is required.';
    const admitted = draft.admittedAt ? new Date(draft.admittedAt) : null;
    const discharged = draft.dischargedAt ? new Date(draft.dischargedAt) : null;
    if (admitted && discharged && discharged < admitted)
      errors['dischargedAt'] = 'Discharge date and time must be after admission.';
    if (!draft.reason.trim()) errors['reason'] = 'Reason is required.';
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length || !admitted) return;
    const editing = this.editingHospitalization();
    const request: SavePublicHospitalizationRequest = {
      hospitalName: draft.hospitalName.trim(),
      admittedAtUtc: admitted.toISOString(),
      dischargedAtUtc: discharged?.toISOString() ?? null,
      reason: draft.reason.trim(),
      diagnosis: draft.diagnosis.trim() || null,
      dischargeInstructions: draft.dischargeInstructions.trim() || null,
      editorVersion: editing?.editorVersion ?? null,
    };
    this.saving.set(true);
    this.submitError.set(null);
    try {
      const saved = editing
        ? await this.intake.updateHospitalization(editing.id, request)
        : await this.intake.createHospitalization(request);
      this.hospitalizations.update((items) =>
        editing ? items.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...items],
      );
      this.resetHospitalization();
    } catch (error) {
      this.handleLifecycleError(error, 'The hospitalization could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }

  hospitalizationDraftDirty(): boolean {
    return Object.values(this.hospitalizationDraft).some((value) => !!value);
  }

  async finishClientSetup(): Promise<void> {
    if (this.saving()) return;
    if (this.hospitalizationDraftDirty()) {
      this.submitError.set('Save or cancel the hospitalization form before finishing.');
      return;
    }
    this.saving.set(true);
    this.submitError.set(null);
    try {
      await this.intake.complete();
      this.intake.viewState.set('completed');
      this.hospitalizations.set([]);
      this.resetHospitalization();
    } catch (error) {
      this.handleLifecycleError(error, 'Client intake could not be completed. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private toLocalDateTime(value: string): string {
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }

  normalizeAdditionalPhone(change: {
    field: 'phone1' | 'phone2' | 'companyPhone';
    value: string;
  }): void {
    this.draft[change.field] = formatUsPhone(change.value);
  }

  toggleAdditionalArray(change: {
    field: 'services' | 'languages' | 'diet';
    value: string;
    event: Event;
  }): void {
    const values = new Set(this.draft[change.field]);
    (change.event.target as HTMLInputElement).checked
      ? values.add(change.value)
      : values.delete(change.value);
    this.draft[change.field] = [...values];
  }

  private handleLifecycleError(error: unknown, fallback: string): void {
    if (error instanceof HttpErrorResponse && error.status === 410) {
      this.intake.viewState.set('expired');
    } else if (error instanceof HttpErrorResponse && error.error?.state === 'Completed') {
      this.intake.viewState.set('completed');
    } else if (error instanceof HttpErrorResponse && error.error?.state === 'Unavailable') {
      this.intake.viewState.set('unavailable');
    } else {
      this.submitError.set(fallback);
    }
  }

  private hydrateAdditionalInformation(profile: PublicClientAdditionalInformation): void {
    const referral = parseKeyValueText(profile.referralDetails);
    const demographics = parseKeyValueText(profile.demographics);
    const living = parseKeyValueText(profile.livingArrangement);
    const meals = parseKeyValueText(profile.mealSchedule);
    Object.assign(this.draft, {
      programType: programTypeLabel(profile.programType),
      homeCareRatingStatus: profile.homeCareRating ?? '',
      medicalEquipment: profile.medicalEquipment ?? '',
      pcaComplexity: profile.pcaComplexity ?? '',
      referringClient: referral['referringClient'] === 'Yes',
      referringClientName: referral['referringClientName'] ?? '',
      companyName: referral['companyName'] ?? '',
      companyPhone: referral['companyPhone'] ?? '',
      maritalStatus: demographics['maritalStatus'] ?? '',
      ethnicity: demographics['ethnicity'] ?? '',
      race: demographics['race'] ?? '',
      veteranDetails: demographics['veteranDetails'] ?? '',
      petsDetails: demographics['petsDetails'] ?? '',
      smoking: booleanLabel(profile.smokes),
      veteran: booleanLabel(profile.isVeteran),
      pets: booleanLabel(profile.hasPets),
      livingArrangement: living['type'] ?? '',
      livingArrangementDetails: living['details'] ?? '',
      clinicName: profile.preferredClinic ?? '',
      hospitalName: profile.preferredHospital ?? '',
      ambulanceName: profile.preferredAmbulance ?? '',
      caregiverPreference: profile.caregiverPreference ?? '',
      nutritionalRequirements: profile.nutritionalRequirements ?? '',
      diet: splitList(profile.diet),
      breakfastTime: meals['breakfast'] ?? '',
      lunchTime: meals['lunch'] ?? '',
      dinnerTime: meals['dinner'] ?? '',
      notes: profile.notes ?? '',
      additionalInformation: profile.additionalInformation ?? '',
    });
  }

  private toAdditionalInformation(): PublicClientAdditionalInformation {
    const optional = (value: string): string | null => value.trim() || null;
    return {
      programType: programTypeCode(this.draft.programType),
      referralDetails: keyValueText({
        referringClient: this.draft.referringClient ? 'Yes' : 'No',
        referringClientName: this.draft.referringClientName,
        companyName: this.draft.companyName,
        companyPhone: this.draft.companyPhone,
      }),
      homeCareRating: optional(this.draft.homeCareRatingStatus),
      medicalEquipment: optional(this.draft.medicalEquipment),
      pcaComplexity: optional(this.draft.pcaComplexity),
      demographics: keyValueText({
        maritalStatus: this.draft.maritalStatus,
        ethnicity: this.draft.ethnicity,
        race: this.draft.race,
        veteranDetails: this.draft.veteranDetails,
        petsDetails: this.draft.petsDetails,
      }),
      smokes: booleanValue(this.draft.smoking),
      isVeteran: booleanValue(this.draft.veteran),
      hasPets: booleanValue(this.draft.pets),
      livingArrangement: keyValueText({
        type: this.draft.livingArrangement,
        details: this.draft.livingArrangementDetails,
      }),
      preferredClinic: optional(this.draft.clinicName),
      preferredHospital: optional(this.draft.hospitalName),
      preferredAmbulance: optional(this.draft.ambulanceName),
      caregiverPreference: optional(this.draft.caregiverPreference),
      nutritionalRequirements: optional(this.draft.nutritionalRequirements),
      diet: optional(this.draft.diet.join(', ')),
      mealSchedule: keyValueText({
        breakfast: this.draft.breakfastTime,
        lunch: this.draft.lunchTime,
        dinner: this.draft.dinnerTime,
      }),
      notes: optional(this.draft.notes),
      additionalInformation: optional(this.draft.additionalInformation),
    };
  }

  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!this.draft.firstName.trim()) errors['firstName'] = 'First name is required.';
    if (!this.draft.lastName.trim()) errors['lastName'] = 'Last name is required.';
    if (!this.draft.dob) errors['dob'] = 'Date of birth is required.';
    else if (this.draft.dob > new Date().toISOString().slice(0, 10))
      errors['dob'] = 'Date of birth cannot be in the future.';
    if (!this.draft.gender) errors['gender'] = 'Gender is required.';
    if (!isValidPmi(this.draft.pmi)) errors['pmi'] = 'Enter an 8-digit PMI number.';
    if (this.draft.ssn && !isValidUsSsn(this.draft.ssn)) errors['ssn'] = 'Enter a valid SSN.';
    if (!this.draft.socDate) errors['socDate'] = 'SOC date is required.';
    if (!this.draft.locationId) errors['locationId'] = 'Location is required.';
    const hours = this.draft.evvHours === '' ? null : Number(this.draft.evvHours);
    if (hours !== null && (!Number.isFinite(hours) || hours < 0 || hours > 168))
      errors['evvHours'] = 'EVV hours must be between 0 and 168 per week.';
    return errors;
  }

  clearError(field: string): void {
    const { [field]: _, ...remaining } = this.fieldErrors();
    this.fieldErrors.set(remaining);
  }

  fieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  private toRequest(): PublicClientBasicDetailsRequest {
    const optional = (value: string): string | null => value.trim() || null;
    return {
      identity: {
        firstName: this.draft.firstName.trim(),
        middleName: optional(this.draft.middleName),
        lastName: this.draft.lastName.trim(),
        preferredName: optional(this.draft.goesBy),
        dateOfBirth: this.draft.dob,
        gender: this.draft.gender,
        pmiNumber: this.draft.pmi,
        ssn: optional(this.draft.ssn),
      },
      careSetup: {
        intakeDate: optional(this.draft.intakeDate),
        socDate: this.draft.socDate,
        referralSource: optional(this.draft.referralSource),
        locationId: this.draft.locationId,
        supervisorUserId: optional(this.draft.supervisor),
        evvAuthorizedHoursPerWeek: this.draft.evvHours === '' ? null : Number(this.draft.evvHours),
      },
      insuranceProvider: optional(this.draft.insurance),
      services: this.draft.services.map((value) => ({ code: value, name: value })),
    };
  }
}

function parseKeyValueText(value: string | null): Record<string, string> {
  return Object.fromEntries(
    (value ?? '').split(/\r?\n/).flatMap((line) => {
      const separator = line.indexOf('=');
      return separator > 0 ? [[line.slice(0, separator), line.slice(separator + 1)]] : [];
    }),
  );
}

function keyValueText(values: Readonly<Record<string, string>>): string | null {
  const value = Object.entries(values)
    .filter(([, item]) => item.trim())
    .map(([key, item]) => `${key}=${item.trim().replace(/\r?\n/g, ' ')}`)
    .join('\n');
  return value || null;
}

function splitList(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function booleanLabel(value: boolean | null): string {
  return value === null ? '' : value ? 'Yes' : 'No';
}

function booleanValue(value: string): boolean | null {
  return value === 'Yes' ? true : value === 'No' ? false : null;
}

function programTypeLabel(value: string): string {
  return (
    (
      {
        PcaTraditional: 'PCA Traditional',
        PcaChoice: 'PCA Choice',
        Two45D: '245D',
        CfssAgency: 'CFSS Agency',
        CfssBudget: 'CFSS Budget',
        None: '',
      } as Record<string, string>
    )[value] ?? value
  );
}

function programTypeCode(value: string): string {
  return (
    (
      {
        'PCA Traditional': 'PcaTraditional',
        'PCA Choice': 'PcaChoice',
        '245D': 'Two45D',
        'CFSS Agency': 'CfssAgency',
        'CFSS Budget': 'CfssBudget',
        '': 'None',
      } as Record<string, string>
    )[value] ?? value
  );
}

function optional(value: string): string | null {
  return value.trim() || null;
}
function languageCode(value: string): string {
  return (
    ({ English: 'en', Spanish: 'es', Somali: 'so', Hmong: 'hmn' } as Record<string, string>)[
      value
    ] ??
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 20)
  );
}
