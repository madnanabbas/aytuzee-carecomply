import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientCaregiverApiService } from '../../data-access/client-caregiver-api.service';
import {
  ClientCaregiver,
  ClientCaregiverCandidate,
  ClientCaregiverType,
  SaveClientCaregiverRequest,
} from '../../models/client-caregiver.models';
import { CLIENT_SERVICE_OPTIONS } from '../../models/client-service-catalog';

@Component({
  selector: 'app-client-caregivers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-caregivers.html',
  styleUrl: './client-caregivers.css',
})
export class ClientCaregiversComponent implements OnInit {
  readonly clientId = input.required<string>();
  private readonly api = inject(ClientCaregiverApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly canView = computed(() =>
    this.authorization.hasPermission(Permissions.ClientCaregiver.View),
  );
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(Permissions.ClientCaregiver.Create),
  );
  readonly canEdit = computed(() =>
    this.authorization.hasPermission(Permissions.ClientCaregiver.Edit),
  );
  readonly assignments = signal<readonly ClientCaregiver[]>([]);
  readonly activeCount = computed(
    () => this.assignments().filter((x) => this.effectiveStatus(x) === 'Active').length,
  );
  readonly primaryCount = computed(
    () =>
      this.assignments().filter((x) => this.effectiveStatus(x) === 'Active' && x.type === 'Primary')
        .length,
  );
  readonly backupCount = computed(
    () =>
      this.assignments().filter((x) => this.effectiveStatus(x) === 'Active' && x.type === 'Backup')
        .length,
  );
  readonly candidates = signal<readonly ClientCaregiverCandidate[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal<ClientCaregiver | null>(null);
  readonly servicesOpen = signal(false);
  readonly serviceOptions = CLIENT_SERVICE_OPTIONS;
  readonly relationshipOptions = [
    'Professional caregiver',
    'Spouse or partner',
    'Parent',
    'Child',
    'Sibling',
    'Other relative',
    'Friend',
    'Other',
  ] as const;
  readonly draft = {
    userId: '',
    type: 'Primary' as ClientCaregiverType,
    isPreferred: true,
    services: '',
    startDate: '',
    endDate: '',
    notes: '',
    relationshipToClient: '',
    livesWithClient: null as boolean | null,
  };

  ngOnInit(): void {
    this.add();
    if (this.canView()) this.load();
    else this.loading.set(false);
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      assignments: this.api.list(this.clientId()),
      candidates: this.api.candidates(this.clientId()),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (x) => {
          this.assignments.set(x.assignments);
          this.candidates.set(x.candidates);
        },
        error: () => this.error.set('Primary caregivers could not be loaded.'),
      });
  }
  add(): void {
    this.editing.set(null);
    this.servicesOpen.set(false);
    Object.assign(this.draft, {
      userId: '',
      type: 'Primary',
      isPreferred: true,
      services: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      notes: '',
      relationshipToClient: '',
      livesWithClient: null,
    });
  }
  edit(value: ClientCaregiver): void {
    this.editing.set(value);
    this.servicesOpen.set(false);
    Object.assign(this.draft, {
      userId: value.userId,
      type: value.type,
      isPreferred: value.isPreferred,
      services: value.services,
      startDate: value.startDate,
      endDate: value.endDate ?? '',
      notes: value.notes,
      relationshipToClient: value.relationshipToClient ?? '',
      livesWithClient: value.livesWithClient ?? null,
    });
  }
  close(): void {
    if (!this.saving()) {
      this.servicesOpen.set(false);
      this.add();
    }
  }
  save(): void {
    if (this.saving() || !this.draft.userId || !this.draft.startDate || this.invalidDates()) return;
    if (!this.draft.relationshipToClient || this.draft.livesWithClient === null) return;
    const current = this.editing();
    const request: SaveClientCaregiverRequest = {
      userId: this.draft.userId,
      type: this.draft.type,
      isPreferred: this.draft.isPreferred,
      services: this.draft.services.trim() || null,
      startDate: this.draft.startDate,
      endDate: this.draft.endDate || null,
      notes: this.draft.notes.trim() || null,
      relationshipToClient: this.draft.relationshipToClient,
      livesWithClient: this.draft.livesWithClient,
      ...(current ? { editorVersion: current.editorVersion } : {}),
    };
    this.persist(
      current
        ? this.api.update(this.clientId(), current.id, request)
        : this.api.create(this.clientId(), request),
      !!current,
    );
  }
  end(value: ClientCaregiver): void {
    if (!window.confirm(`End the caregiver assignment for ${value.name}?`)) return;
    this.persist(this.api.end(this.clientId(), value, this.today()), true);
  }
  invalidDates(): boolean {
    return !!this.draft.endDate && this.draft.endDate < this.draft.startDate;
  }
  effectiveStatus(value: ClientCaregiver): 'Active' | 'Ended' {
    if (!value.endDate) return value.status;
    if (value.endDate > this.today()) return 'Active';
    if (value.endDate < this.today()) return 'Ended';
    return value.status;
  }
  serviceSelected(service: string): boolean {
    return this.selectedServices().includes(service);
  }
  toggleServicesDropdown(): void {
    this.servicesOpen.update((open) => !open);
  }
  toggleService(service: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const selected = new Set(this.selectedServices());
    event.target.checked ? selected.add(service) : selected.delete(service);
    this.draft.services = this.serviceOptions.filter((option) => selected.has(option)).join(', ');
  }
  selectedServicesLabel(): string {
    const values = this.selectedServices();
    if (!values.length) return 'Select services';
    if (values.length <= 2) return values.join(', ');
    return `${values.slice(0, 2).join(', ')} +${values.length - 2}`;
  }
  date(value: string | null): string {
    return value ? new Intl.DateTimeFormat('en-US').format(new Date(`${value}T00:00:00`)) : '—';
  }
  private selectedServices(): string[] {
    return this.draft.services
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  private today(): string {
    const value = new Date();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
  private message(status?: number): string {
    return status === 409
      ? 'The assignment conflicts with an existing primary caregiver or has changed. Refresh and try again.'
      : 'The caregiver assignment could not be saved.';
  }
  private persist(
    operation: ReturnType<ClientCaregiverApiService['create']>,
    replace: boolean,
  ): void {
    this.saving.set(true);
    this.error.set(null);
    operation
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.assignments.update((items) =>
            replace ? items.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...items],
          );
          this.add();
        },
        error: (e) => this.error.set(this.message(e?.status)),
      });
  }
}
