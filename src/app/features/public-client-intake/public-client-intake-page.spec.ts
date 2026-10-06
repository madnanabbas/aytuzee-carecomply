import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PostalLookupService } from '../clients/data-access/postal-lookup.service';
import { PublicClientIntakePageComponent } from './public-client-intake-page';
import {
  PublicClientIntakeViewState,
  PublicClientInvitationContext,
} from './public-client-intake.models';
import { PublicClientIntakeState } from './public-client-intake-state.service';

describe('PublicClientIntakePageComponent', () => {
  let fixture: ComponentFixture<PublicClientIntakePageComponent>;
  const viewState = signal<PublicClientIntakeViewState>('validating');
  const context = signal<PublicClientInvitationContext>({
    state: 'Ready',
    clientDisplayName: 'Guest Client',
    expiresAtUtc: '2026-10-01T00:00:00Z',
    hasCreatedClient: false,
  });
  const state = {
    viewState,
    context,
    initialize: vi.fn(),
    clear: vi.fn(),
    locations: vi.fn().mockResolvedValue([{ id: 'location-1', displayName: 'Main' }]),
    supervisors: vi.fn().mockResolvedValue([]),
    createBasicDetails: vi.fn().mockResolvedValue({
      state: 'Ready',
      nextStep: 2,
      editorVersion: 'opaque-version',
      hasCreatedClient: true,
    }),
    additionalInformation: vi.fn().mockResolvedValue({
      additionalInformation: {
        programType: 'PcaChoice',
        referralDetails: 'companyName=Referral Co',
        homeCareRating: 'Standard',
        medicalEquipment: null,
        pcaComplexity: null,
        demographics: 'maritalStatus=Single',
        smokes: false,
        isVeteran: false,
        hasPets: true,
        livingArrangement: 'type=With family',
        preferredClinic: null,
        preferredHospital: null,
        preferredAmbulance: null,
        caregiverPreference: null,
        nutritionalRequirements: null,
        diet: 'Regular',
        mealSchedule: null,
        notes: 'Hydrated note',
        additionalInformation: null,
      },
      editorVersion: 'step-two-version',
      creationProgressStep: 2,
    }),
    updateAdditionalInformation: vi.fn().mockResolvedValue({
      editorVersion: 'step-three-version',
      nextStep: 3,
    }),
    contactInformation: vi.fn().mockResolvedValue({
      contactInformation: {
        email: 'invite@example.test',
        primaryPhone: '(612) 555-0100',
        secondaryPhone: null,
        addressLine1: '',
        addressLine2: null,
        city: null,
        state: 'Minnesota',
        postalCode: null,
        county: null,
        country: 'United States',
        preferredLanguages: [{ languageCode: 'en', languageName: 'English', isPrimary: true }],
      },
      editorVersion: 'contact-version',
      creationProgressStep: 3,
    }),
    updateContactInformation: vi
      .fn()
      .mockResolvedValue({ editorVersion: 'step-four-version', nextStep: 4 }),
    caregiverCandidates: vi
      .fn()
      .mockResolvedValue([{ id: 'caregiver-1', displayName: 'Care Giver', jobTitle: 'PCA' }]),
    caregivers: vi.fn().mockResolvedValue({
      caregivers: [],
      availableServices: ['PCA'],
      creationProgressStep: 4,
    }),
    createCaregiver: vi.fn().mockResolvedValue({
      assignmentId: 'assignment-1',
      caregiverUserId: 'caregiver-1',
      caregiverDisplayName: 'Care Giver',
      jobTitle: 'PCA',
      assignmentType: 'Primary',
      relationship: 'Professional caregiver',
      livesWithClient: false,
      assignedServices: 'PCA',
      startDate: '2026-09-30',
      endDate: null,
      status: 'Active',
      clientPreference: true,
      notes: '',
      editorVersion: 'caregiver-v1',
    }),
    updateCaregiver: vi.fn(),
    endCaregiver: vi.fn(),
    continueCaregivers: vi
      .fn()
      .mockResolvedValue({ editorVersion: 'step-five-version', nextStep: 5 }),
    contacts: vi.fn().mockResolvedValue({ contacts: [], creationProgressStep: 5 }),
    createContact: vi.fn().mockResolvedValue({
      id: 'contact-1',
      type: 'Emergency',
      name: 'Guest Contact',
      relationship: 'Parent',
      phone: '(612) 555-0100',
      email: 'contact@example.test',
      address: '100 Main St',
      isActive: true,
    }),
    updateContact: vi.fn(),
    continueContacts: vi.fn().mockResolvedValue({ editorVersion: 'step-six-version', nextStep: 6 }),
    careCoordinators: vi.fn().mockResolvedValue({ coordinators: [], creationProgressStep: 6 }),
    createCareCoordinator: vi.fn().mockResolvedValue({
      id: 'coordinator-1',
      name: 'Case Manager',
      companyName: 'Agency',
      phone: '(612) 555-0100',
      phoneExtension: '12',
      fax: '(612) 555-0101',
      email: 'manager@example.test',
      isActive: true,
    }),
    updateCareCoordinator: vi.fn(),
    continueCareCoordinators: vi
      .fn()
      .mockResolvedValue({ editorVersion: 'step-seven-version', nextStep: 7 }),
    consultationProviders: vi.fn().mockResolvedValue({ providers: [], creationProgressStep: 7 }),
    createConsultationProvider: vi.fn().mockResolvedValue({
      id: 'provider-1',
      name: 'Consulting Nurse',
      phone: '(612) 555-0100',
      email: 'nurse@example.test',
      supportProviderName: 'Support Person',
      supportProviderPhone: '(612) 555-0101',
      supportProviderAddress: '100 Main Street',
      isActive: true,
    }),
    updateConsultationProvider: vi.fn(),
    continueConsultationProviders: vi
      .fn()
      .mockResolvedValue({ editorVersion: 'step-eight-version', nextStep: 8 }),
    physicians: vi.fn().mockResolvedValue({ physicians: [], creationProgressStep: 8 }),
    createPhysician: vi.fn().mockResolvedValue({
      id: 'physician-1',
      name: 'Guest Doctor',
      npi: '1234567890',
      phone: '(612) 555-0100',
      fax: '(612) 555-0101',
      address: '100 Clinic Street',
      zipCode: '55401',
      city: 'Minneapolis',
      state: 'MN',
      isActive: true,
    }),
    updatePhysician: vi.fn(),
    continuePhysicians: vi
      .fn()
      .mockResolvedValue({ editorVersion: 'step-nine-version', nextStep: 9 }),
    responsibleParties: vi.fn().mockResolvedValue({
      responsibleParties: [],
      creationProgressStep: 9,
    }),
    createResponsibleParty: vi.fn().mockResolvedValue({
      id: 'party-1',
      name: 'Guest Guardian',
      relationship: 'Parent',
      phone: '(612) 555-0100',
      email: 'guardian@example.test',
      address: '100 Family Street',
      livesWithClient: true,
      hasSpenddown: false,
      isActive: true,
    }),
    updateResponsibleParty: vi.fn(),
    continueResponsibleParties: vi
      .fn()
      .mockResolvedValue({ editorVersion: 'step-ten-version', nextStep: 10 }),
    hospitalizations: vi.fn().mockResolvedValue({
      hospitalizations: [],
      creationProgressStep: 10,
    }),
    createHospitalization: vi.fn().mockResolvedValue({
      id: 'hospitalization-1',
      hospitalName: 'Guest Hospital',
      admittedAtUtc: '2026-10-02T10:00:00Z',
      dischargedAtUtc: null,
      reason: 'Observation',
      diagnosis: '',
      dischargeInstructions: '',
      editorVersion: 'a'.repeat(64),
    }),
    updateHospitalization: vi.fn(),
    complete: vi.fn().mockResolvedValue({
      state: 'Completed',
      completedAtUtc: '2026-10-01T10:00:00Z',
      message: 'Client intake completed successfully.',
    }),
  };
  const postalLookup = {
    lookupPostalCode: vi.fn().mockReturnValue(
      of({
        city: 'Minneapolis',
        state: 'Minnesota',
        country: 'United States',
        countryCode: 'US',
        area: 'Hennepin',
      }),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({ imports: [PublicClientIntakePageComponent] })
      .overrideComponent(PublicClientIntakePageComponent, {
        set: {
          providers: [
            { provide: PublicClientIntakeState, useValue: state },
            { provide: PostalLookupService, useValue: postalLookup },
          ],
        },
      })
      .compileComponents();
    fixture = TestBed.createComponent(PublicClientIntakePageComponent);
  });

  it.each([
    ['validating', 'validating-state'],
    ['ready', 'ready-state'],
    ['invalid', 'invalid-state'],
    ['expired', 'expired-state'],
    ['unavailable', 'unavailable-state'],
    ['completed', 'completed-state'],
    ['missing', 'missing-state'],
    ['error', 'error-state'],
  ] as const)('renders the %s state without authenticated navigation', (value, testId) => {
    viewState.set(value);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector(`[data-testid="${testId}"]`)).not.toBeNull();
    expect(element.querySelector('app-sidebar')).toBeNull();
    expect(element.textContent).not.toContain('Client Search');
  });

  it('opens guest Step 1 without company, status, or authenticated navigation', async () => {
    viewState.set('ready');
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    button?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const controlScope = element.querySelector('.public-intake-page.client-form-control-scope');
    const firstName = element.querySelector<HTMLInputElement>('[name="firstName"]');
    const supervisor = element.querySelector<HTMLSelectElement>('[name="supervisor"]');
    expect(element.querySelector('[data-testid="guest-step-one"]')).not.toBeNull();
    expect(controlScope).not.toBeNull();
    expect(controlScope?.contains(firstName ?? null)).toBe(true);
    expect(element.querySelector('[name="locationId"]')).not.toBeNull();
    expect(supervisor?.disabled).toBe(true);
    expect(element.querySelector('[name="companyId"]')).toBeNull();
    expect(element.querySelector('[name="status"]')).toBeNull();
    expect(element.querySelector('[name="onboarding"]')).toBeNull();
    expect(element.querySelector('app-client-form')).toBeNull();
    expect(element.querySelector('.public-header app-brand-logo')).not.toBeNull();
    expect(element.querySelectorAll('.client-wizard-stepper li')).toHaveLength(10);
    expect(
      element.querySelector('.client-wizard-stepper li[aria-current="step"]')?.textContent,
    ).toContain('Basic details');
    expect(element.querySelector('app-sidebar')).toBeNull();
    expect(element.querySelector('app-header')).toBeNull();
    expect(state.locations).toHaveBeenCalledOnce();
  });

  it('formats invitation expiry for people instead of rendering the raw ISO value', () => {
    viewState.set('ready');
    fixture.detectChanges();

    const expiry = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="invitation-expiry"]',
    );
    expect(expiry?.textContent).not.toContain('2026-10-01T00:00:00Z');
    expect(expiry?.textContent).toMatch(/01 Oct 2026/);
  });

  it('uses the dense responsive form grid and shows field errors only after submit', async () => {
    viewState.set('ready');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const form = element.querySelector('[data-testid="guest-step-one"] .guest-form');
    const firstName = element.querySelector<HTMLInputElement>('[name="firstName"]');
    expect(form).not.toBeNull();
    expect(firstName?.getAttribute('aria-invalid')).toBe('false');
    expect(firstName?.parentElement?.querySelector('.field-error')).toBeNull();

    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(firstName?.getAttribute('aria-invalid')).toBe('true');
    expect(firstName?.parentElement?.querySelector('.field-error')?.textContent).toContain(
      'First name is required.',
    );
  });

  it('loads token-scoped supervisors when a location is selected', async () => {
    const component = fixture.componentInstance;
    await component.selectLocation('location-1');

    expect(state.supervisors).toHaveBeenCalledWith('location-1');
  });

  it('rejects a future date of birth before submitting basic details', async () => {
    const component = fixture.componentInstance;
    Object.assign(component.draft, {
      firstName: 'Guest',
      lastName: 'Client',
      dob: '2999-01-01',
      gender: 'Female',
      pmi: '87654321',
      socDate: '2026-10-01',
      locationId: 'location-1',
    });

    await component.submit();

    expect(component.fieldError('dob')).toBe('Date of birth cannot be in the future.');
    expect(state.createBasicDetails).not.toHaveBeenCalled();
  });

  it('submits once, excludes trusted identifiers, and hydrates Step 2', async () => {
    const component = fixture.componentInstance;
    Object.assign(component.draft, {
      firstName: 'Guest',
      lastName: 'Client',
      dob: '1990-01-01',
      gender: 'Female',
      pmi: '87654321',
      socDate: '2026-10-01',
      locationId: 'location-1',
    });

    await Promise.all([component.submit(), component.submit()]);
    fixture.detectChanges();

    expect(state.createBasicDetails).toHaveBeenCalledOnce();
    const request = state.createBasicDetails.mock.calls[0][0];
    expect(request.companyId).toBeUndefined();
    expect(request.clientId).toBeUndefined();
    expect(request.status).toBeUndefined();
    expect(state.additionalInformation).toHaveBeenCalledOnce();
    expect(component.editorVersion()).toBe('step-two-version');
    expect(component.draft.notes).toBe('Hydrated note');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="guest-step-two"]'),
    ).not.toBeNull();
  });

  it('saves Step 2 without trusted identifiers and hydrates Step 3', async () => {
    const component = fixture.componentInstance;
    await component.enterStepTwo();
    await Promise.all([
      component.saveAdditionalInformation(),
      component.saveAdditionalInformation(),
    ]);
    fixture.detectChanges();

    expect(state.updateAdditionalInformation).toHaveBeenCalledOnce();
    const request = state.updateAdditionalInformation.mock.calls[0][0];
    expect(request.clientId).toBeUndefined();
    expect(request.companyId).toBeUndefined();
    expect(request.editorVersion).toBe('step-two-version');
    expect(component.editorVersion()).toBe('contact-version');
    expect(component.draft.email).toBe('invite@example.test');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="guest-step-three"]'),
    ).not.toBeNull();
  });

  it('saves Step 3 and loads the real Step 4 caregiver UI', async () => {
    const component = fixture.componentInstance;
    await component.enterStepThree();
    component.draft.street = '123 Main St';
    await Promise.all([component.saveContactInformation(), component.saveContactInformation()]);
    fixture.detectChanges();
    expect(state.updateContactInformation).toHaveBeenCalledOnce();
    const request = state.updateContactInformation.mock.calls[0][0];
    expect(request.clientId).toBeUndefined();
    expect(request.companyId).toBeUndefined();
    expect(component.editorVersion()).toBe('step-four-version');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="guest-step-four"]'),
    ).not.toBeNull();
  });

  it('adds a caregiver without trusted identifiers and resets the inline form', async () => {
    const component = fixture.componentInstance;
    await component.enterStepFour();
    Object.assign(component.caregiverDraft, {
      caregiverUserId: 'caregiver-1',
      startDate: '2026-09-30',
      relationship: 'Professional caregiver',
      livesWithClient: false,
      assignedServices: ['PCA'],
      clientPreference: true,
    });
    await Promise.all([component.saveCaregiver(), component.saveCaregiver()]);
    const request = state.createCaregiver.mock.calls.at(-1)?.[0];
    expect(request.clientId).toBeUndefined();
    expect(request.companyId).toBeUndefined();
    expect(request.locationId).toBeUndefined();
    expect(component.caregiverAssignments()).toHaveLength(1);
    expect(component.caregiverDraft.caregiverUserId).toBe('');
  });

  it('preserves the inline form when Add fails', async () => {
    const component = fixture.componentInstance;
    await component.enterStepFour();
    Object.assign(component.caregiverDraft, {
      caregiverUserId: 'caregiver-1',
      startDate: '2026-09-30',
      relationship: 'Friend',
      livesWithClient: false,
    });
    state.createCaregiver.mockRejectedValueOnce(new Error('failed'));

    await component.saveCaregiver();

    expect(component.caregiverDraft.caregiverUserId).toBe('caregiver-1');
    expect(component.caregiverDraft.relationship).toBe('Friend');
    expect(component.submitError()).toContain('could not be saved');
  });

  it('edits through the same inline form and Cancel restores Add mode', async () => {
    const component = fixture.componentInstance;
    await component.enterStepFour();
    const assignment = await state.createCaregiver();
    state.updateCaregiver.mockResolvedValueOnce({
      ...assignment,
      assignmentType: 'Backup',
      editorVersion: 'caregiver-v2',
    });
    component.caregiverAssignments.set([assignment]);

    component.editCaregiver(assignment);
    expect(component.editingCaregiver()?.assignmentId).toBe('assignment-1');
    expect(component.caregiverDraft.relationship).toBe('Professional caregiver');
    component.caregiverDraft.assignmentType = 'Backup';
    await component.saveCaregiver();
    expect(state.updateCaregiver).toHaveBeenCalledWith(
      'assignment-1',
      expect.objectContaining({ assignmentType: 'Backup', editorVersion: 'caregiver-v1' }),
    );
    expect(component.caregiverAssignments()[0].assignmentType).toBe('Backup');
    expect(component.editingCaregiver()).toBeNull();

    component.editCaregiver(assignment);
    component.resetCaregiver();
    expect(component.editingCaregiver()).toBeNull();
    expect(component.caregiverDraft.caregiverUserId).toBe('');
  });

  it('confirms before ending and keeps the historical row', async () => {
    const component = fixture.componentInstance;
    await component.enterStepFour();
    const assignment = await state.createCaregiver();
    component.caregiverAssignments.set([assignment]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    state.endCaregiver.mockResolvedValueOnce({
      ...assignment,
      status: 'Ended',
      endDate: '2026-10-01',
      editorVersion: 'caregiver-v2',
    });

    await component.endCaregiver(assignment);

    expect(confirm).toHaveBeenCalledOnce();
    expect(state.endCaregiver).toHaveBeenCalledWith(
      'assignment-1',
      expect.any(String),
      'caregiver-v1',
    );
    expect(component.caregiverAssignments()).toHaveLength(1);
    expect(component.caregiverAssignments()[0].status).toBe('Ended');
    confirm.mockRestore();
  });

  it('blocks caregiver Continue for unsaved values and otherwise loads Step 5', async () => {
    const component = fixture.componentInstance;
    await component.enterStepFour();
    component.caregiverDraft.relationship = 'Friend';
    await component.continueFromCaregivers();
    expect(state.continueCaregivers).not.toHaveBeenCalled();
    component.resetCaregiver();
    await component.continueFromCaregivers();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(5);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="guest-step-five"]'),
    ).not.toBeNull();
  });

  it('adds and edits a contact through the same inline form without tenant identifiers', async () => {
    const component = fixture.componentInstance;
    await component.enterStepFive();
    Object.assign(component.contactDraft, {
      type: 'Emergency',
      name: 'Guest Contact',
      relationship: 'Parent',
      phone: '(612) 555-0100',
      email: 'contact@example.test',
      address: '100 Main St',
      isActive: true,
    });
    await Promise.all([component.saveContact(), component.saveContact()]);
    const request = state.createContact.mock.calls[0][0];
    expect(state.createContact).toHaveBeenCalledOnce();
    expect(request.clientId).toBeUndefined();
    expect(request.companyId).toBeUndefined();
    expect(component.contacts()).toHaveLength(1);
    expect(component.contactDraft.name).toBe('');

    const contact = component.contacts()[0];
    state.updateContact.mockResolvedValueOnce({ ...contact, relationship: 'Guardian' });
    component.editContact(contact);
    component.contactDraft.relationship = 'Guardian';
    await component.saveContact();
    expect(state.updateContact).toHaveBeenCalledWith(
      'contact-1',
      expect.objectContaining({ relationship: 'Guardian' }),
    );
    expect(component.contacts()[0].relationship).toBe('Guardian');
  });

  it('preserves a failed contact draft and blocks Continue until reset', async () => {
    const component = fixture.componentInstance;
    await component.enterStepFive();
    Object.assign(component.contactDraft, {
      name: 'Unsaved',
      relationship: 'Friend',
      phone: '(612) 555-0100',
    });
    state.createContact.mockRejectedValueOnce(new Error('failed'));
    await component.saveContact();
    expect(component.contactDraft.name).toBe('Unsaved');
    await component.continueFromContacts();
    expect(state.continueContacts).not.toHaveBeenCalled();
    component.resetContact();
    await component.continueFromContacts();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(6);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="guest-step-six"]'),
    ).not.toBeNull();
  });

  it('adds, edits, and continues care coordinators without tenant identifiers', async () => {
    const component = fixture.componentInstance;
    await component.enterStepSix();
    Object.assign(component.careCoordinatorDraft, {
      name: 'Case Manager',
      companyName: 'Agency',
      phone: '(612) 555-0100',
      phoneExtension: '12',
      fax: '(612) 555-0101',
      email: 'manager@example.test',
      isActive: true,
    });
    await Promise.all([component.saveCareCoordinator(), component.saveCareCoordinator()]);
    expect(state.createCareCoordinator).toHaveBeenCalledOnce();
    const request = state.createCareCoordinator.mock.calls[0][0];
    expect(request.clientId).toBeUndefined();
    expect(request.companyId).toBeUndefined();
    const item = component.careCoordinators()[0];
    state.updateCareCoordinator.mockResolvedValueOnce({ ...item, companyName: 'Updated Agency' });
    component.editCareCoordinator(item);
    component.careCoordinatorDraft.companyName = 'Updated Agency';
    await component.saveCareCoordinator();
    expect(component.careCoordinators()[0].companyName).toBe('Updated Agency');
    component.careCoordinatorDraft.name = 'Unsaved';
    await component.continueFromCareCoordinators();
    expect(state.continueCareCoordinators).not.toHaveBeenCalled();
    component.resetCareCoordinator();
    await component.continueFromCareCoordinators();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(7);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="guest-step-seven"]'),
    ).not.toBeNull();
  });

  it('adds, edits, and continues consultation providers without ownership or kind fields', async () => {
    const component = fixture.componentInstance;
    await component.enterStepSeven();
    Object.assign(component.consultationProviderDraft, {
      name: 'Consulting Nurse',
      phone: '(612) 555-0100',
      email: 'nurse@example.test',
      supportProviderName: 'Support Person',
      supportProviderPhone: '(612) 555-0101',
      supportProviderAddress: '100 Main Street',
      isActive: true,
    });
    await Promise.all([component.saveConsultationProvider(), component.saveConsultationProvider()]);
    expect(state.createConsultationProvider).toHaveBeenCalledOnce();
    const request = state.createConsultationProvider.mock.calls[0][0];
    expect(request.clientId).toBeUndefined();
    expect(request.companyId).toBeUndefined();
    expect(request.type).toBeUndefined();
    const item = component.consultationProviders()[0];
    state.updateConsultationProvider.mockResolvedValueOnce({ ...item, name: 'Updated Nurse' });
    component.editConsultationProvider(item);
    component.consultationProviderDraft.name = 'Updated Nurse';
    await component.saveConsultationProvider();
    expect(component.consultationProviders()[0].name).toBe('Updated Nurse');
    component.consultationProviderDraft.name = 'Unsaved';
    await component.continueFromConsultationProviders();
    expect(state.continueConsultationProviders).not.toHaveBeenCalled();
    component.resetConsultationProvider();
    await component.continueFromConsultationProviders();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(8);
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('[data-testid="guest-step-eight"]')).not.toBeNull();
    expect(html.textContent).not.toContain('Delete');
  });

  it('adds, edits, and continues physicians without ownership or kind fields', async () => {
    const component = fixture.componentInstance;
    await component.enterStepEight();
    Object.assign(component.physicianDraft, {
      name: 'Guest Doctor',
      npi: '1234567890',
      phone: '(612) 555-0100',
      fax: '(612) 555-0101',
      address: '100 Clinic Street',
      zipCode: '55401',
      city: 'Minneapolis',
      state: 'MN',
      isActive: true,
    });
    await Promise.all([component.savePhysician(), component.savePhysician()]);
    expect(state.createPhysician).toHaveBeenCalledOnce();
    const request = state.createPhysician.mock.calls[0][0];
    expect(request.clientId).toBeUndefined();
    expect(request.companyId).toBeUndefined();
    expect(request.type).toBeUndefined();
    const item = component.physicians()[0];
    state.updatePhysician.mockResolvedValueOnce({ ...item, name: 'Updated Doctor' });
    component.editPhysician(item);
    component.physicianDraft.name = 'Updated Doctor';
    await component.savePhysician();
    expect(component.physicians()[0].name).toBe('Updated Doctor');
    component.physicianDraft.name = 'Unsaved';
    await component.continueFromPhysicians();
    expect(state.continuePhysicians).not.toHaveBeenCalled();
    component.resetPhysician();
    await component.continueFromPhysicians();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(9);
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('[data-testid="guest-step-nine"]')).not.toBeNull();
    expect(html.textContent).not.toContain('Delete');
  });

  it('adds, edits, and continues responsible parties without ownership fields', async () => {
    const component = fixture.componentInstance;
    await component.enterStepNine();
    Object.assign(component.responsiblePartyDraft, {
      name: 'Guest Guardian',
      relationship: 'Parent',
      phone: '(612) 555-0100',
      email: 'guardian@example.test',
      address: '100 Family Street',
      livesWithClient: true,
      hasSpenddown: false,
      isActive: true,
    });
    await Promise.all([component.saveResponsibleParty(), component.saveResponsibleParty()]);
    expect(state.createResponsibleParty).toHaveBeenCalledOnce();
    const request = state.createResponsibleParty.mock.calls[0][0];
    expect(request.clientId).toBeUndefined();
    expect(request.companyId).toBeUndefined();
    expect(request.hasSpenddown).toBe(false);
    const item = component.responsibleParties()[0];
    state.updateResponsibleParty.mockResolvedValueOnce({ ...item, name: 'Updated Guardian' });
    component.editResponsibleParty(item);
    component.responsiblePartyDraft.name = 'Updated Guardian';
    await component.saveResponsibleParty();
    expect(component.responsibleParties()[0].name).toBe('Updated Guardian');
    component.responsiblePartyDraft.name = 'Unsaved';
    await component.continueFromResponsibleParties();
    expect(state.continueResponsibleParties).not.toHaveBeenCalled();
    component.resetResponsibleParty();
    await component.continueFromResponsibleParties();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(10);
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('[data-testid="guest-step-ten"]')).not.toBeNull();
    expect(html.textContent).not.toContain('Delete');
  });

  it('adds and edits Step 10 hospitalizations without ownership or completion calls', async () => {
    const component = fixture.componentInstance;
    await component.enterStepTen();
    Object.assign(component.hospitalizationDraft, {
      hospitalName: 'Guest Hospital',
      admittedAt: '2026-10-02T10:00',
      dischargedAt: '',
      reason: 'Observation',
      diagnosis: 'Pending tests',
      dischargeInstructions: '',
    });
    await Promise.all([component.saveHospitalization(), component.saveHospitalization()]);
    expect(state.createHospitalization).toHaveBeenCalledOnce();
    const request = state.createHospitalization.mock.calls[0][0];
    expect(request.clientId).toBeUndefined();
    expect(request.companyId).toBeUndefined();
    expect(request.dischargedAtUtc).toBeNull();
    expect(component.hospitalizations()).toHaveLength(1);

    const item = component.hospitalizations()[0];
    state.updateHospitalization.mockResolvedValueOnce({
      ...item,
      hospitalName: 'Updated Hospital',
    });
    component.editHospitalization(item);
    component.hospitalizationDraft.hospitalName = 'Updated Hospital';
    await component.saveHospitalization();
    expect(component.hospitalizations()[0].hospitalName).toBe('Updated Hospital');
    component.editHospitalization(component.hospitalizations()[0]);
    component.resetHospitalization();
    expect(component.editingHospitalization()).toBeNull();
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('[data-testid="hospitalization-inline-form"]')).not.toBeNull();
    expect(
      html.querySelector('[data-testid="finish-client-setup"]')?.hasAttribute('disabled'),
    ).toBe(false);
    expect(html.textContent).not.toContain('Delete');
  });

  it('blocks dirty completion, prevents duplicate Finish, and shows the completed state', async () => {
    viewState.set('ready');
    const component = fixture.componentInstance;
    await component.enterStepTen();
    component.hospitalizationDraft.reason = 'Unsaved';
    await component.finishClientSetup();
    expect(state.complete).not.toHaveBeenCalled();
    expect(component.submitError()).toContain('Save or cancel');

    component.resetHospitalization();
    await Promise.all([component.finishClientSetup(), component.finishClientSetup()]);
    expect(state.complete).toHaveBeenCalledOnce();
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('[data-testid="completed-state"]')).not.toBeNull();
    expect(html.querySelector('[data-testid="guest-step-ten"]')).toBeNull();
    expect(html.textContent).not.toContain('Back');
    expect(html.textContent).not.toContain('Restart');
  });

  it('keeps Step 10 retryable after a completion network error', async () => {
    viewState.set('ready');
    const component = fixture.componentInstance;
    await component.enterStepTen();
    state.complete.mockRejectedValueOnce(new Error('network'));
    await component.finishClientSetup();
    expect(component.currentStep()).toBe(10);
    expect(component.intake.viewState()).toBe('ready');
    expect(component.submitError()).toContain('Please try again');
    await component.finishClientSetup();
    expect(state.complete).toHaveBeenCalledTimes(2);
  });

  it('validates Step 3 without losing the editable invitation prefills', async () => {
    const component = fixture.componentInstance;
    await component.enterStepThree();
    component.draft.email = 'not-an-email';
    component.draft.phone1 = '123';
    component.draft.street = '';
    component.draft.languages = [];

    await component.saveContactInformation();

    expect(state.updateContactInformation).not.toHaveBeenCalled();
    expect(component.draft.email).toBe('not-an-email');
    expect(component.fieldErrors()).toMatchObject({
      email: 'Enter a valid email address.',
      phone1: 'Primary phone must use (555) 555-1234 format.',
      street: 'Street address is required.',
      languages: 'Select at least one preferred language.',
    });
  });

  it('preserves Step 3 values and editor version when save fails', async () => {
    const component = fixture.componentInstance;
    await component.enterStepThree();
    component.draft.street = '123 Main St';
    component.draft.email = 'edited@example.test';
    state.updateContactInformation.mockRejectedValueOnce(new Error('network'));

    await component.saveContactInformation();

    expect(component.currentStep()).toBe(3);
    expect(component.editorVersion()).toBe('contact-version');
    expect(component.draft.email).toBe('edited@example.test');
    expect(component.submitError()).toBe('Contact information could not be saved.');
  });

  it('adds and removes languages without duplicates and sends exactly one primary language', async () => {
    const component = fixture.componentInstance;
    await component.enterStepThree();
    component.draft.street = '123 Main St';
    component.toggleLanguage('Spanish', true);
    component.toggleLanguage('Spanish', true);
    component.toggleLanguage('English', false);

    await component.saveContactInformation();

    const request = state.updateContactInformation.mock.calls.at(-1)?.[0];
    expect(request.contactInformation.preferredLanguages).toEqual([
      { languageCode: 'es', languageName: 'Spanish', isPrimary: true },
    ]);
  });

  it('uses the existing external postal lookup without an authenticated backend endpoint', async () => {
    const component = fixture.componentInstance;
    component.draft.zip = '55401';

    await component.lookupContactPostalCode();

    expect(postalLookup.lookupPostalCode).toHaveBeenCalledWith('US', '55401');
    expect(component.draft.city).toBe('Minneapolis');
    expect(component.draft.state).toBe('Minnesota');
    expect(component.draft.county).toBe('Hennepin');
  });

  it('resumes an already-started Step 3 intake without creating another client', async () => {
    context.set({
      state: 'Ready',
      clientDisplayName: 'Guest Client',
      expiresAtUtc: '2026-10-01T00:00:00Z',
      hasCreatedClient: true,
    });
    state.additionalInformation.mockResolvedValueOnce({
      ...(await state.additionalInformation()),
      creationProgressStep: 3,
    });
    const component = fixture.componentInstance;

    await component.start();

    expect(state.createBasicDetails).not.toHaveBeenCalled();
    expect(state.contactInformation).toHaveBeenCalledOnce();
    expect(component.currentStep()).toBe(3);
  });

  it('allows safe back navigation from Step 3 to the implemented Step 2', async () => {
    const component = fixture.componentInstance;
    await component.enterStepThree();
    state.additionalInformation.mockResolvedValueOnce({
      ...(await state.additionalInformation()),
      creationProgressStep: 3,
    });

    await component.enterStepTwo(false);

    expect(component.currentStep()).toBe(2);
  });
});
