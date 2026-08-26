import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoleManagementService } from '../../data-access/role-management.service';

@Component({
  selector: 'app-role-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './role-list-page.html',
})
export class RoleListPage {
  private readonly roleService = inject(RoleManagementService);

  readonly search = signal('');

  readonly roles = computed(() => {
    const search = this.search().trim().toLowerCase();

    const roles = this.roleService.getRoles();

    if (!search) {
      return roles;
    }

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(search) ||
        role.description.toLowerCase().includes(search),
    );
  });

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}