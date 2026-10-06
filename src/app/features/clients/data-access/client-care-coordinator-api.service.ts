import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';

export interface CareCoordinator {
  readonly id: string;
  readonly name: string;
  readonly companyName: string;
  readonly phone: string;
  readonly phoneExtension: string;
  readonly fax: string;
  readonly email: string;
  readonly isActive: boolean;
}

export type SaveCareCoordinator = Omit<CareCoordinator, 'id'>;

@Injectable({ providedIn: 'root' })
export class ClientCareCoordinatorApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(clientId: string): Observable<readonly CareCoordinator[]> {
    return this.http.get<readonly CareCoordinator[]>(this.url(clientId));
  }

  create(clientId: string, request: SaveCareCoordinator): Observable<CareCoordinator> {
    return this.http.post<CareCoordinator>(this.url(clientId), request);
  }

  update(
    clientId: string,
    coordinatorId: string,
    request: SaveCareCoordinator,
  ): Observable<CareCoordinator> {
    return this.http.put<CareCoordinator>(
      `${this.url(clientId)}/${encodeURIComponent(coordinatorId)}`,
      request,
    );
  }

  private url(clientId: string): string {
    return `${this.base}/clients/${encodeURIComponent(clientId)}/care-coordinators`;
  }
}
