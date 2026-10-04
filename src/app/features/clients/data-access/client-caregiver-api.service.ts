import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';
import {
  ClientCaregiver,
  ClientCaregiverCandidate,
  SaveClientCaregiverRequest,
} from '../models/client-caregiver.models';

@Injectable({ providedIn: 'root' })
export class ClientCaregiverApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  list(clientId: string): Observable<readonly ClientCaregiver[]> {
    return this.http.get<readonly ClientCaregiver[]>(this.url(clientId));
  }
  candidates(clientId: string): Observable<readonly ClientCaregiverCandidate[]> {
    return this.http.get<readonly ClientCaregiverCandidate[]>(`${this.url(clientId)}/candidates`);
  }
  create(clientId: string, request: SaveClientCaregiverRequest): Observable<ClientCaregiver> {
    return this.http.post<ClientCaregiver>(this.url(clientId), request);
  }
  update(
    clientId: string,
    id: string,
    request: SaveClientCaregiverRequest,
  ): Observable<ClientCaregiver> {
    return this.http.put<ClientCaregiver>(
      `${this.url(clientId)}/${encodeURIComponent(id)}`,
      request,
    );
  }
  end(clientId: string, value: ClientCaregiver, endDate: string): Observable<ClientCaregiver> {
    return this.http.post<ClientCaregiver>(
      `${this.url(clientId)}/${encodeURIComponent(value.id)}/end`,
      { endDate, editorVersion: value.editorVersion },
    );
  }
  private url(clientId: string): string {
    return `${this.base}/clients/${encodeURIComponent(clientId)}/caregivers`;
  }
}
