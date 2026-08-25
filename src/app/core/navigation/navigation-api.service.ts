import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class NavigationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getNavigation(): Observable<unknown> {
    return this.http.get<unknown>(`${this.apiBaseUrl}/navigation`);
  }
}
