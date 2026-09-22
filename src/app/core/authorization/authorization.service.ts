import { Injectable, signal } from '@angular/core';
import { Permission } from './permissions';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  private readonly currentPermissions = signal<ReadonlySet<Permission>>(new Set());

  setPermissions(permissions: readonly Permission[]): void {
    this.currentPermissions.set(new Set(permissions));
  }

  clearPermissions(): void {
    this.currentPermissions.set(new Set());
  }

  hasPermission(permission: Permission): boolean {
    return this.currentPermissions().has(permission);
  }

  hasAnyPermission(permissions: readonly Permission[]): boolean {
    if (permissions.length === 0) {
      return false;
    }

    const currentPermissions = this.currentPermissions();
    return permissions.some((permission) => currentPermissions.has(permission));
  }

  hasAllPermissions(permissions: readonly Permission[]): boolean {
    if (permissions.length === 0) {
      return false;
    }

    const currentPermissions = this.currentPermissions();
    return permissions.every((permission) => currentPermissions.has(permission));
  }

  permissionKey(): string {
    return [...this.currentPermissions()].sort().join('|');
  }
}
