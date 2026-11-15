import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/app-config';
import {
  FormTemplate,
  FormTemplateField,
  FormTemplateMutationResponse,
  FormTemplateSummary,
  FormTemplateUploadEvent,
  FormTemplateBindingCatalog,
  FormTemplateMappingSet,
  FormTemplatePreview,
  FormFieldPurpose,
  NewFormTemplateUpload,
} from '../models/form-template.models';

const INVALID_PDF_TYPE = 'urn:carecomply:problem:form-template-invalid-pdf';
const DUPLICATE_CONTENT_TYPE = 'urn:carecomply:problem:form-template-duplicate-content';

const VALIDATION_MESSAGES: Readonly<Record<string, string>> = {
  NotPdf: 'Choose a valid PDF file.',
  TooLarge: 'The PDF exceeds the 10 MB upload limit.',
  MalformedPdf: 'The PDF is damaged or cannot be safely read.',
  Encrypted: 'Encrypted or password-protected PDFs cannot be uploaded.',
  TooManyPages: 'The PDF exceeds the 20-page limit.',
  TooManyFields: 'The PDF exceeds the 500-field limit.',
  NoAcroFormFields: 'The PDF does not contain fillable AcroForm fields.',
  PureXfa: 'XFA-only PDFs are not supported. Upload a fillable AcroForm PDF.',
  DuplicateFieldNames: 'The PDF contains duplicate field names and cannot be uploaded.',
  DangerousContent: 'The PDF contains actions or content that CareComply does not allow.',
  TraversalLimitExceeded: 'The PDF is too complex to validate safely.',
};

@Injectable({ providedIn: 'root' })
export class FormTemplateApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly http = inject(HttpClient);

  listTemplates(): Observable<readonly FormTemplateSummary[]> {
    return this.http.get<readonly FormTemplateSummary[]>(this.baseUrl);
  }

  getTemplate(templateId: string): Observable<FormTemplate> {
    return this.http.get<FormTemplate>(`${this.baseUrl}/${encodeURIComponent(templateId)}`);
  }

  listFields(templateId: string, versionId: string): Observable<readonly FormTemplateField[]> {
    return this.http.get<readonly FormTemplateField[]>(
      `${this.baseUrl}/${encodeURIComponent(templateId)}/versions/${encodeURIComponent(versionId)}/fields`,
    );
  }

  uploadTemplate(request: NewFormTemplateUpload): Observable<FormTemplateUploadEvent> {
    const body = new FormData();
    body.set('Key', request.key);
    body.set('Name', request.name);
    body.set('Description', request.description);
    body.set('Category', request.category);
    body.set('File', request.file);
    return this.toUploadEvents(
      this.http.post<FormTemplateMutationResponse>(this.baseUrl, body, {
        observe: 'events',
        reportProgress: true,
      }),
    );
  }

  uploadVersion(templateId: string, file: File): Observable<FormTemplateUploadEvent> {
    const body = new FormData();
    body.set('File', file);
    return this.toUploadEvents(
      this.http.post<FormTemplateMutationResponse>(
        `${this.baseUrl}/${encodeURIComponent(templateId)}/versions`,
        body,
        { observe: 'events', reportProgress: true },
      ),
    );
  }

  retireVersion(templateId: string, versionId: string): Observable<FormTemplateMutationResponse> {
    return this.http.post<FormTemplateMutationResponse>(
      `${this.baseUrl}/${encodeURIComponent(templateId)}/versions/${encodeURIComponent(versionId)}/retire`,
      {},
    );
  }

  getBindingCatalog(): Observable<FormTemplateBindingCatalog> {
    return this.http.get<FormTemplateBindingCatalog>(`${this.baseUrl}/binding-catalog`);
  }

  getMappings(templateId: string, versionId: string): Observable<FormTemplateMappingSet> {
    return this.http.get<FormTemplateMappingSet>(this.mappingUrl(templateId, versionId));
  }

  saveMappings(
    templateId: string,
    versionId: string,
    rowVersion: string,
    mappings: readonly {
      readonly id: string;
      readonly fieldPurpose: FormFieldPurpose;
      readonly bindingKey: string | null;
    }[],
  ): Observable<FormTemplateMappingSet> {
    return this.http.put<FormTemplateMappingSet>(this.mappingUrl(templateId, versionId), {
      rowVersion,
      mappings,
    });
  }

  preview(templateId: string, versionId: string): Observable<FormTemplatePreview> {
    return this.http.get<FormTemplatePreview>(`${this.versionUrl(templateId, versionId)}/preview`);
  }

  getContent(templateId: string, versionId: string): Observable<ArrayBuffer> {
    return this.http.get(`${this.versionUrl(templateId, versionId)}/content`, {
      responseType: 'arraybuffer',
    });
  }

  publish(
    templateId: string,
    versionId: string,
    rowVersion: string,
    acknowledgeValidationWarnings: boolean,
  ): Observable<FormTemplateMappingSet> {
    return this.http.post<FormTemplateMappingSet>(
      `${this.versionUrl(templateId, versionId)}/publish`,
      { rowVersion, acknowledgeValidationWarnings },
    );
  }

  private get baseUrl(): string {
    return `${this.apiBaseUrl}/form-templates`;
  }

  private versionUrl(templateId: string, versionId: string): string {
    return `${this.baseUrl}/${encodeURIComponent(templateId)}/versions/${encodeURIComponent(versionId)}`;
  }

  private mappingUrl(templateId: string, versionId: string): string {
    return `${this.versionUrl(templateId, versionId)}/mappings`;
  }

  private toUploadEvents(
    source: Observable<HttpEvent<FormTemplateMutationResponse>>,
  ): Observable<FormTemplateUploadEvent> {
    return source.pipe(
      map((event): FormTemplateUploadEvent | null => {
        if (event.type === HttpEventType.UploadProgress) {
          return {
            kind: 'progress',
            percent: event.total ? Math.round((event.loaded / event.total) * 100) : 0,
          };
        }
        if (event.type === HttpEventType.Response && event.body !== null) {
          return { kind: 'complete', response: event.body };
        }
        return null;
      }),
      filter((event): event is FormTemplateUploadEvent => event !== null),
    );
  }
}

export function formTemplateErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse) || !isProblem(error.error)) {
    return 'The form template operation could not be completed. Try again.';
  }
  if (error.error.type === DUPLICATE_CONTENT_TYPE) {
    return 'This PDF content has already been uploaded.';
  }
  if (error.error.type === INVALID_PDF_TYPE && typeof error.error.code === 'string') {
    return VALIDATION_MESSAGES[error.error.code] ?? 'The PDF did not pass validation.';
  }
  if (error.status === 403) return 'You do not have access to manage form templates.';
  if (error.status === 404) return 'The form template could not be found.';
  if (error.status === 429) return 'Too many uploads were attempted. Wait and try again.';
  return 'The form template operation could not be completed. Try again.';
}

export function formTemplateWarningMessage(code: string): string {
  if (code === 'hybrid-xfa') {
    return 'This hybrid XFA/AcroForm PDF needs review before publishing.';
  }
  if (code === 'adobe-version-check-scripts') {
    return 'Standard Adobe version-check scripts are present and need review before publishing. They run only in Adobe viewers, not CareComply.';
  }
  return 'The server reported a validation warning. Review the template before publishing.';
}

function isProblem(value: unknown): value is { readonly type: string; readonly code?: unknown } {
  return (
    typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
  );
}
