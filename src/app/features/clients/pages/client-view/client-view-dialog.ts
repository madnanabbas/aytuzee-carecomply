import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ClientDialog, ClientDialogDraft, DialogDefinition } from './client-view.models';

@Component({
  selector: 'app-client-view-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-view-dialog.html',
  styleUrl: './client-view-page.css',
})
export class ClientViewDialogComponent {
  @Input({ required: true }) dialog!: Exclude<ClientDialog, null>;
  @Input() definition: DialogDefinition | null = null;
  @Input({ required: true }) draft!: ClientDialogDraft;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly submitted = new EventEmitter<void>();

  closeDialog(): void {
    this.closed.emit();
  }

  submitDialog(): void {
    this.submitted.emit();
  }
}
