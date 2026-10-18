import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientCoverage } from '../../models/client-coverage.models';
import {
  ClientServiceAgreement,
  ClientServiceAgreementLine,
  ClientServiceAgreementPriority,
  ClientServiceAgreementStatus,
  ClientServiceAgreementUnitType,
  ClientServiceAgreementWarning,
  CreateClientServiceAgreementRequest,
  UpdateClientServiceAgreementRequest,
} from '../../models/client-service-agreement.models';

interface AgreementDraft {
  agreementNumber: string;
  payerId: string;
  clientCoverageId: string;
  manualPayerMode: boolean;
  payerName: string;
  insuredMemberId: string;
  priorAuthorizationNumber: string;
  startDate: string;
  endDate: string;
  status: ClientServiceAgreementStatus | '';
  priority: ClientServiceAgreementPriority | '';
  isDummy: boolean;
  notes: string;
}

interface DiagnosisDraft {
  id?: string;
  diagnosisText: string;
  icdCode: string;
  isPrimary: boolean;
}

export interface AgreementLineDraft {
  id?: string;
  serviceCode: string;
  serviceName: string;
  unitType: ClientServiceAgreementUnitType | '';
  minutesPerUnit: number | null;
  authorizedUnits: number | null;
  ratePerUnit: number | null;
  plannedHoursPerVisit: number | null;
  plannedVisitsPerWeek: number | null;
  startDate: string;
  endDate: string;
  rateEffectiveFrom: string;
  rateEffectiveTo: string;
  authorizedBudgetAmount: number | null;
  diagnoses: DiagnosisDraft[];
}

@Component({
  selector: 'app-client-service-agreements',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-service-agreements.html',
  styleUrls: ['../client-related-section.css', './client-service-agreements.css'],
})
export class ClientServiceAgreementsComponent implements OnInit {
  readonly statusOptions: readonly { value: ClientServiceAgreementStatus; label: string }[] = [
    { value: 'Draft', label: 'Draft' },
    { value: 'PendingAuthorization', label: 'Pending authorization' },
    { value: 'Active', label: 'Active' },
    { value: 'OnHold', label: 'On hold' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Terminated', label: 'Terminated' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];
  readonly priorityOptions: readonly ClientServiceAgreementPriority[] = [
    'Normal',
    'High',
    'Urgent',
  ];
  readonly unitTypeOptions: readonly { value: ClientServiceAgreementUnitType; label: string }[] = [
    { value: 'FifteenMinutes', label: '15 Minutes' },
    { value: 'Hour', label: 'Hour' },
    { value: 'Visit', label: 'Visit' },
    { value: 'Day', label: 'Day' },
    { value: 'PerDiem', label: 'Per Diem' },
    { value: 'ServiceUnit', label: 'Service Unit' },
    { value: 'DollarAmount', label: 'Dollar Amount' },
  ];
  readonly clientId = input.required<string>();
  private readonly api = inject(ClientApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<readonly ClientServiceAgreement[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadingEditor = signal(false);
  readonly error = signal<string | null>(null);
  readonly editorOpen = signal(false);
  readonly editing = signal<ClientServiceAgreement | null>(null);
  readonly expandedId = signal<string | null>(null);
  readonly lines = signal<AgreementLineDraft[]>([]);
  readonly coverages = signal<readonly ClientCoverage[]>([]);
  readonly saveWarnings = signal<readonly ClientServiceAgreementWarning[]>([]);

  readonly canView = computed(() =>
    this.authorization.hasPermission(Permissions.ClientServiceAgreement.View),
  );
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(Permissions.ClientServiceAgreement.Create),
  );
  readonly canEdit = computed(() =>
    this.authorization.hasPermission(Permissions.ClientServiceAgreement.Edit),
  );
  readonly canViewCoverage = computed(() =>
    this.authorization.hasPermission(Permissions.ClientCoverage.View),
  );

  readonly draft: AgreementDraft = this.emptyDraft();

  ngOnInit(): void {
    if (this.canView()) this.load();
    if (this.canViewCoverage()) this.loadCoverages();
  }

  load(): void {
    if (!this.canView()) return;
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listClientServiceAgreements(this.clientId())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => this.items.set(items),
        error: () => this.error.set('Service agreements could not be loaded.'),
      });
  }

  startCreate(): void {
    if (!this.canCreate() || this.saving()) return;
    this.editing.set(null);
    Object.assign(this.draft, this.emptyDraft());
    const preferredCoverage =
      this.coverages().find((coverage) => coverage.isPrimary) ?? this.coverages()[0];
    if (preferredCoverage) this.selectCoverage(preferredCoverage.id);
    this.lines.set([this.emptyLine()]);
    this.error.set(null);
    this.saveWarnings.set([]);
    this.editorOpen.set(true);
  }

  startEdit(item: ClientServiceAgreement): void {
    if (!this.canEdit() || this.loadingEditor()) return;
    this.loadingEditor.set(true);
    this.error.set(null);
    this.saveWarnings.set([]);
    this.api
      .getClientServiceAgreement(this.clientId(), item.id)
      .pipe(
        finalize(() => this.loadingEditor.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (agreement) => {
          this.editing.set(agreement);
          Object.assign(this.draft, {
            agreementNumber: agreement.agreementNumber ?? '',
            payerId: agreement.payerId ?? '',
            clientCoverageId: agreement.clientCoverageId ?? '',
            manualPayerMode: !agreement.clientCoverageId && !agreement.payerId,
            payerName: agreement.payerName ?? '',
            insuredMemberId: agreement.insuredMemberId ?? '',
            priorAuthorizationNumber: agreement.priorAuthorizationNumber ?? '',
            startDate: agreement.startDate,
            endDate: agreement.endDate ?? '',
            status: agreement.status ?? '',
            priority: agreement.priority ?? '',
            isDummy: agreement.isDummy,
            notes: agreement.notes ?? '',
          });
          this.lines.set(agreement.lines.map((line) => this.toDraft(line)));
          this.editorOpen.set(true);
        },
        error: () => this.error.set('The service agreement could not be opened.'),
      });
  }

  closeEditor(): void {
    if (this.saving()) return;
    this.editorOpen.set(false);
    this.editing.set(null);
    this.lines.set([]);
    Object.assign(this.draft, this.emptyDraft());
    this.error.set(null);
  }

  addLine(): void {
    if (this.lines().length >= 25) return;
    this.lines.update((lines) => [...lines, this.emptyLine()]);
  }

  removeLine(index: number): void {
    const line = this.lines()[index];
    if (!line || line.id) return;
    this.lines.update((lines) => lines.filter((_, current) => current !== index));
  }

  addDiagnosis(line: AgreementLineDraft): void {
    if (line.diagnoses.length >= 25) return;
    line.diagnoses.push({ diagnosisText: '', icdCode: '', isPrimary: false });
  }

  removeDiagnosis(line: AgreementLineDraft, index: number): void {
    line.diagnoses.splice(index, 1);
  }

  selectPrimaryDiagnosis(line: AgreementLineDraft, selectedIndex: number, isPrimary = true): void {
    line.diagnoses.forEach((diagnosis, index) => {
      diagnosis.isPrimary = isPrimary && index === selectedIndex;
    });
  }

  save(): void {
    if (this.saving() || !this.valid()) return;
    const current = this.editing();
    const base = {
      agreementNumber: this.optional(this.draft.agreementNumber),
      payerId: this.draft.manualPayerMode ? null : this.draft.payerId || null,
      clientCoverageId: this.draft.manualPayerMode ? null : this.draft.clientCoverageId || null,
      payerName: this.optional(this.draft.payerName),
      insuredMemberId: this.optional(this.draft.insuredMemberId),
      priorAuthorizationNumber: this.optional(this.draft.priorAuthorizationNumber),
      startDate: this.draft.startDate,
      endDate: this.draft.endDate || null,
      status: this.draft.status || null,
      priority: this.draft.priority || null,
      isDummy: this.draft.isDummy,
      notes: this.optional(this.draft.notes),
      lines: this.lines().map((line) => ({
        ...(line.id ? { id: line.id } : {}),
        serviceCode: line.serviceCode.trim(),
        serviceName: line.serviceName.trim(),
        unitType: line.unitType || null,
        minutesPerUnit: line.minutesPerUnit,
        authorizedUnits: line.authorizedUnits,
        ratePerUnit: line.ratePerUnit,
        plannedHoursPerVisit: line.plannedHoursPerVisit,
        plannedVisitsPerWeek: line.plannedVisitsPerWeek,
        startDate: line.startDate,
        endDate: line.endDate || null,
        rateEffectiveFrom: line.rateEffectiveFrom || null,
        rateEffectiveTo: line.rateEffectiveTo || null,
        authorizedBudgetAmount: line.authorizedBudgetAmount,
        diagnoses: line.diagnoses.map((diagnosis) => ({
          ...(diagnosis.id ? { id: diagnosis.id } : {}),
          diagnosisText: this.optional(diagnosis.diagnosisText),
          icdCode: this.optional(diagnosis.icdCode),
          isPrimary: diagnosis.isPrimary,
        })),
      })),
    };
    this.saving.set(true);
    this.error.set(null);
    const request = current
      ? this.api.updateClientServiceAgreement(this.clientId(), current.id, {
          ...base,
          editorVersion: current.editorVersion,
        } satisfies UpdateClientServiceAgreementRequest)
      : this.api.createClientServiceAgreement(
          this.clientId(),
          base satisfies CreateClientServiceAgreementRequest,
        );
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.items.update((items) =>
            current
              ? items.map((item) => (item.id === saved.id ? saved : item))
              : [saved, ...items],
          );
          this.saveWarnings.set(saved.warnings);
          this.editorOpen.set(false);
          this.editing.set(null);
          this.lines.set([]);
          Object.assign(this.draft, this.emptyDraft());
        },
        error: (response: HttpErrorResponse) => {
          this.error.set(
            response.status === 409
              ? 'This service agreement was changed by another user. Reload or reopen it to edit the latest data.'
              : 'The service agreement could not be saved. Check the details and try again.',
          );
        },
      });
  }

  valid(): boolean {
    return (
      !!this.draft.startDate &&
      (!this.draft.manualPayerMode || !!this.draft.payerName.trim()) &&
      (!this.draft.endDate || this.draft.endDate >= this.draft.startDate) &&
      this.lines().length > 0 &&
      this.lines().every((line) => this.validLine(line))
    );
  }

  invalidDates(): boolean {
    return (
      !!this.draft.endDate && !!this.draft.startDate && this.draft.endDate < this.draft.startDate
    );
  }

  selectCoverage(value: string): void {
    if (value === '__manual__') {
      this.draft.manualPayerMode = true;
      this.draft.clientCoverageId = '';
      this.draft.payerId = '';
      this.draft.payerName = '';
      this.draft.insuredMemberId = '';
      return;
    }
    this.draft.manualPayerMode = false;
    this.draft.clientCoverageId = value;
    const coverage = this.coverages().find((item) => item.id === value);
    this.draft.payerId = coverage?.payerId ?? '';
    this.draft.payerName = coverage?.payerName ?? '';
    this.draft.insuredMemberId = coverage?.memberId ?? '';
  }

  setAgreementStartDate(value: string): void {
    this.draft.startDate = value;
    this.lines.update((lines) =>
      lines.map((line) => (line.startDate ? line : { ...line, startDate: value })),
    );
  }

  toggleDetails(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  warningsForLine(
    item: ClientServiceAgreement,
    lineId: string,
  ): readonly ClientServiceAgreementWarning[] {
    return item.warnings.filter((warning) => warning.serviceLineId === lineId);
  }

  overlapPeriod(warning: ClientServiceAgreementWarning): string {
    return `${this.displayDate(warning.overlapStartDate)} – ${this.displayDate(warning.overlapEndDate)}`;
  }

  servicesSummary(item: ClientServiceAgreement): string {
    return item.lines.map((line) => line.serviceName || line.serviceCode).join(', ') || '—';
  }

  authorizedUnitsSummary(item: ClientServiceAgreement): string {
    const values = item.lines.filter((line) => line.authorizedUnits !== null);
    if (!values.length) return '—';
    const unitTypes = new Set(
      values.map((line) => (line.unitType ?? 'units').trim().toLowerCase()),
    );
    if (unitTypes.size > 1) return 'Multiple unit types';
    const total = values.reduce((sum, line) => sum + (line.authorizedUnits ?? 0), 0);
    return `${this.number(total)} (${this.unitTypeLabel(values[0].unitType)})`;
  }

  estimatedBudgetSummary(item: ClientServiceAgreement): string {
    const values = item.lines
      .map((line) => line.estimatedBudget)
      .filter((value): value is number => value !== null);
    return values.length ? this.currency(values.reduce((sum, value) => sum + value, 0)) : '—';
  }

  displayDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
      new Date(`${value}T00:00:00`),
    );
  }

  number(value: number | null): string {
    return value === null
      ? '—'
      : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  }

  currency(value: number | null): string {
    return value === null
      ? '—'
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  optionLabel(options: readonly { value: string; label: string }[], value: string | null): string {
    return options.find((option) => option.value === value)?.label ?? value ?? '—';
  }

  unitTypeLabel(value: ClientServiceAgreementUnitType | null): string {
    return value ? this.optionLabel(this.unitTypeOptions, value) : 'Units';
  }

  private validLine(line: AgreementLineDraft): boolean {
    return (
      !!line.serviceCode.trim() &&
      !!line.serviceName.trim() &&
      !!line.startDate &&
      (!line.endDate || line.endDate >= line.startDate) &&
      (!line.rateEffectiveFrom ||
        !line.rateEffectiveTo ||
        line.rateEffectiveTo >= line.rateEffectiveFrom) &&
      (line.authorizedBudgetAmount === null || line.authorizedBudgetAmount >= 0) &&
      (line.authorizedUnits === null || line.authorizedUnits >= 0) &&
      (line.ratePerUnit === null || line.ratePerUnit >= 0) &&
      (line.minutesPerUnit === null || line.minutesPerUnit > 0) &&
      (line.plannedHoursPerVisit === null || line.plannedHoursPerVisit >= 0) &&
      (line.plannedVisitsPerWeek === null || line.plannedVisitsPerWeek >= 0)
    );
  }

  private optional(value: string): string | null {
    return value.trim() || null;
  }

  private emptyDraft(): AgreementDraft {
    return {
      agreementNumber: '',
      payerId: '',
      clientCoverageId: '',
      manualPayerMode: false,
      payerName: '',
      insuredMemberId: '',
      priorAuthorizationNumber: '',
      startDate: '',
      endDate: '',
      status: '',
      priority: '',
      isDummy: false,
      notes: '',
    };
  }

  private emptyLine(): AgreementLineDraft {
    return {
      serviceCode: '',
      serviceName: '',
      unitType: '',
      minutesPerUnit: null,
      authorizedUnits: null,
      ratePerUnit: null,
      plannedHoursPerVisit: null,
      plannedVisitsPerWeek: null,
      startDate: this.draft.startDate,
      endDate: '',
      rateEffectiveFrom: '',
      rateEffectiveTo: '',
      authorizedBudgetAmount: null,
      diagnoses: [],
    };
  }

  private toDraft(line: ClientServiceAgreementLine): AgreementLineDraft {
    return {
      id: line.id,
      serviceCode: line.serviceCode,
      serviceName: line.serviceName,
      unitType: line.unitType ?? '',
      minutesPerUnit: line.minutesPerUnit,
      authorizedUnits: line.authorizedUnits,
      ratePerUnit: line.ratePerUnit,
      plannedHoursPerVisit: line.plannedHoursPerVisit,
      plannedVisitsPerWeek: line.plannedVisitsPerWeek,
      startDate: line.startDate,
      endDate: line.endDate ?? '',
      rateEffectiveFrom: line.rateEffectiveFrom ?? '',
      rateEffectiveTo: line.rateEffectiveTo ?? '',
      authorizedBudgetAmount: line.authorizedBudgetAmount,
      diagnoses: line.diagnoses.map((diagnosis) => ({
        id: diagnosis.id,
        diagnosisText: diagnosis.diagnosisText ?? '',
        icdCode: diagnosis.icdCode ?? '',
        isPrimary: diagnosis.isPrimary,
      })),
    };
  }

  private loadCoverages(): void {
    this.api
      .listClientCoverages(this.clientId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.coverages.set(items),
        error: () => this.coverages.set([]),
      });
  }
}
