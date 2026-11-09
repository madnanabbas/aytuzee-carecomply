import { Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { ClientApiService } from '../../../data-access/client-api.service';
import {
  ClientListApiItem,
  ClientListResponse,
  DEFAULT_CLIENT_LIST_QUERY,
} from '../../../models/client-api.models';
import { ClientFormPdfViewerComponent } from '../../components/client-form-pdf-viewer/client-form-pdf-viewer';
import { ClientFormApiService } from '../../data-access/client-form-api.service';
import { ClientFormDocumentSource, ClientFormTemplate } from '../../models/client-form.models';

type LoadState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';

@Component({
  selector: 'app-client-forms-page',
  standalone: true,
  imports: [ClientFormPdfViewerComponent],
  templateUrl: './client-forms-page.html',
})
export class ClientFormsPageComponent {
  private readonly clientsApi = inject(ClientApiService);
  private readonly formsApi = inject(ClientFormApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchRequests = new Subject<{ search: string; pageNumber: number }>();

  @ViewChild(ClientFormPdfViewerComponent) viewer?: ClientFormPdfViewerComponent;

  readonly clientSearch = signal('');
  readonly clientState = signal<LoadState>('loading');
  readonly clientResponse = signal<ClientListResponse | null>(null);
  readonly clientDropdownOpen = signal(false);
  readonly activeClientIndex = signal(-1);
  readonly selectedClient = signal<ClientListApiItem | null>(null);

  readonly templateState = signal<LoadState>('idle');
  readonly templates = signal<readonly ClientFormTemplate[]>([]);
  readonly selectedTemplateVersionId = signal('');
  readonly documentState = signal<LoadState>('idle');
  readonly documentSource = signal<ClientFormDocumentSource | null>(null);
  readonly viewerDirty = signal(false);

  readonly canExport = computed(() =>
    this.authorization.hasPermission(Permissions.ClientForm.Export),
  );
  readonly templateDisabled = computed(
    () => this.selectedClient() === null || this.templateState() === 'loading',
  );
  readonly clientTotalPages = computed(() => this.clientResponse()?.totalPages ?? 1);
  readonly selectedTemplate = computed(() =>
    this.templates().find(
      (template) => template.templateVersionId === this.selectedTemplateVersionId(),
    ),
  );

  constructor() {
    this.searchRequests
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (previous, current) =>
            previous.search === current.search && previous.pageNumber === current.pageNumber,
        ),
        tap(() => this.clientState.set('loading')),
        switchMap(({ search, pageNumber }) =>
          this.clientsApi
            .listClients({
              ...DEFAULT_CLIENT_LIST_QUERY,
              search,
              pageNumber,
              pageSize: 10,
            })
            .pipe(
              map((response) => ({ response, failed: false })),
              catchError(() => of({ response: null, failed: true })),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ response, failed }) => {
        this.clientResponse.set(response);
        this.clientState.set(failed ? 'error' : response?.items.length ? 'loaded' : 'empty');
        this.activeClientIndex.set(response?.items.length ? 0 : -1);
      });

    this.requestClients('', 1);
  }

  updateClientSearch(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const search = event.target.value.slice(0, 200);
    this.clientSearch.set(search);
    this.clientDropdownOpen.set(true);
    this.requestClients(search, 1);
  }

  onClientSearchKeydown(event: KeyboardEvent): void {
    const clients = this.clientResponse()?.items ?? [];
    if (event.key === 'Escape') {
      this.clientDropdownOpen.set(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.clientDropdownOpen.set(true);
      if (!clients.length) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const current = this.activeClientIndex();
      this.activeClientIndex.set((current + delta + clients.length) % clients.length);
      return;
    }
    if (event.key === 'Enter' && this.clientDropdownOpen()) {
      const client = clients[this.activeClientIndex()];
      if (client) {
        event.preventDefault();
        this.selectClient(client);
      }
    }
  }

  selectClient(client: ClientListApiItem): void {
    if (this.selectedClient()?.id === client.id) {
      this.clientDropdownOpen.set(false);
      return;
    }
    if (!this.confirmDiscardEdits()) return;

    this.selectedClient.set(client);
    this.clientSearch.set(client.displayName);
    this.clientDropdownOpen.set(false);
    this.clearDocument();
    this.loadTemplates(client.id);
  }

  changeClientPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.clientTotalPages()) return;
    this.requestClients(this.clientSearch().trim(), pageNumber);
  }

  retryClients(): void {
    this.requestClients(this.clientSearch().trim(), 1);
  }

  retryTemplates(): void {
    const clientId = this.selectedClient()?.id;
    if (clientId) this.loadTemplates(clientId);
  }

  onTemplateChange(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) return;
    this.selectTemplate(event.target.value);
  }

  selectTemplate(templateVersionId: string): void {
    if (templateVersionId === this.selectedTemplateVersionId()) return;
    if (!this.confirmDiscardEdits()) return;

    this.selectedTemplateVersionId.set(templateVersionId);
    this.documentSource.set(null);
    this.viewerDirty.set(false);
    if (!templateVersionId) {
      this.documentState.set('idle');
      return;
    }

    const clientId = this.selectedClient()?.id;
    if (!clientId) return;
    this.documentState.set('loading');
    forkJoin({
      bytes: this.formsApi.getContent(clientId, templateVersionId),
      bindings: this.formsApi.getBindings(clientId, templateVersionId),
    })
      .pipe(
        map(({ bytes, bindings }) => ({
          source: { bytes, bindings: bindings.fields },
          failed: false,
        })),
        catchError(() => of({ source: null, failed: true })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ source, failed }) => {
        if (this.selectedTemplateVersionId() !== templateVersionId) return;
        this.documentSource.set(source);
        this.documentState.set(failed ? 'error' : 'loading');
      });
  }

  retryDocument(): void {
    const templateVersionId = this.selectedTemplateVersionId();
    this.selectedTemplateVersionId.set('');
    this.selectTemplate(templateVersionId);
  }

  onViewerReady(): void {
    this.documentState.set('loaded');
  }

  onViewerFailed(): void {
    this.documentSource.set(null);
    this.documentState.set('error');
  }

  resetToClientData(): void {
    this.viewer?.resetToClientData();
    this.viewerDirty.set(false);
  }

  download(): void {
    const template = this.selectedTemplate();
    if (!template || !this.canExport()) return;
    const key = template.templateKey.replace(/[^A-Za-z0-9_-]/g, '') || 'client-form';
    const date = new Date().toISOString().slice(0, 10);
    void this.viewer?.download(`${key}-${date}.pdf`);
  }

  private requestClients(search: string, pageNumber: number): void {
    this.searchRequests.next({ search: search.trim(), pageNumber });
  }

  private loadTemplates(clientId: string): void {
    this.templateState.set('loading');
    this.templates.set([]);
    this.formsApi
      .listTemplates(clientId)
      .pipe(
        map((response) => ({ templates: response.templates, failed: false })),
        catchError(() => of({ templates: [], failed: true })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ templates, failed }) => {
        if (this.selectedClient()?.id !== clientId) return;
        this.templates.set(templates);
        this.templateState.set(failed ? 'error' : templates.length ? 'loaded' : 'empty');
      });
  }

  private clearDocument(): void {
    this.templates.set([]);
    this.templateState.set('idle');
    this.selectedTemplateVersionId.set('');
    this.documentSource.set(null);
    this.documentState.set('idle');
    this.viewerDirty.set(false);
  }

  private confirmDiscardEdits(): boolean {
    return (
      !this.viewerDirty() ||
      window.confirm('Discard your edits and load a different client or template?')
    );
  }
}
