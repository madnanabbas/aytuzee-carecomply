import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientApiService } from '../../data-access/client-api.service';
import {
  ClientListApiItem,
  ClientListQuery,
  ClientListResponse,
  ClientProgramTypeCode,
  ClientStatusCode,
  DEFAULT_CLIENT_LIST_QUERY,
} from '../../models/client-api.models';
import {
  clientProgramLabel,
  clientStatusLabel,
  formatDateForDisplay,
} from '../../models/client-presentation';

interface ClientListViewItem {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly goesBy: string;
  readonly pmi: string;
  readonly phone: string;
  readonly program: string;
  readonly services: readonly string[];
  readonly location: string;
  readonly socDate: string;
  readonly supervisor: string;
  readonly status: string;
  readonly onboarding: boolean;
  readonly attentionCount: number;
}

@Component({
  selector: 'app-client-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-list-page.html',
})
export class ClientListPageComponent {
  private readonly api = inject(ClientApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reloadRequested = new Subject<void>();
  private readonly searchChanged = new Subject<string>();

  readonly canCreateClient = computed(() =>
    this.authorization.hasPermission(Permissions.Client.Create)
  );

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly searchDraft = signal('');
  readonly response = signal<ClientListResponse | null>(null);
  readonly query = signal<ClientListQuery>(DEFAULT_CLIENT_LIST_QUERY);
  readonly clients = computed<readonly ClientListViewItem[]>(() =>
    (this.response()?.items ?? []).map((item) => this.toViewItem(item)),
  );
  readonly totalCount = computed(() => this.response()?.totalCount ?? 0);
  readonly activeCount = computed(() =>
    this.response()?.activeCount ?? this.clients().filter((client) => client.status === 'Active').length,
  );
  readonly onboardingCount = computed(() =>
    this.response()?.onboardingCount ?? this.clients().filter((client) => client.onboarding).length,
  );
  readonly attentionCount = computed(() =>
    this.clients().filter((client) => client.attentionCount > 0).length,
  );
  readonly totalPages = computed(() => {
    const response = this.response();
    return response ? Math.max(1, Math.ceil(response.totalCount / response.pageSize)) : 1;
  });
  readonly locations = computed(() => {
    const serverLocations = this.response()?.availableLocations ?? [];
    const pageLocations = this.clients().map((client) => client.location).filter(Boolean);
    return [...new Set([...serverLocations, ...pageLocations])].sort((a, b) => a.localeCompare(b));
  });

  readonly programOptions = [
    { value: ClientProgramTypeCode.PcaTraditional, label: 'PCA Traditional' },
    { value: ClientProgramTypeCode.PcaChoice, label: 'PCA Choice' },
    { value: ClientProgramTypeCode.Two45D, label: '245D' },
    { value: ClientProgramTypeCode.CfssAgency, label: 'CFSS Agency' },
    { value: ClientProgramTypeCode.CfssBudget, label: 'CFSS Budget' },
  ] as const;

  readonly Math = Math;

  constructor() {
    combineLatest([
      this.route.queryParamMap,
      this.reloadRequested.pipe(startWith(undefined)),
    ])
      .pipe(
        map(([params]) => this.parseQuery(params)),
        tap((query) => {
          this.query.set(query);
          this.searchDraft.set(query.search);
          this.loading.set(true);
          this.loadFailed.set(false);
        }),
        switchMap((query) => this.api.listClients(query).pipe(
          map((response) => ({ response, failed: false })),
          catchError(() => of({ response: null, failed: true })),
        )),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ response, failed }) => {
        this.response.set(response);
        this.loadFailed.set(failed);
        this.loading.set(false);
      });

    this.searchChanged
      .pipe(
        map((value) => value.trim().slice(0, 200)),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => {
        void this.navigate({ ...this.query(), search, pageNumber: 1 });
      });
  }

  updateSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.searchDraft.set(event.target.value);
      this.searchChanged.next(event.target.value);
    }
  }

  updateSelect(key: 'status' | 'program' | 'location' | 'onboarding', event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) return;

    const value = event.target.value;
    const current = this.query();
    const next: ClientListQuery = key === 'status'
      ? { ...current, status: value ? Number(value) as ClientStatusCode : null, pageNumber: 1 }
      : key === 'program'
        ? { ...current, programType: value ? Number(value) as ClientProgramTypeCode : null, pageNumber: 1 }
        : key === 'location'
          ? { ...current, location: value, pageNumber: 1 }
          : { ...current, onboarding: value === '' ? null : value === 'yes', pageNumber: 1 };

    void this.navigate(next);
  }

  clearFilters(): void {
    void this.navigate(DEFAULT_CLIENT_LIST_QUERY);
  }

  retry(): void {
    this.reloadRequested.next();
  }

  changePage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages()) return;
    void this.navigate({ ...this.query(), pageNumber });
  }

  changePageSize(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const pageSize = Number(event.target.value);
    if (![10, 25, 50, 100].includes(pageSize)) return;
    void this.navigate({ ...this.query(), pageNumber: 1, pageSize });
  }

  fullName(client: ClientListViewItem): string {
    return `${client.firstName} ${client.lastName}`;
  }

  initials(client: ClientListViewItem): string {
    return `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
  }

  statusClasses(status: string): string {
    switch (status) {
      case 'Active': return 'bg-green-50 text-success ring-green-200';
      case 'Pending': return 'bg-amber-50 text-warning ring-amber-200';
      case 'On hold': return 'bg-blue-50 text-info ring-blue-200';
      case 'Discharged': return 'bg-rose-50 text-danger ring-rose-200';
      default: return 'bg-slate-100 text-text-muted ring-slate-200';
    }
  }

  private toViewItem(item: ClientListApiItem): ClientListViewItem {
    return {
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      goesBy: item.preferredName ?? '',
      pmi: item.pmiNumber,
      phone: item.primaryPhone ?? '—',
      program: clientProgramLabel(item.programType),
      services: item.services,
      location: item.location ?? '—',
      socDate: formatDateForDisplay(item.socDate),
      supervisor: '—',
      status: clientStatusLabel(item.status),
      onboarding: item.isOnboarding,
      // Compliance/attention counts belong to the later compliance milestone.
      attentionCount: 0,
    };
  }

  private navigate(query: ClientListQuery): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: query.search || undefined,
        status: query.status ?? undefined,
        program: query.programType ?? undefined,
        service: query.service || undefined,
        location: query.location || undefined,
        onboarding: query.onboarding === null ? undefined : query.onboarding ? 'yes' : 'no',
        sortBy: query.sortBy === 'name' ? undefined : query.sortBy,
        sortDirection: query.sortDirection === 'asc' ? undefined : query.sortDirection,
        page: query.pageNumber === 1 ? undefined : query.pageNumber,
        pageSize: query.pageSize === 25 ? undefined : query.pageSize,
      },
    });
  }

  private parseQuery(params: ParamMap): ClientListQuery {
    const status = this.parseEnumNumber<ClientStatusCode>(params.get('status'), [1, 2, 3, 4, 5]);
    const programType = this.parseEnumNumber<ClientProgramTypeCode>(params.get('program'), [1, 2, 3, 4, 5]);
    const onboarding = params.get('onboarding') === 'yes'
      ? true
      : params.get('onboarding') === 'no'
        ? false
        : null;
    const pageNumber = this.parsePositiveInteger(params.get('page'), 1);
    const parsedPageSize = this.parsePositiveInteger(params.get('pageSize'), 25);

    return {
      search: (params.get('search') ?? '').trim().slice(0, 200),
      status,
      programType,
      service: (params.get('service') ?? '').trim().slice(0, 50),
      location: (params.get('location') ?? '').trim().slice(0, 150),
      onboarding,
      sortBy: this.parseSortBy(params.get('sortBy')),
      sortDirection: params.get('sortDirection') === 'desc' ? 'desc' : 'asc',
      pageNumber,
      pageSize: [10, 25, 50, 100].includes(parsedPageSize) ? parsedPageSize : 25,
    };
  }

  private parseEnumNumber<T extends number>(value: string | null, allowed: readonly number[]): T | null {
    if (value === null || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return allowed.includes(parsed) ? parsed as T : null;
  }

  private parsePositiveInteger(value: string | null, fallback: number): number {
    if (value === null || !/^\d+$/.test(value)) return fallback;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseSortBy(value: string | null): ClientListQuery['sortBy'] {
    return value === 'pmi' || value === 'socDate' || value === 'status' || value === 'location'
      ? value
      : 'name';
  }
}
