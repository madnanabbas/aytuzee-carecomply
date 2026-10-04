import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ClientViewModel, RelatedRecordPreviewRow } from './client-view.models';

@Component({
  selector: 'app-client-view-overview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-view-overview.html',
  styleUrl: './client-view-page.css',
})
export class ClientViewOverviewComponent {
  @Input({ required: true }) client!: ClientViewModel;
  @Input() documents: readonly RelatedRecordPreviewRow[] = [];
  @Input() canEditClient = false;
  @Input() hasSsn = false;
  @Input() canRevealSsn = false;
  @Input() ssn = '***-**-****';
  @Input() ssnRevealing = false;
  @Input() ssnError: string | null = null;

  @Output() readonly revealRequested = new EventEmitter<void>();
  @Output() readonly hideRequested = new EventEmitter<void>();

  revealSsn(): void {
    this.revealRequested.emit();
  }

  hideSsn(): void {
    this.hideRequested.emit();
  }

  statusClass(status: string): string {
    const normalized = status.toLowerCase();
    if (
      normalized.includes('current') ||
      normalized.includes('active') ||
      normalized.includes('complete') ||
      normalized.includes('delivered')
    ) {
      return 'bg-green-50 text-success ring-green-200';
    }
    if (
      normalized.includes('expiring') ||
      normalized.includes('progress') ||
      normalized.includes('pending')
    ) {
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    }
    if (
      normalized.includes('missing') ||
      normalized.includes('expired') ||
      normalized.includes('overdue')
    ) {
      return 'bg-red-50 text-danger ring-red-200';
    }
    return 'bg-surface-muted text-text-secondary ring-border';
  }
}
