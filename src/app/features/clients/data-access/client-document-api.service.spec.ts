import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/app-config';
import { ClientDocumentApiService } from './client-document-api.service';

describe('ClientDocumentApiService', () => {
  let api: ClientDocumentApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(ClientDocumentApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses client-scoped encoded endpoints', () => {
    api.list('client 1').subscribe();
    expect(http.expectOne('/api/clients/client%201/documents').request.method).toBe('GET');
    api.get('client 1', 'document 1').subscribe();
    expect(http.expectOne('/api/clients/client%201/documents/document%201').request.method).toBe(
      'GET',
    );
  });

  it('sends multipart content and concurrency tokens', () => {
    const file = new File(['document'], 'care plan.pdf', { type: 'application/pdf' });
    api.upload('client-1', metadata(), file).subscribe();
    const upload = http.expectOne('/api/clients/client-1/documents');
    expect(upload.request.body).toBeInstanceOf(FormData);
    expect((upload.request.body as FormData).get('file')).toBe(file);

    api.replace('client-1', 'document-1', 'A'.repeat(64), file).subscribe();
    const replace = http.expectOne('/api/clients/client-1/documents/document-1/versions');
    expect((replace.request.body as FormData).get('editorVersion')).toBe('A'.repeat(64));

    api.archive('client-1', 'document-1', 'B'.repeat(64)).subscribe();
    expect(
      http.expectOne('/api/clients/client-1/documents/document-1/archive').request.body,
    ).toEqual({ editorVersion: 'B'.repeat(64) });
  });

  it('downloads only through the authorized API as a blob', () => {
    api.download('client-1', 'document-1', 'version-1').subscribe();
    const request = http.expectOne(
      '/api/clients/client-1/documents/document-1/versions/version-1/content',
    );
    expect(request.request.responseType).toBe('blob');
  });
});

function metadata() {
  return { category: 'Care plan', title: 'Plan', description: '', expiryDate: '', reviewDate: '' };
}
