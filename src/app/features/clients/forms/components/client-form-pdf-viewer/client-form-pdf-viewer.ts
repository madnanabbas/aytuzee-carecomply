import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import type { EventBus, PDFLinkService, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { ClientFormBinding, ClientFormDocumentSource } from '../../models/client-form.models';

export interface PdfFieldPlan {
  readonly id: string;
  readonly type: string;
  readonly value: string;
  readonly userEditable: boolean;
}

interface PdfFieldObject {
  readonly id: string;
  readonly type: string;
  readonly value: string;
  readonly exportValue: string;
}

export function buildPdfFieldPlan(
  fieldObjects: Map<string, Array<object>> | null,
  bindings: readonly ClientFormBinding[],
): readonly PdfFieldPlan[] {
  const bindingsByName = new Map(bindings.map((binding) => [binding.pdfFieldName, binding]));
  const plan: PdfFieldPlan[] = [];

  for (const [fieldName, rawFields] of fieldObjects ?? []) {
    const binding = bindingsByName.get(fieldName);
    for (const rawField of rawFields) {
      const field = readFieldObject(rawField);
      if (!field || !field.type) continue;

      const value = binding
        ? field.type === 'checkbox'
          ? checkboxValue(binding.value, field.exportValue)
          : binding.value
        : field.value;
      plan.push({
        id: field.id,
        type: field.type,
        value,
        userEditable: binding?.userEditable ?? true,
      });
    }
  }

  return plan;
}

@Component({
  selector: 'app-client-form-pdf-viewer',
  standalone: true,
  templateUrl: './client-form-pdf-viewer.html',
  styleUrl: './client-form-pdf-viewer.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ClientFormPdfViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) source!: ClientFormDocumentSource;
  @Output() readonly ready = new EventEmitter<void>();
  @Output() readonly failed = new EventEmitter<void>();
  @Output() readonly dirtyChange = new EventEmitter<boolean>();

  @ViewChild('container', { static: true }) private containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('viewer', { static: true }) private viewerRef!: ElementRef<HTMLDivElement>;

  readonly editedCount = signal(0);
  readonly zoomPercent = signal(100);

  private viewReady = false;
  private loadSequence = 0;
  private loadingTask: PDFDocumentLoadingTask | null = null;
  private pdfDocument: PDFDocumentProxy | null = null;
  private pdfViewer: PDFViewer | null = null;
  private linkService: PDFLinkService | null = null;
  private eventBus: EventBus | null = null;
  private fieldPlan: readonly PdfFieldPlan[] = [];
  private readonly editedFieldIds = new Set<string>();

  private readonly onAnnotationLayerRendered = (): void => this.synchronizeRenderedFields();
  private readonly onScaleChanging = (event: object): void => {
    const scale = readNumberProperty(event, 'scale');
    if (scale !== null) this.zoomPercent.set(Math.round(scale * 100));
  };
  private readonly onFormInput = (event: Event): void => {
    const target = event.target;
    if (!(
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ))
      return;
    const fieldId = target.dataset['elementId'];
    if (!fieldId || this.fieldPlan.find((field) => field.id === fieldId)?.userEditable === false)
      return;

    this.editedFieldIds.add(fieldId);
    this.updateEditedState();
    this.markRenderedField(fieldId, true);
  };

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.containerRef.nativeElement.addEventListener('input', this.onFormInput);
    this.containerRef.nativeElement.addEventListener('change', this.onFormInput);
    void this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady && changes['source']) void this.load();
  }

  ngOnDestroy(): void {
    this.loadSequence += 1;
    this.containerRef.nativeElement.removeEventListener('input', this.onFormInput);
    this.containerRef.nativeElement.removeEventListener('change', this.onFormInput);
    void this.destroyDocument();
  }

  zoomIn(): void {
    this.pdfViewer?.updateScale({ steps: 1 });
  }

  zoomOut(): void {
    this.pdfViewer?.updateScale({ steps: -1 });
  }

  fitToWidth(): void {
    if (this.pdfViewer) this.pdfViewer.currentScaleValue = 'page-width';
  }

  resetToClientData(): void {
    const storage = this.pdfDocument?.annotationStorage;
    if (!storage) return;

    for (const field of this.fieldPlan) {
      storage.setValue(field.id, { value: storageValue(field) });
    }
    storage.resetModified();
    this.editedFieldIds.clear();
    this.updateEditedState();
    this.synchronizeRenderedFields(true);
  }

  async download(filename: string): Promise<void> {
    if (!this.pdfDocument) return;

    const bytes = await this.pdfDocument.saveDocument();
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private async load(): Promise<void> {
    if (!this.source?.bytes) return;
    const sequence = ++this.loadSequence;

    try {
      await this.destroyDocument();
      if (sequence !== this.loadSequence) return;

      const pdfjs = await import('pdfjs-dist');
      const viewerModule = await import('pdfjs-dist/web/pdf_viewer.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.min.mjs';

      this.eventBus = new viewerModule.EventBus();
      this.linkService = new viewerModule.PDFLinkService({ eventBus: this.eventBus });
      this.pdfViewer = new viewerModule.PDFViewer({
        container: this.containerRef.nativeElement,
        viewer: this.viewerRef.nativeElement,
        eventBus: this.eventBus,
        linkService: this.linkService,
        // CareComply must never execute scripts embedded in uploaded PDFs.
        // Supplying no scripting manager keeps PDF.js scripting disabled.
        scriptingManager: undefined,
        annotationMode: pdfjs.AnnotationMode.ENABLE_FORMS,
        removePageBorders: true,
      });
      if (this.pdfViewer.enableScripting) {
        await this.destroyDocument();
        if (sequence === this.loadSequence) this.failed.emit();
        return;
      }
      this.linkService.setViewer(this.pdfViewer);
      this.eventBus.on('annotationlayerrendered', this.onAnnotationLayerRendered);
      this.eventBus.on('scalechanging', this.onScaleChanging);

      this.loadingTask = pdfjs.getDocument({
        data: new Uint8Array(this.source.bytes.slice(0)),
        enableXfa: false,
      });
      const document = await this.loadingTask.promise;
      if (sequence !== this.loadSequence) return;

      this.pdfDocument = document;
      this.fieldPlan = buildPdfFieldPlan(await document.getFieldObjects(), this.source.bindings);
      for (const field of this.fieldPlan) {
        document.annotationStorage.setValue(field.id, { value: storageValue(field) });
      }
      document.annotationStorage.resetModified();
      this.editedFieldIds.clear();
      this.updateEditedState();

      this.linkService.setDocument(document);
      this.pdfViewer.setDocument(document);
      await this.pdfViewer.pagesPromise;
      if (sequence !== this.loadSequence) return;
      this.fitToWidth();
      this.synchronizeRenderedFields();
      this.ready.emit();
    } catch {
      if (sequence === this.loadSequence) this.failed.emit();
    }
  }

  private async destroyDocument(): Promise<void> {
    this.eventBus?.off('annotationlayerrendered', this.onAnnotationLayerRendered);
    this.eventBus?.off('scalechanging', this.onScaleChanging);
    this.pdfViewer?.setDocument(null);
    this.linkService?.setDocument(null);
    this.pdfViewer = null;
    this.linkService = null;
    this.eventBus = null;
    this.pdfDocument = null;
    this.fieldPlan = [];
    const loadingTask = this.loadingTask;
    this.loadingTask = null;
    if (loadingTask) await loadingTask.destroy();
    this.viewerRef.nativeElement.replaceChildren();
  }

  private synchronizeRenderedFields(restoreValues = false): void {
    for (const field of this.fieldPlan) {
      const control = this.fieldControl(field.id);
      if (!control) continue;
      synchronizePdfControl(control, field, restoreValues);
      this.markRenderedField(field.id, this.editedFieldIds.has(field.id));
    }
  }

  private markRenderedField(fieldId: string, edited: boolean): void {
    const control = this.fieldControl(fieldId);
    const wrapper = control?.closest<HTMLElement>('section') ?? control?.parentElement;
    if (!wrapper) return;
    wrapper.classList.toggle('client-form-field-edited', edited);
    const existing = wrapper.querySelector<HTMLElement>('.client-form-edited-label');
    if (!edited) {
      existing?.remove();
      return;
    }
    if (existing) return;
    const label = document.createElement('span');
    label.className = 'client-form-edited-label';
    label.textContent = 'Edited';
    wrapper.append(label);
  }

  private fieldControl(
    fieldId: string,
  ): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
    return this.containerRef.nativeElement.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(`[data-element-id="${CSS.escape(fieldId)}"]`);
  }

  private updateEditedState(): void {
    const count = this.editedFieldIds.size;
    this.editedCount.set(count);
    this.dirtyChange.emit(count > 0);
  }
}

function readFieldObject(value: object): PdfFieldObject | null {
  const id = readStringProperty(value, 'id');
  if (!id) return null;
  const exportValues = Reflect.get(value, 'exportValues');
  return {
    id,
    type: readStringProperty(value, 'type') ?? '',
    value: readStringProperty(value, 'value') ?? '',
    exportValue:
      typeof exportValues === 'string'
        ? exportValues
        : Array.isArray(exportValues) && typeof exportValues[0] === 'string'
          ? exportValues[0]
          : 'Yes',
  };
}

function readStringProperty(value: object, key: string): string | null {
  const property = Reflect.get(value, key);
  return typeof property === 'string' ? property : null;
}

function readNumberProperty(value: object, key: string): number | null {
  const property = Reflect.get(value, key);
  return typeof property === 'number' && Number.isFinite(property) ? property : null;
}

function checkboxValue(value: string, exportValue: string): string {
  return ['true', '1', 'yes', 'on', exportValue.toLocaleLowerCase()].includes(
    value.trim().toLocaleLowerCase(),
  )
    ? exportValue
    : 'Off';
}

function storageValue(field: PdfFieldPlan): string | boolean {
  return field.type === 'checkbox' ? field.value !== 'Off' : field.value;
}

export function synchronizePdfControl(
  control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  field: PdfFieldPlan,
  restoreValue: boolean,
): void {
  control.disabled = !field.userEditable;
  if (!restoreValue) return;
  if (control instanceof HTMLInputElement && control.type === 'checkbox') {
    control.checked = field.value !== 'Off';
  } else {
    control.value = field.value;
  }
}
