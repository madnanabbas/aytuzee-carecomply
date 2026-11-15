import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ClientFormPdfViewerComponent } from '../../../../clients/forms/components/client-form-pdf-viewer/client-form-pdf-viewer';
import { ClientFormDocumentSource } from '../../../../clients/forms/models/client-form.models';
import { FormTemplateApiService } from '../../data-access/form-template-api.service';
import {
  FormFieldPurpose,
  FormTemplateBindingCatalog,
  FormTemplateMapping,
  FormTemplateMappingSet,
} from '../../models/form-template.models';

interface EditableMapping {
  readonly id: string;
  readonly pdfFieldName: string;
  readonly pdfFieldType: string;
  readonly suggestedPurpose: FormFieldPurpose | null;
  fieldPurpose: FormFieldPurpose;
  bindingKey: string | null;
}

@Component({
  selector: 'app-form-template-mapping-page',
  standalone: true,
  imports: [FormsModule, RouterLink, ClientFormPdfViewerComponent],
  templateUrl: './form-template-mapping-page.html',
})
export class FormTemplateMappingPageComponent {
  private readonly api = inject(FormTemplateApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly templateId = this.route.snapshot.paramMap.get('templateId') ?? '';
  readonly versionId = this.route.snapshot.paramMap.get('versionId') ?? '';
  readonly mappingSet = signal<FormTemplateMappingSet | null>(null);
  readonly catalog = signal<FormTemplateBindingCatalog>({ groups: [] });
  readonly mappings = signal<EditableMapping[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);
  readonly publishing = signal(false);
  readonly operationError = signal<string | null>(null);
  readonly search = signal('');
  readonly unmappedOnly = signal(false);
  readonly showPublish = signal(false);
  readonly warningsAcknowledged = signal(false);
  readonly previewSource = signal<ClientFormDocumentSource | null>(null);
  readonly previewLoading = signal(false);
  readonly previewFailed = signal(false);
  readonly isDraft = computed(() => this.mappingSet()?.status === 'Draft');
  readonly filteredMappings = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.mappings().filter(
      (item) =>
        (!this.unmappedOnly() || item.fieldPurpose === 'Manual') &&
        (!term || item.pdfFieldName.toLowerCase().includes(term)),
    );
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    forkJoin({
      mappingSet: this.api.getMappings(this.templateId, this.versionId),
      catalog: this.api.getBindingCatalog(),
    })
      .pipe(
        catchError(() => {
          this.loadFailed.set(true);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result) {
          this.mappingSet.set(result.mappingSet);
          this.catalog.set(result.catalog);
          this.mappings.set(result.mappingSet.mappings.map(toEditable));
        }
        this.loading.set(false);
      });
  }

  setPurpose(mapping: EditableMapping, purpose: FormFieldPurpose): void {
    mapping.fieldPurpose = purpose;
    if (purpose !== 'Data') mapping.bindingKey = null;
    this.mappings.set([...this.mappings()]);
  }

  applySuggestion(mapping: EditableMapping): void {
    if (mapping.suggestedPurpose) this.setPurpose(mapping, mapping.suggestedPurpose);
  }

  save(): void {
    const set = this.mappingSet();
    if (!set || !this.isDraft() || this.saving()) return;
    this.saving.set(true);
    this.operationError.set(null);
    this.api
      .saveMappings(
        this.templateId,
        this.versionId,
        set.rowVersion,
        this.mappings().map((mapping) => ({
          id: mapping.id,
          fieldPurpose: mapping.fieldPurpose,
          bindingKey: mapping.bindingKey,
        })),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.mappingSet.set(updated);
          this.mappings.set(updated.mappings.map(toEditable));
          this.saving.set(false);
        },
        error: () => {
          this.operationError.set('Mappings could not be saved. Reload and try again.');
          this.saving.set(false);
        },
      });
  }

  preview(): void {
    this.previewLoading.set(true);
    this.previewFailed.set(false);
    this.previewSource.set(null);
    forkJoin({
      preview: this.api.preview(this.templateId, this.versionId),
      bytes: this.api.getContent(this.templateId, this.versionId),
    })
      .pipe(
        catchError(() => {
          this.previewFailed.set(true);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result) {
          const byId = new Map(
            result.preview.values.map((value) => [value.mappingId, value.value]),
          );
          this.previewSource.set({
            bytes: result.bytes,
            bindings: this.mappings().map((mapping) => ({
              pdfFieldName: mapping.pdfFieldName,
              value: byId.get(mapping.id) ?? '',
              userEditable: true,
            })),
          });
        }
        this.previewLoading.set(false);
      });
  }

  publish(): void {
    const set = this.mappingSet();
    if (!set || !this.isDraft() || this.publishing()) return;
    if (set.requiresWarningAcknowledgement && !this.warningsAcknowledged()) return;
    this.publishing.set(true);
    this.operationError.set(null);
    this.api
      .publish(this.templateId, this.versionId, set.rowVersion, this.warningsAcknowledged())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.mappingSet.set(updated);
          this.mappings.set(updated.mappings.map(toEditable));
          this.showPublish.set(false);
          this.publishing.set(false);
        },
        error: () => {
          this.operationError.set(
            'The version could not be published. Review the mappings and try again.',
          );
          this.publishing.set(false);
        },
      });
  }
}

function toEditable(mapping: FormTemplateMapping): EditableMapping {
  return { ...mapping };
}
