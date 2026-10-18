import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';

export interface PayerLookup {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly editorVersion: string;
}

@Injectable({ providedIn: 'root' })
export class PayerLookupService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/payers`;

  list(includeInactive = false): Observable<readonly PayerLookup[]> {
    const params = includeInactive ? new HttpParams().set('includeInactive', true) : undefined;
    return this.http.get<readonly PayerLookup[]>(this.base, { params });
  }
}
