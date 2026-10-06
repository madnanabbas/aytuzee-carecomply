import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { LocationLookupService } from '../../../../core/lookups/location-lookup.service';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientDetails, UpdateClientRequest } from '../../models/client-api.models';
import { ClientEditPageComponent } from './client-edit-page';

describe('ClientEditPageComponent wizard navigation', () => {
  it('renders the canonical vertical sidebar and keeps the right-side form and footer', async () => {
    await TestBed.configureTestingModule({
      imports: [ClientEditPageComponent],
      providers: [
        provideRouter([]),
        { provide: ClientApiService, useValue: { getClient: () => NEVER } },
        { provide: LocationLookupService, useValue: { list: () => NEVER } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: 'client-1' }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientEditPageComponent);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-client-wizard-sidebar')).toBeTruthy();
    expect(element.querySelector('app-client-wizard-stepper')).toBeNull();
    expect(element.querySelectorAll('.client-wizard-sidebar li')).toHaveLength(10);
    const sidebar = element.querySelector('.client-wizard-sidebar');
    const active = sidebar?.querySelector('[aria-current="step"]');
    expect(sidebar?.querySelector('.client-vertical-nav-heading')?.textContent?.trim()).toBe(
      'Client setup',
    );
    expect(sidebar?.querySelector('.client-wizard-sidebar-number')).toBeNull();
    expect(sidebar?.querySelectorAll('button:disabled')).toHaveLength(0);
    expect(active?.textContent).toContain('Basic details');
    expect(active?.classList).toContain('client-vertical-nav-item');
    expect(active?.classList).toContain('active');
    expect(element.querySelector('.client-wizard-mobile-selector')).toBeTruthy();
    expect(element.textContent).toContain('Client identity');
    expect(element.textContent).toContain('Save changes');
    const mainCard = element.querySelector('.client-wizard-content');
    expect(mainCard?.classList).toContain('rounded-surface');
    expect(mainCard?.classList).toContain('border-border');
    expect(mainCard?.querySelectorAll('.client-step-section')).toHaveLength(2);
    expect(mainCard?.querySelectorAll('.client-step-section__header')).toHaveLength(2);
    expect(mainCard?.querySelectorAll('.client-step-section__grid')).toHaveLength(2);
    expect(
      Array.from(mainCard?.querySelectorAll('h3') ?? []).map((heading) =>
        heading.textContent?.trim(),
      ),
    ).toEqual(['Client identity', 'Intake & service setup']);
    expect(mainCard?.textContent).not.toContain('Care & safety');
    expect(mainCard?.textContent).toContain('Safety measure');
    expect(mainCard?.textContent).toContain('Special equipment');
    expect(mainCard?.textContent).toContain('Allergies');
    expect(mainCard?.textContent).toContain('Other services');
    expect(mainCard?.querySelector('.client-wizard-footer')).toBeTruthy();
    expect(element.querySelector('.form-section')).toBeNull();
    expect(element.querySelector('.form-grid')).toBeNull();
    const statusOptions = Array.from(
      element.querySelectorAll<HTMLSelectElement>('.client-step-section select'),
    )
      .flatMap((select) => Array.from(select.options))
      .map((option) => option.text);
    expect(statusOptions).toEqual(
      expect.arrayContaining(['Pending', 'Active', 'On hold', 'Discharged', 'Inactive']),
    );
    expect(element.textContent).toContain('Discharge date');
    expect(element.textContent).toContain('Discharge reason');
    const ssn = element.querySelector<HTMLInputElement>('[data-client-ssn-input]')!;
    ssn.value = 'abc';
    ssn.dispatchEvent(new Event('input'));
    expect(ssn.value).toBe('');
    ssn.value = '12a3b45c6789';
    ssn.dispatchEvent(new Event('input'));
    expect(ssn.value).toBe('123-45-6789');
    const status = element.querySelector<HTMLSelectElement>('[data-client-status-select]')!;
    expect(status.disabled).toBe(false);
    status.value = 'Discharged';
    status.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('[data-client-discharge-date]')?.disabled).toBe(
      false,
    );
    expect(
      element.querySelector<HTMLInputElement>('[data-client-discharge-reason]')?.disabled,
    ).toBe(false);

    fixture.componentInstance.selectSection(1);
    fixture.detectChanges();
    expect(mainCard?.querySelectorAll('.section-heading')).toHaveLength(4);
    expect(mainCard?.querySelector('.client-step-section')).toBeNull();

    fixture.componentInstance.selectSection(2);
    fixture.detectChanges();
    expect(mainCard?.querySelector('.section-heading')).toBeNull();
    expect(mainCard?.querySelector('.client-step-section')).toBeNull();
    expect(mainCard?.querySelector('.grid.xl\\:grid-cols-4')).toBeTruthy();
  });

  it('keeps direct step selection and maps Contact information to its existing fields', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: { getClient: () => NEVER } },
        { provide: LocationLookupService, useValue: { list: () => NEVER } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: 'client-1' }) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new ClientEditPageComponent());
    expect(page.section()).toBe('basic');

    page.normalizeSsn('125-80asdas');
    expect(page.model.ssn).toBe('125-80');
    page.normalizeSsn('1234567890');
    expect(page.model.ssn).toBe('123-45-6789');

    page.selectSection(2);

    expect(page.section()).toBe('contact');
    expect(page.activeStepIndex()).toBe(2);
  });

  it('hydrates persisted assignments and submits the selected location and supervisor IDs', () => {
    const details = clientDetails();
    const updateClient = vi.fn((_clientId: string, _request: UpdateClientRequest) =>
      of({
        ...details,
        location: 'Bloomington',
        locationId: 'location-2',
        supervisorUserId: 'supervisor-2',
        supervisorName: 'Second Supervisor',
      }),
    );
    const supervisorCandidates = vi.fn((locationId: string) =>
      of(
        locationId === 'location-2'
          ? [{ id: 'supervisor-2', name: 'Second Supervisor', jobTitle: 'RN' }]
          : [{ id: 'supervisor-1', name: 'First Supervisor', jobTitle: 'RN' }],
      ),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ClientApiService,
          useValue: { getClient: () => of(details), supervisorCandidates, updateClient },
        },
        {
          provide: LocationLookupService,
          useValue: {
            list: () =>
              of([
                {
                  id: 'location-1',
                  companyId: 'company-1',
                  name: 'Main',
                  isMain: true,
                  isActive: true,
                },
                {
                  id: 'location-2',
                  companyId: 'company-1',
                  name: 'Bloomington',
                  isMain: false,
                  isActive: true,
                },
              ]),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: details.id }) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new ClientEditPageComponent());
    expect(page.model.locationId).toBe('location-1');
    expect(page.model.location).toBe('Main');
    expect(page.model.supervisor).toBe('supervisor-1');
    expect(page.model.safetyMeasure).toBe('Use gait belt');
    expect(page.model.specialEquipment).toBe('Walker');
    expect(page.model.allergies).toBe('Penicillin');
    expect(page.model.otherServices).toBe('Meal delivery');

    page.selectLocation('location-2');
    expect(page.model.locationId).toBe('location-2');
    expect(page.model.location).toBe('Bloomington');
    expect(page.model.supervisor).toBe('');
    expect(supervisorCandidates).toHaveBeenLastCalledWith('location-2');

    page.model.supervisor = 'supervisor-2';
    page.save();

    expect(updateClient).toHaveBeenCalledOnce();
    expect(updateClient.mock.calls[0]![1].careSetup).toMatchObject({
      location: 'Bloomington',
      locationId: 'location-2',
      supervisorUserId: 'supervisor-2',
    });
    expect(updateClient.mock.calls[0]![1].safety).toEqual({
      safetyMeasures: 'Use gait belt',
      specialEquipment: 'Walker',
      allergies: 'Penicillin',
      otherServices: 'Meal delivery',
    });
  });

  it('rejects an invalid status and saves authoritative discharge fields', () => {
    const details = clientDetails();
    const updateClient = vi.fn(() => of({ ...details, editorVersion: 'b'.repeat(64) }));
    const changeStatus = vi.fn(() =>
      of({
        ...details,
        status: 'Discharged',
        dischargeDate: '2026-02-01',
        dischargeReason: 'Care completed',
        editorVersion: 'c'.repeat(64),
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ClientApiService,
          useValue: {
            getClient: () => of(details),
            supervisorCandidates: () => of([]),
            updateClient,
            changeStatus,
          },
        },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: details.id }) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientEditPageComponent());

    page.model.status = 'Browser injected value';
    page.save();
    expect(updateClient).not.toHaveBeenCalled();
    expect(page.fieldErrors()['status']).toBe('Status is invalid.');

    page.model.status = 'Discharged';
    page.model.dischargeDate = '2026-02-01';
    page.model.dischargeReason = 'Care completed';
    page.save();

    expect(updateClient).toHaveBeenCalledOnce();
    expect(changeStatus).toHaveBeenCalledWith('client-1', {
      status: 4,
      dischargeDate: '2026-02-01',
      dischargeReason: 'Care completed',
      editorVersion: 'b'.repeat(64),
    });
  });
});

function clientDetails(): ClientDetails {
  return {
    id: 'client-1',
    firstName: 'Avery',
    middleName: null,
    lastName: 'Northstar',
    preferredName: 'Avery',
    dateOfBirth: '1990-01-01',
    gender: 'Female',
    pmiNumber: '12345678',
    hasSsn: false,
    insuranceProvider: null,
    email: 'avery@example.test',
    primaryPhone: '(612) 555-0100',
    secondaryPhone: null,
    intakeDate: null,
    socDate: '2026-01-01',
    referralSource: null,
    status: 'Active',
    location: 'Main',
    locationId: 'location-1',
    supervisorUserId: 'supervisor-1',
    supervisorName: 'First Supervisor',
    isOnboarding: false,
    dischargeDate: null,
    dischargeReason: null,
    addressLine1: '100 Main Street',
    addressLine2: null,
    city: 'Minneapolis',
    state: 'MN',
    postalCode: '55401',
    county: 'Hennepin',
    country: 'United States',
    evvAuthorizedHoursPerWeek: null,
    safetyMeasures: 'Use gait belt',
    specialEquipment: 'Walker',
    allergies: 'Penicillin',
    otherServices: 'Meal delivery',
    additionalProfile: null,
    services: [],
    languages: [{ languageCode: 'en', languageName: 'English', isPrimary: true }],
    editorVersion: 'a'.repeat(64),
  };
}
