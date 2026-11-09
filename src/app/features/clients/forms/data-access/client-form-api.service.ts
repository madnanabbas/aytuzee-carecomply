import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/app-config';
import {
  ClientFormBindingsResponse,
  ClientFormTemplateListResponse,
} from '../models/client-form.models';

@Injectable({ providedIn: 'root' })
export class ClientFormApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listTemplates(clientId: string): Observable<ClientFormTemplateListResponse> {
    return this.http.get<ClientFormTemplateListResponse>(this.templatesUrl(clientId));
  }

  getContent(clientId: string, templateVersionId: string): Observable<ArrayBuffer> {
    return this.http.get(`${this.templatesUrl(clientId)}/${this.id(templateVersionId)}/content`, {
      responseType: 'arraybuffer',
    });
  }

  getBindings(clientId: string, templateVersionId: string): Observable<ClientFormBindingsResponse> {
    return this.http.get<ClientFormBindingsResponse>(
      `${this.templatesUrl(clientId)}/${this.id(templateVersionId)}/bindings`,
    );
  }

  private templatesUrl(clientId: string): string {
    return `${this.apiBaseUrl}/clients/${this.id(clientId)}/form-templates`;
  }

  private id(value: string): string {
    return encodeURIComponent(value);
  }
}
