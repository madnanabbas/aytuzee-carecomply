import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';

export interface CompanyLocation {
  readonly id: string;
  readonly companyId: string;
  readonly name: string;
  readonly isMain: boolean;
  readonly isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(companyId?: string | null): Observable<readonly CompanyLocation[]> {
    const params = companyId ? new HttpParams().set('companyId', companyId) : undefined;
    return this.http.get<readonly CompanyLocation[]>(`${this.apiBaseUrl}/locations`, { params });
  }
}
