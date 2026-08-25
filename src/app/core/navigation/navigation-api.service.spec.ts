import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import { NavigationApiService } from './navigation-api.service';

describe('NavigationApiService', () => {
  it('loads navigation through injectable runtime API configuration', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    const api = TestBed.inject(NavigationApiService);
    const http = TestBed.inject(HttpTestingController);

    api.getNavigation().subscribe();

    const request = http.expectOne('/api/navigation');
    expect(request.request.method).toBe('GET');
    request.flush([]);
    http.verify();
  });
});
