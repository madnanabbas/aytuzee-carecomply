import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientHospitalizationApiService } from '../../data-access/client-hospitalization-api.service';
import {
  ClientHospitalization,
  SaveClientHospitalization,
} from '../../models/client-hospitalization.models';
@Component({
  selector: 'app-client-hospitalizations',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-hospitalizations.html',
  styleUrl: '../client-related-section.css',
})
export class ClientHospitalizationsComponent implements OnInit {
  readonly clientId = input.required<string>();
  private readonly api = inject(ClientHospitalizationApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly items = signal<readonly ClientHospitalization[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal<ClientHospitalization | null>(null);
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(Permissions.ClientHospitalization.Create),
  );
  readonly canEdit = computed(() =>
    this.authorization.hasPermission(Permissions.ClientHospitalization.Edit),
  );
  readonly canView = computed(() =>
    this.authorization.hasPermission(Permissions.ClientHospitalization.View),
  );
  readonly draft = {
    hospitalName: '',
    admittedAt: '',
    dischargedAt: '',
    reason: '',
    diagnosis: '',
    dischargeInstructions: '',
  };
  ngOnInit(): void {
    this.resetDraft();
    if (this.canView()) this.load();
    else this.loading.set(false);
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(this.clientId())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (x) => this.items.set(x),
        error: () => this.error.set('Hospitalizations could not be loaded.'),
      });
  }
  add(): void {
    if (!this.saving()) this.resetDraft();
  }
  edit(x: ClientHospitalization): void {
    this.editing.set(x);
    Object.assign(this.draft, {
      hospitalName: x.hospitalName,
      admittedAt: this.local(x.admittedAtUtc),
      dischargedAt: x.dischargedAtUtc ? this.local(x.dischargedAtUtc) : '',
      reason: x.reason,
      diagnosis: x.diagnosis,
      dischargeInstructions: x.dischargeInstructions,
    });
    this.error.set(null);
  }
  close(): void {
    if (!this.saving()) this.resetDraft();
  }

  save(): void {
    if (
      this.saving() ||
      !this.draft.hospitalName.trim() ||
      !this.draft.admittedAt ||
      !this.draft.reason.trim() ||
      this.invalid()
    )
      return;
    const current = this.editing();
    const request: SaveClientHospitalization = {
      hospitalName: this.draft.hospitalName.trim(),
      admittedAtUtc: new Date(this.draft.admittedAt).toISOString(),
      dischargedAtUtc: this.draft.dischargedAt
        ? new Date(this.draft.dischargedAt).toISOString()
        : null,
      reason: this.draft.reason.trim(),
      diagnosis: this.draft.diagnosis.trim() || null,
      dischargeInstructions: this.draft.dischargeInstructions.trim() || null,
      ...(current ? { editorVersion: current.editorVersion } : {}),
    };
    this.saving.set(true);
    this.error.set(null);
    (current
      ? this.api.update(this.clientId(), current.id, request)
      : this.api.create(this.clientId(), request)
    )
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (x) => {
          this.items.update((items) =>
            current
              ? items.map((item) => (item.id === x.id ? x : item))
              : [x, ...items].sort(
                  (a, b) => Date.parse(b.admittedAtUtc) - Date.parse(a.admittedAtUtc),
                ),
          );
          this.resetDraft();
        },
        error: () =>
          this.error.set('Could not save the hospitalization. Check the details and try again.'),
      });
  }

  invalid(): boolean {
    return !!this.draft.dischargedAt && this.draft.dischargedAt < this.draft.admittedAt;
  }

  valid(): boolean {
    return (
      !!this.draft.hospitalName.trim() &&
      !!this.draft.admittedAt &&
      !!this.draft.reason.trim() &&
      !this.invalid() &&
      this.draft.hospitalName.length <= 200 &&
      this.draft.reason.length <= 1000 &&
      this.draft.diagnosis.length <= 2000 &&
      this.draft.dischargeInstructions.length <= 2000
    );
  }

  hasUnsavedDraft(): boolean {
    return (
      this.editing() !== null ||
      !!this.draft.hospitalName.trim() ||
      !!this.draft.admittedAt ||
      !!this.draft.dischargedAt ||
      !!this.draft.reason.trim() ||
      !!this.draft.diagnosis.trim() ||
      !!this.draft.dischargeInstructions.trim()
    );
  }

  canLeaveStep(): boolean {
    if (!this.hasUnsavedDraft()) return true;
    this.error.set('Save the hospitalization or cancel your changes before continuing.');
    return false;
  }

  display(x: string | null): string {
    return x
      ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(x),
        )
      : '—';
  }
  private local(x: string): string {
    const d = new Date(x);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  private resetDraft(): void {
    this.editing.set(null);
    Object.assign(this.draft, {
      hospitalName: '',
      admittedAt: '',
      dischargedAt: '',
      reason: '',
      diagnosis: '',
      dischargeInstructions: '',
    });
    this.error.set(null);
  }
}
