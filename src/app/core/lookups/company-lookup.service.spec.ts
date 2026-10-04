import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import { CompanyLookupService } from './company-lookup.service';

describe('CompanyLookupService', () => {
  let api: CompanyLookupService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });

    api = TestBed.inject(CompanyLookupService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads companies from the existing endpoint', () => {
    api.list().subscribe();

    const request = http.expectOne('/api/companies');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
