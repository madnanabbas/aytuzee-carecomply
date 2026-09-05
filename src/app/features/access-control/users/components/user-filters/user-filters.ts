import { Component, effect, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  UserListFilterValues,
  UserListQuery,
  UserListRole,
} from '../../models/user-management.models';

@Component({
  selector: 'app-user-filters',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-filters.html',
  styleUrls: ['../../user-density.css'],
})
export class UserFiltersComponent {
  readonly query = input.required<UserListQuery>();
  readonly roles = input.required<readonly UserListRole[]>();
  readonly filtersApplied = output<UserListFilterValues>();

  readonly form = new FormBuilder().nonNullable.group({
    search: '',
    roleId: '',
    status: 'all' as UserListFilterValues['status'],
    mfaStatus: 'all' as UserListFilterValues['mfaStatus'],
  });

  constructor() {
    effect(() => {
      const query = this.query();
      this.form.setValue(
        {
          search: query.search,
          roleId: query.roleId,
          status: query.status,
          mfaStatus: query.mfaStatus,
        },
        { emitEvent: false },
      );
    });
  }

  apply(): void {
    const value = this.form.getRawValue();
    this.filtersApplied.emit({
      ...value,
      search: value.search.trim(),
    });
  }

  clear(): void {
    this.form.setValue({
      search: '',
      roleId: '',
      status: 'all',
      mfaStatus: 'all',
    });
    this.apply();
  }
}
