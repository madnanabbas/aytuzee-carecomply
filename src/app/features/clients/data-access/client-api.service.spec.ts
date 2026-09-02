import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/app-config';
import {
  ClientGenderCode,
  ClientProgramTypeCode,
  ClientStatusCode,
  CreateClientRequest,
  UpdateClientRequest,
} from '../models/client-api.models';
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

  it('builds the approved server-side client list query', () => {
    api.listClients({
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
    }).subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/clients');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('Marcus');
    expect(request.request.params.get('status')).toBe('2');
    expect(request.request.params.get('programType')).toBe('3');
    expect(request.request.params.get('service')).toBe('245D');
    expect(request.request.params.get('location')).toBe('Minneapolis');
    expect(request.request.params.get('onboarding')).toBe('false');
    expect(request.request.params.get('sortBy')).toBe('socDate');
    expect(request.request.params.get('sortDirection')).toBe('desc');
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('50');
    request.flush({ items: [], pageNumber: 2, pageSize: 50, totalCount: 0 });
  });

  it('uses encoded client detail and focused write endpoints', () => {
    api.getClient('client/one').subscribe();
    const detail = http.expectOne('/api/clients/client%2Fone');
    expect(detail.request.method).toBe('GET');
    detail.flush({});

    api.changeStatus('client-1', {
      status: ClientStatusCode.Discharged,
      dischargeDate: '2026-09-01',
      dischargeReason: 'Transferred',
      editorVersion: 'v2',
    }).subscribe();
    const status = http.expectOne('/api/clients/client-1/status');
    expect(status.request.method).toBe('PUT');
    expect(status.request.body.editorVersion).toBe('v2');
    status.flush({});
  });

  it('posts and updates only the Client Core contract', () => {
    const create = createRequest();
    api.createClient(create).subscribe();
    const createHttp = http.expectOne('/api/clients');
    expect(createHttp.request.method).toBe('POST');
    expect(createHttp.request.body.pmiNumber).toBe('24591384');
    expect(createHttp.request.body.services).toHaveLength(1);
    createHttp.flush({ id: 'client-1' });

    const { status: _status, dischargeDate: _dischargeDate, dischargeReason: _dischargeReason, ...core } = create;
    const update: UpdateClientRequest = {
      ...core,
      editorVersion: 'version-1',
      serviceChangeEffectiveDate: null,
    };

    api.updateClient('client-1', update).subscribe();
    const updateHttp = http.expectOne('/api/clients/client-1');
    expect(updateHttp.request.method).toBe('PUT');
    expect(updateHttp.request.body.editorVersion).toBe('version-1');
    updateHttp.flush({});
  });
});

function createRequest(): CreateClientRequest {
  return {
    firstName: 'Marcus', middleName: null, lastName: 'Lee', preferredName: 'Marc',
    dateOfBirth: '1986-02-14', gender: ClientGenderCode.Male, pmiNumber: '24591384',
    insuranceProvider: 'Medical Assistance', email: 'marcus@example.test', primaryPhone: '6125550142', secondaryPhone: null,
    intakeDate: '2026-05-26', socDate: '2026-06-01', referralSource: 'County', status: ClientStatusCode.Active,
    location: 'Minneapolis', isOnboarding: false, dischargeDate: null, dischargeReason: null,
    addressLine1: '1240 Portland Ave', addressLine2: null, city: 'Minneapolis', state: 'MN', postalCode: '55404', county: 'Hennepin',
    evvAuthorizedHoursPerWeek: 32, safetyMeasures: null, specialEquipment: null, allergies: null, otherServices: null,
    additionalProfile: {
      programType: ClientProgramTypeCode.Two45D, referralDetails: null, homeCareRating: null, medicalEquipment: null,
      pcaComplexity: null, demographics: null, smokes: null, isVeteran: null, hasPets: null, livingArrangement: null,
      preferredClinic: null, preferredHospital: null, preferredAmbulance: null, caregiverPreference: null,
      nutritionalRequirements: null, diet: null, mealSchedule: null, notes: null,
    },
    services: [{ code: '245D', name: '245D', startDate: '2026-06-01' }],
    languages: [{ languageCode: 'en', languageName: 'English', isPrimary: true }],
  };
}
