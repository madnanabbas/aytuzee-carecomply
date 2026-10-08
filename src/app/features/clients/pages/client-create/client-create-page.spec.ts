import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { GeographyDirectoryService } from '../../data-access/geography-directory.service';
import { ClientApiService } from '../../data-access/client-api.service';
import { PostalLookupService } from '../../data-access/postal-lookup.service';
import { LocationLookupService } from '../../../../core/lookups/location-lookup.service';
import { ClientCreatePageComponent } from './client-create-page';
import { ClientDetails } from '../../models/client-api.models';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';

describe('ClientCreatePageComponent', () => {
  it('renders the canonical vertical sidebar while preserving the Step 1 form and actions', async () => {
    await TestBed.configureTestingModule({
      imports: [ClientCreatePageComponent],
      providers: [
        provideRouter([]),
        { provide: ClientApiService, useValue: { supervisorCandidates: () => of([]) } },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientCreatePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const page = fixture.componentInstance;

    expect(element.querySelector('app-client-wizard-sidebar')).toBeTruthy();
    expect(element.querySelector('app-client-wizard-stepper')).toBeNull();
    expect(element.querySelectorAll('.client-wizard-sidebar li')).toHaveLength(11);
    const sidebar = element.querySelector('.client-wizard-sidebar');
    const active = sidebar?.querySelector('[aria-current="step"]');
    expect(sidebar?.querySelector('.client-vertical-nav-heading')?.textContent?.trim()).toBe(
      'Client setup',
    );
    expect(sidebar?.querySelector('.client-wizard-sidebar-number')).toBeNull();
    expect(sidebar?.querySelectorAll('button:disabled')).toHaveLength(10);
    expect(active?.textContent).toContain('Basic details');
    expect(active?.classList).toContain('client-vertical-nav-item');
    expect(active?.classList).toContain('active');
    expect(element.querySelector('.client-wizard-mobile-selector')).toBeTruthy();
    expect(element.textContent).toContain('Client identity');
    expect(element.textContent).toContain('Save & continue');
    expect(element.querySelectorAll('.client-step-section')).toHaveLength(2);
    expect(element.querySelectorAll('.client-step-section__header')).toHaveLength(2);
    expect(element.querySelectorAll('.client-step-section__grid')).toHaveLength(2);
    const mainCard = element.querySelector('.client-wizard-content');
    expect(mainCard?.classList).toContain('rounded-surface');
    expect(mainCard?.classList).toContain('border-border');
    expect(mainCard?.querySelector('.client-wizard-footer')).toBeTruthy();
    const layout = element.querySelector('.client-authenticated-wizard-layout');
    expect(layout?.children[0]?.tagName).toBe('APP-CLIENT-WIZARD-SIDEBAR');
    expect(layout?.children[1]?.classList).toContain('client-authenticated-wizard-main');
    const status = element.querySelector<HTMLSelectElement>('[data-client-status-select]');
    expect(status?.disabled).toBe(false);
    expect(status?.value).toBe('Pending');
    expect(Array.from(status?.options ?? []).map((option) => option.text)).toEqual([
      'Pending',
      'Active',
      'On hold',
      'Discharged',
      'Inactive',
    ]);
    expect(element.textContent).toContain('Discharge date');
    expect(element.textContent).toContain('Discharge reason');

    const ssn = element.querySelector<HTMLInputElement>('[data-client-ssn-input]')!;
    ssn.value = 'sdasdasdasd';
    ssn.dispatchEvent(new Event('input'));
    expect(ssn.value).toBe('');
    expect(page.draft.ssn).toBe('');
    ssn.value = '12a3b45c6789';
    ssn.dispatchEvent(new Event('input'));
    expect(ssn.value).toBe('123-45-6789');
    expect(page.draft.ssn).toBe('123-45-6789');

    status!.value = 'Discharged';
    status!.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    const dischargeDate = element.querySelector<HTMLInputElement>('[data-client-discharge-date]')!;
    const dischargeReason = element.querySelector<HTMLInputElement>(
      '[data-client-discharge-reason]',
    )!;
    expect(dischargeDate.disabled).toBe(false);
    expect(dischargeReason.disabled).toBe(false);
    status!.value = 'Active';
    status!.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(dischargeDate.disabled).toBe(true);
    expect(dischargeReason.disabled).toBe(true);

    page.servicesOpen.set(true);
    fixture.detectChanges();
    const serviceOptions = element.querySelector<HTMLElement>('[data-services-options]');
    expect(serviceOptions).toBeTruthy();
    expect(serviceOptions?.classList).not.toContain('absolute');
    expect(serviceOptions?.parentElement?.hasAttribute('data-services-overlay-host')).toBe(true);
    const serviceCheckbox =
      serviceOptions?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(serviceCheckbox).toBeTruthy();
    serviceCheckbox!.checked = true;
    serviceCheckbox!.dispatchEvent(new Event('change'));
    expect(page.draft.services).toContain(page.serviceOptions[0]);
  });

  it('creates once from Step 1, stores identity/version, and advances to Step 2', () => {
    const response = new Subject<{ id: string; editorVersion: string }>();
    const additionalResponse = new Subject<{ id: string; editorVersion: string }>();
    const contactResponse = new Subject<{ id: string; editorVersion: string }>();
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      createClientBasicDetails: vi.fn(() => response.asObservable()),
      updateClientAdditionalInformation: vi.fn(() => additionalResponse.asObservable()),
      updateClientContactInformation: vi.fn(() => contactResponse.asObservable()),
      completeClientCreation: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        {
          provide: LocationLookupService,
          useValue: {
            list: () => of([{ id: 'location-1', name: 'Main', isMain: true }]),
          },
        },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    Object.assign(page.draft, {
      firstName: 'Avery',
      lastName: 'Northstar',
      dob: '1990-01-01',
      gender: 'Female',
      pmi: '12345678',
      socDate: '2026-09-01',
      ssn: '',
    });

    page.next();
    page.next();

    expect(api.createClientBasicDetails).toHaveBeenCalledTimes(1);
    expect(page.saving()).toBe(true);
    response.next({ id: 'client-1', editorVersion: 'version-1' });
    response.complete();
    expect(page.createdClientId()).toBe('client-1');
    expect(page.editorVersion()).toBe('version-1');
    expect(page.stepIndex()).toBe(1);
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/clients', 'new', 'client-1'], {
      replaceUrl: true,
    });

    page.draft.notes = 'Preserve this value';
    page.next();
    page.next();
    expect(api.createClientBasicDetails).toHaveBeenCalledTimes(1);
    expect(api.updateClientAdditionalInformation).toHaveBeenCalledTimes(1);
    expect(api.updateClientAdditionalInformation).toHaveBeenCalledWith(
      'client-1',
      expect.objectContaining({ editorVersion: 'version-1' }),
    );
    const calls = api.updateClientAdditionalInformation.mock.calls as unknown as [
      string,
      Record<string, unknown>,
    ][];
    const request = calls[0][1];
    expect(request['companyId']).toBeUndefined();
    expect(Object.keys(request).sort()).toEqual(['additionalProfile', 'editorVersion']);
    additionalResponse.next({ id: 'client-1', editorVersion: 'version-2' });
    additionalResponse.complete();
    expect(page.editorVersion()).toBe('version-2');
    expect(page.stepIndex()).toBe(2);
    expect(page.draft.notes).toBe('Preserve this value');

    Object.assign(page.draft, {
      email: 'client@example.test',
      phone1: '(612) 555-0111',
      street: '100 Main St',
      languages: ['English', 'Spanish'],
    });
    page.next();
    page.next();
    expect(api.createClientBasicDetails).toHaveBeenCalledTimes(1);
    expect(api.updateClientContactInformation).toHaveBeenCalledTimes(1);
    const contactCalls = api.updateClientContactInformation.mock.calls as unknown as [
      string,
      Record<string, unknown>,
    ][];
    const contactRequest = contactCalls[0][1];
    expect(contactRequest['companyId']).toBeUndefined();
    expect(contactRequest['editorVersion']).toBe('version-2');
    expect(contactRequest['primaryPhone']).toBe('(612) 555-0111');
    expect(contactRequest['addressLine1']).toBe('100 Main St');
    expect(contactRequest['preferredLanguages']).toEqual([
      { languageCode: 'en', languageName: 'English', isPrimary: true },
      { languageCode: 'es', languageName: 'Spanish', isPrimary: false },
    ]);
    contactResponse.next({ id: 'client-1', editorVersion: 'version-3' });
    contactResponse.complete();
    expect(page.editorVersion()).toBe('version-3');
    expect(page.stepIndex()).toBe(3);
  });

  it('requires discharge date and reason before a discharged client can leave Step 1', () => {
    const createClientBasicDetails = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ClientApiService,
          useValue: { supervisorCandidates: () => of([]), createClientBasicDetails },
        },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    page.draft.status = 'Discharged';

    page.createClientFromBasicDetails();

    expect(createClientBasicDetails).not.toHaveBeenCalled();
    expect(page.fieldErrors()['dischargeDate']).toBe(
      'Discharge date is required for a discharged client.',
    );
    expect(page.fieldErrors()['dischargeReason']).toBe(
      'Discharge reason is required for a discharged client.',
    );
  });

  it('does not allow later steps before Step 1 has created the Client', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ClientApiService,
          useValue: {
            supervisorCandidates: () => of([]),
            createClientBasicDetails: vi.fn(),
            updateClientAdditionalInformation: vi.fn(),
            updateClientContactInformation: vi.fn(),
            completeClientCreation: vi.fn(),
          },
        },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());

    page.goToStep(3);

    expect(page.stepIndex()).toBe(0);
  });

  it('finishes once, preserves state on failure, and navigates to the client after success', () => {
    const completion = new Subject<{ id: string; status: 'Active'; editorVersion: string }>();
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      createClientBasicDetails: vi.fn(),
      updateClientAdditionalInformation: vi.fn(),
      updateClientContactInformation: vi.fn(),
      completeClientCreation: vi.fn(() => completion.asObservable()),
    };
    const router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        { provide: Router, useValue: router },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    page.createdClientId.set('client-1');
    page.editorVersion.set('a'.repeat(64));
    page.stepIndex.set(10);
    page.draft.status = 'Active';

    page.finish();
    page.finish();

    expect(api.completeClientCreation).toHaveBeenCalledTimes(1);
    expect(api.createClientBasicDetails).not.toHaveBeenCalled();
    expect(api.completeClientCreation).toHaveBeenCalledWith(
      'client-1',
      'a'.repeat(64),
      2,
      null,
      null,
    );
    completion.next({ id: 'client-1', status: 'Active', editorVersion: 'b'.repeat(64) });
    completion.complete();
    expect(page.editorVersion()).toBe('b'.repeat(64));
    expect(page.completionDialog()?.title).toBe('Client created successfully');
    expect(router.navigate).not.toHaveBeenCalled();

    page.confirmCompletion();
    expect(router.navigate).toHaveBeenCalledWith(['/clients', 'client-1'], {
      state: { clientCreated: true },
    });
  });

  it('requires identity/version but does not require a Service Agreement to complete', () => {
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      createClientBasicDetails: vi.fn(),
      updateClientAdditionalInformation: vi.fn(),
      updateClientContactInformation: vi.fn(),
      completeClientCreation: vi.fn(() =>
        of({ id: 'client-1', status: 'Active' as const, editorVersion: 'b'.repeat(64) }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    page.finish();
    expect(page.errorMessage()).toContain('Save the client details');
    page.createdClientId.set('client-1');
    page.editorVersion.set('a'.repeat(64));
    page.stepIndex.set(10);

    page.finish();

    expect(api.completeClientCreation).toHaveBeenCalledTimes(1);
    expect(page.completionDialog()?.title).toBe('Client created successfully');
  });

  it('applies the authenticated staff selected discharged status after completing creation', () => {
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      completeClientCreation: vi.fn(() =>
        of({ id: 'client-1', status: 'Active' as const, editorVersion: 'c'.repeat(64) }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    page.createdClientId.set('client-1');
    page.editorVersion.set('a'.repeat(64));
    page.stepIndex.set(10);
    page.draft.status = 'Discharged';
    page.draft.dischargeDate = '2026-10-01';
    page.draft.dischargeReason = 'Care completed';

    page.finish();

    expect(api.completeClientCreation).toHaveBeenCalledWith(
      'client-1',
      'a'.repeat(64),
      4,
      '2026-10-01',
      'Care completed',
    );
    expect(page.editorVersion()).toBe('c'.repeat(64));
    expect(page.completionDialog()?.title).toBe('Client created successfully');
  });

  it('remains on Service agreements and preserves identity/version when completion fails', () => {
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      createClientBasicDetails: vi.fn(),
      updateClientAdditionalInformation: vi.fn(),
      updateClientContactInformation: vi.fn(),
      completeClientCreation: vi.fn(() =>
        throwError(() => ({ status: 409, error: { title: 'Client conflict' } })),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    page.createdClientId.set('client-1');
    page.editorVersion.set('a'.repeat(64));
    page.stepIndex.set(10);

    page.finish();

    expect(page.stepIndex()).toBe(10);
    expect(page.createdClientId()).toBe('client-1');
    expect(page.editorVersion()).toBe('a'.repeat(64));
    expect(page.completionDialog()).toBeNull();
    expect(api.createClientBasicDetails).not.toHaveBeenCalled();
  });

  it('loads a trusted resume state, hydrates Steps 1-3, and never creates another Client', () => {
    const client = resumedClient();
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      createClientBasicDetails: vi.fn(),
      updateClientAdditionalInformation: vi.fn(),
      updateClientContactInformation: vi.fn(),
      completeClientCreation: vi.fn(),
      advanceClientCreationProgress: vi.fn(),
      getClientCreationState: vi.fn(() =>
        of({
          id: 'client-1',
          status: 'Pending',
          currentStep: 8,
          editorVersion: 'b'.repeat(64),
          client,
        }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: 'client-1' }) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());

    expect(api.getClientCreationState).toHaveBeenCalledWith('client-1');
    expect(page.createdClientId()).toBe('client-1');
    expect(page.editorVersion()).toBe('b'.repeat(64));
    expect(page.stepIndex()).toBe(7);
    expect(page.furthestStepIndex()).toBe(7);
    expect(page.draft.firstName).toBe('Resume');
    expect(page.draft.notes).toBe('Persisted notes');
    expect(page.draft.email).toBe('resume@example.test');
    expect(page.draft.languages).toEqual(['English', 'Spanish']);
    expect(page.draft.ssn).toBe('');
    expect(api.createClientBasicDetails).not.toHaveBeenCalled();
  });

  it('edits resumed Step 1 with PUT, preserves identity/progress, and prevents duplicate submit', () => {
    const update = new Subject<{ id: string; editorVersion: string }>();
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      createClientBasicDetails: vi.fn(),
      updateClientBasicDetails: vi.fn(() => update.asObservable()),
      updateClientAdditionalInformation: vi.fn(),
      updateClientContactInformation: vi.fn(),
      completeClientCreation: vi.fn(),
      advanceClientCreationProgress: vi.fn(),
      getClientCreationState: vi.fn(() =>
        of({
          id: 'client-1',
          status: 'Pending',
          currentStep: 8,
          editorVersion: 'a'.repeat(64),
          client: resumedClient(),
        }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: 'client-1' }) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    page.goToStep(0);
    page.draft.firstName = 'Edited';

    page.next();
    page.next();

    expect(api.updateClientBasicDetails).toHaveBeenCalledTimes(1);
    expect(api.createClientBasicDetails).not.toHaveBeenCalled();
    expect(api.updateClientBasicDetails).toHaveBeenCalledWith(
      'client-1',
      expect.objectContaining({ editorVersion: 'a'.repeat(64) }),
    );
    const calls = api.updateClientBasicDetails.mock.calls as unknown as [
      string,
      Record<string, unknown>,
    ][];
    const request = calls[0][1];
    expect(request['companyId']).toBeUndefined();
    expect((request['identity'] as Record<string, unknown>)['ssn']).toBeNull();
    expect(page.saving()).toBe(true);

    update.next({ id: 'client-1', editorVersion: 'b'.repeat(64) });
    update.complete();

    expect(page.createdClientId()).toBe('client-1');
    expect(page.editorVersion()).toBe('b'.repeat(64));
    expect(page.stepIndex()).toBe(1);
    expect(page.furthestStepIndex()).toBe(7);
  });

  it('keeps resumed Step 1 values and editor version when its update fails', () => {
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      createClientBasicDetails: vi.fn(),
      updateClientBasicDetails: vi.fn(() => throwError(() => ({ status: 409 }))),
      getClientCreationState: vi.fn(() =>
        of({
          id: 'client-1',
          status: 'Pending',
          currentStep: 2,
          editorVersion: 'a'.repeat(64),
          client: resumedClient(),
        }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: 'client-1' }) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    page.goToStep(0);
    page.draft.firstName = 'Keep me';

    page.next();

    expect(page.stepIndex()).toBe(0);
    expect(page.draft.firstName).toBe('Keep me');
    expect(page.editorVersion()).toBe('a'.repeat(64));
    expect(api.createClientBasicDetails).not.toHaveBeenCalled();
  });

  it('persists related-step Continue without reducing progress on backward navigation', () => {
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      createClientBasicDetails: vi.fn(),
      updateClientAdditionalInformation: vi.fn(),
      updateClientContactInformation: vi.fn(),
      completeClientCreation: vi.fn(),
      getClientCreationState: vi.fn(),
      advanceClientCreationProgress: vi.fn(() =>
        of({ id: 'client-1', currentStep: 5, editorVersion: 'b'.repeat(64) }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    page.createdClientId.set('client-1');
    page.editorVersion.set('a'.repeat(64));
    page.stepIndex.set(3);
    page.furthestStepIndex.set(3);

    page.next();

    expect(api.advanceClientCreationProgress).toHaveBeenCalledWith('client-1', 5, 'a'.repeat(64));
    expect(page.stepIndex()).toBe(4);
    expect(page.furthestStepIndex()).toBe(4);
    expect(page.editorVersion()).toBe('b'.repeat(64));
    page.back();
    expect(page.stepIndex()).toBe(3);
    expect(page.furthestStepIndex()).toBe(4);
    expect(api.advanceClientCreationProgress).toHaveBeenCalledTimes(1);
  });

  it('moves from Hospitalizations to optional Step 11 without sending unsupported progress 11', () => {
    const api = {
      supervisorCandidates: vi.fn(() => of([])),
      advanceClientCreationProgress: vi.fn(),
      completeClientCreation: vi.fn(() =>
        of({ id: 'client-1', status: 'Active' as const, editorVersion: 'b'.repeat(64) }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new ClientCreatePageComponent());
    page.createdClientId.set('client-1');
    page.editorVersion.set('a'.repeat(64));
    page.stepIndex.set(9);
    page.furthestStepIndex.set(9);

    page.next();

    expect(page.activeStep().id).toBe('service-agreements');
    expect(page.stepIndex()).toBe(10);
    expect(page.furthestStepIndex()).toBe(10);
    expect(api.advanceClientCreationProgress).not.toHaveBeenCalled();

    page.finish();
    expect(api.completeClientCreation).toHaveBeenCalledTimes(1);
  });

  it('resumes server progress 10 into the optional Service agreements step and reuses the shared component', async () => {
    const listClientServiceAgreements = vi.fn(() => of([]));
    await TestBed.configureTestingModule({
      imports: [ClientCreatePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ClientApiService,
          useValue: {
            supervisorCandidates: () => of([]),
            listClientServiceAgreements,
            getClientCreationState: () =>
              of({
                id: 'client-1',
                status: 'Pending',
                currentStep: 10,
                editorVersion: 'a'.repeat(64),
                client: resumedClient(),
              }),
          },
        },
        {
          provide: AuthorizationService,
          useValue: {
            hasPermission: (permission: string) =>
              permission === Permissions.ClientServiceAgreement.View,
          },
        },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: 'client-1' }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientCreatePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeStep().id).toBe('service-agreements');
    expect(fixture.nativeElement.querySelector('app-client-service-agreements')).toBeTruthy();
    expect(listClientServiceAgreements).toHaveBeenCalledWith('client-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No service agreements have been added yet.',
    );
  });

  it('redirects a non-Pending resume to the existing Client view', () => {
    const router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ClientApiService,
          useValue: {
            supervisorCandidates: () => of([]),
            getClientCreationState: () => throwError(() => ({ status: 409 })),
          },
        },
        { provide: LocationLookupService, useValue: { list: () => of([]) } },
        { provide: PostalLookupService, useValue: { lookupPostalCode: () => of(null) } },
        {
          provide: GeographyDirectoryService,
          useValue: { states: () => of([]), cities: () => of([]) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: 'client-1' }) } },
        },
        { provide: Router, useValue: router },
      ],
    });

    TestBed.runInInjectionContext(() => new ClientCreatePageComponent());

    expect(router.navigate).toHaveBeenCalledWith(['/clients', 'client-1']);
  });
});

function resumedClient(): ClientDetails {
  return {
    id: 'client-1',
    firstName: 'Resume',
    middleName: 'A',
    lastName: 'Client',
    preferredName: 'R',
    dateOfBirth: '1990-01-01',
    gender: 'Female',
    pmiNumber: '12345678',
    hasSsn: true,
    insuranceProvider: 'Medical Assistance',
    email: 'resume@example.test',
    primaryPhone: '(612) 555-0100',
    secondaryPhone: null,
    intakeDate: '2026-08-15',
    socDate: '2026-09-01',
    referralSource: 'County',
    status: 'Pending',
    location: 'Main',
    locationId: 'location-1',
    supervisorUserId: null,
    isOnboarding: true,
    dischargeDate: null,
    dischargeReason: null,
    addressLine1: '100 Main St',
    addressLine2: null,
    city: 'Minneapolis',
    state: 'Minnesota',
    postalCode: '55401',
    county: 'Hennepin',
    country: 'United States',
    evvAuthorizedHoursPerWeek: 32,
    safetyMeasures: null,
    specialEquipment: null,
    allergies: null,
    otherServices: null,
    additionalProfile: {
      programType: 'Two45D',
      referralDetails: '',
      homeCareRating: '',
      medicalEquipment: '',
      pcaComplexity: '',
      demographics: '',
      smokes: null,
      isVeteran: null,
      hasPets: null,
      livingArrangement: '',
      preferredClinic: '',
      preferredHospital: '',
      preferredAmbulance: '',
      caregiverPreference: '',
      nutritionalRequirements: '',
      diet: 'Regular',
      mealSchedule: '',
      notes: 'Persisted notes',
      additionalInformation: '',
    },
    services: [
      { code: '245D', name: '245D', startDate: '2026-09-01', endDate: null, isActive: true },
    ],
    languages: [
      { languageCode: 'en', languageName: 'English', isPrimary: true },
      { languageCode: 'es', languageName: 'Spanish', isPrimary: false },
    ],
    editorVersion: 'b'.repeat(64),
  };
}
