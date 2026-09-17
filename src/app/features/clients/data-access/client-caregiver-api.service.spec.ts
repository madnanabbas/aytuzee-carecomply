import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/app-config';
import { ClientCaregiverApiService } from './client-caregiver-api.service';

describe('ClientCaregiverApiService', () => {
  let service: ClientCaregiverApiService;
  let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }] }); service = TestBed.inject(ClientCaregiverApiService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());

  it('uses nested client caregiver endpoints', () => {
    service.list('client 1').subscribe();
    expect(http.expectOne('/api/clients/client%201/caregivers').request.method).toBe('GET');
    service.candidates('client 1').subscribe();
    expect(http.expectOne('/api/clients/client%201/caregivers/candidates').request.method).toBe('GET');
  });

  it('sends assignment mutations with concurrency data', () => {
    const request = { userId: 'u1', type: 'Primary' as const, isPreferred: true, services: null, startDate: '2026-09-04', endDate: null, notes: null, relationshipToClient: 'Professional caregiver', livesWithClient: false };
    service.create('c1', request).subscribe(); expect(http.expectOne('/api/clients/c1/caregivers').request.method).toBe('POST');
    service.update('c1', 'a1', { ...request, editorVersion: 'V' }).subscribe(); expect(http.expectOne('/api/clients/c1/caregivers/a1').request.method).toBe('PUT');
  });
});
