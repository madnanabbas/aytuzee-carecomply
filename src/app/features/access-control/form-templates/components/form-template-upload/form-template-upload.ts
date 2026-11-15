import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  FormTemplateApiService,
  formTemplateErrorMessage,
  formTemplateWarningMessage,
} from '../../data-access/form-template-api.service';
import { FormTemplateMutationResponse } from '../../models/form-template.models';

const MAXIMUM_FILE_BYTES = 10 * 1024 * 1024;
@Component({
  selector: 'app-form-template-upload',
  standalone: true,
  templateUrl: './form-template-upload.html',
})
export class FormTemplateUploadComponent {
  private readonly api = inject(FormTemplateApiService);

  @Input({ required: true }) mode: 'new' | 'version' = 'new';
  @Input() templateId: string | null = null;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly completed = new EventEmitter<FormTemplateMutationResponse>();

  readonly selectedFile = signal<File | null>(null);
  readonly fileError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly result = signal<FormTemplateMutationResponse | null>(null);
  readonly dragging = signal(false);
  readonly warningMessage = formTemplateWarningMessage;

  submit(form: HTMLFormElement): void {
    if (this.uploading() || this.result()) return;
    const file = this.selectedFile();
    if (!file || !form.reportValidity()) {
      if (!file) this.fileError.set('Choose a PDF file.');
      return;
    }

    const data = new FormData(form);
    const request$ =
      this.mode === 'new'
        ? this.api.uploadTemplate({
            key: String(data.get('key') ?? '').trim(),
            name: String(data.get('name') ?? '').trim(),
            description: String(data.get('description') ?? '').trim(),
            category: String(data.get('category') ?? '').trim(),
            file,
          })
        : this.api.uploadVersion(this.templateId ?? '', file);

    this.uploading.set(true);
    this.progress.set(0);
    this.submitError.set(null);
    request$.pipe(finalize(() => this.uploading.set(false))).subscribe({
      next: (event) => {
        if (event.kind === 'progress') {
          this.progress.set(event.percent);
          return;
        }
        this.progress.set(100);
        this.result.set(event.response);
        this.completed.emit(event.response);
      },
      error: (error: unknown) => this.submitError.set(formTemplateErrorMessage(error)),
    });
  }

  chooseFile(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.validateFile(event.target.files?.[0] ?? null);
    }
  }

  drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.validateFile(event.dataTransfer?.files[0] ?? null);
  }

  dragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  private validateFile(file: File | null): void {
    this.selectedFile.set(null);
    this.fileError.set(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.fileError.set('Choose a file with a .pdf extension.');
      return;
    }
    if (file.size > MAXIMUM_FILE_BYTES) {
      this.fileError.set('Choose a PDF no larger than 10 MB.');
      return;
    }
    this.selectedFile.set(file);
  }
}
