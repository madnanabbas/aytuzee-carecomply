import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmployeeApiService } from '../../data-access/employee-api.service';
import { EmployeeFormModel } from '../../models/employee.models';

@Component({
  selector: 'app-employee-view-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './employee-view-page.html',
  styleUrl: './employee-view-page.css',
})
export class EmployeeViewPageComponent {
  private readonly api = inject(EmployeeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  readonly employee = signal<(EmployeeFormModel & { id: string }) | null>(null);
  readonly failed = signal(false);
  readonly id = this.route.snapshot.paramMap.get('employeeId')!;
  constructor() {
    this.api
      .get(this.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: (x) => this.employee.set(x), error: () => this.failed.set(true) });
  }
  initials(x: EmployeeFormModel) {
    return `${x.firstName[0] ?? ''}${x.lastName[0] ?? ''}`.toUpperCase();
  }
}
