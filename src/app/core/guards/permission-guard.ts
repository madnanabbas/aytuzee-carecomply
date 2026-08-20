import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService } from '../authorization/authorization.service';
import { isPermission, Permission } from '../authorization/permissions';

export interface PermissionRouteData {
  readonly permissions: readonly [Permission, ...Permission[]];
}

export const permissionGuard: CanActivateFn = (route) => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  const permissions: unknown = route.data['permissions'];

  if (
    !Array.isArray(permissions) ||
    permissions.length === 0 ||
    !permissions.every(isPermission) ||
    !authorization.hasAnyPermission(permissions)
  ) {
    return router.createUrlTree(['/forbidden']);
  }

  return true;
};
