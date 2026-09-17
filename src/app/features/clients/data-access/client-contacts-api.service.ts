import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';

export type ClientContactType = 'General' | 'Emergency';

export interface ClientContact {
  readonly id: string;
  readonly type: ClientContactType;
  readonly name: string;
  readonly relationship: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly isActive: boolean;
}

export type SaveClientContact = Omit<ClientContact, 'id'>;

@Injectable({ providedIn: 'root' })
export class ClientContactsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(clientId: string): Observable<readonly ClientContact[]> {
    return this.http.get<readonly ClientContact[]>(this.url(clientId));
  }

  create(clientId: string, request: SaveClientContact): Observable<ClientContact> {
    return this.http.post<ClientContact>(this.url(clientId), request);
  }

  update(clientId: string, contactId: string, request: SaveClientContact): Observable<ClientContact> {
    return this.http.put<ClientContact>(`${this.url(clientId)}/${encodeURIComponent(contactId)}`, request);
  }

  private url(clientId: string): string {
    return `${this.base}/clients/${encodeURIComponent(clientId)}/contacts`;
  }
}
