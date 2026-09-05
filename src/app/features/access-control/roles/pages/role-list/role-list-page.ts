import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { RoleManagementService } from '../../data-access/role-management.service';
import { RoleListItem } from '../../models/role-management.models';

@Component({
  selector: 'app-role-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './role-list-page.html',
  styleUrls: ['../../../users/user-density.css'],
})
export class RoleListPage {
  private readonly roleService = inject(RoleManagementService);
  private readonly authorization = inject(AuthorizationService);

  readonly search = signal('');
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly allRoles = signal<readonly RoleListItem[]>([]);
  readonly canManage = computed(() =>
    this.authorization.hasPermission(Permissions.Role.Manage),
  );

  readonly roles = computed(() => {
    const search = this.search().trim().toLowerCase();
    const roles = this.allRoles();

    if (!search) {
      return roles;
    }

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(search) ||
        role.description.toLowerCase().includes(search),
    );
  });

  constructor() {
    this.load();
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  reload(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    this.roleService
      .listRoles()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (roles) => this.allRoles.set(roles),
        error: (_error: HttpErrorResponse) => {
          this.allRoles.set([]);
          this.loadFailed.set(true);
        },
      });
  }
}
