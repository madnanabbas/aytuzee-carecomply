import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { PayerLookup, PayerLookupService } from '../../../../core/lookups/payer-lookup.service';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientCoverage, SaveClientCoverageRequest } from '../../models/client-coverage.models';

interface CoverageDraft {
  payerId: string;
  manualMode: boolean;
  manualPayerName: string;
  memberId: string;
  medicaidId: string;
  effectiveFrom: string;
  effectiveTo: string;
  isVerified: boolean;
  isPrimary: boolean;
}

@Component({
  selector: 'app-client-coverages',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-coverages.html',
  styleUrls: ['../client-related-section.css'],
})
export class ClientCoveragesComponent implements OnInit {
  readonly clientId = input.required<string>();
  private readonly api = inject(ClientApiService);
  private readonly payersApi = inject(PayerLookupService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<readonly ClientCoverage[]>([]);
  readonly payers = signal<readonly PayerLookup[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editor = signal<ClientCoverage | 'new' | null>(null);
  readonly draft: CoverageDraft = this.emptyDraft();
  readonly canView = computed(() =>
    this.authorization.hasPermission(Permissions.ClientCoverage.View),
  );
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(Permissions.ClientCoverage.Create),
  );
  readonly canEdit = computed(() =>
    this.authorization.hasPermission(Permissions.ClientCoverage.Edit),
  );
  readonly canViewPayers = computed(() => this.authorization.hasPermission(Permissions.Payer.View));

  ngOnInit(): void {
    if (this.canView()) this.load();
  }

  open(item?: ClientCoverage): void {
    if (item ? !this.canEdit() : !this.canCreate()) return;
    this.editor.set(item ?? 'new');
    Object.assign(
      this.draft,
      item
        ? {
            payerId: item.payerId ?? '',
            manualMode: !item.payerId,
            manualPayerName: item.manualPayerName ?? '',
            memberId: item.memberId ?? '',
            medicaidId: item.medicaidId ?? '',
            effectiveFrom: item.effectiveFrom ?? '',
            effectiveTo: item.effectiveTo ?? '',
            isVerified: item.isVerified,
            isPrimary: item.isPrimary,
          }
        : this.emptyDraft(),
    );
    this.error.set(null);
  }

  setManualMode(manual: boolean): void {
    this.draft.manualMode = manual;
    if (manual) this.draft.payerId = '';
    else this.draft.manualPayerName = '';
  }

  close(): void {
    if (!this.saving()) this.editor.set(null);
  }

  valid(): boolean {
    return (
      (this.draft.manualMode ? !!this.draft.manualPayerName.trim() : !!this.draft.payerId) &&
      (!this.draft.effectiveFrom ||
        !this.draft.effectiveTo ||
        this.draft.effectiveTo >= this.draft.effectiveFrom)
    );
  }

  save(): void {
    const current = this.editor();
    if (!current || !this.valid() || this.saving()) return;
    const base: SaveClientCoverageRequest = {
      payerId: this.draft.manualMode ? null : this.draft.payerId,
      manualPayerName: this.draft.manualMode ? this.optional(this.draft.manualPayerName) : null,
      memberId: this.optional(this.draft.memberId),
      medicaidId: this.optional(this.draft.medicaidId),
      effectiveFrom: this.draft.effectiveFrom || null,
      effectiveTo: this.draft.effectiveTo || null,
      isVerified: this.draft.isVerified,
      isPrimary: this.draft.isPrimary,
    };
    this.saving.set(true);
    this.error.set(null);
    const request =
      current === 'new'
        ? this.api.createClientCoverage(this.clientId(), base)
        : this.api.updateClientCoverage(this.clientId(), current.id, {
            ...base,
            editorVersion: current.editorVersion,
          });
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.editor.set(null);
          this.load();
        },
        error: (response: HttpErrorResponse) =>
          this.error.set(
            response.status === 409
              ? 'This coverage conflicts with an existing primary coverage or was changed by another user.'
              : 'The coverage could not be saved. Check the details and try again.',
          ),
      });
  }

  displayDate(value: string | null): string {
    return value
      ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
          new Date(`${value}T00:00:00`),
        )
      : '—';
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      coverages: this.api.listClientCoverages(this.clientId()),
      payers: this.canViewPayers() ? this.payersApi.list() : of([] as readonly PayerLookup[]),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ coverages, payers }) => {
          this.items.set(coverages);
          this.payers.set(payers);
        },
        error: () => this.error.set('Client coverage could not be loaded.'),
      });
  }

  private emptyDraft(): CoverageDraft {
    return {
      payerId: '',
      manualMode: false,
      manualPayerName: '',
      memberId: '',
      medicaidId: '',
      effectiveFrom: '',
      effectiveTo: '',
      isVerified: false,
      isPrimary: false,
    };
  }

  private optional(value: string): string | null {
    return value.trim() || null;
  }
}
