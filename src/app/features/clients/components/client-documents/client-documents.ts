import { Component, computed, DestroyRef, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientDocumentApiService } from '../../data-access/client-document-api.service';
import {
  ClientDocument,
  ClientDocumentDetails,
  ClientDocumentMetadata,
} from '../../models/client-document.models';

@Component({
  selector: 'app-client-documents',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-documents.html',
})
export class ClientDocumentsComponent {
  private readonly api = inject(ClientDocumentApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  private clientIdentifier = '';

  @Input({ required: true })
  set clientId(value: string) {
    if (value && value !== this.clientIdentifier) {
      this.clientIdentifier = value;
      this.load();
    }
  }

  readonly documents = signal<readonly ClientDocument[]>([]);
  readonly selected = signal<ClientDocumentDetails | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly showEditor = signal(false);
  readonly replacing = signal(false);
  readonly canUpload = computed(() =>
    this.authorization.hasPermission(Permissions.ClientDocument.Upload),
  );
  readonly canDownload = computed(() =>
    this.authorization.hasPermission(Permissions.ClientDocument.Download),
  );
  readonly canReplace = computed(() =>
    this.authorization.hasPermission(Permissions.ClientDocument.Replace),
  );
  readonly canArchive = computed(() =>
    this.authorization.hasPermission(Permissions.ClientDocument.Archive),
  );
  readonly draft: ClientDocumentMetadata = {
    category: '',
    title: '',
    description: '',
    expiryDate: '',
    reviewDate: '',
  };
  file: File | null = null;

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(this.clientIdentifier)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => this.documents.set(items),
        error: () => this.error.set('Documents could not be loaded.'),
      });
  }

  open(document: ClientDocument): void {
    this.error.set(null);
    this.api
      .get(this.clientIdentifier, document.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (details) => this.selected.set(details),
        error: () => this.error.set('Document details could not be loaded.'),
      });
  }

  beginUpload(): void {
    this.resetDraft();
    this.selected.set(null);
    this.replacing.set(false);
    this.showEditor.set(true);
  }

  beginEdit(details: ClientDocumentDetails): void {
    const item = details.document;
    Object.assign(this.draft, {
      category: item.category,
      title: item.title,
      description: item.description ?? '',
      expiryDate: item.expiryDate ?? '',
      reviewDate: item.reviewDate ?? '',
    });
    this.file = null;
    this.replacing.set(false);
    this.showEditor.set(true);
  }

  chooseFile(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.item(0) ?? null;
  }

  save(): void {
    if (this.busy() || !this.draft.category.trim() || !this.draft.title.trim()) return;
    const selected = this.selected();
    const request = selected
      ? this.api.update(
          this.clientIdentifier,
          selected.document.id,
          this.draft,
          selected.document.editorVersion,
        )
      : this.file
        ? this.api.upload(this.clientIdentifier, this.draft, this.file)
        : null;
    if (!request) {
      this.error.set('Choose a PDF, JPEG or PNG file.');
      return;
    }
    this.run(request);
  }

  replace(): void {
    const selected = this.selected();
    if (!selected || !this.file) {
      this.error.set('Choose a PDF, JPEG or PNG file.');
      return;
    }
    this.run(
      this.api.replace(
        this.clientIdentifier,
        selected.document.id,
        selected.document.editorVersion,
        this.file,
      ),
    );
  }

  archive(): void {
    const selected = this.selected();
    if (
      !selected ||
      !confirm('Archive this document? It will remain in the audit and version history.')
    )
      return;
    this.run(
      this.api.archive(
        this.clientIdentifier,
        selected.document.id,
        selected.document.editorVersion,
      ),
    );
  }

  download(documentId: string, versionId: string, fileName: string): void {
    this.api
      .download(this.clientIdentifier, documentId, versionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = fileName;
          anchor.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.error.set('The document could not be downloaded.'),
      });
  }

  close(): void {
    this.selected.set(null);
    this.showEditor.set(false);
    this.file = null;
  }

  formatSize(bytes: number): string {
    return bytes < 1024 * 1024
      ? `${Math.ceil(bytes / 1024)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private run(request: ReturnType<ClientDocumentApiService['archive']>): void {
    this.busy.set(true);
    this.error.set(null);
    request
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (details) => {
          this.selected.set(details);
          this.showEditor.set(false);
          this.file = null;
          this.load();
        },
        error: (error: { status?: number }) =>
          this.error.set(
            error.status === 409
              ? 'The document changed or this file is already stored. Refresh and try again.'
              : 'The document could not be saved.',
          ),
      });
  }

  private resetDraft(): void {
    Object.assign(this.draft, {
      category: '',
      title: '',
      description: '',
      expiryDate: '',
      reviewDate: '',
    });
    this.file = null;
  }
}
