import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';

export interface ResponsibleParty {
  readonly id: string;
  readonly name: string;
  readonly firstName: string | null;
  readonly middleName: string | null;
  readonly lastName: string | null;
  readonly relationship: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly livesWithClient: boolean | null;
  readonly hasSpenddown: boolean | null;
  readonly isActive: boolean;
}

export type SaveResponsibleParty = Omit<ResponsibleParty, 'id'>;

@Injectable({ providedIn: 'root' })
export class ClientResponsiblePartyApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(clientId: string): Observable<readonly ResponsibleParty[]> {
    return this.http.get<readonly ResponsibleParty[]>(this.url(clientId));
  }

  create(clientId: string, request: SaveResponsibleParty): Observable<ResponsibleParty> {
    return this.http.post<ResponsibleParty>(this.url(clientId), request);
  }

  update(
    clientId: string,
    partyId: string,
    request: SaveResponsibleParty,
  ): Observable<ResponsibleParty> {
    return this.http.put<ResponsibleParty>(
      `${this.url(clientId)}/${encodeURIComponent(partyId)}`,
      request,
    );
  }

  private url(clientId: string): string {
    return `${this.base}/clients/${encodeURIComponent(clientId)}/responsible-parties`;
  }
}
