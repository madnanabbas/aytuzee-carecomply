import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import { LocationLookupService } from './location-lookup.service';

describe('LocationLookupService', () => {
  let api: LocationLookupService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });

    api = TestBed.inject(LocationLookupService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads locations from the existing endpoint', () => {
    api.list().subscribe();

    const request = http.expectOne('/api/locations');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('preserves company-dependent location filtering', () => {
    api.list('company-1').subscribe();

    const request = http.expectOne('/api/locations?companyId=company-1');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
