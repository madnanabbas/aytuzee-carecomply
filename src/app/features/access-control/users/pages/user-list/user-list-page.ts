import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { UserFiltersComponent } from '../../components/user-filters/user-filters';
import { UserTableComponent } from '../../components/user-table/user-table';
import { UserManagementApiService } from '../../data-access/user-management-api.service';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import {
  DEFAULT_USER_LIST_QUERY,
  SortDirection,
  UserListFilterValues,
  UserListQuery,
  UserListResponse,
  UserListSort,
  UserMfaFilter,
  UserStatusFilter,
} from '../../models/user-management.models';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [RouterLink, UserFiltersComponent, UserTableComponent],
  templateUrl: './user-list-page.html',
  styleUrls: ['../../user-density.css'],
})
export class UserListPageComponent {
  private readonly api = inject(UserManagementApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authorization = inject(AuthorizationService);
  private readonly reloadRequested = new Subject<void>();

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly response = signal<UserListResponse | null>(null);
  readonly query = signal<UserListQuery>(DEFAULT_USER_LIST_QUERY);
  readonly totalPages = computed(() => {
    const response = this.response();
    return response ? Math.max(1, Math.ceil(response.totalCount / response.pageSize)) : 1;
  });
  readonly hasFilters = computed(() => {
    const query = this.query();
    return Boolean(
      query.search
      || query.roleId
      || query.status !== 'all'
      || query.mfaStatus !== 'all'
    );
  });

  readonly Math = Math;

  readonly canManageUsers = computed(() =>
    this.authorization.hasPermission(Permissions.User.Manage)
  );

  constructor() {
    combineLatest([
      this.route.queryParamMap,
      this.reloadRequested.pipe(startWith(undefined)),
    ])
      .pipe(
        map(([params]) => this.parseQuery(params)),
        tap((query) => {
          this.query.set(query);
          this.loading.set(true);
          this.loadFailed.set(false);
        }),
        switchMap((query) => this.api.listUsers(query).pipe(
          map((response) => ({ response, failed: false })),
          catchError(() => of({
            response: null,
            failed: true,
          })),
        )),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.response.set(result.response);
        this.loadFailed.set(result.failed);
        this.loading.set(false);
      });
  }

  applyFilters(filters: UserListFilterValues): void {
    void this.navigate({
      ...this.query(),
      ...filters,
      pageNumber: 1,
    });
  }

  changePage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages()) {
      return;
    }

    void this.navigate({ ...this.query(), pageNumber });
  }

  changePageSize(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }

    const pageSize = Number(event.target.value);
    if (![10, 25, 50, 100].includes(pageSize)) {
      return;
    }

    void this.navigate({ ...this.query(), pageNumber: 1, pageSize });
  }

  retry(): void {
    this.reloadRequested.next();
  }

  private navigate(query: UserListQuery): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: query.search || undefined,
        roleId: query.roleId || undefined,
        status: query.status === 'all' ? undefined : query.status,
        mfaStatus: query.mfaStatus === 'all' ? undefined : query.mfaStatus,
        sortBy: query.sortBy === 'name' ? undefined : query.sortBy,
        sortDirection: query.sortDirection === 'asc' ? undefined : query.sortDirection,
        page: query.pageNumber === 1 ? undefined : query.pageNumber,
        pageSize: query.pageSize === 25 ? undefined : query.pageSize,
      },
    });
  }

  private parseQuery(params: ParamMap): UserListQuery {
    const status = this.parseMember<UserStatusFilter>(
      params.get('status'),
      ['active', 'inactive'],
      'all',
    );
    const mfaStatus = this.parseMember<UserMfaFilter>(
      params.get('mfaStatus'),
      ['enabled', 'notEnabled'],
      'all',
    );
    const sortBy = this.parseMember<UserListSort>(
      params.get('sortBy'),
      ['email', 'status', 'mfa'],
      'name',
    );
    const sortDirection = this.parseMember<SortDirection>(
      params.get('sortDirection'),
      ['desc'],
      'asc',
    );
    const pageNumber = this.parsePositiveInteger(params.get('page'), 1);
    const parsedPageSize = this.parsePositiveInteger(params.get('pageSize'), 25);

    return {
      search: (params.get('search') ?? '').trim().slice(0, 200),
      roleId: params.get('roleId') ?? '',
      status,
      mfaStatus,
      sortBy,
      sortDirection,
      pageNumber,
      pageSize: [10, 25, 50, 100].includes(parsedPageSize) ? parsedPageSize : 25,
    };
  }

  private parseMember<T extends string>(
    value: string | null,
    members: readonly T[],
    fallback: T,
  ): T {
    return members.find((member) => member === value) ?? fallback;
  }

  private parsePositiveInteger(value: string | null, fallback: number): number {
    if (value === null || !/^\d+$/.test(value)) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
