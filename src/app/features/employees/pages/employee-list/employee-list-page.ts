import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { EmployeeApiService, EmployeeSummary } from '../../data-access/employee-api.service';

@Component({ selector: 'app-employee-list-page', standalone: true, imports: [RouterLink], templateUrl: './employee-list-page.html', styleUrl: './employee-list-page.css' })
export class EmployeeListPageComponent {
  private readonly api = inject(EmployeeApiService); private readonly destroy = inject(DestroyRef); private readonly auth = inject(AuthorizationService);
  readonly employees = signal<readonly EmployeeSummary[]>([]); readonly loading = signal(true); readonly failed = signal(false);
  readonly canCreate = computed(() => this.auth.hasPermission(Permissions.Employee.Create));
  constructor() { this.load(); }
  search(event: Event) { this.load((event.target as HTMLInputElement).value.trim()); }
  load(search = '') { this.loading.set(true); this.api.list(search).pipe(catchError(() => { this.failed.set(true); return of([]); }), takeUntilDestroyed(this.destroy)).subscribe(x => { this.employees.set(x); this.loading.set(false); }); }
  initials(employee: EmployeeSummary): string { return `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase(); }
}
