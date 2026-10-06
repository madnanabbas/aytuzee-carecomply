import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/app-config';
import { EmployeeApiService } from './employee-api.service';

describe('EmployeeApiService', () => {
  let api: EmployeeApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(EmployeeApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends search and paging to the server', () => {
    let totalCount = 0;
    api.list('Taylor', 2, 50).subscribe((response) => (totalCount = response.totalCount));

    const request = http.expectOne((candidate) => candidate.url === '/api/employees');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('Taylor');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('50');
    request.flush({ items: [], pageNumber: 2, pageSize: 50, totalCount: 75, totalPages: 2 });
    expect(totalCount).toBe(75);
  });
});
