import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';

export type ClinicalContactKind = 'consultation-providers' | 'physicians';

export interface ClinicalContact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly secondaryName: string;
  readonly secondaryPhone: string;
  readonly secondaryAddress: string;
  readonly npi: string;
  readonly fax: string;
  readonly address: string;
  readonly postalCode: string;
  readonly city: string;
  readonly state: string;
  readonly isActive: boolean;
}

export interface ConsultationProviderInput {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly supportProviderName: string;
  readonly supportProviderPhone: string;
  readonly supportProviderAddress: string;
  readonly isActive: boolean;
}

export interface PhysicianInput {
  readonly name: string;
  readonly npi: string;
  readonly phone: string;
  readonly fax: string;
  readonly address: string;
  readonly postalCode: string;
  readonly city: string;
  readonly state: string;
  readonly isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClientClinicalContactsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(clientId: string, kind: ClinicalContactKind): Observable<readonly ClinicalContact[]> {
    return this.http.get<readonly ClinicalContact[]>(this.url(clientId, kind));
  }

  create(clientId: string, kind: ClinicalContactKind, request: ConsultationProviderInput | PhysicianInput): Observable<ClinicalContact> {
    return this.http.post<ClinicalContact>(this.url(clientId, kind), request);
  }

  update(clientId: string, kind: ClinicalContactKind, contactId: string, request: ConsultationProviderInput | PhysicianInput): Observable<ClinicalContact> {
    return this.http.put<ClinicalContact>(`${this.url(clientId, kind)}/${encodeURIComponent(contactId)}`, request);
  }

  private url(clientId: string, kind: ClinicalContactKind): string {
    return `${this.base}/clients/${encodeURIComponent(clientId)}/${kind}`;
  }
}
