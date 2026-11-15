import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/app-config';
import {
  FormTemplateApiService,
  formTemplateErrorMessage,
  formTemplateWarningMessage,
} from './form-template-api.service';

describe('FormTemplateApiService', () => {
  let api: FormTemplateApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(FormTemplateApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the approved list, detail, field and retire URLs with encoded ids', () => {
    api.listTemplates().subscribe();
    http.expectOne('/api/form-templates').flush([]);

    api.getTemplate('template/1').subscribe();
    http.expectOne('/api/form-templates/template%2F1').flush({});

    api.listFields('template/1', 'version/1').subscribe();
    http.expectOne('/api/form-templates/template%2F1/versions/version%2F1/fields').flush([]);

    api.retireVersion('template/1', 'version/1').subscribe();
    const retire = http.expectOne('/api/form-templates/template%2F1/versions/version%2F1/retire');
    expect(retire.request.method).toBe('POST');
    retire.flush({ template: null, version: null, warnings: [] });
  });

  it('sends the exact new-template multipart contract and reports upload completion', () => {
    const received = vi.fn();
    api
      .uploadTemplate({
        key: 'dhs-6893f',
        name: 'DHS 6893F',
        description: 'Assessment',
        category: 'PCA',
        file: new File(['pdf'], 'template.pdf', { type: 'application/pdf' }),
      })
      .subscribe(received);

    const request = http.expectOne('/api/form-templates');
    expect(request.request.method).toBe('POST');
    expect(request.request.reportProgress).toBe(true);
    const body = request.request.body as FormData;
    expect(body.get('Key')).toBe('dhs-6893f');
    expect(body.get('Name')).toBe('DHS 6893F');
    expect(body.get('Description')).toBe('Assessment');
    expect(body.get('Category')).toBe('PCA');
    expect(body.get('File')).toBeInstanceOf(File);
    request.flush({ template: null, version: null, warnings: [] });
    expect(received).toHaveBeenCalledWith(expect.objectContaining({ kind: 'complete' }));
  });

  it('uploads a new version without resending inherited template metadata', () => {
    api.uploadVersion('template/1', new File(['pdf'], 'v2.pdf')).subscribe();
    const request = http.expectOne('/api/form-templates/template%2F1/versions');
    const body = request.request.body as FormData;
    expect(body.get('File')).toBeInstanceOf(File);
    expect(body.has('Name')).toBe(false);
    expect(body.has('Category')).toBe(false);
    request.flush({ template: null, version: null, warnings: [] });
  });

  it('uses the mapping, catalog, preview and publish contracts', () => {
    api.getBindingCatalog().subscribe();
    http.expectOne('/api/form-templates/binding-catalog').flush({ groups: [] });

    api.getMappings('template/1', 'version/1').subscribe();
    http.expectOne('/api/form-templates/template%2F1/versions/version%2F1/mappings').flush({});

    api
      .saveMappings('template/1', 'version/1', 'row-version', [
        { id: 'field-1', fieldPurpose: 'Data', bindingKey: 'client.firstName' },
      ])
      .subscribe();
    const save = http.expectOne('/api/form-templates/template%2F1/versions/version%2F1/mappings');
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual({
      rowVersion: 'row-version',
      mappings: [{ id: 'field-1', fieldPurpose: 'Data', bindingKey: 'client.firstName' }],
    });
    save.flush({});

    api.preview('template/1', 'version/1').subscribe();
    http.expectOne('/api/form-templates/template%2F1/versions/version%2F1/preview').flush({
      isSynthetic: true,
      values: [],
    });

    api.publish('template/1', 'version/1', 'row-version', true).subscribe();
    const publish = http.expectOne('/api/form-templates/template%2F1/versions/version%2F1/publish');
    expect(publish.request.method).toBe('POST');
    expect(publish.request.body).toEqual({
      rowVersion: 'row-version',
      acknowledgeValidationWarnings: true,
    });
    publish.flush({});
  });

  it.each([
    ['NotPdf', 'valid PDF'],
    ['TooLarge', '10 MB'],
    ['MalformedPdf', 'damaged'],
    ['Encrypted', 'password-protected'],
    ['TooManyPages', '20-page'],
    ['TooManyFields', '500-field'],
    ['NoAcroFormFields', 'fillable AcroForm'],
    ['PureXfa', 'XFA-only'],
    ['DuplicateFieldNames', 'duplicate field names'],
    ['DangerousContent', 'does not allow'],
    ['TraversalLimitExceeded', 'too complex'],
  ])('maps stable validation code %s without displaying server text', (code, expected) => {
    const message = formTemplateErrorMessage(
      new HttpErrorResponse({
        status: 400,
        error: {
          type: 'urn:carecomply:problem:form-template-invalid-pdf',
          code,
          detail: 'raw parser secret',
        },
      }),
    );
    expect(message).toContain(expected);
    expect(message).not.toContain('raw parser secret');
  });

  it('uses generic messages for unknown codes and exact duplicate content', () => {
    expect(
      formTemplateErrorMessage(
        new HttpErrorResponse({
          status: 400,
          error: { type: 'urn:carecomply:problem:form-template-invalid-pdf', code: 'FutureCode' },
        }),
      ),
    ).toBe('The PDF did not pass validation.');
    expect(
      formTemplateErrorMessage(
        new HttpErrorResponse({
          status: 409,
          error: { type: 'urn:carecomply:problem:form-template-duplicate-content' },
        }),
      ),
    ).toContain('already been uploaded');
  });

  it('maps both approved warning codes to review-before-publishing language', () => {
    expect(formTemplateWarningMessage('hybrid-xfa')).toContain('review before publishing');
    expect(formTemplateWarningMessage('adobe-version-check-scripts')).toContain(
      'review before publishing',
    );
  });
});
