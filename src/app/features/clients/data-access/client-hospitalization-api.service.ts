import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';
import {
  ClientHospitalization,
  SaveClientHospitalization,
} from '../models/client-hospitalization.models';
@Injectable({ providedIn: 'root' })
export class ClientHospitalizationApiService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);
  list(clientId: string): Observable<ClientHospitalization[]> {
    return this.http.get<ClientHospitalization[]>(
      `${this.base}/clients/${clientId}/hospitalizations`,
    );
  }
  create(clientId: string, x: SaveClientHospitalization) {
    return this.http.post<ClientHospitalization>(
      `${this.base}/clients/${clientId}/hospitalizations`,
      x,
    );
  }
  update(clientId: string, id: string, x: SaveClientHospitalization) {
    return this.http.put<ClientHospitalization>(
      `${this.base}/clients/${clientId}/hospitalizations/${id}`,
      x,
    );
  }
}
