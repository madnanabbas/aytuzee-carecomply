import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { EmployeeApiService } from '../../data-access/employee-api.service';
import { EmployeeListResponse, EmployeeSummary } from '../../models/employee.models';

@Component({
  selector: 'app-employee-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './employee-list-page.html',
  styleUrl: './employee-list-page.css',
})
export class EmployeeListPageComponent {
  private readonly api = inject(EmployeeApiService);
  private readonly destroy = inject(DestroyRef);
  private readonly auth = inject(AuthorizationService);

  readonly response = signal<EmployeeListResponse | null>(null);
  readonly employees = computed(() => this.response()?.items ?? []);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly searchValue = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly canCreate = computed(() => this.auth.hasPermission(Permissions.Employee.Create));

  constructor() {
    this.load();
  }

  search(event: Event): void {
    this.searchValue.set((event.target as HTMLInputElement).value.trim());
    this.page.set(1);
    this.load();
  }

  changePageSize(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);
    if (![10, 25, 50, 100].includes(pageSize)) return;
    this.pageSize.set(pageSize);
    this.page.set(1);
    this.load();
  }

  previousPage(): void {
    if (this.loading() || this.page() <= 1) return;
    this.page.update((value) => value - 1);
    this.load();
  }

  nextPage(): void {
    if (this.loading() || this.page() >= (this.response()?.totalPages ?? 0)) return;
    this.page.update((value) => value + 1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api
      .list(this.searchValue(), this.page(), this.pageSize())
      .pipe(
        catchError(() => {
          this.failed.set(true);
          return of(null);
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((response) => {
        this.response.set(response);
        this.loading.set(false);
      });
  }

  initials(employee: EmployeeSummary): string {
    return `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase();
  }
}
