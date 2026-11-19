import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';
import {
  ClientDocument,
  ClientDocumentDetails,
  ClientDocumentMetadata,
} from '../models/client-document.models';

@Injectable({ providedIn: 'root' })
export class ClientDocumentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(clientId: string): Observable<readonly ClientDocument[]> {
    return this.http.get<readonly ClientDocument[]>(this.url(clientId));
  }

  get(clientId: string, documentId: string): Observable<ClientDocumentDetails> {
    return this.http.get<ClientDocumentDetails>(
      `${this.url(clientId)}/${encodeURIComponent(documentId)}`,
    );
  }

  upload(
    clientId: string,
    metadata: ClientDocumentMetadata,
    file: File,
  ): Observable<ClientDocumentDetails> {
    const body = this.formData(metadata, file);
    return this.http.post<ClientDocumentDetails>(this.url(clientId), body);
  }

  update(
    clientId: string,
    documentId: string,
    metadata: ClientDocumentMetadata,
    editorVersion: string,
  ): Observable<ClientDocumentDetails> {
    return this.http.put<ClientDocumentDetails>(
      `${this.url(clientId)}/${encodeURIComponent(documentId)}`,
      {
        ...metadata,
        expiryDate: metadata.expiryDate || null,
        reviewDate: metadata.reviewDate || null,
        editorVersion,
      },
    );
  }

  replace(
    clientId: string,
    documentId: string,
    editorVersion: string,
    file: File,
  ): Observable<ClientDocumentDetails> {
    const body = new FormData();
    body.set('editorVersion', editorVersion);
    body.set('file', file);
    return this.http.post<ClientDocumentDetails>(
      `${this.url(clientId)}/${encodeURIComponent(documentId)}/versions`,
      body,
    );
  }

  archive(
    clientId: string,
    documentId: string,
    editorVersion: string,
  ): Observable<ClientDocumentDetails> {
    return this.http.post<ClientDocumentDetails>(
      `${this.url(clientId)}/${encodeURIComponent(documentId)}/archive`,
      { editorVersion },
    );
  }

  download(clientId: string, documentId: string, versionId: string): Observable<Blob> {
    return this.http.get(
      `${this.url(clientId)}/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(versionId)}/content`,
      { responseType: 'blob' },
    );
  }

  private url(clientId: string): string {
    return `${this.apiBaseUrl}/clients/${encodeURIComponent(clientId)}/documents`;
  }

  private formData(metadata: ClientDocumentMetadata, file: File): FormData {
    const body = new FormData();
    body.set('category', metadata.category);
    body.set('title', metadata.title);
    body.set('description', metadata.description);
    if (metadata.expiryDate) body.set('expiryDate', metadata.expiryDate);
    if (metadata.reviewDate) body.set('reviewDate', metadata.reviewDate);
    body.set('file', file);
    return body;
  }
}
