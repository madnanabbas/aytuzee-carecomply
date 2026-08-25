import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserListItem } from '../../models/user-management.models';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-table.html',
})
export class UserTableComponent {
  readonly users = input.required<readonly UserListItem[]>();

  initials(displayName: string): string {
    const parts = displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
}