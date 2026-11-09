import { TestBed } from '@angular/core/testing';
import {
  buildPdfFieldPlan,
  ClientFormPdfViewerComponent,
  synchronizePdfControl,
} from './client-form-pdf-viewer';

const pdfMockState = vi.hoisted(() => ({
  enableScripting: false,
  viewerOptions: [] as Array<Record<string, unknown>>,
  viewerDocuments: [] as unknown[],
  loadingOptions: [] as Array<Record<string, unknown>>,
  loadingTaskDestroyed: 0,
  scriptingManagerConstructed: 0,
}));

vi.mock('pdfjs-dist', () => ({
  AnnotationMode: { ENABLE_FORMS: 2 },
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (options: Record<string, unknown>) => {
    pdfMockState.loadingOptions.push(options);
    return {
      promise: Promise.resolve({
        annotationStorage: {
          setValue: vi.fn(),
          resetModified: vi.fn(),
        },
        getFieldObjects: () =>
          Promise.resolve(
            new Map<string, Array<object>>([
              ['ClientName', [{ id: 'client-name', type: 'text', value: '' }]],
            ]),
          ),
        saveDocument: () => Promise.resolve(new Uint8Array()),
      }),
      destroy: () => {
        pdfMockState.loadingTaskDestroyed += 1;
        return Promise.resolve();
      },
    };
  },
}));

vi.mock('pdfjs-dist/web/pdf_viewer.mjs', () => ({
  EventBus: class {
    on(): void {}
    off(): void {}
  },
  PDFLinkService: class {
    setViewer(): void {}
    setDocument(): void {}
  },
  PDFScriptingManager: class {
    constructor() {
      pdfMockState.scriptingManagerConstructed += 1;
    }
  },
  PDFViewer: class {
    readonly enableScripting = pdfMockState.enableScripting;
    readonly pagesPromise = Promise.resolve();
    currentScaleValue = '';

    constructor(private readonly options: Record<string, unknown>) {
      pdfMockState.viewerOptions.push(options);
    }

    setDocument(document: unknown): void {
      pdfMockState.viewerDocuments.push(document);
      if (!document) return;
      const viewer = this.options['viewer'];
      if (!(viewer instanceof HTMLElement)) return;
      const input = window.document.createElement('input');
      input.dataset['elementId'] = 'client-name';
      viewer.append(input);
    }

    updateScale(): void {}
  },
}));

describe('buildPdfFieldPlan', () => {
  it('applies blank bindings without inventing values and locks non-editable fields', () => {
    const fields = new Map<string, Array<object>>([
      ['ClientName', [{ id: 'name-id', type: 'text', value: 'PDF default' }]],
      ['ReadOnly', [{ id: 'readonly-id', type: 'text', value: '' }]],
      ['Consent', [{ id: 'consent-id', type: 'checkbox', value: 'Off', exportValues: '1' }]],
    ]);

    const plan = buildPdfFieldPlan(fields, [
      { pdfFieldName: 'ClientName', value: '', userEditable: true },
      { pdfFieldName: 'ReadOnly', value: 'Authoritative', userEditable: false },
      { pdfFieldName: 'Consent', value: '', userEditable: true },
    ]);

    expect(plan).toEqual([
      { id: 'name-id', type: 'text', value: '', userEditable: true },
      { id: 'readonly-id', type: 'text', value: 'Authoritative', userEditable: false },
      { id: 'consent-id', type: 'checkbox', value: 'Off', userEditable: true },
    ]);
  });

  it('checks a checkbox only when its binding explicitly says so', () => {
    const fields = new Map<string, Array<object>>([
      ['Consent', [{ id: 'consent-id', type: 'checkbox', value: 'Off', exportValues: '1' }]],
    ]);

    expect(
      buildPdfFieldPlan(fields, [{ pdfFieldName: 'Consent', value: 'true', userEditable: true }])[0]
        ?.value,
    ).toBe('1');
  });

  it('locks a non-editable rendered field and restores its bound value', () => {
    const input = document.createElement('input');

    synchronizePdfControl(
      input,
      { id: 'readonly-id', type: 'text', value: 'Authoritative', userEditable: false },
      true,
    );

    expect(input.disabled).toBe(true);
    expect(input.value).toBe('Authoritative');
  });
});

describe('ClientFormPdfViewerComponent scripting safety', () => {
  beforeEach(async () => {
    vi.stubGlobal('CSS', { escape: (value: string) => value });
    pdfMockState.enableScripting = false;
    pdfMockState.viewerOptions.length = 0;
    pdfMockState.viewerDocuments.length = 0;
    pdfMockState.loadingOptions.length = 0;
    pdfMockState.loadingTaskDestroyed = 0;
    pdfMockState.scriptingManagerConstructed = 0;
    await TestBed.configureTestingModule({
      imports: [ClientFormPdfViewerComponent],
    }).compileComponents();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders AcroForm fields while XFA and PDF scripting remain disabled', async () => {
    const fixture = TestBed.createComponent(ClientFormPdfViewerComponent);
    const ready = vi.fn();
    fixture.componentInstance.ready.subscribe(ready);
    fixture.componentRef.setInput('source', {
      bytes: new Uint8Array([1, 2, 3]).buffer,
      bindings: [{ pdfFieldName: 'ClientName', value: 'Synthetic Client', userEditable: true }],
    });

    fixture.detectChanges();
    await vi.waitFor(() => expect(pdfMockState.loadingOptions).toHaveLength(1));
    await vi.waitFor(() => expect(ready).toHaveBeenCalledOnce());

    expect(pdfMockState.scriptingManagerConstructed).toBe(0);
    expect(pdfMockState.viewerOptions[0]?.['scriptingManager']).toBeUndefined();
    expect(pdfMockState.loadingOptions[0]?.['enableXfa']).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-element-id="client-name"]')).not.toBeNull();
    expect(ready).toHaveBeenCalledOnce();
  });

  it('fails closed when PDF.js unexpectedly reports scripting enabled', async () => {
    pdfMockState.enableScripting = true;
    const fixture = TestBed.createComponent(ClientFormPdfViewerComponent);
    const failed = vi.fn();
    fixture.componentInstance.failed.subscribe(failed);
    fixture.componentRef.setInput('source', {
      bytes: new Uint8Array([1, 2, 3]).buffer,
      bindings: [],
    });

    fixture.detectChanges();
    await vi.waitFor(() => expect(failed).toHaveBeenCalledOnce());

    expect(failed).toHaveBeenCalledOnce();
    expect(pdfMockState.viewerDocuments).toEqual([null]);
    expect(pdfMockState.loadingOptions).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.pdfViewer')?.childElementCount).toBe(0);
  });
});
