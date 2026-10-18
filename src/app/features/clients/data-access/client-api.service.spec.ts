import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/app-config';
import {
  ClientGenderCode,
  ClientListResponse,
  ClientProgramTypeCode,
  ClientStatusCode,
  CreateClientRequest,
  UpdateClientRequest,
} from '../models/client-api.models';
import { CreateClientServiceAgreementRequest } from '../models/client-service-agreement.models';
import { ClientApiService } from './client-api.service';

describe('ClientApiService', () => {
  let api: ClientApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(ClientApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests only supervisor candidates at the selected location', () => {
    let names: string[] = [];
    api.supervisorCandidates('location-1').subscribe((staff) => {
      names = staff.map((person) => person.name);
    });
    const request = http.expectOne('/api/clients/supervisor-candidates?locationId=location-1');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'employee-1', name: 'Alex Smith', jobTitle: 'RN' }]);
    expect(names).toEqual(['Alex Smith']);
  });

  it('builds the approved server-side client list query', () => {
    let result: ClientListResponse | undefined;
    api
      .listClients({
        search: 'Marcus',
        status: ClientStatusCode.Active,
        programType: ClientProgramTypeCode.Two45D,
        service: '245D',
        location: 'Minneapolis',
        onboarding: false,
        sortBy: 'socDate',
        sortDirection: 'desc',
        pageNumber: 2,
        pageSize: 50,
      })
      .subscribe((response) => {
        result = response;
      });

    const request = http.expectOne((candidate) => candidate.url === '/api/clients');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('Marcus');
    expect(request.request.params.get('status')).toBe('2');
    expect(request.request.params.get('programType')).toBe('3');
    expect(request.request.params.get('serviceCode')).toBe('245D');
    expect(request.request.params.get('location')).toBe('Minneapolis');
    expect(request.request.params.get('isOnboarding')).toBe('false');
    expect(request.request.params.get('sortBy')).toBe('socDate');
    expect(request.request.params.get('sortDirection')).toBe('desc');
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('50');
    request.flush({
      items: [
        {
          id: 'client-1',
          displayName: 'Marcus Lee',
          preferredName: 'Marc',
          pmiNumber: '24591384',
          dateOfBirth: '1986-02-14',
          gender: 'Male',
          status: 'Active',
          location: 'Minneapolis',
          socDate: '2026-06-01',
          isOnboarding: false,
          programType: 'Two45D',
          updatedAtUtc: '2026-09-02T00:00:00Z',
          services: [
            {
              id: 'service-1',
              code: '245D',
              name: '245D',
              startDate: '2026-06-01',
              endDate: null,
              isActive: true,
            },
          ],
        },
      ],
      pageNumber: 2,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
    });
    expect(result?.items[0].displayName).toBe('Marcus Lee');
    expect(result?.items[0].services[0].name).toBe('245D');
  });

  it('uses encoded client detail and focused write endpoints', () => {
    let clientName: string | undefined;
    let supervisorName: string | null | undefined;
    api.getClient('client/one').subscribe((client) => {
      clientName = client.firstName;
      supervisorName = client.supervisorName;
    });
    const detail = http.expectOne('/api/clients/client%2Fone');
    expect(detail.request.method).toBe('GET');
    detail.flush(clientDetailsResponse());
    expect(clientName).toBe('Marcus');
    expect(supervisorName).toBe('Nora Nurse');

    let revealedSsn: string | undefined;
    api.revealClientSsn('client/one').subscribe((response) => {
      revealedSsn = response.ssn;
    });
    const reveal = http.expectOne('/api/clients/client%2Fone/ssn');
    expect(reveal.request.method).toBe('GET');
    reveal.flush({ ssn: '123-45-6789' });
    expect(revealedSsn).toBe('123-45-6789');

    let changedClientName: string | undefined;
    api
      .changeStatus('client-1', {
        status: ClientStatusCode.Discharged,
        dischargeDate: '2026-09-01',
        dischargeReason: 'Transferred',
        editorVersion: 'v2',
      })
      .subscribe((client) => {
        changedClientName = client.firstName;
      });
    const status = http.expectOne('/api/clients/client-1/status');
    expect(status.request.method).toBe('PUT');
    expect(status.request.body.editorVersion).toBe('v2');
    status.flush(clientDetailsResponse());
    expect(changedClientName).toBe('Marcus');
  });

  it('posts and updates only the Client Core contract', () => {
    const create = createRequest();
    api.createClient(create).subscribe();
    const createHttp = http.expectOne('/api/clients');
    expect(createHttp.request.method).toBe('POST');
    expect(createHttp.request.body.identity.pmiNumber).toBe('24591384');
    expect(createHttp.request.body.identity.gender).toBe('Male');
    expect(createHttp.request.body.additionalProfile.programType).toBe('Two45D');
    expect(createHttp.request.body.initialStatus).toBe('Active');
    expect(createHttp.request.body.services).toHaveLength(1);
    createHttp.flush({ id: 'client-1' });

    const update: UpdateClientRequest = {
      ...legacyWriteRequest(),
      editorVersion: 'version-1',
      serviceChangeEffectiveDate: null,
    };

    let updatedClientName: string | undefined;
    api.updateClient('client-1', update).subscribe((client) => {
      updatedClientName = client.firstName;
    });
    const updateHttp = http.expectOne('/api/clients/client-1');
    expect(updateHttp.request.method).toBe('PUT');
    expect(updateHttp.request.body.editorVersion).toBe('version-1');
    updateHttp.flush(clientDetailsResponse());
    expect(updatedClientName).toBe('Marcus');
  });

  it('posts Step-1 basic details to the focused creation endpoint', () => {
    const full = createRequest();
    api
      .createClientBasicDetails({
        identity: full.identity,
        careSetup: full.careSetup,
        insuranceProvider: full.contact.insuranceProvider,
        services: full.services,
      })
      .subscribe();

    const request = http.expectOne('/api/clients/basic-details');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.identity.pmiNumber).toBe('24591384');
    expect(request.request.body.contact).toBeUndefined();
    expect(request.request.body.additionalProfile).toBeUndefined();
    expect(request.request.body.languages).toBeUndefined();
    request.flush({ id: 'client-1', editorVersion: 'version-1' });
  });

  it('uses the focused G-Link generation and send contracts', () => {
    api
      .createGuestInvitation({
        clientName: 'Jamie Client',
        email: 'jamie@example.test',
        mobileNumber: null,
      })
      .subscribe();
    const create = http.expectOne('/api/clients/guest-invitations');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({
      clientName: 'Jamie Client',
      email: 'jamie@example.test',
      mobileNumber: null,
    });
    create.flush({
      invitationId: 'invitation-1',
      guestLink: 'https://example.test/client-intake#token=abc',
      expiresAtUtc: '2026-10-07T00:00:00Z',
    });

    api.sendGuestInvitation('invitation/1', 'raw-token').subscribe();
    const send = http.expectOne('/api/clients/guest-invitations/invitation%2F1/send');
    expect(send.request.method).toBe('POST');
    expect(send.request.body).toEqual({ token: 'raw-token' });
    send.flush({
      invitationId: 'invitation/1',
      sentAtUtc: '2026-09-30T00:00:00Z',
      expiresAtUtc: '2026-10-07T00:00:00Z',
    });
  });

  it('uses the focused service-agreement endpoints and preserves update concurrency data', () => {
    api.listClientServiceAgreements('client/1').subscribe();
    const list = http.expectOne('/api/clients/client%2F1/service-agreements');
    expect(list.request.method).toBe('GET');
    list.flush([]);

    api.getClientServiceAgreement('client/1', 'agreement/1').subscribe();
    const get = http.expectOne('/api/clients/client%2F1/service-agreements/agreement%2F1');
    expect(get.request.method).toBe('GET');
    get.flush(serviceAgreementResponse());

    const createRequest: CreateClientServiceAgreementRequest = {
      agreementNumber: 'AGR-1',
      payerName: 'County',
      insuredMemberId: null,
      priorAuthorizationNumber: null,
      startDate: '2026-10-01',
      endDate: null,
      status: 'Active',
      priority: 'High',
      isDummy: false,
      notes: null,
      lines: [
        {
          serviceCode: 'SVC',
          serviceName: 'Service',
          unitType: 'Hour',
          minutesPerUnit: 60,
          authorizedUnits: 10,
          ratePerUnit: 20,
          startDate: '2026-10-01',
          endDate: null,
          rateEffectiveFrom: null,
          rateEffectiveTo: null,
          authorizedBudgetAmount: 200,
          plannedHoursPerVisit: 2,
          plannedVisitsPerWeek: 3,
          diagnoses: [],
        },
      ],
    };
    api.createClientServiceAgreement('client-1', createRequest).subscribe();
    const create = http.expectOne('/api/clients/client-1/service-agreements');
    expect(create.request.method).toBe('POST');
    expect(create.request.body.lines).toHaveLength(1);
    create.flush(serviceAgreementResponse());

    api
      .updateClientServiceAgreement('client-1', 'agreement-1', {
        ...createRequest,
        editorVersion: 'version-1',
        lines: [{ ...createRequest.lines[0], id: 'line-1' }],
      })
      .subscribe();
    const update = http.expectOne('/api/clients/client-1/service-agreements/agreement-1');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body.editorVersion).toBe('version-1');
    expect(update.request.body.lines[0].id).toBe('line-1');
    update.flush(serviceAgreementResponse());
  });
});

function serviceAgreementResponse() {
  return {
    id: 'agreement-1',
    agreementNumber: 'AGR-1',
    payerName: 'County',
    insuredMemberId: null,
    priorAuthorizationNumber: null,
    startDate: '2026-10-01',
    endDate: null,
    status: 'Active',
    priority: 'High',
    isDummy: false,
    notes: null,
    editorVersion: 'version-1',
    lines: [
      {
        id: 'line-1',
        serviceCode: 'SVC',
        serviceName: 'Service',
        unitType: 'Hour',
        minutesPerUnit: 60,
        authorizedUnits: 10,
        ratePerUnit: 20,
        startDate: '2026-10-01',
        endDate: null,
        rateEffectiveFrom: null,
        rateEffectiveTo: null,
        authorizedBudgetAmount: 200,
        plannedHoursPerVisit: 2,
        plannedVisitsPerWeek: 3,
        diagnoses: [],
        estimatedBudget: 200,
        plannedHoursPerWeek: 6,
        plannedUnitsPerWeek: 6,
      },
    ],
  };
}

function createRequest(): CreateClientRequest {
  return {
    identity: {
      firstName: 'Marcus',
      middleName: null,
      lastName: 'Lee',
      preferredName: 'Marc',
      dateOfBirth: '1986-02-14',
      gender: 'Male',
      pmiNumber: '24591384',
    },
    contact: {
      insuranceProvider: 'Medical Assistance',
      email: 'marcus@example.test',
      primaryPhone: '6125550142',
      secondaryPhone: null,
      addressLine1: '1240 Portland Ave',
      addressLine2: null,
      city: 'Minneapolis',
      state: 'MN',
      postalCode: '55404',
      county: 'Hennepin',
      country: 'United States',
    },
    careSetup: {
      intakeDate: '2026-05-26',
      socDate: '2026-06-01',
      referralSource: 'County',
      location: 'Minneapolis',
      isOnboarding: false,
      evvAuthorizedHoursPerWeek: 32,
    },
    safety: { safetyMeasures: null, specialEquipment: null, allergies: null, otherServices: null },
    additionalProfile: {
      programType: 'Two45D',
      referralDetails: null,
      homeCareRating: null,
      medicalEquipment: null,
      pcaComplexity: null,
      demographics: null,
      smokes: null,
      isVeteran: null,
      hasPets: null,
      livingArrangement: null,
      preferredClinic: null,
      preferredHospital: null,
      preferredAmbulance: null,
      caregiverPreference: null,
      nutritionalRequirements: null,
      diet: null,
      mealSchedule: null,
      notes: null,
      additionalInformation: null,
    },
    initialStatus: 'Active',
    dischargeDate: null,
    dischargeReason: null,
    services: [{ code: '245D', name: '245D' }],
    languages: [{ languageCode: 'en', languageName: 'English', isPrimary: true }],
  };
}

function clientDetailsResponse() {
  return {
    id: 'client-1',
    identity: {
      firstName: 'Marcus',
      middleName: '',
      lastName: 'Lee',
      preferredName: 'Marc',
      dateOfBirth: '1986-02-14',
      gender: 'Male',
      pmiNumber: '24591384',
      hasSsn: false,
    },
    contact: {
      insuranceProvider: '',
      email: 'marcus@example.test',
      primaryPhone: '(612) 555-0142',
      secondaryPhone: '',
      addressLine1: '1240 Portland Ave',
      addressLine2: '',
      city: 'Minneapolis',
      state: 'MN',
      postalCode: '55404',
      county: 'Hennepin',
      country: 'United States',
    },
    careSetup: {
      intakeDate: '2026-05-26',
      socDate: '2026-06-01',
      referralSource: 'County',
      status: 'Active',
      location: 'Minneapolis',
      locationId: 'location-1',
      supervisorUserId: 'supervisor-1',
      supervisorName: 'Nora Nurse',
      isOnboarding: false,
      evvAuthorizedHoursPerWeek: 32,
      dischargeDate: null,
      dischargeReason: '',
    },
    safety: { safetyMeasures: '', specialEquipment: '', allergies: '', otherServices: '' },
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
      diet: '',
      mealSchedule: '',
      notes: '',
      additionalInformation: '',
    },
    services: [],
    languages: [],
    editorVersion: 'version-1',
  };
}

function legacyWriteRequest(): Omit<
  UpdateClientRequest,
  'editorVersion' | 'serviceChangeEffectiveDate'
> {
  return {
    identity: {
      firstName: 'Marcus',
      middleName: null,
      lastName: 'Lee',
      preferredName: 'Marc',
      dateOfBirth: '1986-02-14',
      gender: 'Male',
      pmiNumber: '24591384',
      ssn: null,
    },
    contact: {
      insuranceProvider: 'Medical Assistance',
      email: 'marcus@example.test',
      primaryPhone: '(612) 555-0142',
      secondaryPhone: null,
      addressLine1: '1240 Portland Ave',
      addressLine2: null,
      city: 'Minneapolis',
      state: 'MN',
      postalCode: '55404',
      county: 'Hennepin',
      country: 'United States',
    },
    careSetup: {
      intakeDate: '2026-05-26',
      socDate: '2026-06-01',
      referralSource: 'County',
      location: 'Minneapolis',
      isOnboarding: false,
      evvAuthorizedHoursPerWeek: 32,
    },
    safety: { safetyMeasures: null, specialEquipment: null, allergies: null, otherServices: null },
    additionalProfile: {
      programType: 'Two45D',
      referralDetails: null,
      homeCareRating: null,
      medicalEquipment: null,
      pcaComplexity: null,
      demographics: null,
      smokes: null,
      isVeteran: null,
      hasPets: null,
      livingArrangement: null,
      preferredClinic: null,
      preferredHospital: null,
      preferredAmbulance: null,
      caregiverPreference: null,
      nutritionalRequirements: null,
      diet: null,
      mealSchedule: null,
      notes: null,
      additionalInformation: null,
    },
    services: [{ code: '245D', name: '245D' }],
    languages: [{ languageCode: 'en', languageName: 'English', isPrimary: true }],
  };
}
