import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/app-config';
import {
  CLIENT_INTAKE_TOKEN_HEADER,
  PublicClientIntakeApiService,
} from './public-client-intake-api.service';

describe('PublicClientIntakeApiService', () => {
  it('sends the invitation token only to the one-time redemption endpoint', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    const api = TestBed.inject(PublicClientIntakeApiService);
    const http = TestBed.inject(HttpTestingController);
    const token = 'sensitive-token';

    api.redeem(token).subscribe();

    const request = http.expectOne('/api/public/client-intake/redeem');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get(CLIENT_INTAKE_TOKEN_HEADER)).toBe(token);
    expect(request.request.urlWithParams).not.toContain(token);
    expect(request.request.body).toBeNull();
    expect(request.request.withCredentials).toBe(false);
    request.flush({
      state: 'Ready',
      clientDisplayName: 'Guest Client',
      expiresAtUtc: '2026-10-01T00:00:00Z',
      hasCreatedClient: false,
    });
    http.verify();
  });

  it('uses the guest cookie for Step 1 lookups and never reuses the invitation token', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    const api = TestBed.inject(PublicClientIntakeApiService);
    const http = TestBed.inject(HttpTestingController);

    api.locations('secret').subscribe();
    const request = http.expectOne('/api/public/client-intake/locations');
    expect(request.request.headers.has(CLIENT_INTAKE_TOKEN_HEADER)).toBe(false);
    expect(request.request.urlWithParams).not.toContain('secret');
    expect(request.request.urlWithParams).not.toContain('company');
    request.flush({ state: 'Ready', locations: [] });
    http.verify();
  });

  it('uses the token header for Step 2 GET and PUT without exposing it in URL or body', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    const api = TestBed.inject(PublicClientIntakeApiService);
    const http = TestBed.inject(HttpTestingController);
    api.additionalInformation('step-two-secret').subscribe();
    const get = http.expectOne('/api/public/client-intake/additional-information');
    expect(get.request.headers.has(CLIENT_INTAKE_TOKEN_HEADER)).toBe(false);
    expect(get.request.urlWithParams).not.toContain('step-two-secret');
    get.flush({ additionalInformation: {}, editorVersion: 'v1', creationProgressStep: 2 });

    const body = { additionalInformation: { programType: 'None' }, editorVersion: 'v1' } as never;
    api.updateAdditionalInformation('step-two-secret', body).subscribe();
    const put = http.expectOne('/api/public/client-intake/additional-information');
    expect(put.request.method).toBe('PUT');
    expect(put.request.headers.has(CLIENT_INTAKE_TOKEN_HEADER)).toBe(false);
    expect(JSON.stringify(put.request.body)).not.toContain('step-two-secret');
    expect(put.request.body).not.toHaveProperty('clientId');
    expect(put.request.body).not.toHaveProperty('companyId');
    put.flush({ editorVersion: 'v2', nextStep: 3 });
    http.verify();
  });

  it('uses the token header for Step 3 GET and PUT without exposing tenant identifiers', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    const api = TestBed.inject(PublicClientIntakeApiService);
    const http = TestBed.inject(HttpTestingController);

    api.contactInformation('step-three-secret').subscribe();
    const get = http.expectOne('/api/public/client-intake/contact-information');
    expect(get.request.method).toBe('GET');
    expect(get.request.headers.has(CLIENT_INTAKE_TOKEN_HEADER)).toBe(false);
    expect(get.request.urlWithParams).not.toContain('step-three-secret');
    get.flush({ contactInformation: {}, editorVersion: 'v2', creationProgressStep: 3 });

    const body = {
      contactInformation: {
        email: 'guest@example.test',
        primaryPhone: '(612) 555-0100',
        preferredLanguages: [{ languageCode: 'en', languageName: 'English', isPrimary: true }],
      },
      editorVersion: 'v2',
    } as never;
    api.updateContactInformation('step-three-secret', body).subscribe();
    const put = http.expectOne('/api/public/client-intake/contact-information');
    expect(put.request.method).toBe('PUT');
    expect(put.request.headers.has(CLIENT_INTAKE_TOKEN_HEADER)).toBe(false);
    expect(put.request.urlWithParams).not.toContain('step-three-secret');
    expect(JSON.stringify(put.request.body)).not.toContain('step-three-secret');
    expect(put.request.body).not.toHaveProperty('clientId');
    expect(put.request.body).not.toHaveProperty('companyId');
    put.flush({ editorVersion: 'v3', nextStep: 4 });
    http.verify();
  });

  it('uses only the token header and child assignment id for all Step 4 operations', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    const api = TestBed.inject(PublicClientIntakeApiService);
    const http = TestBed.inject(HttpTestingController);
    const token = 'step-four-secret';
    const body = {
      caregiverUserId: 'caregiver-1',
      assignmentType: 'Primary' as const,
      clientPreference: true,
      assignedServices: 'PCA',
      startDate: '2026-09-30',
      endDate: null,
      relationship: 'Friend',
      livesWithClient: false,
      notes: '',
    };

    api.caregiverCandidates(token).subscribe();
    api.caregivers(token).subscribe();
    api.createCaregiver(token, body).subscribe();
    api.updateCaregiver(token, 'assignment/1', { ...body, editorVersion: 'v1' }).subscribe();
    api.endCaregiver(token, 'assignment/1', '2026-09-30', 'v2').subscribe();
    api.continueCaregivers(token).subscribe();

    const requests = http.match(() => true);
    expect(requests).toHaveLength(6);
    for (const request of requests) {
      expect(request.request.headers.has(CLIENT_INTAKE_TOKEN_HEADER)).toBe(false);
      expect(request.request.urlWithParams).not.toContain(token);
      expect(request.request.body ?? {}).not.toHaveProperty('clientId');
      expect(request.request.body ?? {}).not.toHaveProperty('companyId');
      expect(request.request.body ?? {}).not.toHaveProperty('locationId');
      request.flush(request.request.method === 'GET' ? [] : {});
    }
    expect(requests[3].request.url).toContain('assignment%2F1');
    expect(requests[4].request.url).toContain('assignment%2F1/end');
    http.verify();
  });

  it('uses token-only public routes for Step 5 and sends no tenant identifiers', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    const api = TestBed.inject(PublicClientIntakeApiService);
    const http = TestBed.inject(HttpTestingController);
    const token = 'step-five-secret';
    const body = {
      type: 'General' as const,
      name: 'Contact',
      relationship: 'Friend',
      phone: '(612) 555-0100',
      email: null,
      address: null,
      isActive: true,
    };
    api.contacts(token).subscribe();
    api.createContact(token, body).subscribe();
    api.updateContact(token, 'contact/1', body).subscribe();
    api.continueContacts(token).subscribe();
    const requests = http.match(() => true);
    expect(requests).toHaveLength(4);
    for (const request of requests) {
      expect(request.request.headers.has(CLIENT_INTAKE_TOKEN_HEADER)).toBe(false);
      expect(request.request.urlWithParams).not.toContain(token);
      expect(request.request.body ?? {}).not.toHaveProperty('clientId');
      expect(request.request.body ?? {}).not.toHaveProperty('companyId');
      request.flush(
        request.request.method === 'GET' ? { contacts: [], creationProgressStep: 5 } : {},
      );
    }
    expect(requests[2].request.url).toContain('contact%2F1');
    http.verify();
  });

  it('completes intake without exposing or reusing the invitation token', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    const api = TestBed.inject(PublicClientIntakeApiService);
    const http = TestBed.inject(HttpTestingController);
    const token = 'completion-secret';
    api.complete(token).subscribe();
    const request = http.expectOne('/api/public/client-intake/complete');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has(CLIENT_INTAKE_TOKEN_HEADER)).toBe(false);
    expect(request.request.urlWithParams).not.toContain(token);
    expect(request.request.body).toBeNull();
    request.flush({
      state: 'Completed',
      completedAtUtc: '2026-10-01T10:00:00Z',
      message: 'Client intake completed successfully.',
    });
    http.verify();
  });
});
