import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { ClientApiService } from '../../../data-access/client-api.service';
import { ClientListApiItem, ClientListResponse } from '../../../models/client-api.models';
import { ClientFormPdfViewerComponent } from '../../components/client-form-pdf-viewer/client-form-pdf-viewer';
import { ClientFormApiService } from '../../data-access/client-form-api.service';
import { ClientFormsPageComponent } from './client-forms-page';

describe('ClientFormsPageComponent', () => {
  const client: ClientListApiItem = {
    id: 'client-1',
    displayName: 'Synthetic Client',
    preferredName: null,
    pmiNumber: 'TEST-1',
    dateOfBirth: '2000-01-01',
    gender: 'Unknown',
    programType: 'None',
    services: [],
    location: 'Test location',
    socDate: '2026-01-01',
    status: 'Active',
    isOnboarding: false,
    updatedAtUtc: '2026-01-01T00:00:00Z',
  };
  const secondClient = { ...client, id: 'client-2', displayName: 'Second Synthetic Client' };
  const clientResponse: ClientListResponse = {
    items: [client, secondClient],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
  };
  const template = {
    templateVersionId: 'version-1',
    templateKey: 'DHS-TEST',
    name: 'Synthetic form',
    description: '',
    category: 'Test',
    versionNumber: 1,
    pageCount: 1,
    effectiveFrom: null,
    effectiveTo: null,
  };

  const clientsApi = { listClients: vi.fn(() => of(clientResponse)) };
  const formsApi = {
    listTemplates: vi.fn(() => of({ templates: [template] })),
    getContent: vi.fn(() => of(new ArrayBuffer(8))),
    getBindings: vi.fn(() =>
      of({
        templateVersionId: 'version-1',
        fields: [{ pdfFieldName: 'Name', value: 'Synthetic', userEditable: true }],
      }),
    ),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    clientsApi.listClients.mockReset().mockReturnValue(of(clientResponse));
    formsApi.listTemplates.mockReset().mockReturnValue(of({ templates: [template] }));
    formsApi.getContent.mockReset().mockReturnValue(of(new ArrayBuffer(8)));
    formsApi.getBindings.mockReset().mockReturnValue(
      of({
        templateVersionId: 'version-1',
        fields: [{ pdfFieldName: 'Name', value: 'Synthetic', userEditable: true }],
      }),
    );
    TestBed.configureTestingModule({
      imports: [ClientFormsPageComponent],
      providers: [
        { provide: ClientApiService, useValue: clientsApi },
        { provide: ClientFormApiService, useValue: formsApi },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('moves from client search to templates and a loaded document', () => {
    const page = TestBed.runInInjectionContext(() => new ClientFormsPageComponent());
    expect(page.selectedClient()).toBeNull();
    expect(page.templateDisabled()).toBe(true);

    vi.advanceTimersByTime(300);
    expect(page.clientState()).toBe('loaded');
    page.selectClient(client);
    expect(page.templateState()).toBe('loaded');
    expect(page.templateDisabled()).toBe(false);

    page.selectTemplate('version-1');
    expect(page.documentState()).toBe('loading');
    expect(page.documentSource()?.bindings[0]?.value).toBe('Synthetic');
    page.onViewerReady();
    expect(page.documentState()).toBe('loaded');
  });

  it('keeps the current client or template when edited-field confirmation is declined', () => {
    const page = TestBed.runInInjectionContext(() => new ClientFormsPageComponent());
    vi.advanceTimersByTime(300);
    page.selectClient(client);
    page.selectTemplate('version-1');
    page.viewerDirty.set(true);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    page.selectClient(secondClient);
    page.selectTemplate('other-version');

    expect(page.selectedClient()?.id).toBe('client-1');
    expect(page.selectedTemplateVersionId()).toBe('version-1');
  });

  it('delegates reset and clears the page dirty state', () => {
    const page = TestBed.runInInjectionContext(() => new ClientFormsPageComponent());
    vi.advanceTimersByTime(300);
    const viewer = new ClientFormPdfViewerComponent();
    const reset = vi.spyOn(viewer, 'resetToClientData');
    page.viewer = viewer;
    page.viewerDirty.set(true);

    page.resetToClientData();

    expect(reset).toHaveBeenCalledOnce();
    expect(page.viewerDirty()).toBe(false);
  });

  it('hides export unless the canonical export permission is present', () => {
    const fixture = TestBed.createComponent(ClientFormsPageComponent);
    const authorization = TestBed.inject(AuthorizationService);
    vi.advanceTimersByTime(300);
    fixture.componentInstance.selectClient(client);
    fixture.componentInstance.selectTemplate('version-1');
    fixture.componentInstance.onViewerReady();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Download PDF');

    authorization.setPermissions([Permissions.ClientForm.Export]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Download PDF');
  });

  it('downloads with a generic template-and-date filename containing no client data', () => {
    const page = TestBed.runInInjectionContext(() => new ClientFormsPageComponent());
    TestBed.inject(AuthorizationService).setPermissions([Permissions.ClientForm.Export]);
    vi.advanceTimersByTime(300);
    page.selectClient(client);
    page.selectTemplate('version-1');
    const viewer = new ClientFormPdfViewerComponent();
    const download = vi.spyOn(viewer, 'download').mockResolvedValue();
    page.viewer = viewer;

    page.download();

    const filename = download.mock.calls[0]?.[0];
    expect(filename).toMatch(/^DHS-TEST-\d{4}-\d{2}-\d{2}\.pdf$/u);
    expect(filename).not.toContain('Synthetic');
    expect(filename).not.toContain('TEST-1');
  });

  it('exposes client empty and failure states without sensitive error detail', () => {
    clientsApi.listClients.mockReturnValueOnce(of({ ...clientResponse, items: [], totalCount: 0 }));
    const empty = TestBed.runInInjectionContext(() => new ClientFormsPageComponent());
    vi.advanceTimersByTime(300);
    expect(empty.clientState()).toBe('empty');

    clientsApi.listClients.mockReturnValueOnce(
      throwError(() => new Error('sensitive upstream detail')),
    );
    const failed = TestBed.runInInjectionContext(() => new ClientFormsPageComponent());
    vi.advanceTimersByTime(300);
    expect(failed.clientState()).toBe('error');
  });

  it('exposes template empty and document failure states', () => {
    formsApi.listTemplates.mockReturnValueOnce(of({ templates: [] }));
    const empty = TestBed.runInInjectionContext(() => new ClientFormsPageComponent());
    vi.advanceTimersByTime(300);
    empty.selectClient(client);
    expect(empty.templateState()).toBe('empty');

    formsApi.getContent.mockReturnValueOnce(throwError(() => new Error('upstream detail')));
    const failed = TestBed.runInInjectionContext(() => new ClientFormsPageComponent());
    vi.advanceTimersByTime(300);
    failed.selectClient(client);
    failed.selectTemplate('version-1');
    expect(failed.documentState()).toBe('error');
    expect(failed.documentSource()).toBeNull();
  });
});
