import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/app-config';
import { ClientFormApiService } from './client-form-api.service';

describe('ClientFormApiService', () => {
  let api: ClientFormApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(ClientFormApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses identifier-only template, content, and binding URLs', () => {
    api.listTemplates('client id').subscribe();
    http.expectOne('/api/clients/client%20id/form-templates').flush({ templates: [] });

    api.getContent('client id', 'version/id').subscribe();
    const content = http.expectOne('/api/clients/client%20id/form-templates/version%2Fid/content');
    expect(content.request.responseType).toBe('arraybuffer');
    content.flush(new ArrayBuffer(0));

    api.getBindings('client id', 'version/id').subscribe();
    http
      .expectOne('/api/clients/client%20id/form-templates/version%2Fid/bindings')
      .flush({ templateVersionId: 'version/id', fields: [] });
  });
});
