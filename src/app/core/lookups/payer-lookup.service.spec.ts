import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import { PayerLookupService } from './payer-lookup.service';

describe('PayerLookupService', () => {
  let service: PayerLookupService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(PayerLookupService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads active payers by default and supports maintenance including inactive payers', () => {
    service.list().subscribe();
    http.expectOne('/api/payers').flush([]);
    service.list(true).subscribe();
    http.expectOne('/api/payers?includeInactive=true').flush([]);
  });
});
