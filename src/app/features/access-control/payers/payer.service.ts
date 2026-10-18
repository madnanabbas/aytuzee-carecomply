import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';
import { PayerLookup, PayerLookupService } from '../../../core/lookups/payer-lookup.service';

export type Payer = PayerLookup;

@Injectable({ providedIn: 'root' })
export class PayerService {
  private readonly http = inject(HttpClient);
  private readonly lookup = inject(PayerLookupService);
  private readonly base = `${inject(API_BASE_URL)}/payers`;

  list(): Observable<readonly Payer[]> {
    return this.lookup.list(true);
  }

  create(name: string): Observable<Payer> {
    return this.http.post<Payer>(this.base, { name });
  }

  update(payer: Payer, name: string, isActive: boolean): Observable<Payer> {
    return this.http.put<Payer>(`${this.base}/${encodeURIComponent(payer.id)}`, {
      name,
      isActive,
      editorVersion: payer.editorVersion,
    });
  }
}
