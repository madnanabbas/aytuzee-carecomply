import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { POSTAL_LOOKUP_BASE_URL } from '../../../core/config/app-config';
import { PostalLookupService } from './postal-lookup.service';

describe('PostalLookupService', () => {
  let service: PostalLookupService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: POSTAL_LOOKUP_BASE_URL, useValue: 'https://postal.example.test' },
      ],
    });
    service = TestBed.inject(PostalLookupService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps the primary place returned for a US ZIP code', () => {
    let result: unknown;
    service.lookupPostalCode('US', '55404-1234').subscribe((value) => (result = value));

    http.expectOne('https://postal.example.test/us/55404').flush({
      country: 'United States',
      'country abbreviation': 'US',
      places: [{ 'place name': 'Minneapolis', state: 'Minnesota', 'state abbreviation': 'MN' }],
    });

    expect(result).toEqual({
      city: 'Minneapolis',
      state: 'Minnesota',
      country: 'United States',
      countryCode: 'US',
      area: null,
    });
  });
});
