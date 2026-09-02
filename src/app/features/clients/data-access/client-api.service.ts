import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';
import {
  ChangeClientStatusRequest,
  ClientDetails,
  ClientListQuery,
  ClientListResponse,
  CreateClientRequest,
  CreateClientResponse,
  UpdateClientRequest,
} from '../models/client-api.models';

@Injectable({ providedIn: 'root' })
export class ClientApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listClients(query: ClientListQuery): Observable<ClientListResponse> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);

    if (query.search) params = params.set('search', query.search);
    if (query.status !== null) params = params.set('status', query.status);
    if (query.programType !== null) params = params.set('programType', query.programType);
    if (query.service) params = params.set('serviceCode', query.service);
    if (query.location) params = params.set('location', query.location);
    if (query.onboarding !== null) params = params.set('isOnboarding', query.onboarding);

    return this.http.get<ClientListResponse>(this.clientsUrl(), { params });
  }

  getClient(clientId: string): Observable<ClientDetails> {
    return this.http.get<ClientDetails>(`${this.clientsUrl()}/${encodeURIComponent(clientId)}`);
  }

  createClient(request: CreateClientRequest): Observable<CreateClientResponse> {
    return this.http.post<CreateClientResponse>(this.clientsUrl(), request);
  }

  updateClient(clientId: string, request: UpdateClientRequest): Observable<ClientDetails> {
    return this.http.put<ClientDetails>(
      `${this.clientsUrl()}/${encodeURIComponent(clientId)}`,
      request,
    );
  }

  changeStatus(
    clientId: string,
    request: ChangeClientStatusRequest,
  ): Observable<ClientDetails> {
    return this.http.put<ClientDetails>(
      `${this.clientsUrl()}/${encodeURIComponent(clientId)}/status`,
      request,
    );
  }

  private clientsUrl(): string {
    return `${this.apiBaseUrl}/clients`;
  }
}
